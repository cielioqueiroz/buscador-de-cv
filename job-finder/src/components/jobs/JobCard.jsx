import { useState } from 'react';
import { FiBriefcase, FiMapPin, FiDollarSign, FiClock, FiExternalLink, FiHeart } from 'react-icons/fi';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { TrustBadge } from './TrustBadge';
import { CircularGauge } from '../ui/CircularGauge';
import { ShareJob } from './ShareJob';

export const JobCard = ({ job, matchScore = null }) => {
  const [saved, setSaved] = useState(false);

  const formatDate = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Há poucos minutos';
    if (hours < 24) return `Há ${hours}h`;
    if (days === 1) return 'Ontem';
    if (days < 30) return `Há ${days}d`;
    return `Há ${Math.floor(days / 30)}m`;
  };

  const formatSalary = (min, max) => {
    return `R$ ${(min / 1000).toFixed(0)}k – ${(max / 1000).toFixed(0)}k`;
  };

  const modalityEmoji = {
    remoto: '🌐',
    híbrido: '🏢',
    presencial: '📍',
  };

  const trustColor = {
    verified: `
      border-l-emerald-500 dark:border-l-emerald-500
      bg-emerald-50/30 dark:bg-transparent
    `,
    caution: `
      border-l-amber-500 dark:border-l-amber-500
      bg-amber-50/30 dark:bg-transparent
    `,
    unverified: `
      border-l-slate-300 dark:border-l-[#FF6B00]
      bg-slate-50/50 dark:bg-transparent
    `,
  };

  return (
    <div className={`
      rounded-lg border-l-4 p-6
      transition-smooth
      bg-white dark:bg-[#1e2433]
      border border-slate-200 dark:border-[#2a3245]
      hover:shadow-md dark:hover:shadow-2xl dark:hover:shadow-[#FF6B00]/10
      ${trustColor[job.trustLevel]}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex gap-4 flex-1">
          <div className="
            w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0
            bg-blue-100 dark:bg-[#2a3245]
          ">
            <FiBriefcase className="
              text-lg
              text-blue-600 dark:text-[#FF6B00]
            " />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="
              text-lg font-serif font-semibold mb-1
              text-slate-900 dark:text-white
              dark:font-display dark:uppercase dark:text-base
            ">
              {job.title}
            </h3>
            <p className="
              text-sm
              text-slate-600 dark:text-[#8892a4]
            ">
              {job.company} • {job.site}
            </p>
          </div>
        </div>
        <TrustBadge trustLevel={job.trustLevel} />
      </div>

      {/* Meta Info */}
      <div className="flex flex-wrap gap-4 mb-5 text-sm text-slate-700 dark:text-[#c4d0e0]">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{modalityEmoji[job.modality]}</span>
          <span className="capitalize font-medium">{job.modality}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <FiMapPin className="
            text-base flex-shrink-0
            text-slate-500 dark:text-[#8892a4]
          " />
          <span>{job.city}, {job.state}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <FiDollarSign className="
            text-base flex-shrink-0
            text-slate-500 dark:text-[#8892a4]
          " />
          <span className="font-medium">{formatSalary(job.salary.min, job.salary.max)}</span>
        </div>
      </div>

      {/* Details */}
      <div className="
        flex flex-wrap gap-2 text-xs mb-4 pb-4
        text-slate-500 dark:text-[#8892a4]
        border-b border-slate-200 dark:border-[#2a3245]
      ">
        <span className="flex items-center gap-1">
          <FiClock className="text-slate-400 dark:text-[#6a7b8d]" />
          {formatDate(job.postedAt)}
        </span>
        <span className="text-slate-300 dark:text-[#4a5567]">•</span>
        <span className="capitalize font-medium">{job.seniority}</span>
        <span className="text-slate-300 dark:text-[#4a5567]">•</span>
        <span>{job.contractType}</span>
      </div>

      {/* Match Score */}
      {matchScore !== null && (
        <div className="
          mb-5 p-4 rounded-lg
          bg-blue-50 dark:bg-[#2a3245]
        ">
          <div className="flex items-center justify-between mb-3">
            <span className="
              text-xs font-semibold
              text-slate-700 dark:text-[#8892a4]
            ">
              Compatibilidade com seu perfil
            </span>
            <div className="hidden dark:block">
              <CircularGauge value={matchScore} max={100} size={60} strokeWidth={4} />
            </div>
            <span className="
              text-base font-semibold
              text-blue-600 dark:hidden
            ">
              {matchScore}%
            </span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-[#3a4457] rounded-full overflow-hidden dark:hidden">
            <div
              className="h-full bg-blue-600 transition-smooth"
              style={{ width: `${matchScore}%` }}
            />
          </div>
        </div>
      )}

      {/* Description */}
      <p className="
        text-sm mb-5 line-clamp-2 leading-relaxed
        text-slate-700 dark:text-[#c4d0e0]
      ">
        {job.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        {job.tags.slice(0, 3).map((tag, idx) => (
          <Badge key={idx} variant="default" size="sm">
            {tag}
          </Badge>
        ))}
        {job.tags.length > 3 && (
          <Badge variant="default" size="sm">
            +{job.tags.length - 3}
          </Badge>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <a
          href={job.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-w-[200px]"
        >
          <Button
            variant="primary"
            size="md"
            className="w-full flex items-center justify-center gap-2 font-medium"
          >
            <FiExternalLink />
            Acessar Vaga
          </Button>
        </a>
        <ShareJob job={job} />
        <button
          onClick={() => setSaved(!saved)}
          title={saved ? 'Remover dos favoritos' : 'Salvar vaga'}
          className={`px-4 py-2 rounded-lg transition-smooth border ${
            saved
              ? `
                  bg-rose-50 dark:bg-[#2a3245]
                  border-rose-200 dark:border-[#3a4457]
                  text-rose-600 dark:text-rose-500
                `
              : `
                  bg-slate-100 dark:bg-[#2a3245]
                  border-slate-200 dark:border-[#3a4457]
                  text-slate-600 dark:text-[#8892a4]
                  hover:border-slate-300 dark:hover:border-[#4a5567]
                `
          }`}
        >
          <FiHeart fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>
    </div>
  );
};
