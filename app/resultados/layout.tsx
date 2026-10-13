import type { Metadata } from 'next';

/** Página de conta: exige login (ver page.tsx); robô só veria o redirect. */
export const metadata: Metadata = {
  title: 'Vagas para o seu perfil',
  robots: { index: false, follow: true },
};

export default function ResultadosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
