const BAR = 'h-11 rounded-lg bg-muted motion-safe:animate-pulse';

export function ReadingSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-6">
      <div className="flex justify-between gap-3">
        <div className={`${BAR} w-32`} />
        <div className={`${BAR} w-28`} />
      </div>
      <div className="flex flex-col gap-2">
        <div className={BAR} />
        <div className={BAR} />
        <div className={BAR} />
      </div>
    </div>
  );
}
