import { cn } from '@/lib/utils';

/**
 * Cartão das telas de conta (entrar, cadastrar, esqueci/redefinir senha).
 * Fica parado de propósito: a interação mora nos campos e botões (hover e
 * foco em `.field`, app/globals.css), não no cartão.
 */
export function AuthCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-panel border border-border bg-surface p-6 shadow-float sm:p-8', className)}>
      {children}
    </div>
  );
}
