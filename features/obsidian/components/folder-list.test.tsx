import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { FolderList } from './folder-list';

const root = {} as FileSystemDirectoryHandle;

describe('FolderList', () => {
  it('shows an empty folder state', () => {
    const html = renderToStaticMarkup(<FolderList entries={[]} root={root} />);
    expect(html).toContain('This folder is empty.');
  });

  it('links notes and marks the selected note as the current page', () => {
    const html = renderToStaticMarkup(
      <FolderList
        root={root}
        entries={[
          { kind: 'note', name: 'Project plan', path: 'Work/Project plan.md' },
        ]}
        selectedPath="Work/Project plan.md"
      />
    );

    expect(html).toContain('href="/obsidian?note=Work%2FProject+plan.md"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('Project plan');
  });

  it('exposes expandable folders with an accessible trigger', () => {
    const html = renderToStaticMarkup(
      <FolderList
        root={root}
        entries={[{ kind: 'folder', name: 'Research', path: 'Research' }]}
      />
    );

    expect(html).toContain('aria-label="Research folder contents"');
    expect(html).toContain('href="/obsidian?folder=Research"');
  });
});
