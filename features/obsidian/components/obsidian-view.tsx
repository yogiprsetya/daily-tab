import { requirePageSession } from '@/features/auth/require-session';
import { getEnv } from '@/lib/env';
import { listFolder, openVault, resolveInVault } from '../vault';
import { FolderList } from './folder-list';
import { VaultBreadcrumb } from './vault-breadcrumb';
import { VaultNotice } from './vault-notice';

type Params = { folder?: string | string[] };

const NOT_FOUND = (
  <VaultNotice
    title="Note not found"
    description="It may have been moved, renamed or deleted in Obsidian."
  />
);

/** Reads the session, URL and vault folder: render inside <Suspense>. */
export async function ObsidianView({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  await requirePageSession();
  const vault = await openVault(getEnv().OBSIDIAN_VAULT_PATH);

  if (vault.status === 'off') {
    return (
      <VaultNotice
        title="Only on your PC"
        description="The vault is available when Daily Tab runs on your PC."
      />
    );
  }
  if (vault.status === 'missing') {
    return (
      <VaultNotice
        title="Vault folder not found"
        description="Check OBSIDIAN_VAULT_PATH in .env.local, then restart Daily Tab."
      />
    );
  }

  const { folder } = await searchParams;
  const relative = (typeof folder === 'string' ? folder : '').replace(
    /\/$/,
    ''
  );
  const dir = await resolveInVault(vault.root, relative, 'folder');
  if (!dir) return NOT_FOUND;

  return (
    <div className="flex flex-col gap-2">
      <VaultBreadcrumb folder={relative} />
      <FolderList entries={await listFolder(vault.root, dir)} />
    </div>
  );
}
