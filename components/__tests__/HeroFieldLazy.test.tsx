import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// O campo 3D de verdade não roda no jsdom; o que importa é SE ele é pedido.
vi.mock('next/dynamic', () => ({
  default: () => function HeroFieldStub() {
    return <div data-testid="campo-3d" />;
  },
}));

import { HeroFieldLazy } from '@/components/HeroFieldLazy';
import { prefersLightweight } from '@/lib/client/browser-state';

const matchMediaOriginal = window.matchMedia;

function reduzirMovimento(ativo: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: ativo && query.includes('reduce'),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

function conexao(valor: object | undefined) {
  Object.defineProperty(navigator, 'connection', { value: valor, configurable: true });
}

afterEach(() => {
  window.matchMedia = matchMediaOriginal;
  conexao(undefined);
});

describe('HeroFieldLazy — o three.js só baixa quando vai aparecer', () => {
  it('carrega o campo 3D no caso normal', () => {
    reduzirMovimento(false);
    render(<HeroFieldLazy />);
    expect(screen.getByTestId('campo-3d')).toBeInTheDocument();
  });

  it('com "reduzir movimento" não pede o campo', () => {
    reduzirMovimento(true);
    render(<HeroFieldLazy />);
    expect(screen.queryByTestId('campo-3d')).not.toBeInTheDocument();
  });

  it('com economia de dados não pede o campo', () => {
    reduzirMovimento(false);
    conexao({ saveData: true });
    render(<HeroFieldLazy />);
    expect(screen.queryByTestId('campo-3d')).not.toBeInTheDocument();
  });
});

describe('prefersLightweight', () => {
  const nav = (connection?: object) => ({ connection }) as unknown as Navigator;
  it('economia de dados ou 2G/3G pedem a versão leve', () => {
    expect(prefersLightweight(nav({ saveData: true }))).toBe(true);
    expect(prefersLightweight(nav({ effectiveType: '3g' }))).toBe(true);
    expect(prefersLightweight(nav({ effectiveType: 'slow-2g' }))).toBe(true);
  });
  it('4G, ou navegador sem a API, segue normal', () => {
    expect(prefersLightweight(nav({ effectiveType: '4g', saveData: false }))).toBe(false);
    expect(prefersLightweight(nav())).toBe(false);
  });
});
