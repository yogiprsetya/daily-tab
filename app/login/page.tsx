import type { Metadata } from 'next';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Sign in · Daily Tab' };

export default function LoginPage() {
  return (
    <main className="flex h-dvh w-full items-center justify-center overflow-y-auto px-4">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          {/* Decorative: the heading carries the name. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon.svg" alt="" width={48} height={48} />
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold tracking-tight">Daily Tab</h1>
            <p className="text-sm text-muted-foreground">
              Sign in with your email and PIN.
            </p>
          </div>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
