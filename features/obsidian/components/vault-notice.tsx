import { NotebookText } from 'lucide-react';

export function VaultNotice({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-dashed border-border p-4 text-sm">
      <NotebookText
        aria-hidden
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
      />
      <div className="flex flex-col gap-0.5">
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
