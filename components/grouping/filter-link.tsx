import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function FilterLink({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      data-slot="button"
      className={cn(
        buttonVariants({
          variant: active ? 'secondary' : 'outline',
        }),
        'h-11',
        !active && 'text-muted-foreground'
      )}
    >
      <span className="max-w-40 truncate">{label}</span>
      <span className="text-xs tabular-nums">{count}</span>
    </Link>
  );
}
