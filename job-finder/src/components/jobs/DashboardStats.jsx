import { FiBriefcase, FiTrendingUp, FiDollarSign, FiMapPin } from 'react-icons/fi';

export const DashboardStats = ({ jobs, matchScores }) => {
  // Calcular estatísticas
  const totalJobs = jobs.length;
  const avgMatch = totalJobs > 0
    ? Math.round(
        Object.values(matchScores).filter(score => jobs.some(j => j.id in { [jobs.find(j => matchScores[j.id] === score)?.id]: true })).reduce((a, b) => a + b, 0) / totalJobs
      )
    : 0;

  const avgSalary = totalJobs > 0
    ? Math.round(
        jobs.reduce((acc, job) => acc + (job.salary.max + job.salary.min) / 2, 0) / totalJobs / 1000
      )
    : 0;

  const uniqueLocations = new Set(jobs.map(j => j.state)).size;

  const stats = [
    {
      icon: FiBriefcase,
      label: 'Vagas Encontradas',
      value: totalJobs,
      color: 'bg-blue-50 dark:bg-[#2a3245] text-blue-600 dark:text-[#FF6B00]',
      borderColor: 'border-blue-200 dark:border-[#3a4457]',
    },
    {
      icon: FiTrendingUp,
      label: 'Compatibilidade Média',
      value: `${avgMatch}%`,
      color: 'bg-emerald-50 dark:bg-[#2a3245] text-emerald-600 dark:text-emerald-400',
      borderColor: 'border-emerald-200 dark:border-[#3a4457]',
    },
    {
      icon: FiDollarSign,
      label: 'Salário Médio',
      value: `R$ ${avgSalary}k`,
      color: 'bg-amber-50 dark:bg-[#2a3245] text-amber-600 dark:text-amber-400',
      borderColor: 'border-amber-200 dark:border-[#3a4457]',
    },
    {
      icon: FiMapPin,
      label: 'Localizações',
      value: uniqueLocations,
      color: 'bg-rose-50 dark:bg-[#2a3245] text-rose-600 dark:text-rose-400',
      borderColor: 'border-rose-200 dark:border-[#3a4457]',
    },
  ];

  return (
    <div className="mb-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className={`
                rounded-lg p-5 border
                ${stat.color} ${stat.borderColor}
                transition-smooth hover:shadow-md dark:hover:shadow-lg
                dark:hover:shadow-[#FF6B00]/20
              `}
            >
              <div className="flex items-start justify-between mb-3">
                <Icon className="text-2xl opacity-80" />
              </div>
              <p className="
                text-2xl lg:text-3xl font-bold mb-1
                font-display dark:font-display
              ">
                {stat.value}
              </p>
              <p className="
                text-xs font-medium opacity-75
                uppercase tracking-wide
              ">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
