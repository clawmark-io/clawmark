import {
  startOfDay,
  differenceInCalendarDays,
  endOfWeek,
  addWeeks,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  addMonths,
  isBefore,
  isWithinInterval,
  isToday,
  isTomorrow,
} from "date-fns";
import type { Task, Workspace } from "@/types/data-model";

export type TimeBucket =
  | "past-due"
  | "today"
  | "tomorrow"
  | "later-this-week"
  | "next-week"
  | "next-month"
  | "later";

export type UpcomingFilterMode =
  | "show-upcoming"
  | "overdue"
  | "today"
  | "tomorrow"
  | "this-week"
  | "next-week"
  | "this-month"
  | "next-month";

export const FILTER_MODE_CONFIG = [
  { mode: "show-upcoming", label: "filterShowUpcoming", group: "main" },
  { mode: "overdue", label: "filterOverdue", group: "main" },
  { mode: "today", label: "filterToday", group: "date" },
  { mode: "tomorrow", label: "filterTomorrow", group: "date" },
  { mode: "this-week", label: "filterThisWeek", group: "date" },
  { mode: "next-week", label: "filterNextWeek", group: "date" },
  { mode: "this-month", label: "filterThisMonth", group: "date" },
  { mode: "next-month", label: "filterNextMonth", group: "date" },
] as const satisfies readonly { mode: UpcomingFilterMode; label: string; group: string }[];

export type UpcomingTask = {
  task: Task;
  projectId: string;
  projectTitle: string;
  bucket: TimeBucket;
};

export const BUCKET_CONFIG = [
  { bucket: "past-due", label: "pastDue" },
  { bucket: "today", label: "today" },
  { bucket: "tomorrow", label: "tomorrow" },
  { bucket: "later-this-week", label: "laterThisWeek" },
  { bucket: "next-week", label: "nextWeek" },
  { bucket: "next-month", label: "nextMonth" },
  { bucket: "later", label: "later" },
] as const satisfies readonly { bucket: TimeBucket; label: string }[];

export function getTimeBucket(dueDate: number): TimeBucket {
  const now = new Date();
  const today = startOfDay(now);
  const taskDay = startOfDay(new Date(dueDate));
  const diffDays = differenceInCalendarDays(taskDay, today);

  if (diffDays < 0) return "past-due";
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";

  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  if (!isBefore(weekEnd, taskDay)) return "later-this-week";

  const nextWeekEnd = endOfWeek(addWeeks(today, 1), { weekStartsOn: 1 });
  if (!isBefore(nextWeekEnd, taskDay)) return "next-week";

  if (diffDays <= 30) return "next-month";

  return "later";
}

export function collectUpcomingTasks(workspace: Workspace): UpcomingTask[] {
  const result: UpcomingTask[] = [];

  for (const project of Object.values(workspace.projects)) {
    for (const task of Object.values(project.tasks)) {
      if (task.dueDate === null || task.completed || task.archived) continue;

      result.push({
        task,
        projectId: project.id,
        projectTitle: project.title,
        bucket: getTimeBucket(task.dueDate),
      });
    }
  }

  result.sort((a, b) => a.task.dueDate! - b.task.dueDate!);

  return result;
}

export function groupByBucket(tasks: UpcomingTask[]): Map<TimeBucket, UpcomingTask[]> {
  const groups = new Map<TimeBucket, UpcomingTask[]>();
  for (const item of tasks) {
    const list = groups.get(item.bucket);
    if (list) {
      list.push(item);
    } else {
      groups.set(item.bucket, [item]);
    }
  }
  return groups;
}

function isInThisWeek(dueDate: number): boolean {
  const now = new Date();
  const today = startOfDay(now);
  const taskDay = startOfDay(new Date(dueDate));
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  return !isBefore(taskDay, today) && !isBefore(weekEnd, taskDay);
}

function isInNextWeek(dueDate: number): boolean {
  const now = new Date();
  const nextWeekStart = startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
  const nextWeekEnd = endOfWeek(nextWeekStart, { weekStartsOn: 1 });
  const taskDay = startOfDay(new Date(dueDate));
  return isWithinInterval(taskDay, { start: nextWeekStart, end: nextWeekEnd });
}

function isInThisMonth(dueDate: number): boolean {
  const now = new Date();
  const today = startOfDay(now);
  const monthEnd = endOfMonth(now);
  const taskDay = startOfDay(new Date(dueDate));
  return isWithinInterval(taskDay, { start: today, end: monthEnd });
}

function isInNextMonth(dueDate: number): boolean {
  const now = new Date();
  const nextMonthStart = startOfMonth(addMonths(now, 1));
  const nextMonthEnd = endOfMonth(nextMonthStart);
  const taskDay = startOfDay(new Date(dueDate));
  return isWithinInterval(taskDay, { start: nextMonthStart, end: nextMonthEnd });
}

export function filterByMode(tasks: UpcomingTask[], mode: UpcomingFilterMode): UpcomingTask[] {
  if (mode === "show-upcoming") return tasks;

  return tasks.filter((item) => {
    const dueDate = item.task.dueDate;
    if (dueDate === null) return false;

    const taskDate = new Date(dueDate);

    switch (mode) {
      case "overdue":
        return item.bucket === "past-due";
      case "today":
        return isToday(taskDate);
      case "tomorrow":
        return isTomorrow(taskDate);
      case "this-week":
        return isInThisWeek(dueDate);
      case "next-week":
        return isInNextWeek(dueDate);
      case "this-month":
        return isInThisMonth(dueDate);
      case "next-month":
        return isInNextMonth(dueDate);
      default:
        return true;
    }
  });
}
