import type { Job } from '@/lib/providers/types';

/**
 * A carta como um PDF de verdade — um arquivo que o candidato anexa, não uma
 * caixa de impressão que ele precisa saber usar.
 *
 * Antes isto era `window.print()`: funcionava, mas exigia que a pessoa achasse
 * "Salvar como PDF" no diálogo do navegador, e no celular quase ninguém acha.
 * Um botão que baixa o arquivo não tem esse degrau.
 *
 * O jsPDF (~90 KB) entra por `import()` DENTRO da função: quem nunca gera carta
 * nunca baixa a lib. É o mesmo princípio do three.js no herói.
 *
 * Fonte: Helvetica padrão, que usa WinAnsi — cobre todo o acento do português
 * (ç, ã, é, ô). Fonte embutida custaria centenas de KB para resolver um problema
 * que não temos.
 */

const MARGEM = 20; // mm
const LARGURA_A4 = 210;
const ALTURA_A4 = 297;
const UTIL = LARGURA_A4 - MARGEM * 2;

export interface DadosCarta {
  /** O texto como está na tela — a edição do usuário é o que vale. */
  texto: string;
  job: Job;
  /** Cargo do candidato, no topo da folha. */
  titulo: string;
}

export async function buildCoverLetterPdf({ texto, job, titulo }: DadosCarta): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  let y = MARGEM;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(17, 17, 17);
  doc.text(titulo, MARGEM, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(110, 110, 110);
  doc.text(`${job.title} · ${job.company}`, MARGEM, y);
  y += 4;

  doc.setDrawColor(220, 220, 220);
  doc.line(MARGEM, y, LARGURA_A4 - MARGEM, y);
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(17, 17, 17);

  const paragrafos = texto.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  for (const p of paragrafos) {
    // Uma linha solta no pé da página é feia; se o parágrafo não cabe inteiro,
    // ele começa na próxima folha.
    const linhas = doc.splitTextToSize(p, UTIL) as string[];
    const altura = linhas.length * 5.6;

    if (y + altura > ALTURA_A4 - MARGEM) {
      doc.addPage();
      y = MARGEM;
    }

    doc.text(linhas, MARGEM, y, { lineHeightFactor: 1.5 });
    y += altura + 4;
  }

  return doc.output('blob');
}
