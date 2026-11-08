import type { Metadata, Viewport } from 'next';
import { Geist_Mono, Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Daily Tab',
  description: 'Shortcuts, todos, bookmarks, reading list and notes.',
};

export const viewport: Viewport = {
  // Hex of the dark `--background` token (oklch(0.148 0.004 228.8)).
  themeColor: '#090b0c',
  colorScheme: 'dark',
  // Lets content extend under the Android gesture bar; the shell pads with safe-area insets.
  viewportFit: 'cover',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={cn(
        'dark h-full antialiased',
        inter.variable,
        geistMono.variable
      )}
    >
      <body className="h-dvh overflow-hidden">{children}</body>
    </html>
  );
}
