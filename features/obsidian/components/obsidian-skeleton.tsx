const BAR = 'h-11 rounded-lg bg-muted motion-safe:animate-pulse';

export function ObsidianSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-6">
      <div className={BAR} />
      <div className="flex flex-col gap-2">
        <div className={BAR} />
        <div className={BAR} />
        <div className={BAR} />
      </div>
    </div>
  );
}
