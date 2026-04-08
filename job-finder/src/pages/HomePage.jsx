import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { CVUpload } from '../components/upload/CVUpload';
import { CVAnalysisCard } from '../components/upload/CVAnalysisCard';
import { Button } from '../components/ui/Button';
import { parseCVFile } from '../utils/cvParser';
import { FiCheck } from 'react-icons/fi';

export const HomePage = () => {
  const navigate = useNavigate();
  const [cvData, setCVData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCVUpload = async (file) => {
    setIsLoading(true);
    try {
      const parsedCV = await parseCVFile(file);
      setCVData(parsedCV);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchJobs = () => {
    if (cvData) {
      sessionStorage.setItem('cvData', JSON.stringify(cvData));
      navigate('/results');
    }
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-200px)] flex flex-col">
        {/* Hero Section */}
        <div className="mb-20 text-center pt-6">
          <div className="
            mb-8 inline-flex items-center gap-2 px-4 py-2
            rounded-full
            bg-slate-50 dark:bg-[#1e2433]
            border border-slate-200 dark:border-[#2a3245]
          ">
            <span className="
              w-2 h-2 rounded-full animate-pulse
              bg-blue-600 dark:bg-[#FF6B00]
            " />
            <span className="
              text-xs font-medium
              text-slate-700 dark:text-[#8892a4]
            ">
              Análise Inteligente de Currículo
            </span>
          </div>

          <h1 className="
            text-5xl md:text-6xl font-serif font-semibold mb-6
            text-slate-900 dark:text-white
            leading-tight
            dark:font-display dark:uppercase dark:tracking-tight
          ">
            Encontre a oportunidade certa
          </h1>

          <p className="
            text-lg mb-3 max-w-2xl mx-auto
            text-slate-600 dark:text-[#8892a4]
          ">
            Sua inteligência artificial pessoal para recolocação profissional
          </p>

          <p className="
            max-w-3xl mx-auto text-base leading-relaxed
            text-slate-500 dark:text-[#8892a4]
          ">
            Envie seu currículo em PDF ou Word. Nós analisamos suas habilidades, experiência e encontramos as vagas que realmente combinam com você.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">
          {/* Upload Section */}
          <div>
            <h2 className="
              text-3xl font-serif font-semibold mb-8
              text-slate-900 dark:text-white
              dark:font-display dark:uppercase
            ">
              Comece Agora
            </h2>
            <CVUpload onUpload={handleCVUpload} isLoading={isLoading} onSearchClick={handleSearchJobs} />

            {/* Features */}
            <div className="mt-12 space-y-4">
              <h3 className="
                text-sm font-medium uppercase tracking-wide mb-6
                text-slate-500 dark:text-[#8892a4]
              ">
                O que você consegue
              </h3>
              {[
                'Análise precisa das suas habilidades',
                'Busca em múltiplas plataformas',
                'Filtros por localização, salário e modalidade',
                'Score de compatibilidade com cada vaga',
                'Links diretos para candidatura'
              ].map((feature, idx) => (
                <div key={idx} className="
                  flex items-center gap-3 text-sm
                  text-slate-700 dark:text-[#c4d0e0]
                ">
                  <div className="
                    w-5 h-5 rounded-sm flex items-center justify-center flex-shrink-0
                    bg-blue-100 dark:bg-[#2a3245]
                  ">
                    <FiCheck className="
                      text-xs font-bold
                      text-blue-600 dark:text-[#FF6B00]
                    " />
                  </div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CV Analysis Preview */}
          {cvData && (
            <div>
              <h2 className="
                text-3xl font-serif font-semibold mb-8
                text-slate-900 dark:text-white
                dark:font-display dark:uppercase
              ">
                Seu Perfil Detectado
              </h2>
              <CVAnalysisCard cvData={cvData} />
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="
          rounded-xl p-12 mt-auto
          bg-slate-50 dark:bg-[#1e2433]
          border border-slate-200 dark:border-[#2a3245]
        ">
          <h3 className="
            text-2xl font-serif font-semibold mb-10
            text-slate-900 dark:text-white
            dark:font-display dark:uppercase
          ">
            Como funciona
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Carregue seu CV',
                description: 'Envie em PDF, Word ou outro formato compatível'
              },
              {
                step: '2',
                title: 'Análise Automática',
                description: 'Sistema identifica habilidades e experiência com precisão'
              },
              {
                step: '3',
                title: 'Descubra Vagas',
                description: 'Explore oportunidades recomendadas baseadas em seu perfil'
              }
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="
                  w-14 h-14 rounded-lg flex items-center justify-center mx-auto mb-4
                  bg-blue-100 dark:bg-[#2a3245]
                ">
                  <span className="
                    text-2xl font-serif font-bold
                    text-blue-600 dark:text-[#FF6B00]
                  ">
                    {item.step}
                  </span>
                </div>
                <h4 className="
                  font-serif font-semibold mb-2 text-lg
                  text-slate-900 dark:text-white
                  dark:font-display dark:uppercase dark:text-base
                ">
                  {item.title}
                </h4>
                <p className="
                  text-sm
                  text-slate-600 dark:text-[#8892a4]
                ">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};
