# Job Finder - Sistema de Busca de Vagas por Currículo

Um sistema web moderno e responsivo para buscar vagas de emprego baseado na análise do seu currículo.

## 🌟 Funcionalidades

- **Upload de CV** em múltiplos formatos (PDF, DOCX, DOC, TXT, ODT, RTF)
- **Análise Inteligente** do currículo com extração de habilidades e experiência
- **Busca de Vagas** em toda a web com links diretos
- **Filtros Avançados:**
  - Modalidade (Remoto, Híbrido, Presencial)
  - Localização (País, Estado, Cidade)
  - Senioridade (Estágio, Junior, Pleno, Senior, Lead, Gestor)
  - Faixa Salarial (Range Slider)
  - Data de Publicação (24h, 7 dias, 30 dias)
  - Tipo de Contrato (CLT, PJ, Freelance, Estágio)
- **Cálculo de Compatibilidade** entre CV e vaga
- **Interface Dark Mode** moderna e intuitiva
- **Responsividade Mobile** completa
- **Trust Badge** para indicar confiabilidade do site da vaga

## 🚀 Stack Tecnológico

- **Frontend:** React 18 + Vite
- **Estilos:** Tailwind CSS
- **Roteamento:** React Router v6
- **Icons:** React Icons
- **Mock Data:** Dados simulados de 20+ vagas diversas

## 📦 Instalação

### Pré-requisitos
- Node.js (v16+)
- npm ou yarn

### Passos

1. Clone o repositório:
```bash
cd job-finder
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Abra seu navegador em `http://localhost:5173`

## 📂 Estrutura do Projeto

```
job-finder/
├── src/
│   ├── components/
│   │   ├── layout/          # Header e Layout
│   │   ├── upload/          # Upload de CV e análise
│   │   ├── filters/         # Sidebar com filtros
│   │   ├── jobs/            # Cards e lista de vagas
│   │   └── ui/              # Componentes reutilizáveis
│   ├── pages/               # Páginas da aplicação
│   ├── data/                # Mock data de vagas
│   ├── utils/               # Funções utilitárias (CV parser)
│   └── App.jsx              # Componente raiz
├── package.json
├── tailwind.config.js
└── vite.config.js
```

## 🎯 Fluxo de Uso

1. **Home Page** - Upload do CV
   - Drag & drop ou clique para selecionar arquivo
   - Análise automática e exibição do perfil detectado

2. **Results Page** - Busca de Vagas
   - Sidebar com filtros avançados
   - Lista de vagas com score de compatibilidade
   - Ordenação por relevância, data ou salário

3. **CV Profile Page** - Análise Detalhada
   - Visualização completa dos dados extraídos do CV
   - Habilidades, experiência e senioridade

## 🎨 Design System

**Paleta de Cores (Dark Mode):**
- Background: `#0f172a` (Slate 900)
- Cards: `#1e293b` (Slate 800)
- Primary: `#3b82f6` (Blue 500)
- Success: `#22c55e` (Green 500)
- Warning: `#f59e0b` (Amber 500)
- Error: `#ef4444` (Red 500)

## 🔒 TrustBadge

Indica o nível de confiabilidade do site da vaga:
- 🟢 **Verificado** - Sites conhecidos (LinkedIn, Indeed, Glassdoor)
- 🟡 **Use com cautela** - Sites menos conhecidos
- 🔴 **Não verificado** - Sites desconhecidos

## 📊 Mock Data

O sistema inclui 20+ vagas simuladas cobrindo diversas áreas:
- TI (Frontend, Backend, DevOps, Data Science)
- Saúde (Médico, Enfermeiro)
- Construção (Pedreiro, Engenheiro Civil)
- Educação (Professor)
- Vendas, Marketing, Logística, RH, Jurídico

## 🔄 Estados de Loading

- Skeleton loading para simulação de carregamento
- Progress bar para upload de arquivo
- Estados visuais para interações

## 📱 Responsividade

- Layout adaptativo para desktop e mobile
- Menu de filtros escondível em mobile
- Cards responsivos

## 🔮 Recursos Futuros (Não Implementados)

- ✅ Banco de dados funcional
- ✅ Integração com APIs de vagas reais
- ✅ Autenticação de usuários
- ✅ Sistema de favoritos persistente
- ✅ Histórico de buscas
- ✅ Notificações de novas vagas

## 💡 Notas de Desenvolvimento

Este é um protótipo funcional com:
- **Mock data** em lugar de API real
- **Análise simulada** de CV
- **Compatibilidade estimada** baseada em regras simples
- Foco em **UX/UI** e **responsividade**

Perfeito para demonstração de conceito ou como base para expandir com funcionalidades reais.

## 📄 Licença

MIT

## 👨‍💻 Desenvolvido com React + Tailwind CSS + Vite
