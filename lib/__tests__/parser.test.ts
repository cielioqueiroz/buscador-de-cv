import { describe, it, expect, vi } from 'vitest';
import { extractText } from '@/lib/cv/parser';

vi.mock('mammoth', () => ({
  default: { extractRawText: vi.fn(async () => ({ value: 'texto do docx' })) },
}));
// pdf-parse v2 expõe a classe PDFParse (não mais função default).
vi.mock('pdf-parse', () => ({
  PDFParse: class {
    async getText() { return { text: 'texto do pdf' }; }
    async destroy() {}
  },
}));

describe('extractText', () => {
  it('extrai texto de TXT', async () => {
    const buf = Buffer.from('meu curriculo em texto');
    const text = await extractText(buf, 'cv.txt');
    expect(text).toBe('meu curriculo em texto');
  });

  it('roteia .docx para mammoth', async () => {
    const text = await extractText(Buffer.from('x'), 'cv.docx');
    expect(text).toBe('texto do docx');
  });

  it('roteia .pdf para pdf-parse', async () => {
    const text = await extractText(Buffer.from('x'), 'cv.pdf');
    expect(text).toBe('texto do pdf');
  });

  it('lança erro para extensão não suportada', async () => {
    await expect(extractText(Buffer.from('x'), 'cv.xyz')).rejects.toThrow();
  });
});
