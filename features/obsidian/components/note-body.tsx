'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { safeUrl } from '../markdown';

/**
 * Typography for the elements Markdown produces, scoped to the note so no
 * global stylesheet has to know about it. Grouped by element, unlike the
 * single-line form, so a change is easy to find.
 */
const PROSE = [
  'flex flex-col gap-4 text-sm leading-relaxed',
  '[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4',
  '[&_h1]:text-xl [&_h1]:font-semibold [&_h1]:tracking-tight',
  '[&_h2]:text-lg [&_h2]:font-semibold',
  '[&_h3]:font-semibold',
  '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1',
  '[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground',
  '[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5',
  '[&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3',
  '[&_table]:w-full [&_table]:border-collapse',
  '[&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_th]:text-left',
  '[&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1',
  '[&_hr]:border-border',
].join(' ');

/**
 * A note, rendered in the browser. Raw HTML is shown as text: `react-markdown`
 * turns it into a text node and no `rehype-raw` is added. Task lists keep their
 * checkboxes read-only because nothing here handles a change.
 */
export function NoteBody({ text }: { text: string }) {
  return (
    <div className={PROSE}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={safeUrl}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer noopener">
              {children}
            </a>
          ),
          input: ({ checked }) => (
            <input
              type="checkbox"
              checked={checked}
              readOnly
              aria-hidden
              className="mr-1.5"
            />
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
