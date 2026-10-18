// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * Os tokens de cor de app/globals.css, conferidos contra a WCAG AA: texto
 * normal precisa de 4,5:1 sobre cada fundo onde aparece. Um ajuste de paleta
 * que derrube a leitura falha aqui, não na tela de alguém.
 */
const css = readFileSync('app/globals.css', 'utf8');

function bloco(seletor: string): Record<string, string> {
  const inicio = css.indexOf(`${seletor} {`);
  const fim = css.indexOf('}', inicio);
  const tokens: Record<string, string> = {};
  for (const [, nome, valor] of css.slice(inicio, fim).matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)) {
    tokens[nome] = valor;
  }
  return tokens;
}

function luminancia(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contraste(a: string, b: string): number {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (escuro + 0.05);
}

const TEXTOS = ['foreground', 'muted', 'accent-ink', 'warn'];
const FUNDOS = ['background', 'surface', 'surface-2'];

describe.each([
  ['claro', ':root'],
  ['escuro', '.dark'],
])('tema %s', (_nome, seletor) => {
  const t = bloco(seletor);

  it.each(TEXTOS.flatMap((texto) => FUNDOS.map((fundo) => [texto, fundo])))(
    '%s sobre %s tem pelo menos 4,5:1',
    (texto, fundo) => {
      expect(t[texto], texto).toBeDefined();
      expect(contraste(t[texto], t[fundo])).toBeGreaterThanOrEqual(4.5);
    },
  );

  it('texto sobre o botão limão é legível', () => {
    expect(contraste(t['accent-foreground'], t['accent'])).toBeGreaterThanOrEqual(4.5);
  });
});
