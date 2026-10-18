// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function tsxDe(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return nome === 'api' ? [] : tsxDe(caminho);
    return caminho.endsWith('.tsx') ? [caminho] : [];
  });
}

describe('estrutura de acessibilidade', () => {
  it('o layout oferece "Pular para o conteúdo" apontando para #conteudo', () => {
    const layout = readFileSync('app/layout.tsx', 'utf8');
    expect(layout).toMatch(/href="#conteudo"[\s\S]*Pular para o conteúdo/);
  });

  // Página nova sem o destino deixaria o link de pular sem efeito nela.
  it('todo <main> das páginas é o destino #conteudo, focável', () => {
    const mains = tsxDe('app').flatMap((arquivo) =>
      (readFileSync(arquivo, 'utf8').match(/<main\b[^>]*>/g) ?? []).map((tag) => ({ arquivo, tag })),
    );
    expect(mains.length).toBeGreaterThan(0);
    for (const { arquivo, tag } of mains) {
      expect(tag, arquivo).toContain('id="conteudo"');
      expect(tag, arquivo).toContain('tabIndex={-1}');
    }
  });
});

describe('robots.txt', () => {
  it('bloqueia todas as áreas da conta e a API, e libera o resto', async () => {
    const { default: robots } = await import('@/app/robots');
    const regra = [robots().rules].flat()[0]!;
    expect(regra.allow).toBe('/');
    expect(regra.disallow).toEqual(['/perfil', '/resultados', '/candidaturas', '/conta', '/api/']);
  });
});
