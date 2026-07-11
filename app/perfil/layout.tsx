import type { Metadata } from 'next';

/**
 * O conteúdo desta página vem do localStorage: para um robô que nunca enviou um
 * CV, ela é uma casca de 8 palavras. Indexá-la só ensinaria ao Google que o site
 * tem página vazia.
 */
export const metadata: Metadata = {
  title: 'Meu perfil',
  robots: { index: false, follow: true },
};

export default function PerfilLayout({ children }: { children: React.ReactNode }) {
  return children;
}
