import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ehErroDeDeploy, recuperarDeDeploy, CHAVE_RECARGA } from '@/lib/deploy-recovery';

function erro(name: string, message: string): Error {
  const e = new Error(message);
  e.name = name;
  return e;
}

beforeEach(() => {
  sessionStorage.clear();
});

describe('ehErroDeDeploy', () => {
  it('reconhece o ChunkLoadError pelo nome', () => {
    expect(ehErroDeDeploy(erro('ChunkLoadError', 'Loading chunk 49 failed.'))).toBe(true);
  });

  it('reconhece pela mensagem, porque nem todo navegador preserva o nome', () => {
    expect(ehErroDeDeploy(erro('Error', 'Loading chunk 49 failed.'))).toBe(true);
    expect(ehErroDeDeploy(erro('Error', 'Failed to fetch dynamically imported module'))).toBe(true);
    expect(ehErroDeDeploy(erro('Error', "Importing a module script failed."))).toBe(true);
  });

  it('NÃO confunde um erro comum do app com erro de deploy', () => {
    // Recarregar por causa de um bug de verdade esconderia o bug e deixaria o
    // usuário num laço de recargas sem entender nada.
    expect(ehErroDeDeploy(erro('TypeError', 'x is not a function'))).toBe(false);
    expect(ehErroDeDeploy(erro('Error', 'Falha no matching'))).toBe(false);
  });
});

describe('recuperarDeDeploy', () => {
  it('recarrega a página quando o erro é de deploy', () => {
    const recarregar = vi.fn();

    expect(recuperarDeDeploy(erro('ChunkLoadError', 'Loading chunk 3 failed.'), recarregar)).toBe(true);
    expect(recarregar).toHaveBeenCalledOnce();
  });

  it('não recarrega duas vezes seguidas — isso seria um laço de telas piscando', () => {
    const recarregar = vi.fn();
    const err = erro('ChunkLoadError', 'Loading chunk 3 failed.');
    const t = 1_000_000;

    expect(recuperarDeDeploy(err, recarregar, t)).toBe(true);

    // O erro voltou logo depois da recarga: não era deploy, é bug de verdade.
    expect(recuperarDeDeploy(err, recarregar, t + 2_000)).toBe(false);
    expect(recarregar).toHaveBeenCalledOnce();
  });

  it('mas um deploy MAIS TARDE na mesma aba se recupera de novo', () => {
    // Uma flag booleana falharia aqui: quem deixa a aba aberta o dia todo pega
    // vários deploys, e o segundo merece o mesmo resgate do primeiro.
    const recarregar = vi.fn();
    const err = erro('ChunkLoadError', 'Loading chunk 3 failed.');
    const t = 1_000_000;

    expect(recuperarDeDeploy(err, recarregar, t)).toBe(true);
    expect(recuperarDeDeploy(err, recarregar, t + 60_000)).toBe(true);
    expect(recarregar).toHaveBeenCalledTimes(2);
  });

  it('não recarrega em erro comum', () => {
    const recarregar = vi.fn();

    expect(recuperarDeDeploy(erro('TypeError', 'x is not a function'), recarregar)).toBe(false);
    expect(recarregar).not.toHaveBeenCalled();
  });

  it('a marca da recarga vive na sessão — uma aba nova pode se recuperar de novo', () => {
    recuperarDeDeploy(erro('ChunkLoadError', 'falhou'), vi.fn(), 1234);
    expect(sessionStorage.getItem(CHAVE_RECARGA)).toBe('1234');
  });

  it('sobrevive a um sessionStorage bloqueado (modo privado do Safari)', () => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = () => {
      throw new Error('bloqueado');
    };

    const recarregar = vi.fn();
    // Sem poder marcar, ainda assim recarrega: a recarga é a parte que salva o
    // usuário; a marca só evita o laço.
    expect(() => recuperarDeDeploy(erro('ChunkLoadError', 'x'), recarregar)).not.toThrow();

    Storage.prototype.getItem = original;
  });
});
