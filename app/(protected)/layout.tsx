/**
 * Layout per route protette: verifica sessione, BottomTabBar, PageTransition.
 * Redirect a / se non autenticato.
 */
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/actions/auth';
import { BottomTabBar } from '@/components/BottomTabBar';
import { PageTransition } from '@/components/PageTransition';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/');
  }

  return (
    <div className="min-h-dvh bg-bg-primary pb-20 safe-area-bottom">
      <PageTransition>{children}</PageTransition>
      <BottomTabBar />
    </div>
  );
}
