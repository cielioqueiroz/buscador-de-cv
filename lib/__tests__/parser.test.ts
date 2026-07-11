import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { extractText, SUPPORTED_EXTENSIONS } from '@/lib/cv/parser';

const fixture = (f: string) => readFileSync(join(__dirname, 'fixtures', f));

describe('extractText', () => {
  it('extrai texto de TXT', async () => {
    const text = await extractText(Buffer.from('meu curriculo em texto'), 'cv.txt');
    expect(text).toBe('meu curriculo em texto');
  });

  it('extrai texto de Markdown', async () => {
    const text = await extractText(Buffer.from('# Dev\n- React'), 'cv.md');
    expect(text).toContain('React');
  });

  /**
   * Este teste existe porque o PDF quebrava em produção e nenhum teste pegava:
   * os antigos mockavam a biblioteca de PDF, então validavam o mock, não o
   * parser. O pdf-parse puxava o pdfjs-dist, que exige DOMMatrix (uma API de
   * navegador) e estourava no serverless da Vercel. Aqui o PDF é real.
   */
  it('extrai texto de um PDF DE VERDADE, sem mock', async () => {
    const text = await extractText(fixture('cv.pdf'), 'cv.pdf');
    expect(text).toContain('Jacielio');
    expect(text).toContain('Analista');
    expect(text.length).toBeGreaterThan(200);
  });

  it('extrai texto de uma planilha XLSX de verdade', async () => {
    const text = await extractText(fixture('cv.xlsx'), 'cv.xlsx');
    expect(text).toContain('Jacielio');
    expect(text).toContain('Power BI');
  });

  it('extrai texto de CSV', async () => {
    const csv = Buffer.from('Nome,Cargo\nJacielio,Analista Financeiro\n');
    const text = await extractText(csv, 'cv.csv');
    expect(text).toContain('Analista Financeiro');
  });

  it('tira a marcação do RTF, em vez de mandá-la para a IA', async () => {
    const rtf = Buffer.from(String.raw`{\rtf1\ansi\deff0 {\fonttbl{\f0 Arial;}}\f0\fs24 Analista Financeiro\par}`);
    const text = await extractText(rtf, 'cv.rtf');
    expect(text).toContain('Analista Financeiro');
    expect(text).not.toContain('\\rtf1');
    expect(text).not.toContain('fonttbl');
  });

  it('recusa .doc (OLE binário) com mensagem acionável', async () => {
    await expect(extractText(Buffer.from('x'), 'cv.doc')).rejects.toThrow(/PDF ou DOCX/);
  });

  it('lança erro para extensão não suportada', async () => {
    await expect(extractText(Buffer.from('x'), 'cv.exe')).rejects.toThrow(/não suportado/);
  });

  // A lista guarda a rota e o accept do upload: se um formato entra aqui sem
  // ter tratamento no parser, o usuário sobe o arquivo e recebe um 500.
  it('todo formato anunciado como suportado é realmente lido', async () => {
    const semAmostra = ['.docx', '.xls', '.ods']; // exigem binário próprio
    for (const ext of SUPPORTED_EXTENSIONS) {
      if (semAmostra.includes(ext)) continue;
      const buf = ext === '.pdf' ? fixture('cv.pdf')
        : ext === '.xlsx' ? fixture('cv.xlsx')
        : Buffer.from('Analista Financeiro com Power BI');
      await expect(extractText(buf, `cv${ext}`)).resolves.toBeTruthy();
    }
  });
});
