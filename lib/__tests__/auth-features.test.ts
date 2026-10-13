import { describe, it, expect, vi, afterEach } from 'vitest';
import { isGoogleEnabled, isPasswordResetEnabled } from '@/lib/auth/features';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('isGoogleEnabled', () => {
  it('exige id e secret', () => {
    vi.stubEnv('AUTH_GOOGLE_ID', 'id');
    vi.stubEnv('AUTH_GOOGLE_SECRET', '');
    expect(isGoogleEnabled()).toBe(false);
    vi.stubEnv('AUTH_GOOGLE_SECRET', 'secret');
    expect(isGoogleEnabled()).toBe(true);
  });
});

describe('isPasswordResetEnabled', () => {
  it('fica desligado em produção sem Resend', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('RESEND_API_KEY', '');
    vi.stubEnv('EMAIL_FROM', '');
    expect(isPasswordResetEnabled()).toBe(false);
  });

  it('liga em produção com Resend configurado', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('RESEND_API_KEY', 're_x');
    vi.stubEnv('EMAIL_FROM', 'a@b.com');
    expect(isPasswordResetEnabled()).toBe(true);
  });

  it('liga em dev mesmo sem Resend (link vai para o console)', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('RESEND_API_KEY', '');
    expect(isPasswordResetEnabled()).toBe(true);
  });
});
