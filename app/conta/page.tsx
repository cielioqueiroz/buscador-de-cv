import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getAccount } from '@/lib/auth/users';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { AccountSettings } from '@/components/auth/AccountSettings';
import { AccountDataSection } from '@/components/auth/AccountDataSection';

export const metadata: Metadata = {
  title: 'Conta',
  robots: { index: false, follow: false },
};

export default async function ContaPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/entrar?callbackUrl=/conta');

  const account = await getAccount(session.user.id);
  if (!account) redirect('/entrar?callbackUrl=/conta');

  return (
    <>
      <SiteHeader />
      <main id="conteudo" tabIndex={-1} className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-5 scroll-mt-24 outline-none">
        <h1 className="mb-6 font-display text-2xl font-extrabold tracking-tight">Conta</h1>
        <AccountSettings
          initialName={account.name}
          email={account.email}
          initialImage={account.image}
        />
        <div className="mt-6">
          <AccountDataSection email={account.email} hasPassword={account.has_password} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
