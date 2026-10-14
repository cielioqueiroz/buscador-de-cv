import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ApiRequestError, assertSameOrigin, readJson } from '@/lib/api/request';
import { checkRateLimit, clientIp } from '@/lib/rate-limit';
import { findUserByEmail } from '@/lib/auth/users';
import { issueResetToken } from '@/lib/auth/reset-tokens';
import { getMailer } from '@/lib/auth/email';

export const runtime = 'nodejs';

const BodySchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
});

function resetUrl(req: Request, token: string): string {
  const base =
    process.env.AUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    new URL(req.url).origin;
  const url = new URL('/redefinir-senha', base);
  url.searchParams.set('token', token);
  return url.toString();
}

/**
 * O nome é escolhido por quem cria a conta — e o cadastro não verifica o
 * e-mail. Sem escape, alguém cadastraria o e-mail de outra pessoa com um
 * "nome" em HTML e faria o Vaga Certa entregar esse HTML na caixa dela.
 */
function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);

    // Rate-limit por IP primeiro para não deixar enumerar e-mails em massa.
    if (!(await checkRateLimit(`forgot:ip:${clientIp(req)}`, 10, 60 * 60_000))) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente mais tarde.' },
        { status: 429 },
      );
    }

    const { email } = await readJson(req, BodySchema, 2_000);

    // E depois por e-mail, para também não deixar rajar sobre uma conta
    // específica a partir de IPs diferentes.
    if (!(await checkRateLimit(`forgot:email:${email}`, 3, 60 * 60_000))) {
      // Devolve 200 mesmo assim — a resposta precisa ser indistinguível
      // da do caminho feliz para não vazar quais e-mails existem.
      return NextResponse.json({ ok: true });
    }

    const user = await findUserByEmail(email);
    if (user?.password_hash) {
      try {
        const { token } = await issueResetToken(user.id);
        const link = resetUrl(req, token);
        await getMailer().send({
          to: user.email,
          subject: 'Redefinir sua senha no Vaga Certa',
          text: `Para redefinir sua senha, abra: ${link}\nO link vale por 30 minutos. Se você não pediu, ignore.`,
          html: `
            <p>Olá${user.name ? ', ' + escapeHtml(user.name) : ''}.</p>
            <p>Para redefinir sua senha no Vaga Certa, abra o link abaixo (vale por 30 minutos):</p>
            <p><a href="${link}">${link}</a></p>
            <p>Se você não pediu, ignore este e-mail — nada muda.</p>
          `,
        });
      } catch (err) {
        console.error('[auth/forgot-password] falha ao enviar:', err);
        // Mantém 200 — ou o atacante aprenderia a diferença entre "e-mail
        // existe mas o Resend caiu" e "e-mail não existe".
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 });
    }
    console.error('[auth/forgot-password]', error);
    return NextResponse.json({ error: 'Falha ao processar.' }, { status: 500 });
  }
}
