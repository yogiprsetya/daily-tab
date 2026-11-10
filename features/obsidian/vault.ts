import 'server-only';
import { realpath, stat } from 'node:fs/promises';

export type Vault =
  { status: 'off' } | { status: 'missing' } | { status: 'ready'; root: string };

/** Checks the configured folder. Callers never learn why it is missing, so the path cannot leak. */
export async function openVault(path: string | undefined): Promise<Vault> {
  if (!path) return { status: 'off' };
  try {
    const root = await realpath(path);
    if ((await stat(root)).isDirectory()) return { status: 'ready', root };
  } catch {
    // Missing or unreadable: both are reported as missing.
  }
  return { status: 'missing' };
}
