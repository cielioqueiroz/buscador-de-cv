import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configurar worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Dicionário de categorias profissionais
const categoryKeywords = {
  financeiro: [
    'financeiro', 'financeira', 'contábil', 'contabilidade', 'fiscal', 'tributário',
    'orçamento', 'fluxo de caixa', 'balanço', 'analista financeiro', 'controller',
    'tesouraria', 'investimento', 'faturamento', 'auditoria', 'custos', 'ativo', 'passivo',
    'demonstrativo', 'patrimônio', 'provisionamento', 'análise financeira'
  ],
  administrativo: [
    'administrativo', 'administração', 'gestão', 'processos', 'compliance', 'compras',
    'licitação', 'contratos', 'protocolos', 'documentação', 'arquivo', 'secretariado',
    'assistente administrativo', 'rotinas administrativas', 'procedimentos'
  ],
  ti: [
    'programação', 'developer', 'desenvolvedor', 'software', 'react', 'javascript',
    'python', 'java', 'cloud', 'devops', 'banco de dados', 'código', 'sistema',
    'aplicação', 'frontend', 'backend', 'fullstack', 'nodejs', 'typescript', 'html',
    'css', 'sql', 'api', 'framework', 'git', 'docker', 'kubernetes'
  ],
  saude: [
    'enfermagem', 'médico', 'hospital', 'clínica', 'paciente', 'cuidados', 'farmácia',
    'diagnóstico', 'pronto socorro', 'uti', 'odontologia', 'fisioterapia', 'psicologia',
    'enfermeiro', 'médica', 'saúde'
  ],
  construcao: [
    'pedreiro', 'alvenaria', 'obra', 'construção', 'engenharia civil', 'canteiro',
    'estrutura', 'acabamento', 'pintura', 'cobertura', 'fundação', 'concreto',
    'hidráulica', 'elétrico', 'projeto', 'orçamento obras'
  ],
  educacao: [
    'professor', 'docente', 'educação', 'ensino', 'escola', 'pedagógico', 'educador',
    'instrutor', 'tutor', 'aula', 'aluno', 'currículo', 'pedagogia', 'didática'
  ],
  rh: [
    'recursos humanos', 'recrutamento', 'seleção', 'treinamento', 'folha de pagamento',
    'rh', 'gestão de pessoas', 'pessoal', 'desenvolvimento', 'benefícios', 'contratos',
    'admissão', 'demissão'
  ],
  vendas: [
    'vendas', 'comercial', 'metas', 'prospecção', 'clientes', 'negociação', 'vendedor',
    'faturamento', 'contatos', 'relacionamento', 'proposta', 'fechamento'
  ],
  marketing: [
    'marketing', 'branding', 'seo', 'campanha', 'comunicação', 'propaganda', 'redes sociais',
    'digital', 'conteúdo', 'publicidade', 'análise', 'estratégia', 'social media'
  ],
  juridico: [
    'advogado', 'jurídico', 'direito', 'contencioso', 'contratos jurídicos', 'lei',
    'legislação', 'processo', 'tribunal', 'parecer', 'advocacia'
  ],
  logistica: [
    'logística', 'supply chain', 'transportes', 'armazém', 'inventário', 'distribuição',
    'movimentação', 'carga', 'frota', 'estoque', 'fornecedor'
  ]
};

// Dicionário de skills técnicas e profissionais
const skillKeywords = {
  excel: ['excel', 'spreadsheet', 'planilha'],
  sap: ['sap', 'erp'],
  python: ['python', 'py'],
  javascript: ['javascript', 'js', 'typescript'],
  react: ['react', 'reactjs'],
  nodejs: ['node.js', 'nodejs', 'node'],
  sql: ['sql', 'mysql', 'postgresql', 'oracle'],
  java: ['java'],
  docker: ['docker', 'containerização'],
  git: ['git', 'github', 'gitlab'],
  aws: ['aws', 'amazon web services'],
  power_bi: ['power bi', 'powerbi', 'tableau'],
  word: ['word', 'documento'],
  powerpoint: ['powerpoint', 'apresentação'],
  salesforce: ['salesforce', 'crm'],
  jira: ['jira'],
  photoshop: ['photoshop'],
  figma: ['figma'],
  angular: ['angular'],
  vue: ['vue', 'vuejs'],
};

// Extrair texto de PDF
export const extractTextFromPDF = async (arrayBuffer) => {
  try {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(' ') + '\n';
    }

    return text;
  } catch (error) {
    console.error('Erro ao extrair PDF:', error);
    throw new Error('Falha ao processar PDF');
  }
};

// Extrair texto de DOCX
export const extractTextFromDOCX = async (arrayBuffer) => {
  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error('Erro ao extrair DOCX:', error);
    throw new Error('Falha ao processar DOCX');
  }
};

// Extrair texto de arquivo texto
export const extractTextFromTXT = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

