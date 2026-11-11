'use client';

import { FolderSync } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ACTION } from '@/components/form-styles';
import { Button } from '@/components/ui/button';
import {
  loadVault,
  pickVault,
  requestAccess,
  type VaultState,
} from '../vault-handle';
import { VaultPicker } from './vault-picker';

/**
 * Everything below the session gate. The vault is chosen and read in the
 * browser, so this is a Client Component and never runs on the server.
 */
export function ObsidianView() {
  const [state, setState] = useState<VaultState | null>(null);
  const [busy, setBusy] = useState(false);

  /** Replaces the stored handle with the one the owner picks. */
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

  async function allow(handle: FileSystemDirectoryHandle) {
    setBusy(true);
    try {
      if (await requestAccess(handle)) setState({ status: 'ready', handle });
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
    <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-border p-4 text-sm">
      <div className="flex flex-col gap-0.5">
        <p className="font-medium">{state.handle.name}</p>
        <p className="text-muted-foreground">Vault open.</p>
      </div>
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
  );
}
