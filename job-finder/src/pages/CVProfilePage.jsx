import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { CVAnalysisCard } from '../components/upload/CVAnalysisCard';
import { Button } from '../components/ui/Button';
import { FiArrowLeft } from 'react-icons/fi';

export const CVProfilePage = () => {
  const navigate = useNavigate();
  const [cvData, setCVData] = useState(null);

  useEffect(() => {
    const storedCV = sessionStorage.getItem('cvData');
    if (storedCV) {
      setCVData(JSON.parse(storedCV));
    } else {
      navigate('/');
    }
  }, [navigate]);

  if (!cvData) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-slate-600">Carregando...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBreadcrumb breadcrumb="Home > Perfil">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="
              flex items-center gap-2 mb-6
              text-slate-600 dark:text-[#8892a4]
              hover:text-slate-900 dark:hover:text-white
            "
          >
            <FiArrowLeft />
            Voltar
          </Button>
          <h1 className="
            text-4xl font-serif font-semibold
            text-slate-900 dark:text-white
            dark:font-display dark:uppercase
          ">
            Seu Currículo
          </h1>
        </div>

        <CVAnalysisCard cvData={cvData} />

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/')}
          >
            Alterar CV
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/results')}
          >
            Ver Vagas
          </Button>
        </div>
      </div>
    </Layout>
  );
};
