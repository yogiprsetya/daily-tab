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
  const noteAt = noteLocation(notePath);

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
    <div className="flex min-w-0 flex-col gap-4">
      <VaultSearch initialQuery={query} />

      <div className="flex min-w-0 items-center justify-between gap-2">
        <VaultBreadcrumb
          folder={noteAt.folder}
          note={notePath ? noteAt.name : undefined}
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

      {query.trim().length >= MIN_QUERY ? (
        hits?.query === query ? (
          <SearchResults hits={hits.hits} />
        ) : (
          LOADING('Searching notes…')
        )
      ) : (
        <section
          aria-label="Notes workspace"
          className="grid min-w-0 overflow-hidden rounded-md border border-border bg-card md:min-h-[min(68vh,760px)] md:grid-cols-[minmax(220px,280px)_minmax(0,1fr)]"
        >
          <aside className="min-w-0 border-b border-border bg-muted/30 md:border-r md:border-b-0">
            <div className="border-b border-border px-3 py-2">
              <p className="text-xs font-medium text-muted-foreground">
                Vault files
              </p>
            </div>
            <div className="max-h-72 overflow-y-auto p-2 md:max-h-[min(68vh,760px)]">
              {listing?.folder !== folder ? (
                LOADING('Reading the folder…')
              ) : listing.entries ? (
                <FolderList
                  entries={listing.entries}
                  selectedPath={notePath}
                  currentFolder={folder}
                  root={state.handle}
                />
              ) : (
                NOT_FOUND
              )}
            </div>
          </aside>
          <main className="min-w-0 p-4 sm:p-6">
            {notePath ? (
              note?.path === notePath ? (
                <NoteView note={note.note} name={noteAt.name} />
              ) : (
                LOADING('Reading the note…')
              )
            ) : (
              <div className="flex min-h-48 flex-col justify-center px-2 py-8 text-center md:min-h-full">
                <p className="text-base font-medium">Choose a note to read</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Browse the vault or search by title and note content.
                </p>
              </div>
            )}
          </main>
        </section>
      )}
    </div>
  );
}

/**
 * Where a note sits, for the breadcrumb: the folder above it and its name
 * without `.md`. Splitting once keeps the two answers consistent.
 */
function noteLocation(notePath: string | null) {
  const segments = notePath ? notePath.split('/') : [];
  const name = segments.pop() ?? '';
  return { folder: segments.join('/'), name: name.replace(/\.md$/i, '') };
}
