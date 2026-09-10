import { MAX_CV_CHARS } from '@/lib/providers/types';

const MAX_PDF_PAGES = 20;

/** Formatos que sabemos ler de verdade. Usado no accept do upload e na rota. */
export const SUPPORTED_EXTENSIONS = [
  '.pdf', '.txt', '.md', '.rtf', '.csv',
] as const;

/** Evita processar um binário arbitrário só porque ele recebeu outra extensão. */
export function hasValidSignature(buffer: Buffer, fileName: string): boolean {
  const ext = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
  if (ext === '.txt' || ext === '.md' || ext === '.csv') return true;

  if (ext === '.pdf') return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  if (ext === '.rtf') return buffer.subarray(0, 5).toString('ascii') === '{\\rtf';
  return false;
}

/**
 * O RTF é texto com marcação. Basta remover os grupos de controle — não vale
 * uma dependência só para isso, e ler como UTF-8 puro devolveria a marcação
 * inteira como se fosse o currículo.
 */
function rtfToText(raw: string): string {
  return raw
    .replace(/\\'[0-9a-f]{2}/gi, ' ')       // caracteres escapados em hex
    .replace(/\\[a-z]+-?\d*\s?/gi, ' ')     // comandos: \pard, \f0, \fs24...
    .replace(/[{}]/g, ' ')                  // delimitadores de grupo
    .replace(/\s+/g, ' ')
    .trim();
}

async function pdfToText(buffer: Buffer): Promise<string> {
  // O `unpdf` empacota o pdfjs numa build que roda em Node sem APIs de
  // navegador. O `pdf-parse` puxava o pdfjs-dist original, que exige DOMMatrix
  // e quebrava no serverless da Vercel com "DOMMatrix is not defined" — todo
  // upload de PDF em produção falhava.
  const { extractText, getDocumentProxy } = await import('unpdf');
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  if (pdf.numPages > MAX_PDF_PAGES) throw new Error('PDF com páginas demais.');
  const { text } = await extractText(pdf, { mergePages: true });
  return text.trim().slice(0, MAX_CV_CHARS);
}

/** Extrai texto cru de um CV. `buffer` é o conteúdo do arquivo; `fileName` define o formato. */
export async function extractText(buffer: Buffer, fileName: string): Promise<string> {
  const lower = fileName.toLowerCase();
  const ext = lower.slice(lower.lastIndexOf('.'));

  switch (ext) {
    case '.txt':
    case '.md':
      return buffer.toString('utf-8').trim().slice(0, MAX_CV_CHARS);

    case '.rtf':
      return rtfToText(buffer.toString('utf-8')).slice(0, MAX_CV_CHARS);

    case '.pdf':
      return pdfToText(buffer);

    case '.csv':
      return buffer.toString('utf-8').replace(/,+/g, ' ').replace(/[ \t]+/g, ' ').trim().slice(0, MAX_CV_CHARS);

    case '.docx':
    case '.xlsx':
      throw new Error('DOCX e XLSX estão temporariamente desativados por segurança. Use PDF ou TXT.');

    // .doc é OLE binário (formato Word 97) e fica fora do parser seguro.
    case '.doc':
      throw new Error('Formato antigo não suportado. Salve o currículo como PDF ou TXT.');

    default:
      throw new Error(`Formato não suportado: ${fileName}`);
  }
}
