import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Componentes de UI começaram a consultar `useSession`. Nos testes não há
// SessionProvider montado — e também não queremos que a Fase 3b fale com
// backend. O mock devolve "unauthenticated" por padrão: cada componente então
// cai no caminho de localStorage, que é o que os testes atuais exercitam.
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' as const }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

// O jsdom não implementa matchMedia. Vários componentes consultam
// prefers-reduced-motion (ScoreGauge, HeroField, etc.); sem este stub eles
// quebram no mount. Padrão: "não reduzir movimento". Testes que rodam com
// `@vitest-environment node` (sharp, multipart) não têm `window`.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}
