/**
 * Notes Adapter
 * Handles persistence of notes to storage
 * Abstracts away storage implementation details from state layer
 */

import type { Note } from '~/types/notes';
import { storageAdapter } from './storage.adapter';

const NOTES_STORAGE_KEY = 'daily-tab-notes';

export interface NotesAdapter {
  load(): Note[];
  save(notes: Note[]): void;
  clear(): void;
}

export const createNotesAdapter = (): NotesAdapter => {
  return {
    load(): Note[] {
      return storageAdapter.getItem(NOTES_STORAGE_KEY, []);
    },

    save(notes: Note[]): void {
      storageAdapter.setItem(NOTES_STORAGE_KEY, notes);
    },

    clear(): void {
      storageAdapter.removeItem(NOTES_STORAGE_KEY);
    },
  };
};

export const notesAdapter = createNotesAdapter();
