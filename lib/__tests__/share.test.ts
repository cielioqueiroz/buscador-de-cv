import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { compartilhar } from '@/lib/share';

const conteudo = { title: 'Vaga', text: 'Uma vaga boa', url: 'https://acme.com/1' };

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  // @ts-expect-error — limpamos o que injetamos no navigator do jsdom
  delete navigator.share;
  // @ts-expect-error — idem
  delete navigator.canShare;
});

function comClipboard() {
  const writeText = vi.fn(async () => {});
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  return writeText;
}

describe('compartilhar', () => {
  it('manda o arquivo quando o sistema aceita — o PDF vai junto no WhatsApp', async () => {
    const share = vi.fn(async (_d: ShareData) => {});
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });

    const file = new File(['pdf'], 'carta.pdf', { type: 'application/pdf' });
    const r = await compartilhar({ ...conteudo, file });

    expect(r).toBe('compartilhado');
    expect(share.mock.calls[0][0].files?.[0]).toBe(file);
  });

  it('sem suporte a arquivo, compartilha o texto e a URL', async () => {
    const share = vi.fn(async (_d: ShareData) => {});
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    Object.defineProperty(navigator, 'canShare', { value: () => false, configurable: true });

    const file = new File(['pdf'], 'carta.pdf', { type: 'application/pdf' });
    const r = await compartilhar({ ...conteudo, file });

    expect(r).toBe('compartilhado');
    expect(share.mock.calls[0][0].files).toBeUndefined();
    expect(share.mock.calls[0][0].url).toBe('https://acme.com/1');
  });

  it('sem Web Share (o desktop comum), copia para a área de transferência', async () => {
    const writeText = comClipboard();

    const r = await compartilhar(conteudo);

    expect(r).toBe('copiado');
    expect(writeText).toHaveBeenCalledWith('Uma vaga boa\n\nhttps://acme.com/1');
  });

  it('fechar o menu de compartilhamento não é erro', async () => {
    const share = vi.fn(async () => {
      throw new DOMException('cancelou', 'AbortError');
    });
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });

    expect(await compartilhar(conteudo)).toBe('cancelado');
  });

  it('se o share falhar de verdade, ainda sobra a cópia', async () => {
    const writeText = comClipboard();
    Object.defineProperty(navigator, 'share', {
      value: vi.fn(async () => {
        throw new Error('deu ruim');
      }),
      configurable: true,
    });

    expect(await compartilhar(conteudo)).toBe('copiado');
    expect(writeText).toHaveBeenCalled();
  });

  it('quando nem a cópia funciona, avisa em vez de fingir sucesso', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async () => {
          throw new Error('bloqueado');
        },
      },
      configurable: true,
    });

    expect(await compartilhar(conteudo)).toBe('falhou');
  });
});
