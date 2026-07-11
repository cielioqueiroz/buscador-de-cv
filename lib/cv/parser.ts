import mammoth from 'mammoth';

/** Formatos que sabemos ler de verdade. Usado no accept do upload e na rota. */
export const SUPPORTED_EXTENSIONS = [
  '.pdf', '.docx', '.txt', '.md', '.rtf', '.xlsx', '.xls', '.csv', '.ods',
] as const;

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

/** Planilhas: junta o texto de todas as células, de todas as abas. */
async function sheetToText(buffer: Buffer): Promise<string> {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(buffer, { type: 'buffer' });

  return wb.SheetNames
    .map((name) => XLSX.utils.sheet_to_csv(wb.Sheets[name], { blankrows: false }))
    .join('\n')
    .replace(/,+/g, ' ')  // o CSV vira texto corrido; a IA não precisa das vírgulas
    .replace(/[ \t]+/g, ' ')
    .trim();
}

async function pdfToText(buffer: Buffer): Promise<string> {
  // O `unpdf` empacota o pdfjs numa build que roda em Node sem APIs de
  // navegador. O `pdf-parse` puxava o pdfjs-dist original, que exige DOMMatrix
  // e quebrava no serverless da Vercel com "DOMMatrix is not defined" — todo
  // upload de PDF em produção falhava.
  const { extractText, getDocumentProxy } = await import('unpdf');
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return text.trim();
}

/** Extrai texto cru de um CV. `buffer` é o conteúdo do arquivo; `fileName` define o formato. */
export async function extractText(buffer: Buffer, fileName: string): Promise<string> {
  const lower = fileName.toLowerCase();
  const ext = lower.slice(lower.lastIndexOf('.'));

  switch (ext) {
    case '.txt':
    case '.md':
      return buffer.toString('utf-8').trim();

    case '.rtf':
      return rtfToText(buffer.toString('utf-8'));

    case '.docx':
      return (await mammoth.extractRawText({ buffer })).value.trim();

    case '.pdf':
      return pdfToText(buffer);

    case '.xlsx':
    case '.xls':
    case '.csv':
    case '.ods':
      return sheetToText(buffer);

    // .doc é OLE binário (formato Word 97). O mammoth só lê OOXML, e ler como
    // UTF-8 devolveria lixo que passaria despercebido até a IA.
    case '.doc':
      throw new Error('Formato antigo não suportado. Salve o currículo como PDF ou DOCX.');

    default:
      throw new Error(`Formato não suportado: ${fileName}`);
  }
}
