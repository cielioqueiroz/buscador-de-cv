// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import sharp from 'sharp';

const { queryMock } = vi.hoisted(() => ({ queryMock: vi.fn() }));

vi.mock('@/lib/db/client', () => ({
  pool: { query: queryMock },
  assertDatabaseUrl: () => 'postgres://x',
}));

import {
  AVATAR_MAX_UPLOAD_BYTES,
  AVATAR_PATH,
  AvatarError,
  deleteAvatar,
  detectImageFormat,
  processAvatar,
  saveAvatar,
} from '@/lib/auth/avatar';

async function photo(format: 'png' | 'jpeg' | 'webp', width = 600, height = 400): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 200, g: 40, b: 90 } },
  })
    .withExif({ IFD0: { Copyright: 'segredo', Artist: 'gps-escondido' } })
    .toFormat(format)
    .toBuffer();
}

beforeEach(() => {
  queryMock.mockReset();
});

describe('detectImageFormat', () => {
  it('reconhece JPEG, PNG e WebP pela assinatura', async () => {
    expect(detectImageFormat(await photo('jpeg'))).toBe('jpeg');
    expect(detectImageFormat(await photo('png'))).toBe('png');
    expect(detectImageFormat(await photo('webp'))).toBe('webp');
  });

  it('recusa SVG, GIF e lixo', () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    const gif = Buffer.from('GIF89a\x01\x00\x01\x00', 'binary');
    expect(detectImageFormat(svg)).toBeNull();
    expect(detectImageFormat(gif)).toBeNull();
    expect(detectImageFormat(Buffer.alloc(0))).toBeNull();
  });
});

describe('processAvatar', () => {
  it('re-encoda para WebP 256x256 sem metadados', async () => {
    const out = await processAvatar(await photo('jpeg', 1200, 800));
    const meta = await sharp(out).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.width).toBe(256);
    expect(meta.height).toBe(256);
    expect(meta.exif).toBeUndefined();
    expect(out.includes(Buffer.from('gps-escondido'))).toBe(false);
  });

  it('descarta o que vem depois da imagem (payload escondido)', async () => {
    const polyglot = Buffer.concat([await photo('png'), Buffer.from('<?php system($_GET[1]); ?>')]);
    const out = await processAvatar(polyglot);
    expect(out.includes(Buffer.from('system('))).toBe(false);
  });

  it('recusa formato fora da lista com 415', async () => {
    await expect(processAvatar(Buffer.from('<svg/>'))).rejects.toMatchObject({
      name: 'AvatarError',
      status: 415,
    });
  });

  it('recusa arquivo acima do limite com 413', async () => {
    const big = Buffer.alloc(AVATAR_MAX_UPLOAD_BYTES + 1);
    await expect(processAvatar(big)).rejects.toMatchObject({ status: 413 });
  });

  it('recusa assinatura válida com corpo corrompido com 422', async () => {
    const fake = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64, 7)]);
    const err = await processAvatar(fake).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(AvatarError);
    expect((err as AvatarError).status).toBe(422);
  });
});

describe('persistência', () => {
  it('saveAvatar grava os bytes e devolve a URL versionada', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ image: `${AVATAR_PATH}?v=1` }] });
    const data = Buffer.from([1, 2, 3]);
    const image = await saveAvatar('u1', data);
    expect(image).toBe(`${AVATAR_PATH}?v=1`);
    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).toMatch(/insert into user_avatars/);
    expect(sql).toMatch(/update users/);
    expect(params).toEqual(['u1', data, AVATAR_PATH]);
  });

  it('saveAvatar falha quando o usuário não existe', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    await expect(saveAvatar('nope', Buffer.from([1]))).rejects.toThrow();
  });

  it('deleteAvatar só limpa users.image quando aponta para o nosso endpoint', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    await deleteAvatar('u1');
    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).toMatch(/delete from user_avatars/);
    expect(sql).toMatch(/image like/);
    expect(params).toEqual(['u1', AVATAR_PATH]);
  });
});
