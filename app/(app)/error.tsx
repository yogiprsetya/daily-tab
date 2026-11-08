'use client';

import { Button } from '@/components/ui/button';

export default function AppError({ retry }: { retry: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-start gap-3 px-4 py-8 sm:px-8 lg:py-12">
      <h1 className="text-xl font-semibold tracking-tight">
        Could not load this page
      </h1>
      <p className="text-sm text-muted-foreground">
        Check your connection and try again.
      </p>
      <Button onClick={() => retry()} className="h-11 rounded-lg px-4 text-sm">
        Try again
      </Button>
    </div>
  );
}
