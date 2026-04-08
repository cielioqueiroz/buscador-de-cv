import { useState } from 'react';
import { FiUploadCloud, FiCheck, FiAlertCircle, FiArrowRight } from 'react-icons/fi';
import { Button } from '../ui/Button';

export const CVUpload = ({ onUpload, isLoading = false, onSearchClick }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const acceptedFormats = ['.pdf', '.docx', '.doc', '.txt', '.odt', '.rtf'];
  const maxFileSize = 5 * 1024 * 1024; // 5MB

  const validateFile = (file) => {
    // Validar formato
    const fileName = file.name.toLowerCase();
    const isValidFormat = acceptedFormats.some(format => fileName.endsWith(format));

    if (!isValidFormat) {
      setError('Formato não suportado. Aceitos: PDF, DOCX, DOC, TXT, ODT, RTF');
      return false;
    }

    // Validar tamanho
    if (file.size > maxFileSize) {
      setError('Arquivo muito grande. Máximo 5MB');
      return false;
    }

    return true;
  };

  const handleFile = async (file) => {
    setError(null);

    if (!validateFile(file)) {
      return;
    }

    // Simular progresso de upload
    setUploadedFile(file);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 30;
      });
    }, 300);

    // Enviar para análise
    await onUpload(file);

    clearInterval(progressInterval);
    setUploadProgress(100);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setUploadProgress(0);
    setError(null);
  };

  return (
    <div className="w-full space-y-4">
      {!uploadedFile ? (
        <div
          className={`
            border-2 border-dashed rounded-lg p-10 text-center transition-smooth
            ${
              dragActive
                ? `
                    border-blue-500 dark:border-[#FF6B00]
                    bg-blue-50 dark:bg-[#2a3245]
                  `
                : `
                    border-slate-300 dark:border-[#3a4457]
                    hover:border-slate-400 dark:hover:border-[#4a5567]
                    hover:bg-slate-50 dark:hover:bg-[#2a3245]
                  `
            }
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex justify-center mb-5">
            <div className={`
              p-4 rounded-lg transition-smooth
              ${
                dragActive
                  ? 'bg-blue-100 dark:bg-[#FF6B00]/20'
                  : 'bg-slate-100 dark:bg-[#2a3245]'
              }
            `}>
              <FiUploadCloud className={`
                text-4xl transition-smooth
                ${dragActive
                  ? 'text-blue-600 dark:text-[#FF6B00]'
                  : 'text-slate-600 dark:text-[#8892a4]'
                }
              `} />
            </div>
          </div>

          <h3 className="
            text-lg font-serif font-semibold mb-2
            text-slate-900 dark:text-white
            dark:font-display dark:uppercase dark:text-base
          ">
            Arraste seu currículo aqui
          </h3>
          <p className="
            mb-5
            text-slate-600 dark:text-[#8892a4]
          ">
            ou clique para selecionar um arquivo
          </p>

          <p className="
            text-xs font-medium mb-7
            text-slate-500 dark:text-[#8892a4]
          ">
            PDF, Word, TXT ou ODT • Máximo 5MB
          </p>

          <label className="inline-block">
            <input
              type="file"
              accept=".pdf,.docx,.doc,.txt,.odt,.rtf"
              onChange={handleInputChange}
              disabled={isLoading}
              className="hidden"
            />
            <span className={`
              inline-block px-6 py-3 font-medium rounded-lg
              transition-smooth cursor-pointer shadow-subtle hover:shadow-sm
              bg-blue-600 dark:bg-[#FF6B00]
              text-white
              hover:bg-blue-700 dark:hover:bg-[#FF7D20]
              ${
                isLoading ? 'opacity-75 cursor-not-allowed' : ''
              }
            `}>
              {isLoading ? 'Processando...' : 'Escolher Arquivo'}
            </span>
          </label>
        </div>
      ) : (
        <div className="
          rounded-lg p-8
          bg-slate-50 dark:bg-[#1e2433]
          border border-slate-200 dark:border-[#2a3245]
        ">
          <div className="flex items-center gap-4 mb-8">
            <div className="
              p-3 rounded-lg
              bg-emerald-100 dark:bg-[#2a3245]
            ">
              <FiCheck className="
                text-2xl
                text-emerald-600 dark:text-emerald-400
              " />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="
                font-serif font-semibold
                text-slate-900 dark:text-white
                dark:font-display dark:uppercase dark:text-base
              ">
                Arquivo Carregado
              </h3>
              <p className="
                text-sm truncate
                text-slate-600 dark:text-[#8892a4]
              ">
                {uploadedFile.name}
              </p>
            </div>
          </div>

          {uploadProgress < 100 && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <span className="
                  text-xs font-medium
                  text-slate-600 dark:text-[#8892a4]
                ">
                  Processando currículo
                </span>
                <span className="
                  text-xs font-semibold
                  text-blue-600 dark:text-[#FF6B00]
                ">
                  {Math.round(uploadProgress)}%
                </span>
              </div>
              <div className="
                h-2 rounded-full overflow-hidden
                bg-slate-200 dark:bg-[#2a3245]
              ">
                <div
                  className="
                    h-full transition-smooth
                    bg-blue-600 dark:bg-[#FF6B00]
                  "
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {uploadProgress === 100 && (
            <div className="flex gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={onSearchClick}
                className="flex items-center justify-center gap-2 flex-1"
              >
                Buscar Vagas <FiArrowRight />
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={resetUpload}
                className="flex-1"
              >
                Trocar Arquivo
              </Button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="
          p-4 rounded-lg flex items-start gap-3
          bg-rose-50 dark:bg-[#2a3245]
          border border-rose-200 dark:border-[#3a4457]
        ">
          <FiAlertCircle className="
            mt-0.5 flex-shrink-0 text-lg
            text-rose-600 dark:text-rose-500
          " />
          <p className="
            text-sm font-medium
            text-rose-700 dark:text-rose-400
          ">
            {error}
          </p>
        </div>
      )}
    </div>
  );
};
