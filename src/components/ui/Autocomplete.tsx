import { useState, useEffect, useRef, ReactNode, useMemo } from 'react';
import { Search, ChevronDown, Plus, Check } from 'lucide-react';

interface AutocompleteOption {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
}

interface AutocompleteProps {
  label?: string;
  value: string;
  onChange: (value: string, option?: AutocompleteOption) => void;
  options: AutocompleteOption[] | string[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  allowCreate?: boolean;
  onCreate?: (value: string) => void;
  loading?: boolean;
  icon?: ReactNode;
  disabled?: boolean;
}

export default function Autocomplete({
  label,
  value,
  onChange,
  options,
  placeholder = 'Buscar...',
  required,
  error,
  helperText,
  allowCreate,
  onCreate,
  loading,
  icon,
  disabled = false
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedOptions: AutocompleteOption[] = useMemo(() =>
    options.map(opt =>
      typeof opt === 'string' ? { value: opt, label: opt } : opt
    ),
    [options]
  );

  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const selectedLabel = useMemo(() => {
    if (!displayValue) return '';

    const selected = normalizedOptions.find(opt => opt.value === displayValue);

    return selected?.label || displayValue;
  }, [displayValue, normalizedOptions]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = normalizedOptions.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option: AutocompleteOption) => {
    setDisplayValue(option.value);
    onChange(option.value, option);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleCreate = () => {
    if (onCreate && searchTerm.trim()) {
      onCreate(searchTerm.trim());
      setSearchTerm('');
      setIsOpen(false);
    }
  };

  const showCreateOption = allowCreate && searchTerm && !filteredOptions.some(
    opt => opt.label.toLowerCase() === searchTerm.toLowerCase()
  );

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`
            w-full px-4 py-2.5 bg-white border rounded-lg
            transition-all flex items-center justify-between
            ${disabled ? 'cursor-not-allowed bg-slate-50 opacity-60' : 'cursor-pointer'}
            ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : error ? 'border-red-300' : 'border-slate-300'}
            ${icon ? 'pl-10' : ''}
          `}
        >
          {icon && (
            <div className="absolute left-3 text-slate-400">
              {icon}
            </div>
          )}
          <span className={selectedLabel ? 'text-slate-900' : 'text-slate-400'}>
            {selectedLabel || placeholder}
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-80 overflow-hidden">
            <div className="p-3 border-b border-slate-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  autoFocus
                />
              </div>
            </div>

            <div className="overflow-y-auto max-h-60">
              {loading ? (
                <div className="p-4 text-center text-sm text-slate-500">
                  Cargando...
                </div>
              ) : filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelect(option);
                    }}
                    type="button"
                    className={`
                      w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors
                      flex items-center gap-3 border-b border-slate-100 last:border-0
                      ${option.value === value ? 'bg-blue-50' : ''}
                    `}
                  >
                    {option.icon && (
                      <div className="flex-shrink-0 text-slate-400">
                        {option.icon}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {option.label}
                        </p>
                        {option.value === value && (
                          <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        )}
                      </div>
                      {option.description && (
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {option.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-slate-500">
                  No se encontraron resultados
                </div>
              )}

              {showCreateOption && onCreate && (
                <button
                  onClick={handleCreate}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 border-t border-slate-200 text-blue-600"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Crear "{searchTerm}"
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1.5 text-sm text-red-600">{error}</p>
      )}

      {helperText && !error && (
        <p className="mt-1.5 text-sm text-slate-500">{helperText}</p>
      )}
    </div>
  );
}
