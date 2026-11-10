import { requirePageSession } from '@/features/auth/require-session';
import { getEnv } from '@/lib/env';
import { openVault } from '../vault';
import { VaultNotice } from './vault-notice';

/** Reads the session and the vault folder: render inside <Suspense>. */
export async function ObsidianView() {
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
  return null;
}
