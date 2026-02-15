import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavbarLinks } from '~/state/use-navbar-links';
import { NavbarLinkDialog } from '~/components/common/navbar-link-dialog';
import { ScrollArea, ScrollBar } from '~/components/ui/scroll-area';

export const ShortcutLinks = () => {
  const { links: shortcuts, refresh: refreshNavbarLinks } = useNavbarLinks();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  return (
    <ScrollArea className="w-6/12">
      <div className="flex items-center gap-4 w-full justify-end">
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label="Manage shortcuts"
          title="Manage shortcuts"
          onClick={() => setShortcutsOpen(true)}
        >
          <Plus />
        </Button>

        <div className="flex items-center">
          {shortcuts.slice(0, 5).map((s) => (
            <Button
              key={s.id}
              asChild
              variant="link"
              size="xs"
              className="text-muted-foreground"
            >
              <a
                href={s.url.startsWith('http') ? s.url : `https://${s.url}`}
                rel="noopener noreferrer"
                title={s.url}
              >
                {s.title}
              </a>
            </Button>
          ))}
        </div>
      </div>

      <NavbarLinkDialog
        open={shortcutsOpen}
        onOpenChange={(open: boolean) => {
          setShortcutsOpen(open);
          if (!open) refreshNavbarLinks();
        }}
      />

      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};
