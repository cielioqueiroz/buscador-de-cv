'use client';
import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { FiUploadCloud, FiFileText } from 'react-icons/fi';
import type { Stage } from '@/lib/stages';
import { LoadingJourney } from '@/components/LoadingJourney';
import { AuthGateModal } from '@/components/auth/AuthGateModal';
import { cn } from '@/lib/utils';

const ACCEPT = '.pdf,.doc,.docx,.txt,.md,.rtf,.csv';
const MAX_MB = 8;

type Props = {
  /** Se o modal de cadastro deve oferecer "Criar conta com Google". */
  googleEnabled?: boolean;
};

export function CVUpload({ googleEnabled = false }: Props) {
  const router = useRouter();
  const { status } = useSession();
  const authed = status === 'authenticated';
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [stage, setStage] = useState<Stage | null>(null);
  // A última etapa alcançada diz, numa falha, se o CV já foi lido e salvo.
  const lastStage = useRef<Stage | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const closeGate = useCallback(() => setGateOpen(false), []);

  /** Visitante vê o convite para criar conta; enquanto a sessão carrega, nada acontece. */
  function canUse(): boolean {
    if (status === 'loading') return false;
    if (!authed) {
      setGateOpen(true);
      return false;
    }
    return true;
  }

  function openPicker() {
    if (canUse()) inputRef.current?.click();
  }

  async function handleFile(file: File) {
    // Permite escolher o mesmo arquivo novamente depois de uma falha.
    if (inputRef.current) inputRef.current.value = '';
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`Arquivo muito grande (máx. ${MAX_MB}MB).`);
      return;
    }
    setFileName(file.name);
    try {
      // A espera inteira roda aqui, sob o overlay: quando /resultados abre, o
      // ranking já está em cache e a página aparece pronta.
      lastStage.current = null;
      // A jornada (e o Zod que valida as respostas) só baixa quando há um
      // arquivo: fora do bundle inicial da landing, que é a porta de entrada.
      const { runJourney } = await import('@/lib/journey');
      await runJourney(file, (s) => {
        lastStage.current = s;
        setStage(s);
      });
      router.push('/resultados');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erro inesperado.';
      // Passou da leitura: o perfil já está na conta e só a busca falhou.
      // Recarregar os dados tira o /perfil do "envie seu currículo".
      const cvSalvo = lastStage.current !== null && lastStage.current !== 'reading';
      toast.error(cvSalvo ? `Seu currículo foi salvo, mas a busca de vagas falhou. ${message}` : message);
      if (cvSalvo) router.refresh();
      setStage(null);
      setFileName(null);
    }
  }

  if (stage) return <LoadingJourney stage={stage} />;

  return (
    <>
    <div
      id="cv-upload"
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f && canUse()) handleFile(f);
      }}
      onClick={openPicker}
      role="button"
      tabIndex={0}
      aria-label="Enviar currículo"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openPicker();
        }
      }}
      className={cn(
        'group relative scroll-mt-24 cursor-pointer overflow-hidden rounded-panel border-2 border-dashed p-10 text-center transition-all duration-300 sm:p-14',
        dragging
          ? 'border-accent bg-accent-bright/10 scale-[1.02] shadow-float'
          : 'border-border bg-surface hover:-translate-y-1.5 hover:border-accent hover:bg-accent-bright/[0.04] hover:shadow-float',
      )}
    >
      {/* brilho que acende no hover/drag */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute -inset-px rounded-panel opacity-0 transition-opacity duration-300',
          'bg-[radial-gradient(circle_at_50%_0%,color-mix(in_srgb,var(--accent)_22%,transparent),transparent_70%)]',
          dragging ? 'opacity-100' : 'group-hover:opacity-100',
        )}
      />

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      <div className="pointer-events-none relative flex flex-col items-center gap-4">
        <div
          className={cn(
            'grid h-16 w-16 place-items-center rounded-card transition-all duration-300',
            'group-hover:-translate-y-1 group-hover:scale-110 group-hover:-rotate-6 group-hover:shadow-accent',
            dragging && 'scale-110 -rotate-6',
            'bg-accent text-accent-foreground',
          )}
        >
          {fileName ? <FiFileText className="h-7 w-7" /> : <FiUploadCloud className="h-7 w-7" />}
        </div>

        <div>
          <p className="font-display text-xl font-bold">Solte seu currículo aqui</p>
          <p className="mt-1 text-sm text-muted">
            {fileName ?? 'ou clique para escolher — PDF, Word, TXT, Markdown, RTF ou CSV'}
          </p>
        </div>

        <span className="mt-1 rounded-full bg-accent px-5 py-2 font-display text-sm font-bold text-accent-foreground transition-all duration-300 group-hover:scale-105 group-hover:shadow-accent">
          Escolher arquivo
        </span>
        {status === 'unauthenticated' ? (
          <span className="text-xs text-muted">Precisa de uma conta grátis — leva 30 segundos.</span>
        ) : null}
      </div>
    </div>
    <AuthGateModal open={gateOpen} onClose={closeGate} googleEnabled={googleEnabled} />
    </>
  );
}
