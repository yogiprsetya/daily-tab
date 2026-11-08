/**
 * Runs `html` synchronously while the browser parses the server HTML, before
 * first paint. On client renders it becomes inert `text/plain`, which avoids
 * React's dev warning about rendering <script>. See
 * node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
