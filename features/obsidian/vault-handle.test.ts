import { describe, expect, it, vi } from 'vitest';
import { resolveVaultState, type VaultState } from './vault-handle';

const handle = {
  kind: 'directory',
  name: 'obs-vault',
} as unknown as FileSystemDirectoryHandle;

function lookup(permission: PermissionState | null) {
  return {
    load: vi.fn(async () => (permission === null ? null : handle)),
    query: vi.fn(async () => permission ?? 'denied'),
  };
}

describe('resolveVaultState', () => {
  it('is empty when nothing is stored', async () => {
    await expect(resolveVaultState(lookup(null))).resolves.toEqual({
      status: 'empty',
    });
  });

  it('is empty when the stored value is not a directory handle', async () => {
    const state = await resolveVaultState({
      load: async () => null,
      query: async () => 'granted',
    });

    expect(state.status).toBe('empty');
  });

  it('is ready when permission is already granted', async () => {
    const state = await resolveVaultState(lookup('granted'));

    expect(state).toEqual({ status: 'ready', handle });
  });

  it('needs permission when the owner must allow it again', async () => {
    const state = await resolveVaultState(lookup('prompt'));

    expect(state).toEqual({ status: 'needs-permission', handle });
  });

  it('is empty when permission was denied, so the handle is forgotten', async () => {
    const state = await resolveVaultState(lookup('denied'));

    expect(state.status).toBe('empty');
  });

  it('asks for the permission state once and never prompts', async () => {
    const spies = lookup('prompt');
    await resolveVaultState(spies);

    expect(spies.query).toHaveBeenCalledTimes(1);
    expect(spies.load).toHaveBeenCalledTimes(1);
  });
});

describe('VaultState', () => {
  it('narrows to a handle in both permission states', () => {
    const states: VaultState[] = [
      { status: 'ready', handle },
      { status: 'needs-permission', handle },
    ];

    for (const state of states) {
      if (state.status === 'ready' || state.status === 'needs-permission') {
        expect(state.handle).toBe(handle);
      }
    }
  });
});
