import { createPublicKey } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { APP_URL } from './config.js';

const dir = new URL('./', import.meta.url);
const manifest = JSON.parse(
  readFileSync(new URL('manifest.json', dir), 'utf8')
);

describe('extension manifest', () => {
  it('is Manifest V3 and overrides New Tab', () => {
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.chrome_url_overrides).toEqual({ newtab: 'newtab.html' });
  });

  it('grants the deployed app as its only host', () => {
    expect(manifest.host_permissions).toEqual([`${APP_URL}/*`]);
  });

  it('asks for activeTab and nothing else', () => {
    expect(manifest.permissions).toEqual(['activeTab']);
    expect(manifest.content_scripts).toBeUndefined();
  });

  it('has a toolbar button that saves to the reading list', () => {
    expect(manifest.action.default_title).toBe('Save to reading list');
  });

  it('points only at files that exist', () => {
    const files = [
      manifest.chrome_url_overrides.newtab,
      manifest.background.service_worker,
      ...Object.values(manifest.icons as Record<string, string>),
    ];

    for (const file of files) {
      expect(existsSync(new URL(file, dir)), file).toBe(true);
    }
  });

  it('fixes the id with a public RSA key', () => {
    const key = createPublicKey({
      key: Buffer.from(manifest.key, 'base64'),
      format: 'der',
      type: 'spki',
    });

    expect(key.asymmetricKeyType).toBe('rsa');
  });

  it('keeps private key material out of the folder', () => {
    for (const entry of readdirSync(dir, { recursive: true })) {
      const name = String(entry);
      expect(name).not.toMatch(/\.(pem|crx)$/);
      // Shipped files only: this test names the phrase it looks for.
      if (!/\.(js|json|html)$/.test(name)) continue;
      expect(readFileSync(new URL(name, dir), 'utf8'), name).not.toMatch(
        /PRIVATE KEY/
      );
    }
  });
});
