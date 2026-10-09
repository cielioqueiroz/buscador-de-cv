import { Resend } from 'resend';

export interface Mailer {
  send(input: { to: string; subject: string; html: string; text: string }): Promise<void>;
}

class ResendMailer implements Mailer {
  private readonly client: Resend;
  private readonly from: string;

  constructor(apiKey: string, from: string) {
    this.client = new Resend(apiKey);
    this.from = from;
  }

  async send(input: { to: string; subject: string; html: string; text: string }): Promise<void> {
    const { error } = await this.client.emails.send({
      from: this.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    if (error) throw new Error(`Resend: ${error.message}`);
  }
}

class ConsoleMailer implements Mailer {
  async send(input: { to: string; subject: string; html: string; text: string }): Promise<void> {
    // Em dev sem RESEND_API_KEY o reset ainda precisa funcionar: imprimimos o
    // link no console para o desenvolvedor copiar. Em prod sem a chave,
    // getMailer() lança — ninguém deveria subir reset de senha sem envio real.
    console.info(
      `[mailer:console] to=${input.to} subject=${input.subject}\n---\n${input.text}\n---`,
    );
  }
}

let singleton: Mailer | null = null;

export function getMailer(): Mailer {
  if (singleton) return singleton;
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (key && from) {
    singleton = new ResendMailer(key, from);
    return singleton;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('RESEND_API_KEY e EMAIL_FROM são obrigatórios em produção.');
  }
  singleton = new ConsoleMailer();
  return singleton;
}

/** Visibilidade de teste: permite injetar um mailer e limpar o singleton. */
export function __setMailerForTest(mock: Mailer | null): void {
  singleton = mock;
}
