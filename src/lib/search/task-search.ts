import type { Workspace, Task } from '@/types/data-model';
import { getNotes } from '@/lib/utils/notes';

export type SearchScope = 'project' | 'workspace';

export type TaskSearchResult = {
  task: Task;
  projectId: string;
  projectTitle: string;
  matchType: 'title' | 'description' | 'notes';
  matchScore: number;
};

export function searchTasks(
  workspace: Workspace | undefined,
  query: string,
  scope: SearchScope,
  currentProjectId: string | null
): TaskSearchResult[] {
  if (!workspace) {
    return [];
  }

  const trimmedQuery = query.trim();
  const queryLower = trimmedQuery.toLowerCase();
  const results: TaskSearchResult[] = [];

  // Determine which projects to search
  const projectsToSearch = scope === 'project' && currentProjectId
    ? [workspace.projects[currentProjectId]].filter(Boolean)
    : Object.values(workspace.projects);

  for (const project of projectsToSearch) {
    for (const task of Object.values(project.tasks)) {
      // Skip archived tasks in search results
      if (task.archived) {
        continue;
      }

      // No query: return all tasks sorted by title
      if (!trimmedQuery) {
        results.push({
          task,
          projectId: project.id,
          projectTitle: project.title,
          matchType: 'title',
          matchScore: 0,
        });
        continue;
      }

      let matchType: TaskSearchResult['matchType'] | null = null;
      let matchScore = 0;

      // Title match (highest priority)
      if (task.title.toLowerCase().includes(queryLower)) {
        matchType = 'title';
        // Score based on position in title (earlier = higher score)
        const position = task.title.toLowerCase().indexOf(queryLower);
        matchScore = 100 - position;
      }
      // Description match
      else if (task.description.toLowerCase().includes(queryLower)) {
        matchType = 'description';
        matchScore = 50;
      }
      // Notes match (lowest priority)
      else if (getNotes(task.notes).some(n => n.note.toLowerCase().includes(queryLower))) {
        matchType = 'notes';
        matchScore = 25;
      }

      if (matchType) {
        results.push({
          task,
          projectId: project.id,
          projectTitle: project.title,
          matchType,
          matchScore,
        });
      }
    }
  }

  // Sort by match score descending, then alphabetically by title
  return results.toSorted((a, b) => b.matchScore - a.matchScore || a.task.title.localeCompare(b.task.title));
}
