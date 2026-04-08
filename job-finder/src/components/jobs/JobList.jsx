import { useState } from 'react';
import { JobCard } from './JobCard';
import { JobCardSkeleton } from '../ui/Skeleton';

export const JobList = ({ jobs, isLoading = false, matchScores = {} }) => {
  const [sortBy, setSortBy] = useState('relevance');

  const sortedJobs = [...jobs].sort((a, b) => {
    if (sortBy === 'relevance') {
      return (matchScores[b.id] || 0) - (matchScores[a.id] || 0);
    }
    if (sortBy === 'date') {
      return new Date(b.postedAt) - new Date(a.postedAt);
    }
    if (sortBy === 'salary') {
      return b.salary.max - a.salary.max;
    }
    return 0;
  });

  return (
    <div>
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <h2 className="
          text-lg font-medium
          text-slate-700 dark:text-[#c4d0e0]
        ">
          {isLoading ? 'Carregando vagas...' : `${sortedJobs.length} vaga${sortedJobs.length !== 1 ? 's' : ''} encontrada${sortedJobs.length !== 1 ? 's' : ''}`}
        </h2>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          disabled={isLoading}
          className="
            px-4 py-2.5 rounded-lg border text-sm font-medium
            transition-smooth
            focus:outline-none focus:ring-2 focus:ring-offset-2
            bg-white dark:bg-[#1e2433]
            text-slate-900 dark:text-white
            border-slate-300 dark:border-[#2a3245]
            hover:border-slate-400 dark:hover:border-[#3a4457]
            focus:ring-blue-500 dark:focus:ring-[#FF6B00]
            focus:ring-offset-white dark:focus:ring-offset-[#151929]
          "
        >
          <option value="relevance">Relevância</option>
          <option value="date">Data (Recentes)</option>
          <option value="salary">Salário (Maior)</option>
        </select>
      </div>

      {/* Lista de vagas */}
      <div className="space-y-5">
        {isLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <JobCardSkeleton key={i} />
            ))}
          </>
        ) : sortedJobs.length > 0 ? (
          sortedJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              matchScore={matchScores[job.id]}
            />
          ))
        ) : (
          <div className="
            rounded-lg p-12 text-center
            bg-slate-50 dark:bg-[#1e2433]
            border border-slate-200 dark:border-[#2a3245]
          ">
            <p className="
              font-medium
              text-slate-600 dark:text-[#8892a4]
            ">
              Nenhuma vaga encontrada com os filtros selecionados.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
