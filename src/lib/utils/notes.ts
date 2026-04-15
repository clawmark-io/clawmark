import type { TaskNote } from "@/types/data-model";

/**
 * Normalizes the notes field for backward compatibility.
 * Old data may have notes as an empty string instead of an array.
 */
export function getNotes(notes: TaskNote[] | string): TaskNote[] {
  if (Array.isArray(notes)) return notes;
  return [];
}
