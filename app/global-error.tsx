'use client';
import { useEffect } from 'react';
import { recuperarDeDeploy } from '@/lib/deploy-recovery';

/**
 * O último anteparo: erro no próprio layout raiz, onde o `error.tsx` não chega.
 *
 * Aqui o layout falhou, então não há fontes, nem tema, nem `globals.css` de que
 * se possa depender — este arquivo precisa se bastar. Daí o estilo inline: é a
 * única coisa que certamente ainda funciona.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app:global]', error);
    recuperarDeDeploy(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#0b0b0c',
          color: '#f5f4ef',
          fontFamily: 'system-ui, sans-serif',
          padding: '2rem',
        }}
      >
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
            Algo quebrou aqui do nosso lado
          </h1>
          <p style={{ marginTop: '0.75rem', color: '#9b9b91', lineHeight: 1.6 }}>
            Não foi culpa sua, e o seu currículo continua salvo neste navegador.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: '1.75rem',
              border: 'none',
              borderRadius: 12,
              background: '#c8f31d',
              color: '#0b0b0c',
              fontWeight: 700,
              padding: '0.7rem 1.4rem',
              cursor: 'pointer',
            }}
          >
            Tentar de novo
          </button>
        </div>
      </body>
    </html>
  );
}
