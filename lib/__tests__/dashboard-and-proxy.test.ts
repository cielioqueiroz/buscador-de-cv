// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db/client', () => ({ pool: { query: vi.fn() }, assertDatabaseUrl: () => 'x' }));

import { profileChecklist } from '@/lib/auth/checklist';
import { proxy } from '@/proxy';

const zero = { applied: 0, interviews: 0, offers: 0, favorites: 0 };

describe('profileChecklist', () => {
  it('perfil recém-criado: só o CV conta', () => {
    const { items, strength } = profileChecklist({ hasCV: true, hasPhoto: false, hasName: false, stats: zero });
    expect(items.filter((i) => i.done).map((i) => i.id)).toEqual(['cv']);
    expect(strength).toBe(20);
  });

  it('chega a 100 com foto, nome, favorito e candidatura', () => {
    const { strength, items } = profileChecklist({
      hasCV: true,
      hasPhoto: true,
      hasName: true,
      stats: { ...zero, favorites: 2, interviews: 1 },
    });
    expect(strength).toBe(100);
    expect(items.every((i) => i.done)).toBe(true);
  });

  it('qualquer estágio do tracker conta como candidatura', () => {
    const { items } = profileChecklist({ hasCV: true, hasPhoto: false, hasName: true, stats: { ...zero, offers: 1 } });
    expect(items.find((i) => i.id === 'application')?.done).toBe(true);
  });
});

describe('proxy', () => {
  function req(path: string, cookie?: string) {
    return new NextRequest(`http://localhost${path}`, {
      headers: cookie ? { cookie } : {},
    });
  }

  it('visitante vê a landing', () => {
    const res = proxy(req('/'));
    expect(res.headers.get('location')).toBeNull();
  });

  it('logado em / vai para o painel', () => {
    const res = proxy(req('/', 'authjs.session-token=abc'));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/perfil');
  });

  it('reconhece o cookie seguro e o cookie em pedaços', () => {
    expect(proxy(req('/', '__Secure-authjs.session-token.0=abc')).status).toBe(307);
  });

  it('não redireciona outras páginas (evita laço com /entrar)', () => {
    expect(proxy(req('/entrar', 'authjs.session-token=abc')).headers.get('location')).toBeNull();
    expect(proxy(req('/resultados', 'authjs.session-token=abc')).headers.get('location')).toBeNull();
  });
});
