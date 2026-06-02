import mammoth from 'mammoth';

/** Extrai texto cru de um CV. `buffer` é o conteúdo do arquivo; `fileName` define o formato. */
export async function extractText(buffer: Buffer, fileName: string): Promise<string> {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.txt') || lower.endsWith('.rtf')) {
    return buffer.toString('utf-8').trim();
  }
  if (lower.endsWith('.docx') || lower.endsWith('.doc')) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
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
