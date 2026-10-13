import sharp from "sharp";
import { pool } from "@/lib/db/client";

/** Limite do arquivo enviado. A saída re-encodada fica bem abaixo disso. */
export const AVATAR_MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
export const AVATAR_SIZE = 256;
export const AVATAR_PATH = "/api/perfil/avatar";

// Uma foto de celular de 48MP tem ~48M pixels; acima disso é bomba de
// descompressão ou lixo, e o sharp recusa antes de alocar o bitmap.
const MAX_INPUT_PIXELS = 50_000_000;

export class AvatarError extends Error {
  constructor(
    message: string,
    public readonly status: 413 | 415 | 422 = 422,
  ) {
    super(message);
    this.name = "AvatarError";
  }
}

export type AvatarFormat = "jpeg" | "png" | "webp";

/**
 * Identifica o formato pela assinatura binária, nunca pela extensão ou pelo
 * Content-Type do navegador. SVG, GIF e HEIC ficam de fora de propósito: SVG
 * carrega script, GIF animado não vira avatar e HEIC exige libheif.
 */
export function detectImageFormat(buffer: Uint8Array): AvatarFormat | null {
  const b = buffer;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return "jpeg";
  }
  if (
    b.length >= 8 &&
    b[0] === 0x89 &&
    b[1] === 0x50 &&
    b[2] === 0x4e &&
    b[3] === 0x47 &&
    b[4] === 0x0d &&
    b[5] === 0x0a &&
    b[6] === 0x1a &&
    b[7] === 0x0a
  ) {
    return "png";
  }
  if (
    b.length >= 12 &&
    ascii(b, 0, 4) === "RIFF" &&
    ascii(b, 8, 12) === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

function ascii(b: Uint8Array, start: number, end: number): string {
  return String.fromCharCode(...b.subarray(start, end));
}

/**
 * Valida e re-encoda a imagem: corta em quadrado, reduz para 256px e grava
 * WebP sem metadados (EXIF/GPS/ICC somem). Qualquer payload escondido no
 * arquivo original não sobrevive à decodificação + nova codificação.
 */
export async function processAvatar(input: Uint8Array): Promise<Buffer> {
  if (input.byteLength > AVATAR_MAX_UPLOAD_BYTES) {
    throw new AvatarError("Imagem muito grande (máx. 2MB).", 413);
  }
  if (!detectImageFormat(input)) {
    throw new AvatarError("Envie uma imagem JPG, PNG ou WebP.", 415);
  }

  try {
    return await sharp(input, {
      limitInputPixels: MAX_INPUT_PIXELS,
      failOn: "error",
      animated: false,
    })
      .rotate()
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover", position: sharp.strategy.attention })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new AvatarError("Não foi possível ler a imagem.", 422);
  }
}

/**
 * Grava a foto e aponta `users.image` para ela numa única instrução, para que
 * o usuário nunca fique com uma URL que não resolve. A versão na query string
 * quebra o cache do navegador a cada troca.
 */
export async function saveAvatar(userId: string, data: Buffer): Promise<string> {
  const result = await pool.query<{ image: string }>(
    `with saved as (
       insert into user_avatars (user_id, data, mime, updated_at)
            values ($1, $2, 'image/webp', now())
       on conflict (user_id) do update set
         data = excluded.data,
         mime = excluded.mime,
         updated_at = now()
       returning user_id, updated_at
     )
     update users u
        set image = $3::text || '?v=' || floor(extract(epoch from saved.updated_at) * 1000)::bigint::text,
            updated_at = now()
       from saved
      where u.id = saved.user_id
  returning u.image`,
    [userId, data, AVATAR_PATH],
  );
  const image = result.rows[0]?.image;
  if (!image) throw new Error("Usuário não encontrado ao salvar avatar.");
  return image;
}

export async function getAvatar(
  userId: string,
): Promise<{ data: Buffer; mime: string } | null> {
  const result = await pool.query<{ data: Buffer; mime: string }>(
    `select data, mime from user_avatars where user_id = $1`,
    [userId],
  );
  return result.rows[0] ?? null;
}

/**
 * Remove a foto própria. Só limpa `users.image` quando ela aponta para o nosso
 * endpoint — uma foto do Google não é apagada por acidente.
 */
export async function deleteAvatar(userId: string): Promise<void> {
  await pool.query(
    `with removed as (
       delete from user_avatars where user_id = $1 returning user_id
     )
     update users
        set image = null, updated_at = now()
      where id = $1
        and image like $2::text || '%'`,
    [userId, AVATAR_PATH],
  );
}
