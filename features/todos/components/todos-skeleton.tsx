import { SECTION_HEADING } from './styles';

const BAR = 'h-11 rounded-lg bg-muted motion-safe:animate-pulse';

export function TodosSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-6">
      <div className="flex gap-2">
        <div className={`${BAR} w-20`} />
        <div className={`${BAR} w-28`} />
      </div>
      <div className={BAR} />
      <div className="flex flex-col gap-2">
        <div className={BAR} />
        <div className={BAR} />
        <div className={BAR} />
      </div>
    </div>
  );
}

export function PendingSkeleton() {
  return (
    <>
      <div className="flex min-h-11 items-center">
        <h2 id="pending-heading" className={SECTION_HEADING}>
          Pending tasks
        </h2>
      </div>
      <div aria-hidden className="flex flex-col gap-2">
        <div className={BAR} />
        <div className={BAR} />
      </div>
    </>
  );
}
