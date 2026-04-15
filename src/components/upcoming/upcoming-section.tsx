import type { UpcomingTask } from "@/lib/upcoming-utils";
import { UpcomingTaskRow } from "./upcoming-task-row";

type UpcomingSectionProps = {
  label: string;
  tasks: UpcomingTask[];
  onTaskClick: (item: UpcomingTask) => void;
  isPastDue?: boolean;
};

export function UpcomingSection({ label, tasks, onTaskClick, isPastDue = false }: UpcomingSectionProps) {
  return (
    <section>
      <h2 className={`font-semibold mb-2 flex items-center ${isPastDue ? "text-error" : ""}`}>
        <span>{label}</span>
        <hr className='flex-grow mx-4'/>
        <span className="badge badge-neutral">{tasks.length}</span>
      </h2>
      <div className="flex flex-col">
        {tasks.map((item) => (
          <UpcomingTaskRow
            key={`${item.projectId}-${item.task.id}`}
            item={item}
            onClick={() => onTaskClick(item)}
          />
        ))}
      </div>
    </section>
  );
}
