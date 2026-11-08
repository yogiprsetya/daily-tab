'use client';

import { useId, useSyncExternalStore } from 'react';
import { InlineScript } from '@/components/inline-script';

const LOCALE = 'en-GB';
const WEEKDAY: Intl.DateTimeFormatOptions = { weekday: 'long' };
const DATE: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
};
// Rendered on the server, replaced before first paint by the inline script.
const BLANK = ' ';

export function formatDay(d: Date) {
  return {
    weekday: d.toLocaleDateString(LOCALE, WEEKDAY),
    date: d.toLocaleDateString(LOCALE, DATE),
  };
}

export function localIsoDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function msUntilNextMidnight(now: Date): number {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}

function subscribe(onChange: () => void) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(
      () => {
        onChange();
        schedule();
      },
      msUntilNextMidnight(new Date()) + 50
    );
  };
  // Timers stall while a phone sleeps or a tab is frozen: re-check on return.
  const onVisible = () => {
    if (document.visibilityState !== 'visible') return;
    onChange();
    schedule();
  };

  schedule();
  document.addEventListener('visibilitychange', onVisible);
  return () => {
    clearTimeout(timer);
    document.removeEventListener('visibilitychange', onVisible);
  };
}

const getSnapshot = () => localIsoDate(new Date());
// The server cannot know the device's time zone, and Cache Components forbids
// reading the clock while prerendering.
const getServerSnapshot = () => null;

function fillScript(id: string): string {
  const ids = JSON.stringify({ t: id, w: `${id}-w`, d: `${id}-d` });
  return `(function(){var i=${ids},n=new Date(),L=${JSON.stringify(LOCALE)},t=document.getElementById(i.t);if(!t)return;function p(x){return String(x).padStart(2,"0")}t.setAttribute("datetime",n.getFullYear()+"-"+p(n.getMonth()+1)+"-"+p(n.getDate()));document.getElementById(i.w).textContent=n.toLocaleDateString(L,${JSON.stringify(WEEKDAY)});document.getElementById(i.d).textContent=n.toLocaleDateString(L,${JSON.stringify(DATE)})})()`;
}

export function Today() {
  const id = useId();
  const iso = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const parts = iso ? formatDay(new Date(`${iso}T00:00:00`)) : null;

  return (
    <>
      <time
        id={id}
        dateTime={iso ?? undefined}
        suppressHydrationWarning
        className="flex flex-col gap-1"
      >
        <span
          id={`${id}-w`}
          suppressHydrationWarning
          className="text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          {parts?.weekday ?? BLANK}
        </span>
        <span
          id={`${id}-d`}
          suppressHydrationWarning
          className="text-base text-muted-foreground"
        >
          {parts?.date ?? BLANK}
        </span>
      </time>
      <InlineScript html={fillScript(id)} />
    </>
  );
}
