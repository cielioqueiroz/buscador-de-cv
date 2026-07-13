'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import {
  FiX,
  FiCopy,
  FiDownload,
  FiRefreshCw,
  FiFileText,
  FiShare2,
  FiKey,
  FiCheck,
} from 'react-icons/fi';
import {
  coverLetterFilename,
  coverLetterToText,
  LENGTH_LABELS,
  TONE_LABELS,
  type CoverLetter,
  type Length,
  type Tone,
} from '@/lib/cover-letter';
import { buildCoverLetterPdf } from '@/lib/cover-letter-pdf';
import { compartilhar } from '@/lib/share';
import { loadLetter, saveLetter } from '@/lib/store';
import type { CVProfile, Job } from '@/lib/providers/types';
import { cn } from '@/lib/utils';

const TONES: Tone[] = ['formal', 'entusiasmado', 'direto'];
const LENGTHS: Length[] = ['curta', 'media'];

const LENGTH_HINT: Record<Length, string> = {
  curta: '~150 palavras',
  media: '~250 palavras',
};

interface Props {
  job: Job;
  profile: CVProfile;
  onClose: () => void;
}

/**
 * O painel onde a carta nasce, é ajustada e sai para o mundo.
 *
 * Duas decisões que valem a explicação:
 *
 * 1. Ele NÃO gera nada ao abrir. Se já existe carta salva para esta vaga, mostra
 *    a salva; se não existe, mostra a tela de escolher tom e tamanho, e espera o
 *    clique. Gerar por conta própria queimaria uma chamada paga que ninguém pediu
 *    — e é justamente o que o usuário disse que não quer.
 * 2. O que é salvo é o TEXTO NA TELA, não o que o modelo devolveu. Se a pessoa
 *    editou, é a edição dela que sobrevive ao fechar o painel.
 */
