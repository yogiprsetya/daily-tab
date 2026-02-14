import { Edit3, SquareArrowOutUpRight, Trash2 } from 'lucide-react';
import { type SyntheticEvent } from 'react';
import { Button } from '~/components/ui/button';

export type Shortcut = {
  id: string;
  title: string;
  url: string;
  createdAt?: number;
  updatedAt?: number;
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

type Props = {
  s: Shortcut;
  onEdit: (s: Shortcut) => void;
  onDelete: (id: string) => void;
};

export const ShortcutTile: React.FC<Props> = ({ s, onEdit, onDelete }) => {
  const { title, url, id } = s;
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
    <div className="relative group">
      <a
        href={url}
        rel="noreferrer"
        className="aspect-square bg-muted rounded flex flex-col items-center justify-center gap-2 p-3 hover:shadow-sm"
      >
        <img
          src={primary || fallback}
          data-attempt="primary"
          onError={handleError}
          alt={`${title} favicon`}
          className="size-8 rounded-md object-contain"
        />

        <span className="text-xs text-muted-foreground truncate text-center">
          {title}
        </span>
      </a>

      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 group">
        <Button
          asChild
          size="icon-xs"
          variant="ghost"
          aria-label="Edit shortcut"
          title={`Open ${title} in new tab`}
        >
          <a href={url} target="_blank" rel="noreferrer">
            <SquareArrowOutUpRight className="size-3 text-muted-foreground" />
          </a>
        </Button>

        <Button
          size="icon-xs"
          variant="ghost"
          aria-label="Edit shortcut"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit(s);
          }}
        >
          <Edit3 className="size-3 text-muted-foreground" />
        </Button>

        <Button
          size="icon-xs"
          variant="ghost"
          aria-label="Delete shortcut"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(id);
          }}
        >
          <Trash2 className="size-3 text-destructive/75" />
        </Button>
      </div>
    </div>
  );
};
