import { AppShell } from '@/components/shell/app-shell';
import { SwrProvider } from '@/lib/swr/provider';

export default function AppLayout({ children }: LayoutProps<'/'>) {
  return (
    <SwrProvider>
      <AppShell>{children}</AppShell>
    </SwrProvider>
  );
}
