'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiRefreshCw, FiHome, FiAlertTriangle } from 'react-icons/fi';
import { recuperarDeDeploy } from '@/lib/deploy-recovery';

/**
 * A rede de segurança do app.
 *
 * Sem ela, qualquer erro no cliente entregava a tela padrão do Next — cinza, em
 * inglês, sem saída ("Application error: a client-side exception has occurred").
 * Foi o que o usuário viu em produção depois de um deploy, com o currículo já
 * enviado. Uma tela dessas é o fim da visita.
 *
 * Se o erro for de deploy (ver `deploy-recovery`), a página se recarrega sozinha
 * e nem chega a mostrar isto: o conserto acontece sem o usuário saber que houve
 * um problema. O currículo e o ranking ficam no localStorage, então a recarga
 * não perde nada.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Enquanto a recarga não acontece, não pisca a tela de erro na cara de quem
  // só precisava de um F5.
  const [recuperando, setRecuperando] = useState(true);

  useEffect(() => {
    console.error('[app]', error);
    if (!recuperarDeDeploy(error)) setRecuperando(false);
  }, [error]);

  if (recuperando) {
    return (
      <main className="grid flex-1 place-items-center px-5 py-24">
        <p className="flex items-center gap-2 font-mono text-sm text-muted">
          <FiRefreshCw className="h-4 w-4 animate-spin-slow" />
          Atualizando para a versão nova…
        </p>
      </main>
    );
  }

  return (
    <main className="grid flex-1 place-items-center px-5 py-24">
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-8 text-center sm:p-10">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-warn/10 text-warn">
          <FiAlertTriangle className="h-6 w-6" />
        </span>

        <h1 className="mt-5 font-display text-2xl font-extrabold">Algo quebrou aqui do nosso lado</h1>
        <p className="mt-2 text-sm text-muted">
          Não foi culpa sua, e o seu currículo continua salvo neste navegador. Tentar de novo
          costuma resolver.
        </p>

        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="hover-glow inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 font-display text-sm font-bold text-accent-foreground"
          >
            <FiRefreshCw className="h-4 w-4" /> Tentar de novo
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 px-5 py-2.5 font-display text-sm font-bold transition-colors hover:border-accent-ink"
          >
            <FiHome className="h-4 w-4" /> Voltar ao início
          </Link>
        </div>

        {error.digest && (
          <p className="mt-6 font-mono text-[11px] text-muted">código: {error.digest}</p>
        )}
      </div>
    </main>
  );
}
