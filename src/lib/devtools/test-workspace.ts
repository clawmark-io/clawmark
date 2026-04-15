import { createProject, createTask, createColumn, createTag } from "@/lib/data-model";
import type { WorkspacesManager } from "@/lib/workspace/workspace-manager";
import type { Project } from "@/types/data-model";

// Simple seeded PRNG (mulberry32) for repeatable randomness
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TASK_TITLES = [
  "Set up project structure",
  "Design landing page",
  "Implement user authentication",
  "Write API documentation",
  "Fix navigation bug",
  "Add dark mode support",
  "Create onboarding flow",
  "Optimize database queries",
  "Review pull requests",
  "Update dependencies",
  "Write unit tests",
  "Deploy to staging",
  "Configure CI/CD pipeline",
  "Refactor settings page",
  "Add search functionality",
  "Fix mobile layout issues",
  "Create email templates",
  "Set up monitoring",
  "Implement file upload",
  "Add keyboard shortcuts",
  "Design icon set",
  "Write changelog",
  "Fix memory leak",
  "Add pagination",
  "Create user dashboard",
  "Implement notifications",
  "Update privacy policy",
  "Add export to CSV",
  "Fix date formatting",
  "Optimize image loading",
  "Add drag and drop",
  "Create admin panel",
  "Implement caching layer",
  "Write integration tests",
  "Add multi-language support",
  "Fix scroll performance",
  "Create backup system",
  "Add two-factor auth",
  "Design error pages",
  "Implement undo/redo",
];

const DUE_DATE_OFFSETS_DAYS = [
  0, // today
  -3, // overdue
  1,
  3,
  5,
  7,
  14,
  21,
  30,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
];

function pickRandom<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

function buildKanbanProject(rand: () => number) {
  const project = createProject("Kanban");

  const colNext = createColumn("Next");
  colNext.sortOrder = 0;

  const colInProgress = createColumn("In Progress");
  colInProgress.sortOrder = 1;

  const colDone = createColumn("Done");
  colDone.sortOrder = 2;
  colDone.autoComplete = true;

  project.columns = [colNext, colInProgress, colDone];
  project.defaultColumnId = colNext.id;

  const tagBug = createTag("bug", "#ef4444");
  const tagFeature = createTag("feature", "#3b82f6");
  const tagImprovement = createTag("improvement", "#22c55e");
  project.tags = [tagBug, tagFeature, tagImprovement];
  const tagIds = [tagBug.id, tagFeature.id, tagImprovement.id];

  const columns = [colNext, colInProgress, colDone];
  const columnCounters = new Map<string, number>();
  for (const col of columns) columnCounters.set(col.id, 0);

  const now = Date.now();
  const DAY = 86400000;

  for (let i = 0; i < 22; i++) {
    const task = createTask(TASK_TITLES[i]);
    const col = columns[i < 8 ? 0 : i < 14 ? 1 : 2];
    task.columnId = col.id;
    const count = columnCounters.get(col.id)!;
    task.sortOrder = count;
    columnCounters.set(col.id, count + 1);

    if (col.autoComplete) {
      task.completed = true;
      task.completedAt = now - Math.floor(rand() * 7 * DAY);
    }

    const offset = pickRandom(DUE_DATE_OFFSETS_DAYS, rand);
    if (offset !== null) {
      task.dueDate = now + offset * DAY;
    }

    if (rand() > 0.6) {
      task.tags = [pickRandom(tagIds, rand)];
    }

    project.tasks[task.id] = task;
  }

  return project;
}

function buildTodoProject(rand: () => number) {
  const project = createProject("ToDo");
  // createProject already gives a "To Do" column — reuse it
  const col = project.columns[0];

  const now = Date.now();
  const DAY = 86400000;

  for (let i = 22; i < 40; i++) {
    const task = createTask(TASK_TITLES[i]);
    task.columnId = col.id;
    task.sortOrder = i - 22;

    if (i >= 35) {
      task.completed = true;
      task.completedAt = now - Math.floor(rand() * 5 * DAY);
    }

    const offset = pickRandom(DUE_DATE_OFFSETS_DAYS, rand);
    if (offset !== null) {
      task.dueDate = now + offset * DAY;
    }

    project.tasks[task.id] = task;
  }

  project.kanbanEnabled = false;
  return project;
}

export async function createTestWorkspace(
  manager: WorkspacesManager,
): Promise<void> {
  const existingList = manager.workspaces.get();
  const existing = existingList.find((e) => e.name === "Test Workspace");
  if (existing) {
    const now = new Date();
    const stamp = now.toISOString().replace("T", " ").slice(0, 19);
    const newName = `Test Workspace - ${stamp}`;

    manager.renameWorkspace(existing.workspaceId, newName);

    const existingClient = await manager.getWorkspace(existing.workspaceId);
    existingClient.getHandle().change((doc) => {
      doc.name = newName;
      doc.updatedAt = Date.now();
    });
    manager.releaseWorkspace(existingClient);

    console.log(
      `[devtools] Renamed existing "Test Workspace" to "${newName}"`,
    );
  }

  const entry = manager.createWorkspace("Test Workspace");
  const client = await manager.getWorkspace(entry.workspaceId);
  const handle = client.getHandle();

  const rand = mulberry32(42);
  const kanban = buildKanbanProject(rand);
  kanban.sortOrder = 0;
  const todo = buildTodoProject(rand);
  todo.sortOrder = 1;

  handle.change((doc) => {
    doc.projects[kanban.id] = kanban as Project;
    doc.projects[todo.id] = todo as Project;
    doc.updatedAt = Date.now();
  });

  await client.getRepo().flush();
  manager.releaseWorkspace(client);

  console.log(
    `[devtools] Test workspace created (id: ${entry.workspaceId}) with ${Object.keys(kanban.tasks).length + Object.keys(todo.tasks).length} tasks`,
  );

  window.location.reload();
}
