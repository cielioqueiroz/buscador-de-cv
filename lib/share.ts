'use client';

/**
 * Compartilhar usando o menu do próprio sistema — WhatsApp, e-mail, Telegram,
 * AirDrop, o que a pessoa tiver instalado. Não reinventamos uma lista de botões
 * de rede social: o sistema operacional já tem a lista certa, e ela é a lista
 * DELE, não a que nós adivinhamos.
 *
 * A Web Share API só existe em contexto seguro (https ou localhost) e nem todo
 * desktop a traz. Por isso todo caminho aqui termina num fallback que funciona
 * em qualquer lugar: copiar para a área de transferência.
 */

export type ResultadoShare = 'compartilhado' | 'copiado' | 'cancelado' | 'falhou';

interface Conteudo {
  title: string;
  text: string;
  url?: string;
  /** Quando presente e o sistema aceitar, compartilha o arquivo em si. */
  file?: File;
}

/** O usuário fechar o menu de compartilhamento não é erro — não avisamos nada. */
function cancelado(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

export async function compartilhar({ title, text, url, file }: Conteudo): Promise<ResultadoShare> {
  const nav = navigator as Navigator & {
    share?: (d: ShareData) => Promise<void>;
    canShare?: (d: ShareData) => boolean;
  };

  // Melhor caso: o arquivo viaja junto. É o que permite mandar o PDF da carta
  // direto no WhatsApp, sem passar por download → anexar.
  if (file && nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ title, text, files: [file] });
      return 'compartilhado';
    } catch (err) {
      if (cancelado(err)) return 'cancelado';
      // Cai para o texto: alguns sistemas anunciam suporte a arquivo e falham
      // na hora de entregar.
    }
  }

  if (nav.share) {
    try {
      await nav.share({ title, text, url });
      return 'compartilhado';
    } catch (err) {
      if (cancelado(err)) return 'cancelado';
    }
  }

  try {
    await navigator.clipboard.writeText(url ? `${text}\n\n${url}` : text);
    return 'copiado';
  } catch {
    return 'falhou';
  }
}
