'use client';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Aparece quando entra na tela — uma vez só, sem piscar ao rolar de volta.
 *
 * O `animate-rise` que já existia dispara na montagem: numa seção lá embaixo,
 * a animação acontece antes de alguém poder vê-la, e quando o usuário chega ela
 * já acabou. Isto conserta isso.
 *
 * O estado inicial é invisível, mas só depois que o observer confirma que o
 * JS está vivo — se o script falhar, o conteúdo continua na tela, visível. Nunca
 * esconder conteúdo que talvez nunca volte.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = 'div',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'li';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [dentro, setDentro] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDentro(true);
      return;
    }

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setDentro(true);
          io.disconnect();
        }
      },
      // Um respiro antes da borda: o elemento já chega animando, não estala.
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={cn('reveal', dentro && 'reveal-in', className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
