import type { Metadata } from 'next';

/** Painel do usuário logado — page.tsx exige sessão; nada aqui é indexável. */
export const metadata: Metadata = {
  title: 'Meu perfil',
  robots: { index: false, follow: false },
};

export default function PerfilLayout({ children }: { children: React.ReactNode }) {
  return children;
}
