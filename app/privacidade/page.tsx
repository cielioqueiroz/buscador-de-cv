import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

export const metadata: Metadata = {
  title: 'Política de privacidade',
  description: 'Quais dados o Vaga Certa coleta, para quê, com quem compartilha e como pedir a exclusão.',
};

const ATUALIZADA_EM = '13 de outubro de 2026';
const CONTATO = 'https://cielio-portfolio.vercel.app';

/**
 * Texto fiel ao que o código faz hoje. Ao mudar coleta, retenção ou um
 * fornecedor (lib/auth, lib/ai, lib/providers, lib/rate-limit), atualize aqui.
 */
export default function PrivacidadePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-5">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Política de privacidade</h1>
        <p className="mt-2 text-sm text-muted">Atualizada em {ATUALIZADA_EM}.</p>

        <div className="mt-8 space-y-8 leading-relaxed text-foreground/90 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_li]:mt-1.5 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
          <section>
            <p>
              O Vaga Certa lê o seu currículo com IA, busca vagas reais e mostra o quanto cada uma combina com você.
              Esta página explica quais dados usamos para isso. O responsável pelo serviço é Ciélio Queiroz, desenvolvedor
              do projeto.
            </p>
          </section>

          <section>
            <h2>O que coletamos</h2>
            <ul>
              <li><strong>Conta:</strong> nome, e-mail e senha. A senha é guardada só como hash (bcrypt); ninguém consegue lê-la.</li>
              <li>
                <strong>Login com Google:</strong> se você escolher essa opção, recebemos do Google seu nome, e-mail e foto.
                Não pedimos acesso a e-mails, contatos, arquivos nem a nenhum outro dado da sua conta Google.
              </li>
              <li>
                <strong>Currículo:</strong> o arquivo é lido no servidor e descartado. Guardamos o texto extraído dele e o perfil
                que a IA monta a partir desse texto (cargo, senioridade, habilidades, áreas e buscas).
              </li>
              <li><strong>Uso do app:</strong> candidaturas do tracker, vagas favoritas, cartas de apresentação e CVs adaptados que você gerar.</li>
              <li><strong>Foto de perfil:</strong> se você enviar uma, guardamos uma versão reduzida, sem os metadados da imagem (como localização).</li>
              <li><strong>Endereço IP:</strong> usado de forma temporária para limitar o número de requisições e evitar abuso.</li>
            </ul>
          </section>

          <section>
            <h2>Para que usamos</h2>
            <ul>
              <li>Montar seu perfil, buscar vagas e calcular a compatibilidade com cada uma.</li>
              <li>Gerar, quando você pede, cartas de apresentação, CVs adaptados e o relatório de melhoria.</li>
              <li>Manter seus dados salvos para você acessar de qualquer aparelho.</li>
              <li>Enviar e-mails da conta, como o link para redefinir a senha.</li>
            </ul>
            <p className="mt-3">Não vendemos seus dados e não usamos nada disso para publicidade.</p>
          </section>

          <section>
            <h2>Com quem compartilhamos</h2>
            <p>Só com os serviços necessários para o app funcionar:</p>
            <ul>
              <li><strong>Google Gemini:</strong> recebe o texto do currículo e da vaga para gerar a análise e os textos.</li>
              <li><strong>Fontes de vagas (Adzuna, Remotive e JSearch):</strong> recebem apenas os termos de busca, nunca o seu currículo.</li>
              <li><strong>Neon:</strong> banco de dados onde a conta e os dados ficam guardados.</li>
              <li><strong>Vercel:</strong> hospedagem do site.</li>
              <li><strong>Upstash:</strong> contagem temporária de requisições por IP.</li>
              <li><strong>Resend:</strong> envio dos e-mails da conta.</li>
              <li><strong>Google:</strong> autenticação, se você entrar com a conta Google.</li>
            </ul>
          </section>

          <section>
            <h2>Cookies e dados no navegador</h2>
            <p>
              Usamos um cookie de sessão, necessário para manter você conectado. O navegador também guarda uma cópia do perfil e
              das vagas para as telas abrirem mais rápido; ela é apagada quando você sai da conta. A preferência de tema claro ou
              escuro também fica no navegador. Não usamos cookies de anúncio nem de rastreamento.
            </p>
          </section>

          <section>
            <h2>Por quanto tempo guardamos</h2>
            <p>
              Enquanto a conta existir. Ao excluir a conta, o perfil, o currículo, as candidaturas, os favoritos, as cartas, os CVs
              adaptados e a foto são apagados juntos.
            </p>
          </section>

          <section>
            <h2>Seus direitos</h2>
            <p>
              Pela Lei Geral de Proteção de Dados (LGPD), você pode pedir acesso, correção, cópia ou exclusão dos seus dados.
              Nome e foto podem ser alterados na página <Link href="/conta" className="text-accent-ink underline underline-offset-2">Conta</Link>.
              Para os outros pedidos, incluindo excluir a conta, fale com o responsável pelo{' '}
              <a href={CONTATO} target="_blank" rel="noopener noreferrer" className="text-accent-ink underline underline-offset-2">
                portfólio
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
