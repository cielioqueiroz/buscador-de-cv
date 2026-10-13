import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const { search } = vi.hoisted(() => ({ search: { value: '' } }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(search.value),
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

  it('explica quando o e-mail do Google já tem conta com senha', () => {
    search.value = 'error=OAuthAccountNotLinked';
    render(<LoginForm googleEnabled passwordResetEnabled />);
    expect(screen.getByRole('alert')).toHaveTextContent(/já tem uma conta com senha/i);
    search.value = '';
  });

  it('mostra erro genérico para outras falhas do Google', () => {
    search.value = 'error=OAuthCallbackError';
    render(<LoginForm googleEnabled passwordResetEnabled />);
    expect(screen.getByRole('alert')).toHaveTextContent(/não deu para entrar com o google/i);
    search.value = '';
  });
});
