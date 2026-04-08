import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { FilterSidebar } from '../components/filters/FilterSidebar';
import { JobList } from '../components/jobs/JobList';
import { DashboardStats } from '../components/jobs/DashboardStats';
import { CVAnalysisCard } from '../components/upload/CVAnalysisCard';
import { Button } from '../components/ui/Button';
import { mockJobs } from '../data/mockJobs';
import { estimateJobMatch } from '../utils/cvParser';
import { FiMenu, FiX } from 'react-icons/fi';

export const ResultsPage = () => {
  const navigate = useNavigate();
  const [cvData, setCVData] = useState(null);
  const [filters, setFilters] = useState({
    modality: [],
    country: 'Brasil',
    state: '',
    city: '',
    seniority: [],
    salaryRange: [0, 50000],
    timeRange: 'qualquer',
    contractType: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [matchScores, setMatchScores] = useState({});

  useEffect(() => {
    // Carregar CV data do sessionStorage
    const storedCV = sessionStorage.getItem('cvData');
    if (storedCV) {
      const parsed = JSON.parse(storedCV);
      setCVData(parsed);

      // Calcular match scores
      const scores = {};
      mockJobs.forEach(job => {
        scores[job.id] = estimateJobMatch(parsed, job);
      });
      setMatchScores(scores);
    } else {
      navigate('/');
    }
    setIsLoading(false);
  }, [navigate]);

  const filterJobs = () => {
    return mockJobs.filter(job => {
      // Score de compatibilidade mínimo (mostrar apenas vagas com alguma relevância)
      const jobMatchScore = matchScores[job.id] || 0;
      if (jobMatchScore < 5 && !filters.modality.length && !filters.state && !filters.seniority.length && !filters.contractType.length) {
        // Se nenhum filtro manual foi aplicado, usar o score de compatibilidade como filtro
        return false;
      }

      // Filtro Modalidade
      if (filters.modality.length > 0 && !filters.modality.includes(job.modality)) {
        return false;
      }

      // Filtro País
      if (filters.country && filters.country !== 'Brasil' && job.country !== filters.country) {
        return false;
      }

      // Filtro Estado
      if (filters.state && job.state !== filters.state) {
        return false;
      }

      // Filtro Cidade
      if (filters.city && job.city !== filters.city) {
        return false;
      }

      // Filtro Senioridade
      if (filters.seniority.length > 0 && !filters.seniority.includes(job.seniority)) {
        return false;
      }

      // Filtro Faixa Salarial
      if (job.salary.min > filters.salaryRange[1]) {
        return false;
      }

      // Filtro Tempo de Publicação
      const now = new Date();
      const jobDate = new Date(job.postedAt);
      const hoursDiff = (now - jobDate) / (1000 * 60 * 60);
      const daysDiff = hoursDiff / 24;

      if (filters.timeRange === '24h' && hoursDiff > 24) return false;
      if (filters.timeRange === 'semana' && daysDiff > 7) return false;
      if (filters.timeRange === 'mês' && daysDiff > 30) return false;

      // Filtro Tipo de Contrato
      if (filters.contractType.length > 0 && !filters.contractType.includes(job.contractType)) {
        return false;
      }

      return true;
    });
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      modality: [],
      country: 'Brasil',
      state: '',
      city: '',
      seniority: [],
      salaryRange: [0, 50000],
      timeRange: 'qualquer',
      contractType: [],
    });
  };

  if (isLoading || !cvData) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="
            text-slate-400 dark:text-[#8892a4]
          ">
            Carregando...
          </p>
        </div>
      </Layout>
    );
  }

  const filteredJobs = filterJobs();

  return (
    <Layout showBreadcrumb breadcrumb="Home > Buscar Vagas">
      {/* Header Section - Centralizado */}
      <div className="mb-8 text-center">
        <h1 className="
          text-4xl md:text-5xl font-serif font-semibold mb-3
          text-slate-900 dark:text-white
          dark:font-display dark:uppercase
        ">
          Vagas para você
        </h1>
        <div className="flex items-center justify-center gap-3 flex-wrap mb-6">
          <p className="text-slate-600 dark:text-[#8892a4]">
            Baseado em: <span className="
              font-semibold
              text-slate-900 dark:text-white
            ">
              {cvData.analysis.title}
            </span>
          </p>
          {cvData.analysis.preferredCategories && cvData.analysis.preferredCategories.length > 0 && (
            <span className="
              px-3 py-1 rounded-full text-xs font-medium
              bg-blue-100 dark:bg-[#2a3245]
              text-blue-700 dark:text-[#FF6B00]
              border border-blue-200 dark:border-[#2a3245]
            ">
              {cvData.analysis.preferredCategories[0]}
            </span>
          )}
        </div>
      </div>

      {/* Dashboard Stats - Centralizado */}
      <DashboardStats jobs={filteredJobs} matchScores={matchScores} />

      {/* Trocar CV Button */}
      <div className="flex justify-center mb-8">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            sessionStorage.removeItem('cvData');
            navigate('/');
          }}
        >
          Trocar CV
        </Button>
      </div>

      {/* Mobile Filter Toggle */}
      <div className="md:hidden mb-6">
        <Button
          variant="secondary"
          size="md"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-full flex items-center justify-center gap-2"
        >
          {sidebarOpen ? <FiX /> : <FiMenu />}
          {sidebarOpen ? 'Fechar' : 'Abrir'} Filtros
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar com filtros */}
        <aside className={`md:col-span-1 ${sidebarOpen ? 'block' : 'hidden md:block'}`}>
          <div className="sticky top-24 space-y-6">
            <FilterSidebar
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleResetFilters}
              isOpen={sidebarOpen}
              onToggle={() => setSidebarOpen(false)}
            />

            {/* CV Summary */}
            <div>
              <h3 className="
                text-xs font-semibold uppercase tracking-wide mb-4
                text-slate-500 dark:text-[#8892a4]
              ">
                Seu Perfil
              </h3>
              <div className="
                rounded-lg p-5
                bg-slate-50 dark:bg-[#1e2433]
                border border-slate-200 dark:border-[#2a3245]
              ">
                <p className="
                  text-sm font-serif font-semibold mb-2
                  text-slate-900 dark:text-white
                ">
                  {cvData.analysis.title}
                </p>
                <p className="
                  text-xs font-medium mb-4
                  text-slate-600 dark:text-[#8892a4]
                ">
                  {cvData.analysis.experience} anos de experiência
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {cvData.analysis.topSkills.slice(0, 3).map((skill, idx) => (
                    <span
                      key={idx}
                      className="
                        inline-block px-2 py-1 text-xs rounded font-medium
                        bg-blue-100 dark:bg-[#2a3245]
                        text-blue-700 dark:text-[#FF6B00]
                        border border-blue-200 dark:border-[#2a3245]
                      "
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content - Jobs */}
        <main className="md:col-span-3">
          <JobList
            jobs={filteredJobs}
            isLoading={false}
            matchScores={matchScores}
          />
        </main>
      </div>
    </Layout>
  );
};
