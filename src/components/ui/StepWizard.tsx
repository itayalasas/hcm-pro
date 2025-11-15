import { ReactNode } from 'react';
import { Check } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  description?: string;
}

interface StepWizardProps {
  steps: Step[];
  currentStep: number;
  children: ReactNode;
  onStepClick?: (stepIndex: number) => void;
}

export default function StepWizard({ steps, currentStep, children, onStepClick }: StepWizardProps) {
  return (
    <div className="space-y-8">
      <div className="relative">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isClickable = onStepClick && index <= currentStep;

            return (
              <div key={step.id} className="flex-1 relative">
                {index !== 0 && (
                  <div
                    className={`absolute top-5 right-1/2 h-0.5 w-full transition-colors ${
                      isCompleted ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                    style={{ right: '50%', left: '-50%' }}
                  />
                )}

                <button
                  onClick={() => isClickable && onStepClick(index)}
                  disabled={!isClickable}
                  className={`relative flex flex-col items-center group ${
                    isClickable ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-blue-600 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                        : 'bg-slate-100 text-slate-400'
                    } ${isClickable ? 'group-hover:ring-4 group-hover:ring-blue-50' : ''}`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>

                  <div className="mt-3 text-center">
                    <p
                      className={`text-sm font-medium transition-colors ${
                        isCurrent ? 'text-blue-600' : isCompleted ? 'text-slate-900' : 'text-slate-400'
                      }`}
                    >
                      {step.title}
                    </p>
                    {step.description && (
                      <p className="text-xs text-slate-500 mt-1 hidden sm:block">{step.description}</p>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-8">
        {children}
      </div>
    </div>
  );
}
