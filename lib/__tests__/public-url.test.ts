import { describe, it, expect } from 'vitest';
import { publicBaseUrl } from '@/lib/api/public-url';

const req = new Request('https://host-forjado.example/api/auth/forgot-password');
const env = (vars: Record<string, string>) => vars as unknown as NodeJS.ProcessEnv;

describe('publicBaseUrl', () => {
  it('AUTH_URL manda', () => {
    expect(publicBaseUrl(req, env({ AUTH_URL: 'https://vagacerta.com.br', VERCEL_URL: 'x.vercel.app' })))
      .toBe('https://vagacerta.com.br');
  });

  // Regressão: o link do e-mail apontava para o endereço do deploy, que fica
  // atrás da proteção de login da Vercel.
  it('em produção usa o domínio de produção, não o endereço do deploy', () => {
    expect(publicBaseUrl(req, env({
      VERCEL_ENV: 'production',
      VERCEL_PROJECT_PRODUCTION_URL: 'vaga-certa-sooty.vercel.app',
      VERCEL_URL: 'vaga-certa-abc123-cielio-queiroz.vercel.app',
    }))).toBe('https://vaga-certa-sooty.vercel.app');
  });

  it('em preview usa o endereço do deploy', () => {
    expect(publicBaseUrl(req, env({ VERCEL_ENV: 'preview', VERCEL_URL: 'pr-1.vercel.app' })))
      .toBe('https://pr-1.vercel.app');
  });

  it('só sem nenhuma variável (dev local) cai na origem da requisição', () => {
    expect(publicBaseUrl(req, env({}))).toBe('https://host-forjado.example');
  });
});
