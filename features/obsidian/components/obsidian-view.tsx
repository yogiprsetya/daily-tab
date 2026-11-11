'use client';

import { FolderSync } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ACTION } from '@/components/form-styles';
import { Button } from '@/components/ui/button';
import { listFolder, type Entry } from '../entries';
import { readNote, stripFrontmatter, type Note } from '../note';
import {
  createTextCache,
  listAllNotes,
  MIN_QUERY,
  searchVault,
} from '../search';
import { createSearchClient, type Result } from '../search-client';
import {
  loadVault,
  pickVault,
  requestAccess,
  type VaultState,
} from '../vault-handle';
import { FolderList } from './folder-list';
import { NoteView } from './note-view';
import { SearchResults } from './search-results';
import { VaultBreadcrumb } from './vault-breadcrumb';
import { VaultNotice } from './vault-notice';
import { VaultPicker } from './vault-picker';
import { VaultSearch } from './vault-search';

const NOT_FOUND = (
  <VaultNotice
    title="Note not found"
    description="It may have been moved, renamed or deleted in Obsidian."
  />
);

const LOADING = (what: string) => (
  <p className="text-sm text-muted-foreground">{what}</p>
);

/**
 * Everything below the session gate. The vault is chosen and read in the
 * browser, so this is a Client Component and never runs on the server.
 */
export function ObsidianView() {
  const params = useSearchParams();
  const folder = params.get('folder') ?? '';
  const notePath = params.get('note');
  const query = params.get('q') ?? '';

  const [state, setState] = useState<VaultState | null>(null);
  const [listing, setListing] = useState<{
    folder: string;
    entries: Entry[] | null;
  } | null>(null);
  const [note, setNote] = useState<{ path: string; note: Note } | null>(null);
  const [hits, setHits] = useState<{ query: string; hits: Result[] } | null>(
    null
  );
  const [busy, setBusy] = useState(false);

  /** One client per mount, so its text cache survives between searches. */
  const searchClient = useRef<ReturnType<typeof createSearchClient> | null>(
    null
  );
  useEffect(() => {
    const client = createSearchClient();
    searchClient.current = client;
    return () => {
      client.dispose();
      searchClient.current = null;
    };
  }, []);

  const choose = useCallback(async () => {
    setBusy(true);
    try {
      const handle = await pickVault();
      if (handle) setState({ status: 'ready', handle });
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    loadVault().then((next) => {
      if (alive) setState(next);
    });
    return () => {
      alive = false;
    };
  }, []);

  const handle = state?.status === 'ready' ? state.handle : null;

  useEffect(() => {
    if (!handle) return;
    let alive = true;
    listFolder(handle, folder).then((next) => {
      if (alive) setListing({ folder, entries: next });
    });
    return () => {
      alive = false;
    };
  }, [handle, folder]);

  useEffect(() => {
    if (!handle || !notePath) return;
    let alive = true;
    readNote(handle, notePath).then((next) => {
      if (!alive) return;
      setNote({
        path: notePath,
        note:
          next.status === 'ready'
            ? { ...next, text: stripFrontmatter(next.text) }
            : next,
      });
    });
    return () => {
      alive = false;
    };
  }, [handle, notePath]);

  useEffect(() => {
    if (!handle || query.trim().length < MIN_QUERY) return;
    let alive = true;
    listAllNotes(handle).then(async (notes) => {
      const client = searchClient.current;
      const found = client
        ? await client.search(query, notes)
        : await searchVault(notes, query, createTextCache());
      if (alive) setHits({ query, hits: found });
    });
    return () => {
      alive = false;
    };
  }, [handle, query]);

  async function allow(target: FileSystemDirectoryHandle) {
    setBusy(true);
    try {
      if (await requestAccess(target))
        setState({ status: 'ready', handle: target });
    } finally {
      setBusy(false);
    }
  }

  if (state === null) {
    return <p className="text-sm text-muted-foreground">Opening the vault…</p>;
  }

  if (state.status !== 'ready') {
    return (
      <VaultPicker
        status={state.status}
        vaultName={
          state.status === 'needs-permission' ? state.handle.name : undefined
        }
        busy={busy}
        onPick={choose}
        onAllow={() => {
          if (state.status === 'needs-permission') void allow(state.handle);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <VaultSearch initialQuery={query} />

      <div className="flex items-center justify-between gap-2">
        <VaultBreadcrumb
          folder={noteParent(notePath)}
          note={notePath ? noteName(notePath) : undefined}
        />
        <Button
          type="button"
          variant="ghost"
          onClick={choose}
          disabled={busy}
          className={`${ACTION} shrink-0 text-muted-foreground`}
        >
          <FolderSync aria-hidden />
          Change folder
        </Button>
      </div>

      {notePath ? (
        note?.path === notePath ? (
          <NoteView note={note.note} name={noteName(notePath)} />
        ) : (
          LOADING('Reading the note…')
        )
      ) : query.trim().length >= MIN_QUERY ? (
        hits?.query === query ? (
          <SearchResults hits={hits.hits} />
        ) : (
          LOADING('Searching notes…')
        )
      ) : listing?.folder !== folder ? (
        LOADING('Reading the folder…')
      ) : listing.entries ? (
        <FolderList entries={listing.entries} />
      ) : (
        NOT_FOUND
      )}
    </div>
  );
}

/** The folder a note sits in, so the breadcrumb can show the way back. */
function noteParent(notePath: string | null): string {
  if (!notePath) return '';
  const index = notePath.lastIndexOf('/');
  return index === -1 ? '' : notePath.slice(0, index);
}

/** The note's name without its `.md`, as the list shows it. */
function noteName(notePath: string): string {
  const last = notePath.slice(notePath.lastIndexOf('/') + 1);
  return last.replace(/\.md$/i, '');
}
