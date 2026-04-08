import { useState } from 'react';
import { FiFilter, FiX } from 'react-icons/fi';

export const FilterSidebar = ({
  filters,
  onFilterChange,
  onReset,
  isOpen = true,
  onToggle = null,
}) => {
  const [expanded, setExpanded] = useState({
    modality: true,
    location: true,
    seniority: true,
    salary: true,
    time: true,
    contract: true,
  });

  const toggleExpand = (section) => {
    setExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleCheckboxChange = (filterType, value) => {
    const currentArray = filters[filterType] || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(v => v !== value)
      : [...currentArray, value];
    onFilterChange(filterType, newArray);
  };

  const handleSelectChange = (filterType, value) => {
    onFilterChange(filterType, value);
  };

  const handleRangeChange = (value) => {
    onFilterChange('salaryRange', value);
  };

  const states = {
    'SP': ['São Paulo', 'Campinas', 'Santos', 'Sorocaba'],
    'RJ': ['Rio de Janeiro'],
    'MG': ['Belo Horizonte', 'Contagem'],
    'RS': ['Porto Alegre'],
    'PR': ['Curitiba'],
    'PE': ['Recife'],
    'BA': ['Salvador'],
    'DF': ['Brasília'],
  };

  return (
    <div className={`
      rounded-lg p-6 h-fit
      bg-white dark:bg-[#1e2433]
      border border-slate-200 dark:border-[#2a3245]
      shadow-subtle dark:shadow-xl
      ${!isOpen && 'hidden md:block'}
    `}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="
          text-lg font-serif font-semibold flex items-center gap-2
          text-slate-900 dark:text-white
          dark:font-display dark:uppercase dark:text-base
        ">
          <FiFilter className="text-slate-600 dark:text-[#8892a4]" />
          Filtros
        </h2>
        {onToggle && (
          <button
            onClick={onToggle}
            className="
              md:hidden transition-smooth
              text-slate-500 dark:text-[#8892a4]
              hover:text-slate-700 dark:hover:text-white
            "
          >
            <FiX className="text-xl" />
          </button>
        )}
      </div>

      {/* Modalidade */}
      <div className="mb-6 pb-6 border-b border-slate-200 dark:border-[#2a3245]">
        <button
          onClick={() => toggleExpand('modality')}
          className="
            flex items-center justify-between w-full text-sm font-semibold mb-3
            transition-smooth
            text-slate-900 dark:text-white
            hover:text-blue-600 dark:hover:text-[#FF6B00]
            dark:font-display dark:uppercase dark:text-xs
          "
        >
          Modalidade
          <span className="
            text-slate-400 dark:text-[#6a7b8d]
          ">
            {expanded.modality ? '−' : '+'}
          </span>
        </button>
        {expanded.modality && (
          <div className="space-y-2.5">
            {['remoto', 'híbrido', 'presencial'].map(mode => (
              <label
                key={mode}
                className="
                  flex items-center gap-2.5 cursor-pointer
                  text-slate-700 dark:text-[#c4d0e0]
                "
              >
                <input
                  type="checkbox"
                  checked={(filters.modality || []).includes(mode)}
                  onChange={() => handleCheckboxChange('modality', mode)}
                  className="
                    rounded border-slate-300 cursor-pointer
                    accent-blue-600 dark:accent-[#FF6B00]
                  "
                />
                <span className="text-sm capitalize">{mode}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* País e Estado */}
      <div className="mb-6 pb-6 border-b border-slate-200 dark:border-[#2a3245]">
        <button
          onClick={() => toggleExpand('location')}
          className="
            flex items-center justify-between w-full text-sm font-semibold mb-3
            transition-smooth
            text-slate-900 dark:text-white
            hover:text-blue-600 dark:hover:text-[#FF6B00]
            dark:font-display dark:uppercase dark:text-xs
          "
        >
          Localização
          <span className="
            text-slate-400 dark:text-[#6a7b8d]
          ">
            {expanded.location ? '−' : '+'}
          </span>
        </button>
        {expanded.location && (
          <div className="space-y-3">
            <div>
              <label className="
                text-xs font-semibold uppercase tracking-wide block mb-2
                text-slate-600 dark:text-[#8892a4]
              ">
                País
              </label>
              <select
                value={filters.country || 'Brasil'}
                onChange={(e) => handleSelectChange('country', e.target.value)}
                className="
                  w-full px-3 py-2.5 rounded-lg border text-sm font-medium
                  transition-smooth
                  bg-white dark:bg-[#2a3245]
                  text-slate-900 dark:text-white
                  border-slate-300 dark:border-[#3a4457]
                  hover:border-slate-400 dark:hover:border-[#4a5567]
                "
              >
                <option>Brasil</option>
                <option>Portugal</option>
                <option>Outro</option>
              </select>
            </div>

            <div>
              <label className="
                text-xs font-semibold uppercase tracking-wide block mb-2
                text-slate-600 dark:text-[#8892a4]
              ">
                Estado
              </label>
              <select
                value={filters.state || ''}
                onChange={(e) => handleSelectChange('state', e.target.value)}
                className="
                  w-full px-3 py-2.5 rounded-lg border text-sm font-medium
                  transition-smooth
                  bg-white dark:bg-[#2a3245]
                  text-slate-900 dark:text-white
                  border-slate-300 dark:border-[#3a4457]
                  hover:border-slate-400 dark:hover:border-[#4a5567]
                "
              >
                <option value="">Todos</option>
                {Object.keys(states).map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            {filters.state && (
              <div>
                <label className="
                  text-xs font-semibold uppercase tracking-wide block mb-2
                  text-slate-600 dark:text-[#8892a4]
                ">
                  Cidade
                </label>
                <select
                  value={filters.city || ''}
                  onChange={(e) => handleSelectChange('city', e.target.value)}
                  className="
                    w-full px-3 py-2.5 rounded-lg border text-sm font-medium
                    transition-smooth
                    bg-white dark:bg-[#2a3245]
                    text-slate-900 dark:text-white
                    border-slate-300 dark:border-[#3a4457]
                    hover:border-slate-400 dark:hover:border-[#4a5567]
                  "
                >
                  <option value="">Todas</option>
                  {states[filters.state]?.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Senioridade */}
      <div className="mb-6 pb-6 border-b border-slate-200 dark:border-[#2a3245]">
        <button
          onClick={() => toggleExpand('seniority')}
          className="
            flex items-center justify-between w-full text-sm font-semibold mb-3
            transition-smooth
            text-slate-900 dark:text-white
            hover:text-blue-600 dark:hover:text-[#FF6B00]
            dark:font-display dark:uppercase dark:text-xs
          "
        >
          Senioridade
          <span className="
            text-slate-400 dark:text-[#6a7b8d]
          ">
            {expanded.seniority ? '−' : '+'}
          </span>
        </button>
        {expanded.seniority && (
          <div className="space-y-2.5">
            {['estágio', 'junior', 'pleno', 'senior', 'lead', 'gestor'].map(level => (
              <label
                key={level}
                className="
                  flex items-center gap-2.5 cursor-pointer
                  text-slate-700 dark:text-[#c4d0e0]
                "
              >
                <input
                  type="checkbox"
                  checked={(filters.seniority || []).includes(level)}
                  onChange={() => handleCheckboxChange('seniority', level)}
                  className="
                    rounded border-slate-300 cursor-pointer
                    accent-blue-600 dark:accent-[#FF6B00]
                  "
                />
                <span className="text-sm capitalize">{level}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Faixa Salarial */}
      <div className="mb-6 pb-6 border-b border-slate-200 dark:border-[#2a3245]">
        <button
          onClick={() => toggleExpand('salary')}
          className="
            flex items-center justify-between w-full text-sm font-semibold mb-3
            transition-smooth
            text-slate-900 dark:text-white
            hover:text-blue-600 dark:hover:text-[#FF6B00]
            dark:font-display dark:uppercase dark:text-xs
          "
        >
          Faixa Salarial
          <span className="
            text-slate-400 dark:text-[#6a7b8d]
          ">
            {expanded.salary ? '−' : '+'}
          </span>
        </button>
        {expanded.salary && (
          <div className="space-y-4">
            <div>
              <input
                type="range"
                min="0"
                max="50000"
                step="1000"
                value={filters.salaryRange?.[1] || 50000}
                onChange={(e) => handleRangeChange([0, parseInt(e.target.value)])}
                className="
                  w-full
                  accent-blue-600 dark:accent-[#FF6B00]
                "
              />
              <div className="
                flex justify-between text-xs font-medium mt-2
                text-slate-600 dark:text-[#8892a4]
              ">
                <span>R$ 0</span>
                <span>R$ {((filters.salaryRange?.[1] || 50000) / 1000).toFixed(0)}k</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Data de Publicação */}
      <div className="mb-6 pb-6 border-b border-slate-200 dark:border-[#2a3245]">
        <button
          onClick={() => toggleExpand('time')}
          className="
            flex items-center justify-between w-full text-sm font-semibold mb-3
            transition-smooth
            text-slate-900 dark:text-white
            hover:text-blue-600 dark:hover:text-[#FF6B00]
            dark:font-display dark:uppercase dark:text-xs
          "
        >
          Data de Publicação
          <span className="
            text-slate-400 dark:text-[#6a7b8d]
          ">
            {expanded.time ? '−' : '+'}
          </span>
        </button>
        {expanded.time && (
          <div className="space-y-2.5">
            {['24h', 'semana', 'mês', 'qualquer'].map(time => (
              <label
                key={time}
                className="
                  flex items-center gap-2.5 cursor-pointer
                  text-slate-700 dark:text-[#c4d0e0]
                "
              >
                <input
                  type="radio"
                  name="timeFilter"
                  value={time}
                  checked={filters.timeRange === time}
                  onChange={() => handleSelectChange('timeRange', time)}
                  className="
                    cursor-pointer
                    accent-blue-600 dark:accent-[#FF6B00]
                  "
                />
                <span className="text-sm">
                  {time === '24h' ? 'Últimas 24h' : time === 'semana' ? 'Última semana' : time === 'mês' ? 'Último mês' : 'Qualquer data'}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Tipo de Contrato */}
      <div className="mb-6">
        <button
          onClick={() => toggleExpand('contract')}
          className="
            flex items-center justify-between w-full text-sm font-semibold mb-3
            transition-smooth
            text-slate-900 dark:text-white
            hover:text-blue-600 dark:hover:text-[#FF6B00]
            dark:font-display dark:uppercase dark:text-xs
          "
        >
          Tipo de Contrato
          <span className="
            text-slate-400 dark:text-[#6a7b8d]
          ">
            {expanded.contract ? '−' : '+'}
          </span>
        </button>
        {expanded.contract && (
          <div className="space-y-2.5">
            {['CLT', 'PJ', 'Freelance', 'Estágio'].map(type => (
              <label
                key={type}
                className="
                  flex items-center gap-2.5 cursor-pointer
                  text-slate-700 dark:text-[#c4d0e0]
                "
              >
                <input
                  type="checkbox"
                  checked={(filters.contractType || []).includes(type)}
                  onChange={() => handleCheckboxChange('contractType', type)}
                  className="
                    rounded border-slate-300 cursor-pointer
                    accent-blue-600 dark:accent-[#FF6B00]
                  "
                />
                <span className="text-sm">{type}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Botão Limpar */}
      <button
        onClick={onReset}
        className="
          w-full px-4 py-2.5 rounded-lg text-sm font-medium
          transition-smooth
          bg-slate-200 dark:bg-[#2a3245]
          hover:bg-slate-300 dark:hover:bg-[#3a4457]
          text-slate-900 dark:text-white
          dark:font-display dark:uppercase dark:text-xs
        "
      >
        Limpar Filtros
      </button>
    </div>
  );
};
