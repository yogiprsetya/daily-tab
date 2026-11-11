/**
 * The one thing this module remembers: which folder the owner chose as the
 * vault. Only the handle is stored — never note text, never a path, because the
 * browser does not expose one. Everything else lives in memory for the tab.
 */

/** Its own database, so clearing the vault never touches anything else. */
export const VAULT_DB = 'daily-tab';
const STORE = 'obsidian-vault';
const KEY = 'handle';
const PICKER_ID = 'daily-tab-vault';

export type VaultState =
  | { status: 'unsupported' }
  | { status: 'empty' }
  | { status: 'needs-permission'; handle: FileSystemDirectoryHandle }
  | { status: 'ready'; handle: FileSystemDirectoryHandle };

/** Chrome and Edge on desktop have this; the Android PWA, Safari and Firefox do not. */
export function isVaultSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.showDirectoryPicker === 'function'
  );
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(VAULT_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transact<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const request = run(transaction.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => db.close();
      })
  );
}

/** A handle survives a round trip through IndexedDB; a string does not, and neither does `instanceof` across realms. */
function isDirectoryHandle(value: unknown): value is FileSystemDirectoryHandle {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as FileSystemHandle).kind === 'directory'
  );
}

async function readHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const stored = await transact<unknown>('readonly', (store) =>
      store.get(KEY)
    );
    return isDirectoryHandle(stored) ? stored : null;
  } catch {
    // IndexedDB can be unavailable (private mode, storage pressure): behave as if nothing is stored.
    return null;
  }
}

async function writeHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  try {
    await transact('readwrite', (store) => store.put(handle, KEY));
  } catch {
    // Remembering is a convenience; the vault still works for this visit.
  }
}

export async function forgetVault(): Promise<void> {
  try {
    await transact('readwrite', (store) => store.delete(KEY));
  } catch {
    // Nothing to clear, or storage is unavailable.
  }
}

/**
 * Opens the native folder picker, read-only, and remembers the choice. Returns
 * null when the owner cancels or the browser has no picker.
 */
export async function pickVault(): Promise<FileSystemDirectoryHandle | null> {
  if (!isVaultSupported()) return null;
  try {
    const handle = await window.showDirectoryPicker({
      id: PICKER_ID,
      mode: 'read',
    });
    await writeHandle(handle);
    return handle;
  } catch {
    // AbortError: the owner closed the dialog. Anything else is equally harmless here.
    return null;
  }
}

/** Asks for read access; must be called from a click, or the browser refuses. */
export async function requestAccess(
  handle: FileSystemDirectoryHandle
): Promise<boolean> {
  if ((await handle.queryPermission({ mode: 'read' })) === 'granted') {
    return true;
  }
  return (await handle.requestPermission({ mode: 'read' })) === 'granted';
}

type VaultLookup = {
  load: () => Promise<FileSystemDirectoryHandle | null>;
  query: (handle: FileSystemDirectoryHandle) => Promise<PermissionState>;
};

/**
 * Decides what the page shows from the stored handle alone, without prompting.
 * Separated from IndexedDB so it can be tested with plain objects.
 */
export async function resolveVaultState({
  load,
  query,
}: VaultLookup): Promise<VaultState> {
  const handle = await load();
  if (!handle) return { status: 'empty' };

  const permission = await query(handle);
  if (permission === 'granted') return { status: 'ready', handle };
  if (permission === 'prompt') return { status: 'needs-permission', handle };
  // 'denied' is treated as gone: the stored handle is no longer usable.
  return { status: 'empty' };
}

/** The state at page load. Never prompts; a denied handle is forgotten. */
export async function loadVault(): Promise<VaultState> {
  if (!isVaultSupported()) return { status: 'unsupported' };

  const state = await resolveVaultState({
    load: readHandle,
    query: (handle) => handle.queryPermission({ mode: 'read' }),
  });

  // Deleting a key that was never stored is a no-op, so one call covers both cases.
  if (state.status === 'empty') await forgetVault();
  return state;
}
