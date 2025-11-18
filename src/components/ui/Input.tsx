import { InputHTMLAttributes, forwardRef, useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  tooltip?: string;
  onValidate?: (value: string) => string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, tooltip, onValidate, className = '', ...props }, ref) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [internalError, setInternalError] = useState('');

    const displayError = error || internalError;

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (onValidate) {
        const validationError = onValidate(e.target.value);
        setInternalError(validationError);
      }
      if (props.onBlur) {
        props.onBlur(e);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (internalError) {
        setInternalError('');
      }
      if (props.onChange) {
        props.onChange(e);
      }
    };

    return (
      <div className="w-full">
        {label && (
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-medium text-slate-700">
              {label}
              {props.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {tooltip && (
              <div className="relative">
                <HelpCircle
                  className="w-4 h-4 text-slate-400 cursor-help"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                />
                {showTooltip && (
                  <div className="absolute left-0 top-6 z-50 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg shadow-lg">
                    {tooltip}
                    <div className="absolute -top-1 left-4 w-2 h-2 bg-slate-900 transform rotate-45"></div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            className={`
              w-full px-4 py-2.5 bg-white border rounded-lg text-slate-900 placeholder-slate-400
              transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
              ${icon ? 'pl-10' : ''}
              ${displayError ? 'border-red-300 focus:ring-red-500' : 'border-slate-300'}
              ${className}
            `}
            {...props}
            onBlur={handleBlur}
            onChange={handleChange}
          />
        </div>

        {displayError && (
          <p className="mt-1.5 text-sm text-red-600">{displayError}</p>
        )}

        {helperText && !displayError && (
          <p className="mt-1.5 text-sm text-slate-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