export function CoverLetterPanel({ job, profile, onClose }: Props) {
  const saved = useRef(loadLetter(job.id)).current;

  const [tone, setTone] = useState<Tone>(saved?.tone ?? 'entusiasmado');
  const [length, setLength] = useState<Length>(saved?.length ?? 'media');
  const [letter, setLetter] = useState<CoverLetter | null>(saved?.letter ?? null);
  const [text, setText] = useState(saved?.text ?? '');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  // Qual ação pesada está em curso: o PDF precisa buscar o jsPDF na rede na
  // primeira vez, e um botão que não responde parece um botão quebrado.
  const [busy, setBusy] = useState<'pdf' | 'share' | null>(null);

  // Esc fecha, e a rolagem do fundo trava enquanto o painel está aberto —
  // sem isso, rolar dentro do textarea acaba rolando a lista de vagas atrás.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  async function gerar() {
    setLoading(true);
    try {
      const res = await fetch('/api/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, job, tone, length }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Não deu para escrever a carta.');

      const nova = data.letter as CoverLetter;
      const novoTexto = coverLetterToText(nova);
      setLetter(nova);
      setText(novoTexto);
      saveLetter(job.id, { letter: nova, text: novoTexto, tone, length, savedAt: Date.now() });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Não deu para escrever a carta.');
    } finally {
      setLoading(false);
    }
  }

  /** Toda edição manual é persistida — a carta na tela é a carta de verdade. */
  function editar(novo: string) {
    setText(novo);
    if (letter) saveLetter(job.id, { letter, text: novo, tone, length, savedAt: Date.now() });
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Seu navegador bloqueou a cópia. Selecione o texto e copie à mão.');
    }
  }

  function baixar(blob: Blob, nome: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nome;
    a.click();
    URL.revokeObjectURL(url);
  }

  function baixarTxt() {
    baixar(
      new Blob([text], { type: 'text/plain;charset=utf-8' }),
      coverLetterFilename(job.company, 'txt'),
    );
  }

  /** O jsPDF só é baixado aqui dentro — ver `lib/cover-letter-pdf.ts`. */
  async function baixarPdf() {
    setBusy('pdf');
    try {
      const blob = await pdf();
      baixar(blob, coverLetterFilename(job.company, 'pdf'));
    } catch {
      toast.error('Não deu para gerar o PDF. Tente baixar em .txt.');
    } finally {
      setBusy(null);
    }
  }

  function pdf(): Promise<Blob> {
    return buildCoverLetterPdf({ texto: text, job, titulo: profile.title });
  }

  /**
   * Compartilha o PDF pelo menu do sistema. Onde não der para mandar arquivo,
   * vai o texto; onde não houver Web Share (a maioria dos desktops), o texto é
   * copiado — sempre sobra um caminho que funciona.
   */
  async function compartilharCarta() {
    setBusy('share');
    try {
      let file: File | undefined;
      try {
        file = new File([await pdf()], coverLetterFilename(job.company, 'pdf'), {
          type: 'application/pdf',
        });
      } catch {
        // Sem PDF ainda dá para compartilhar o texto — não é motivo para desistir.
      }

      const r = await compartilhar({
        title: `Carta de apresentação — ${job.title} · ${job.company}`,
        text,
        file,
      });

      if (r === 'copiado') toast.success('Carta copiada — é só colar onde quiser.');
      if (r === 'falhou') toast.error('Seu navegador bloqueou o compartilhamento.');
    } finally {
      setBusy(null);
    }
  }

  return createPortal(
    // `print-host` é o único filho do <body> que sobrevive ao @media print — é
    // por dentro dele que a folha A4 chega à impressora. O overlay em si sai.
    <div className="print-host">
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center print:hidden">
      {/* O fundo fecha ao clique, mas não é um botão para a tecnologia
          assistiva: quem navega por teclado já tem o X e o Esc, e anunciar
          "Fechar" duas vezes só atrapalha. */}
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Carta de apresentação para ${job.title}`}
        className="animate-rise relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-border bg-surface shadow-2xl sm:max-h-[88vh] sm:rounded-3xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
              Carta de apresentação
            </p>
            <h2 className="mt-1 truncate font-display text-xl font-bold">{job.title}</h2>
            <p className="truncate text-sm text-muted">{job.company}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border text-muted transition-colors hover:text-foreground"
          >
            <FiX className="h-[18px] w-[18px]" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Escolha label="Tom">
              {TONES.map((t) => (
                <Pilula key={t} ativo={tone === t} onClick={() => setTone(t)}>
                  {TONE_LABELS[t]}
                </Pilula>
              ))}
            </Escolha>
            <Escolha label="Tamanho">
              {LENGTHS.map((l) => (
                <Pilula key={l} ativo={length === l} onClick={() => setLength(l)}>
                  {LENGTH_LABELS[l]}
                  <span className="ml-1 font-mono text-[10px] opacity-60">{LENGTH_HINT[l]}</span>
                </Pilula>
              ))}
            </Escolha>
          </div>

          {!letter && !loading && (
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface-2/50 p-8 text-center">
              <p className="font-display text-lg font-bold">Nenhuma carta ainda</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
                Escolha o tom e o tamanho. A IA lê o seu currículo e a descrição desta vaga, e
                escreve uma carta que só serve para <strong className="text-foreground">esta</strong>{' '}
                empresa.
              </p>
              <button
                onClick={gerar}
                className="hover-glow mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 font-display text-sm font-bold text-accent-foreground"
              >
                Escrever minha carta
              </button>
            </div>
          )}

          {loading && <Escrevendo />}

          {letter && !loading && (
            <>
              <textarea
                value={text}
                onChange={(e) => editar(e.target.value)}
                spellCheck
                aria-label="Texto da carta"
                className="mt-5 min-h-[300px] w-full resize-y rounded-2xl border border-border bg-surface-2/40 p-5 text-[15px] leading-relaxed text-foreground outline-none transition-colors focus:border-accent-ink"
              />

              {letter.keywords.length > 0 && (
                <div className="mt-4 rounded-2xl border border-border bg-surface-2/40 p-4">
                  <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-muted">
                    <FiKey className="h-3.5 w-3.5" /> puxado da vaga
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {letter.keywords.map((k) => (
                      <span
                        key={k}
                        className="rounded-full bg-accent/15 px-2.5 py-1 font-mono text-[11px] font-medium text-accent-ink"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-muted">
                    Termos que a vaga pede e a sua carta usa — é o que um filtro automático (ATS)
                    procura.
                  </p>
                </div>
              )}

              <p className="mt-4 text-xs text-muted">
                Leia antes de enviar. A IA escreveu a partir do seu CV, mas quem assina é você.
              </p>
            </>
          )}
        </div>

        {letter && (
          <footer className="flex flex-wrap items-center gap-2 border-t border-border bg-surface px-6 py-4">
            <button
              onClick={baixarPdf}
              disabled={busy !== null}
              className="hover-glow inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 font-display text-sm font-bold text-accent-foreground disabled:opacity-60 sm:flex-none"
            >
              <FiDownload className={cn('h-4 w-4', busy === 'pdf' && 'animate-bob')} />
              {busy === 'pdf' ? 'Gerando…' : 'Baixar PDF'}
            </button>

            <button
              onClick={compartilharCarta}
              disabled={busy !== null}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-2.5 font-display text-sm font-bold transition-colors hover:border-accent-ink disabled:opacity-60 sm:flex-none"
            >
              <FiShare2 className="h-4 w-4" />
              Compartilhar
            </button>

            {/* Os três secundários andam juntos: soltos, o `flex-wrap` deixava um
                deles órfão na linha de cima no celular. */}
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <button
                onClick={copiar}
                aria-label="Copiar o texto da carta"
                title="Copiar"
                className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-surface-2 text-muted transition-colors hover:text-foreground"
              >
                {copied ? (
                  <FiCheck className="h-[18px] w-[18px] text-accent-ink" />
                ) : (
                  <FiCopy className="h-[18px] w-[18px]" />
                )}
              </button>

              <button
                onClick={baixarTxt}
                aria-label="Baixar em .txt"
                title="Baixar .txt"
                className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-surface-2 text-muted transition-colors hover:text-foreground"
              >
                <FiFileText className="h-[18px] w-[18px]" />
              </button>

              <button
                onClick={gerar}
                disabled={loading}
                aria-label="Regenerar a carta"
                title="Regenerar"
                className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-surface-2 text-muted transition-colors hover:text-foreground disabled:opacity-50"
              >
                <FiRefreshCw className={cn('h-[18px] w-[18px]', loading && 'animate-spin-slow')} />
              </button>
            </div>
          </footer>
        )}
      </div>
      </div>

      {/* A folha A4 que só existe na impressão — é ela que vira o PDF. */}
      {letter && (
        <div className="print-sheet">
          <h1>{profile.title}</h1>
          <p className="print-meta">
            {job.title} · {job.company}
          </p>
          {text
            .split(/\n{2,}/)
            .filter((p) => p.trim())
            .map((p, i) => (
              <p key={i}>{p}</p>
            ))}
        </div>
      )}
    </div>,
    document.body,
  );
}

function Escolha({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted">
        {label}
      </legend>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </fieldset>
  );
}

function Pilula({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        ativo
          ? 'border-accent-ink bg-accent/15 text-accent-ink'
          : 'border-border bg-surface-2 text-muted hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

/** A espera tem que parecer escrita acontecendo, não uma barra parada. */
function Escrevendo() {
  return (
    <div className="mt-6 space-y-3 rounded-2xl border border-border bg-surface-2/40 p-6">
      <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent-ink">
        <span className="h-1.5 w-1.5 animate-pulse-ring rounded-full bg-accent-bright" />
        escrevendo sua carta
      </p>
      {[92, 100, 84, 96, 70].map((w, i) => (
        <div
          key={i}
          className="animate-type-line h-3 rounded-full bg-foreground/10"
          style={{ width: `${w}%`, animationDelay: `${i * 140}ms` }}
        />
      ))}
    </div>
  );
}
