import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { NoteDialog } from '../common/note-dialog';
import { useNotes } from '~/state/use-notes';
import type { Note } from '~/types/notes';

export const NotesWidget = () => {
  const { notes, addNote, updateNote, deleteNote } = useNotes();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);

  const handleEdit = (note: Note) => {
    setEditing(note);
    setOpen(true);
  };

  const handleDelete = (noteId: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      deleteNote(noteId);
    }
  };

  const handleSave = (data: { title: string; content: string }) => {
    if (editing) {
      updateNote(editing.id, data.title, data.content);
    } else {
      addNote(data.title, data.content);
    }
    setEditing(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setEditing(null);
    }
  };

  return (
    <>
      <ScrollArea className="h-full flex flex-col bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Notes</h2>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Add note"
            onClick={() => setOpen(true)}
          >
            <Plus className="size-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {notes.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              No notes yet. Create one to get started!
            </p>
          ) : (
            <ul className="space-y-2">
              {notes.map((note) => (
                <li
                  key={note.id}
                  className="p-2 rounded-md bg-muted hover:bg-muted/80 transition-colors group border border-transparent hover:border-border"
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => handleEdit(note)}
                      className="flex-1 text-left hover:opacity-80 transition-opacity"
                    >
                      <h3 className="text-sm font-medium text-foreground">
                        {note.title}
                      </h3>

                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {note.content}
                      </p>
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 rounded"
                      aria-label="Delete note"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </ScrollArea>

      <NoteDialog
        open={open}
        onOpenChange={handleOpenChange}
        editing={editing}
        onSave={handleSave}
      />
    </>
  );
};
