import { AlertCircle, X } from 'lucide-react';

interface ValidationAlertProps {
  errors: string[];
  onClose: () => void;
}

export default function ValidationAlert({ errors, onClose }: ValidationAlertProps) {
  if (errors.length === 0) return null;

  return (
    <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-lg mb-6 relative animate-shake">
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-semibold text-red-800 mb-1">
            Por favor, complete los siguientes campos requeridos:
          </h3>
          <ul className="list-disc list-inside space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm text-red-700">
                {error}
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={onClose}
          className="ml-3 flex-shrink-0 text-red-600 hover:text-red-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
