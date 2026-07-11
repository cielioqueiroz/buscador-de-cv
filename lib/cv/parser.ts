import mammoth from 'mammoth';

/** Extensões que sabemos ler de verdade. */
export const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.txt'] as const;

/** Extrai texto cru de um CV. `buffer` é o conteúdo do arquivo; `fileName` define o formato. */
export async function extractText(buffer: Buffer, fileName: string): Promise<string> {
  const lower = fileName.toLowerCase();

  if (lower.endsWith('.txt')) {
    return buffer.toString('utf-8').trim();
  }

  if (lower.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  // .doc é OLE binário e .rtf é markup — o mammoth só lê OOXML, e ler qualquer
  // um dos dois como UTF-8 devolveria lixo que passa despercebido até a IA.
  if (lower.endsWith('.doc') || lower.endsWith('.rtf')) {
    throw new Error('Formato antigo não suportado. Salve o currículo como PDF ou DOCX.');
  }

  if (lower.endsWith('.pdf')) {
    // pdf-parse v2: classe PDFParse (converte Buffer -> Uint8Array internamente).
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text.trim();
    } finally {
      await parser.destroy();
    }
  }

  throw new Error(`Formato não suportado: ${fileName}`);
}
