'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Step {
  title: string;
  description: string;
  isCompleted?: boolean;
}

interface PageHeaderProps {
  title: string;
  description: string;
  icon?: string;
  helpText?: string;
  steps?: Step[];
  tips?: string[];
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  icon,
  helpText,
  steps,
  tips,
  children,
}: PageHeaderProps) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="mb-8">
      {/* Main Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {icon && <span className="text-3xl">{icon}</span>}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-gray-600 mt-1">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {helpText && (
            <button
              onClick={() => setShowHelp(!showHelp)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors',
                showHelp
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              <span>❓</span>
              <span>{showHelp ? 'Κλείσιμο βοήθειας' : 'Βοήθεια'}</span>
            </button>
          )}
          {children}
        </div>
      </div>

      {/* Help Panel */}
      {showHelp && helpText && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 mb-2">Πώς λειτουργεί;</h3>
              <p className="text-blue-800 text-sm whitespace-pre-line">{helpText}</p>

              {/* Steps */}
              {steps && steps.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-blue-900 mb-2">Βήματα:</h4>
                  <ol className="space-y-2">
                    {steps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className={cn(
                          'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                          step.isCompleted
                            ? 'bg-green-500 text-white'
                            : 'bg-blue-200 text-blue-800'
                        )}>
                          {step.isCompleted ? '✓' : idx + 1}
                        </span>
                        <div>
                          <span className="font-medium text-blue-900">{step.title}</span>
                          <p className="text-blue-700">{step.description}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Tips */}
              {tips && tips.length > 0 && (
                <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-1 text-sm">💡 Συμβουλές:</h4>
                  <ul className="space-y-1">
                    {tips.map((tip, idx) => (
                      <li key={idx} className="text-blue-800 text-sm flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface FormSectionProps {
  title: string;
  description?: string;
  icon?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FormSection({ title, description, icon, required, children }: FormSectionProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          {icon && <span className="text-lg">{icon}</span>}
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {required && (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
              Υποχρεωτικό
            </span>
          )}
        </div>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

interface FieldHelpProps {
  text: string;
  example?: string;
}

export function FieldHelp({ text, example }: FieldHelpProps) {
  return (
    <div className="mt-1.5 text-xs text-gray-500">
      <span>{text}</span>
      {example && (
        <span className="block text-gray-400 mt-0.5">
          π.χ. {example}
        </span>
      )}
    </div>
  );
}

interface InfoBoxProps {
  type?: 'info' | 'warning' | 'success' | 'tip';
  title?: string;
  children: React.ReactNode;
}

export function InfoBox({ type = 'info', title, children }: InfoBoxProps) {
  const styles = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'ℹ️',
      title: 'text-blue-900',
      text: 'text-blue-800',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: '⚠️',
      title: 'text-yellow-900',
      text: 'text-yellow-800',
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: '✅',
      title: 'text-green-900',
      text: 'text-green-800',
    },
    tip: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      icon: '💡',
      title: 'text-purple-900',
      text: 'text-purple-800',
    },
  };

  const s = styles[type];

  return (
    <div className={cn('p-4 rounded-lg border', s.bg, s.border)}>
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0">{s.icon}</span>
        <div>
          {title && <h4 className={cn('font-medium mb-1', s.title)}>{title}</h4>}
          <div className={cn('text-sm', s.text)}>{children}</div>
        </div>
      </div>
    </div>
  );
}

interface SetupProgressProps {
  steps: {
    name: string;
    href: string;
    completed: boolean;
    current?: boolean;
  }[];
}

export function SetupProgress({ steps }: SetupProgressProps) {
  const completedCount = steps.filter(s => s.completed).length;
  const progress = (completedCount / steps.length) * 100;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">Πρόοδος Ρύθμισης</h3>
        <span className="text-sm text-gray-500">
          {completedCount} / {steps.length} ολοκληρώθηκαν
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-gray-200 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-green-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => (
          <a
            key={idx}
            href={step.href}
            className={cn(
              'flex flex-col items-center text-center group',
              step.current && 'scale-110'
            )}
          >
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-1 transition-colors',
              step.completed
                ? 'bg-green-500 text-white'
                : step.current
                  ? 'bg-blue-500 text-white ring-4 ring-blue-100'
                  : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300'
            )}>
              {step.completed ? '✓' : idx + 1}
            </div>
            <span className={cn(
              'text-xs',
              step.current ? 'text-blue-600 font-medium' : 'text-gray-500'
            )}>
              {step.name}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
