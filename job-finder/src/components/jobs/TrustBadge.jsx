import { FiCheckCircle, FiAlertCircle, FiXCircle } from 'react-icons/fi';

export const TrustBadge = ({ trustLevel = 'unverified' }) => {
  const trustConfig = {
    verified: {
      icon: FiCheckCircle,
      label: 'Verificado',
      color: `
        bg-emerald-100 text-emerald-700 border-emerald-200
        dark:bg-[#2a3245] dark:text-emerald-400 dark:border-[#3a4457]
      `,
    },
    caution: {
      icon: FiAlertCircle,
      label: 'Verificar',
      color: `
        bg-amber-100 text-amber-700 border-amber-200
        dark:bg-[#2a3245] dark:text-amber-400 dark:border-[#3a4457]
      `,
    },
    unverified: {
      icon: FiXCircle,
      label: 'Não verificado',
      color: `
        bg-slate-100 text-slate-600 border-slate-200
        dark:bg-[#2a3245] dark:text-[#8892a4] dark:border-[#3a4457]
      `,
    },
  };

  const config = trustConfig[trustLevel] || trustConfig.unverified;
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${config.color}`}>
      <Icon className="text-sm" />
      <span>{config.label}</span>
    </div>
  );
};
