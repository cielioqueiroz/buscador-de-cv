import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { LoginForm } from '@/components/auth/LoginForm';

describe('LoginForm', () => {
  it('mostra Google e "esqueci a senha" quando configurados', () => {
    render(<LoginForm googleEnabled passwordResetEnabled />);
    expect(screen.getByRole('button', { name: /entrar com google/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /esqueci minha senha/i })).toBeInTheDocument();
  });

  it('esconde as opções que não funcionariam sem credenciais', () => {
    render(<LoginForm googleEnabled={false} passwordResetEnabled={false} />);
    expect(screen.queryByRole('button', { name: /google/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/ou com e-mail/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /esqueci/i })).not.toBeInTheDocument();
  });
});
