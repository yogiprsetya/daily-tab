'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { safeNextPath } from '@/features/auth/request';

const FIELD = 'h-11 rounded-lg px-3 text-base sm:text-sm md:text-sm';

function retryMessage(retryAfter: string | null) {
  const minutes = Math.max(1, Math.ceil(Number(retryAfter || 60) / 60));
  return `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`;
}

export function LoginForm() {
  const router = useRouter();
  const pinRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: form.get('email'),
          pin: form.get('pin'),
        }),
      });

      if (res.ok) {
        // Read at submit time: keeps /login fully static (no useSearchParams).
        const next = new URLSearchParams(window.location.search).get('next');
        router.replace(safeNextPath(next));
        return;
      }

      setError(
        res.status === 429
          ? retryMessage(res.headers.get('retry-after'))
          : res.status === 401
            ? 'Email or PIN is incorrect.'
            : 'Something went wrong. Try again.'
      );
    } catch {
      setError('Could not reach the server. Check your connection.');
    }

    if (pinRef.current) pinRef.current.value = '';
    pinRef.current?.focus();
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="text-sm">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          autoFocus
          className={FIELD}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="pin" className="text-sm">
          PIN
        </Label>
        <Input
          ref={pinRef}
          id="pin"
          name="pin"
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="current-password"
          required
          className={`${FIELD} tracking-widest`}
        />
      </div>

      <p
        role="alert"
        aria-live="assertive"
        className="min-h-5 text-sm text-destructive"
      >
        {error}
      </p>

      <Button
        type="submit"
        disabled={pending}
        className="h-11 rounded-lg text-sm"
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
