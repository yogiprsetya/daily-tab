import { AlertCircle } from 'lucide-react';

/** A failed GET, where a skeleton would otherwise sit forever. */
export function LoadError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="flex items-center gap-2 text-sm text-destructive"
    >
      <AlertCircle aria-hidden className="size-4 shrink-0" />
      {message}
    </p>
  );
}
