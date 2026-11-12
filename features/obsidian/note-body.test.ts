import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { NoteBody } from './components/note-body';

/** The note body is a Client Component, but it is a plain function in a test. */
const render = (text: string) =>
  renderToStaticMarkup(createElement(NoteBody, { text }));

describe('NoteBody', () => {
  it('renders headings, lists and quotes', () => {
    const html = render('# Title\n\n- one\n- two\n\n> quoted\n');

    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<li>one</li>');
    expect(html).toContain('<blockquote>');
  });

  it('renders a GFM table', () => {
    const html = render('| a | b |\n| - | - |\n| 1 | 2 |\n');

    expect(html).toContain('<table>');
    expect(html).toContain('<th>a</th>');
    expect(html).toContain('<td>1</td>');
  });

  it('shows raw HTML as text instead of running it', () => {
    const html = render(
      '<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n'
    );

    expect(html).not.toContain('<script');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('keeps http and https links, opening them in a new tab', () => {
    const html = render('[site](https://example.com)\n');

    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noreferrer noopener"');
  });

  it('drops a javascript link', () => {
    const html = render('[x](javascript:alert(1))\n');

    expect(html).not.toContain('javascript:');
  });

  it('drops a relative link, which would point at the app', () => {
    const html = render('[other](./other-note.md)\n');

    expect(html).not.toContain('href="./other-note.md"');
  });

  it('renders task lists as read-only checkboxes', () => {
    const html = render('- [x] done\n- [ ] todo\n');

    expect(html.match(/type="checkbox"/g)).toHaveLength(2);
    // Two boxes, both read-only, one already ticked: no handler exists, so they
    // cannot be changed from the page.
    expect(html.match(/readOnly=""/g)).toHaveLength(2);
    expect(html.match(/checked=""/g)).toHaveLength(1);
    expect(html).not.toContain('disabled');
  });
});
