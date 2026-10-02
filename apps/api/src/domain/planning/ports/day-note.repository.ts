/** "Notes" of a day: one per user and day. */
export interface DayNoteRepository {
  find(userId: string, day: string): Promise<string | null>;
  /** null removes the note. */
  save(userId: string, day: string, text: string | null): Promise<void>;
}

export const DAY_NOTE_REPOSITORY = Symbol('DayNoteRepository');
