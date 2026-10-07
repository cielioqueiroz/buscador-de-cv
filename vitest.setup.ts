import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// O jsdom não implementa matchMedia. Vários componentes consultam
// prefers-reduced-motion (ScoreGauge, HeroField, etc.); sem este stub eles
// quebram no mount. Padrão: "não reduzir movimento".
if (!window.matchMedia) {
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
