'use client';

import type { Note } from '../note';
import { NoteBody } from './note-body';
import { VaultNotice } from './vault-notice';

/** One of three outcomes, matching `readNote`: missing, too large, or text. */
export function NoteView({ note, name }: { note: Note; name: string }) {
  if (note.status === 'missing') {
    return (
      <VaultNotice
        title="Note not found"
        description="It may have been moved, renamed or deleted in Obsidian."
      />
    );
  }

  if (note.status === 'too-large') {
    return (
      <VaultNotice
        title="This note is too large to show"
        description="Notes over 1 MB are left out to keep the page responsive."
      />
    );
  }

  return (
    <article aria-label={name} className="flex flex-col gap-2">
      <h2 className="text-base font-semibold wrap-break-word">{name}</h2>
      <NoteBody text={note.text} />
    </article>
  );
}
