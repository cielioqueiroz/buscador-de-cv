import { FiUser, FiMail, FiPhone, FiBriefcase, FiTrendingUp } from 'react-icons/fi';
import { Badge } from '../ui/Badge';

export const CVAnalysisCard = ({ cvData }) => {
  const { analysis } = cvData;

  const seniorityColors = {
    estágio: `
      bg-blue-100 text-blue-700 border border-blue-200
      dark:bg-[#2a3245] dark:text-blue-400 dark:border-[#3a4457]
    `,
    junior: `
      bg-blue-100 text-blue-700 border border-blue-200
      dark:bg-[#2a3245] dark:text-blue-400 dark:border-[#3a4457]
    `,
    pleno: `
      bg-emerald-100 text-emerald-700 border border-emerald-200
      dark:bg-[#2a3245] dark:text-emerald-400 dark:border-[#3a4457]
    `,
    senior: `
      bg-amber-100 text-amber-700 border border-amber-200
      dark:bg-[#2a3245] dark:text-amber-400 dark:border-[#3a4457]
    `,
    lead: `
      bg-rose-100 text-rose-700 border border-rose-200
      dark:bg-[#2a3245] dark:text-rose-400 dark:border-[#3a4457]
    `,
  };

  return (
    <div className="
      rounded-lg p-8
      bg-white dark:bg-[#1e2433]
      border border-slate-200 dark:border-[#2a3245]
      shadow-subtle dark:shadow-xl
    ">
      <div className="flex items-start justify-between mb-8">
        <div className="flex-1 pr-4">
          <h2 className="
            text-2xl font-serif font-semibold mb-1
            text-slate-900 dark:text-white
            dark:font-display dark:uppercase dark:text-xl
          ">
            {analysis.title}
          </h2>
          <div className="
            flex items-center gap-2 text-sm
            text-slate-600 dark:text-[#8892a4]
          ">
            <FiBriefcase className="
              text-base
              text-slate-500 dark:text-[#8892a4]
            " />
            <span>Seu Perfil Profissional</span>
          </div>
        </div>
        <div className={`
          px-3 py-1.5 rounded-full text-sm font-semibold flex-shrink-0
          ${seniorityColors[analysis.seniority]}
        `}>
          {analysis.seniority.charAt(0).toUpperCase() + analysis.seniority.slice(1)}
        </div>
      </div>

      <div className="
        grid grid-cols-2 gap-6 mb-8 pb-8
        border-b border-slate-200 dark:border-[#2a3245]
      ">
        <div className="flex items-start gap-4">
          <div className="
            p-3 rounded-lg flex-shrink-0
            bg-blue-100 dark:bg-[#2a3245]
          ">
            <FiTrendingUp className="
              text-lg
              text-blue-600 dark:text-[#FF6B00]
            " />
          </div>
          <div>
            <p className="
              text-xs font-medium uppercase tracking-wide mb-1
              text-slate-500 dark:text-[#8892a4]
            ">
              Experiência
            </p>
            <p className="
              text-lg font-serif font-semibold
              text-slate-900 dark:text-white
              dark:font-display dark:uppercase dark:text-base
            ">
              {analysis.experience}+ anos
            </p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="
            p-3 rounded-lg flex-shrink-0
            bg-slate-100 dark:bg-[#2a3245]
          ">
            <FiBriefcase className="
              text-lg
              text-slate-600 dark:text-[#FF6B00]
            " />
          </div>
          <div>
            <p className="
              text-xs font-medium uppercase tracking-wide mb-1
              text-slate-500 dark:text-[#8892a4]
            ">
              Áreas
            </p>
            <p className="
              text-lg font-serif font-semibold
              text-slate-900 dark:text-white
              dark:font-display dark:uppercase dark:text-base
            ">
              {analysis.preferredCategories?.length > 0
                ? analysis.preferredCategories[0]
                : 'Não detectado'}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="
          text-sm font-medium uppercase tracking-wide mb-4
          text-slate-700 dark:text-[#8892a4]
          dark:font-display dark:text-xs
        ">
          Habilidades Principais
        </h3>
        <div className="flex flex-wrap gap-2">
          {analysis.topSkills && analysis.topSkills.length > 0 ? (
            analysis.topSkills.map((skill, idx) => (
              <Badge key={idx} variant="primary" size="sm">
                {skill}
              </Badge>
            ))
          ) : (
            <p className="
              text-xs
              text-slate-500 dark:text-[#8892a4]
            ">
              Nenhuma skill específica detectada
            </p>
          )}
        </div>
      </div>

      <div className="
        p-4 rounded-lg
        bg-slate-50 dark:bg-[#2a3245]
        border border-slate-200 dark:border-[#3a4457]
      ">
        <p className="
          text-sm leading-relaxed
          text-slate-700 dark:text-[#c4d0e0]
        ">
          {analysis.aboutMe}
        </p>
      </div>
    </div>
  );
};
