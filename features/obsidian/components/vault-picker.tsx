'use client';

import { FolderOpen, ShieldQuestion } from 'lucide-react';
import { ACTION } from '@/components/form-styles';
import { Button } from '@/components/ui/button';
import { VaultNotice } from './vault-notice';

const HINT = 'text-muted-foreground';

/**
 * The three states before a folder is open. `unsupported` is a dead end on
 * purpose: the Android PWA, Safari and Firefox have no picker, and no amount of
 * clicking changes that.
 */
export function VaultPicker({
  status,
  vaultName,
  busy,
  onPick,
  onAllow,
}: {
  status: 'unsupported' | 'empty' | 'needs-permission';
  vaultName?: string;
  busy: boolean;
  onPick: () => void;
  onAllow: () => void;
}) {
  if (status === 'unsupported') {
    return (
      <VaultNotice
        title="Open the vault on a desktop"
        description="The vault reads files in Chrome or Edge on a desktop. Phones and tablets cannot open a folder."
      />
    );
  }

  if (status === 'needs-permission') {
    return (
      <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-border p-4 text-sm">
        <div className="flex items-start gap-3">
          <ShieldQuestion
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          />
          <div className="flex flex-col gap-0.5">
            <p className="font-medium">Allow access to {vaultName}</p>
            <p className={HINT}>
              Chrome asks again after it restarts. Nothing leaves your PC.
            </p>
          </div>
        </div>
        <Button
          type="button"
          onClick={onAllow}
          disabled={busy}
          className={ACTION}
        >
          <FolderOpen aria-hidden />
          Allow access
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-border p-4 text-sm">
      <div className="flex items-start gap-3">
        <FolderOpen
          aria-hidden
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        />
        <div className="flex flex-col gap-0.5">
          <p className="font-medium">Choose your vault folder</p>
          <p className={HINT}>
            Daily Tab reads the notes in your browser. They are never uploaded.
          </p>
        </div>
      </div>
      <Button type="button" onClick={onPick} disabled={busy} className={ACTION}>
        <FolderOpen aria-hidden />
        Choose folder
      </Button>
    </div>
  );
}
