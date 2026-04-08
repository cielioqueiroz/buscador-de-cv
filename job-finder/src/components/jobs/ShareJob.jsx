import { useState } from 'react';
import {
  FiShare2,
  FiX,
  FiCheck,
} from 'react-icons/fi';
import {
  FaWhatsapp,
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaTwitter,
  FaEnvelope,
  FaLink,
} from 'react-icons/fa';

export const ShareJob = ({ job }) => {
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  const jobUrl = `${window.location.origin}${window.location.pathname}?job=${job.id}`;
  const jobTitle = encodeURIComponent(job.title);
  const jobDescription = encodeURIComponent(
    `Vaga: ${job.title} na ${job.company}\n\n${job.description}`
  );
  const url = encodeURIComponent(jobUrl);

  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: FaWhatsapp,
      color: 'hover:text-green-500 dark:hover:text-green-400',
      url: `https://wa.me/?text=${jobTitle}%20-%20${url}`,
      action: 'link',
    },
    {
      name: 'Facebook',
      icon: FaFacebook,
      color: 'hover:text-blue-600 dark:hover:text-blue-400',
      url: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      action: 'link',
    },
    {
      name: 'LinkedIn',
      icon: FaLinkedin,
      color: 'hover:text-blue-700 dark:hover:text-blue-400',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      action: 'link',
    },
    {
      name: 'Twitter/X',
      icon: FaTwitter,
      color: 'hover:text-gray-700 dark:hover:text-gray-300',
      url: `https://twitter.com/intent/tweet?text=${jobTitle}&url=${url}`,
      action: 'link',
    },
    {
      name: 'Email',
      icon: FaEnvelope,
      color: 'hover:text-red-500 dark:hover:text-red-400',
      url: `mailto:?subject=${jobTitle}&body=${jobDescription}%0A%0A${url}`,
      action: 'link',
    },
    {
      name: 'Copiar Link',
      icon: FaLink,
      color: 'hover:text-orange-500 dark:hover:text-orange-400',
      action: 'copy',
    },
  ];

  const handleShare = (link) => {
    if (link.action === 'link') {
      window.open(link.url, '_blank', 'width=600,height=400');
    } else if (link.action === 'copy') {
      navigator.clipboard.writeText(jobUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowShare(!showShare)}
        title="Compartilhar vaga"
        className={`
          px-4 py-2 rounded-lg transition-smooth border flex items-center gap-2
          ${showShare
            ? `
              bg-blue-50 dark:bg-[#2a3245]
              border-blue-200 dark:border-[#3a4457]
              text-blue-600 dark:text-[#FF6B00]
            `
            : `
              bg-slate-100 dark:bg-[#2a3245]
              border-slate-200 dark:border-[#3a4457]
              text-slate-600 dark:text-[#8892a4]
              hover:border-slate-300 dark:hover:border-[#4a5567]
            `
          }
        `}
      >
        <FiShare2 className="text-base" />
        <span className="text-sm font-medium hidden sm:inline">Compartilhar</span>
      </button>

      {showShare && (
        <div className="
          absolute right-0 mt-2 bg-white dark:bg-[#1e2433]
          border border-slate-200 dark:border-[#2a3245]
          rounded-lg shadow-lg dark:shadow-2xl
          p-3 z-50 w-56 sm:w-64
        ">
          <div className="flex items-center justify-between mb-4">
            <h4 className="
              text-sm font-semibold
              text-slate-900 dark:text-white
            ">
              Compartilhar esta vaga
            </h4>
            <button
              onClick={() => setShowShare(false)}
              className="
                text-slate-500 dark:text-[#8892a4]
                hover:text-slate-700 dark:hover:text-white
              "
            >
              <FiX className="text-lg" />
            </button>
          </div>

          <div className="
            grid grid-cols-3 gap-3
            mb-4 pb-4
            border-b border-slate-200 dark:border-[#2a3245]
          ">
            {shareLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.name}
                  onClick={() => handleShare(link)}
                  title={link.name}
                  className={`
                    flex flex-col items-center gap-1.5 p-2 rounded-lg
                    transition-smooth
                    text-slate-500 dark:text-[#8892a4]
                    hover:bg-slate-100 dark:hover:bg-[#2a3245]
                    ${link.color}
                  `}
                >
                  <Icon className="text-xl" />
                  <span className="text-xs font-medium text-center line-clamp-1">
                    {link.name}
                  </span>
                </button>
              );
            })}
          </div>

          {copied && (
            <div className="
              flex items-center gap-2
              p-2 bg-emerald-50 dark:bg-[#2a3245]
              rounded text-emerald-700 dark:text-emerald-400
              text-sm font-medium
            ">
              <FiCheck className="text-lg" />
              Link copiado!
            </div>
          )}

          {!copied && (
            <div className="
              text-xs
              text-slate-500 dark:text-[#8892a4]
            ">
              Clique em uma opção para compartilhar
            </div>
          )}
        </div>
      )}
    </div>
  );
};
