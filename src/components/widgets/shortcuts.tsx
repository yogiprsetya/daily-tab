import { Plus } from 'lucide-react';
import type { SyntheticEvent } from 'react';
import { Button } from '~/components/ui/button';

type Shortcut = {
  title: string;
  url: string;
};

const InlineFallbackSvg = (size = 64) => {
  const svg = `<?xml version='1.0' encoding='UTF-8'?><svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'><rect width='100%' height='100%' fill='%23e5e7eb'/><text x='50%' y='55%' font-size='28' text-anchor='middle' fill='%236b7280' font-family='Arial'>🌐</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const getDomain = (url: string) => {
  try {
    const u = new URL(url);
    return u.hostname;
  } catch {
    try {
      const u = new URL('https://' + url);
      return u.hostname;
    } catch {
      return '';
    }
  }
};

const ShortcutTile: React.FC<Shortcut> = ({ title, url }) => {
  const domain = getDomain(url) || url;
  const primary = domain
    ? `https://www.google.com/s2/favicons?sz=64&domain=${domain}`
    : '';
  const secondary = domain ? `https://${domain}/favicon.ico` : '';
  const fallback = InlineFallbackSvg(64);

  const handleError = (e: SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;

    if (img.dataset.attempt === 'primary' && secondary) {
      img.dataset.attempt = 'secondary';
      img.src = secondary;
      return;
    }

    img.onerror = null;
    img.src = fallback;
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="aspect-square bg-muted rounded-lg border border-border flex flex-col items-center justify-center gap-2 p-3 hover:shadow-sm"
    >
      <img
        src={primary || fallback}
        data-attempt="primary"
        onError={handleError}
        alt={`${title} favicon`}
        className="h-10 w-10 rounded-md object-contain"
      />
      <span className="text-xs text-muted-foreground truncate text-center">
        {title}
      </span>
    </a>
  );
};

export const ShortcutsWidget = () => {
  const shortcuts: Shortcut[] = [
    { title: 'Google', url: 'https://www.google.com' },
    { title: 'GitHub', url: 'https://github.com' },
    { title: 'Reddit', url: 'https://www.reddit.com' },
    { title: 'Vercel', url: 'https://vercel.com' },
    { title: 'MDN', url: 'https://developer.mozilla.org' },
  ];

  return (
    <div className="h-full flex flex-col bg-card rounded-lg border p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Shortcuts</h2>
        <Button size="icon-sm" variant="ghost" aria-label="Add shortcut">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {shortcuts.map((s) => (
            <ShortcutTile key={s.url} title={s.title} url={s.url} />
          ))}
        </div>
      </div>
    </div>
  );
};
