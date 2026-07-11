import type { Metadata } from 'next';

/**
 * Mesma razão do /perfil: as vagas vêm do localStorage. Sem CV enviado, o robô
 * vê só o estado vazio.
 */
export const metadata: Metadata = {
  title: 'Vagas para o seu perfil',
  robots: { index: false, follow: true },
};

export default function ResultadosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
