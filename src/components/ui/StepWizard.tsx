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
      <div className="relative px-4">
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200"
             style={{ marginLeft: '2rem', marginRight: '2rem' }} />

        <div className="relative flex items-start justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isClickable = onStepClick && index <= currentStep;

            return (
              <div key={step.id} className="flex flex-col items-center" style={{ flex: '0 0 auto', width: `${100 / steps.length}%` }}>
                {index !== 0 && (
                  <div
                    className={`absolute top-5 h-0.5 transition-colors ${
                      isCompleted ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                    style={{
                      left: `${(index - 1) * (100 / steps.length) + (50 / steps.length)}%`,
                      width: `${100 / steps.length}%`
                    }}
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
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all z-10 ${
                      isCompleted
                        ? 'bg-blue-600 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                        : 'bg-white border-2 border-slate-200 text-slate-400'
                    } ${isClickable ? 'group-hover:ring-4 group-hover:ring-blue-50' : ''}`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>

                  <div className="mt-3 text-center max-w-[120px]">
                    <p
                      className={`text-xs font-medium transition-colors leading-tight ${
                        isCurrent ? 'text-blue-600' : isCompleted ? 'text-slate-900' : 'text-slate-400'
                      }`}
                    >
                      {step.title}
                    </p>
                    {step.description && (
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{step.description}</p>
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
