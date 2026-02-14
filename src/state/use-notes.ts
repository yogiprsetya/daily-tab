import { useCallback, useState } from 'react';
import type { Note } from '~/types/notes';

const NOTES_STORAGE_KEY = 'daily-tab-notes';

function loadNotes(): Note[] {
  try {
    const stored = localStorage.getItem(NOTES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveNotes(notes: Note[]): void {
  localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>(() => loadNotes());

  // CREATE
  const addNote = useCallback(
    (title: string, content: string) => {
      const newNote: Note = {
        id: generateId(),
        title,
        content,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const updated = [...notes, newNote];
      setNotes(updated);
      saveNotes(updated);
      return newNote;
    },
    [notes]
  );

  // READ (all)
  const getNotes = useCallback(() => {
    return notes;
  }, [notes]);

  // READ (single)
  const getNoteById = useCallback(
    (id: string) => {
      return notes.find((note) => note.id === id);
    },
    [notes]
  );

  // UPDATE
  const updateNote = useCallback(
    (id: string, title: string, content: string) => {
      const updated = notes.map((note) =>
        note.id === id
          ? {
              ...note,
              title,
              content,
              updatedAt: Date.now(),
            }
          : note
      );
      setNotes(updated);
      saveNotes(updated);
      return updated.find((note) => note.id === id);
    },
    [notes]
  );

  // DELETE
  const deleteNote = useCallback(
    (id: string) => {
      const updated = notes.filter((note) => note.id !== id);
      setNotes(updated);
      saveNotes(updated);
    },
    [notes]
  );

  // DELETE ALL
  const deleteAllNotes = useCallback(() => {
    setNotes([]);
    saveNotes([]);
  }, []);

  return {
    notes,
    addNote,
    getNotes,
    getNoteById,
    updateNote,
    deleteNote,
    deleteAllNotes,
  } as const;
}