// Analisar texto do CV e extrair categorias, skills, senioridade
export const analyzeCVText = (text) => {
  const lowerText = text.toLowerCase();

  // 1. Identificar categorias
  const categoryScores = {};
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    categoryScores[category] = keywords.filter(keyword =>
      lowerText.includes(keyword)
    ).length;
  }

  const topCategories = Object.entries(categoryScores)
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category]) => category);

  // 2. Identificar skills
  const detectedSkills = [];
  for (const [skill, keywords] of Object.entries(skillKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      detectedSkills.push(skill.replace(/_/g, ' ').toUpperCase());
    }
  }

  // 3. Estimar senioridade
  let seniority = 'junior';
  if (lowerText.includes('director') || lowerText.includes('gerente') || lowerText.includes('coordenador')) {
    seniority = 'senior';
  } else if (lowerText.includes('lead') || lowerText.includes('líder')) {
    seniority = 'senior';
  } else if (lowerText.includes('senior') || lowerText.match(/\b(\d+)\s*anos/)) {
    const yearsMatch = lowerText.match(/(\d+)\s*anos/);
    const years = yearsMatch ? parseInt(yearsMatch[1]) : 0;
    if (years >= 8) seniority = 'senior';
    else if (years >= 4) seniority = 'pleno';
    else if (years >= 2) seniority = 'junior';
    else seniority = 'estágio';
  }

  // 4. Extrair títulos/cargo
  const titleMatch = text.match(/(?:Profissional|Cargo|Título|Position)[:\s]+([^\n]+)/i);
  let title = titleMatch ? titleMatch[1].trim() : 'Profissional';

  // Tentar inferir título a partir das categorias
  if (topCategories.length > 0) {
    const categoryTitles = {
      financeiro: 'Analista Financeiro',
      administrativo: 'Analista Administrativo',
      ti: 'Desenvolvedor',
      saude: 'Profissional de Saúde',
      construcao: 'Engenheiro/Profissional de Construção',
      educacao: 'Professor',
      rh: 'Especialista em RH',
      vendas: 'Profissional de Vendas',
      marketing: 'Especialista em Marketing',
      juridico: 'Advogado',
      logistica: 'Profissional de Logística'
    };
    title = categoryTitles[topCategories[0]] || title;
  }

  return {
    categories: topCategories,
    skills: detectedSkills.slice(0, 6),
    seniority,
    title,
    allCategoryScores: categoryScores
  };
};

// Parser principal - ler arquivo e extrair dados
export const parseCVFile = async (file) => {
  return new Promise(async (resolve, reject) => {
    try {
      const fileName = file.name.toLowerCase();
      let cvText = '';

      // Validar e extrair texto conforme tipo de arquivo
      if (fileName.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        cvText = await extractTextFromPDF(arrayBuffer);
      } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
        const arrayBuffer = await file.arrayBuffer();
        cvText = await extractTextFromDOCX(arrayBuffer);
      } else if (fileName.endsWith('.txt') || fileName.endsWith('.odt') || fileName.endsWith('.rtf')) {
        cvText = await extractTextFromTXT(file);
      } else {
        cvText = await extractTextFromTXT(file);
      }

      // Analisar o texto extraído
      const analysis = analyzeCVText(cvText);

      // Montar objeto final
      const cvData = {
        fileName: file.name,
        fileType: file.type,
        uploadDate: new Date(),
        rawText: cvText,
        analysis: {
          name: 'Seu Nome',
          email: 'seu.email@email.com',
          phone: '(11) 9XXXX-XXXX',
          title: analysis.title,
          seniority: analysis.seniority,
          topSkills: analysis.skills.length > 0 ? analysis.skills : ['Não foram detectadas skills específicas'],
          experience: analysis.seniority === 'senior' ? 8 : analysis.seniority === 'pleno' ? 4 : analysis.seniority === 'junior' ? 2 : 0,
          preferredCategories: analysis.categories,
          salaryExpectation: { min: 3000, max: 10000 },
          aboutMe: `Profissional com experiência em ${analysis.categories.join(', ') || 'diversos campos'}. Áreas de atuação identificadas no CV.`
        }
      };

      resolve(cvData);
    } catch (error) {
      reject(error);
    }
  });
};

// Estimar compatibilidade melhorada baseada em análise real
export const estimateJobMatch = (cvData, job) => {
  let score = 0;
  const cvCategories = cvData.analysis.preferredCategories || [];
  const jobTags = job.tags.map(t => t.toLowerCase()) || [];
  const jobTitle = job.title.toLowerCase();
  const cvTitle = cvData.analysis.title.toLowerCase();
  const cvSkills = (cvData.analysis.topSkills || []).map(s => s.toLowerCase());

  // 1. Score por categoria (40 pontos máx)
  if (cvCategories.length > 0) {
    // Verificar se categoria do job corresponde à do CV
    const categoryMatch = cvCategories.some(cat =>
      jobTags.some(tag => tag.includes(cat)) ||
      jobTitle.includes(cat)
    );
    if (categoryMatch) score += 40;
    else score += 10; // Penalidade leve se não corresponde
  }

  // 2. Score por sobreposição de skills (35 pontos máx)
  if (cvSkills.length > 0) {
    const skillMatches = jobTags.filter(tag =>
      cvSkills.some(skill => skill.includes(tag.toLowerCase()) || tag.includes(skill))
    ).length;
    score += Math.min(35, skillMatches * 7);
  }

  // 3. Score por senioridade (25 pontos máx)
  if (cvData.analysis.seniority === job.seniority) {
    score += 25;
  } else {
    const seniorityLevels = ['estágio', 'junior', 'pleno', 'senior', 'lead'];
    const cvIndex = seniorityLevels.indexOf(cvData.analysis.seniority);
    const jobIndex = seniorityLevels.indexOf(job.seniority);
    if (Math.abs(cvIndex - jobIndex) <= 1) {
      score += 12;
    }
  }

  // 4. Score por faixa salarial (5 pontos bônus)
  if (job.salary.max >= cvData.analysis.salaryExpectation.min) {
    score += 5;
  }

  return Math.min(100, Math.max(0, score));
};
