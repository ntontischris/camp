'use client';

import { useState } from 'react';
import type { Conflict } from '@/lib/scheduling/conflicts';

interface ConflictIndicatorProps {
  conflicts: Conflict[];
  size?: 'sm' | 'md' | 'lg';
}

export function ConflictIndicator({ conflicts, size = 'md' }: ConflictIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (conflicts.length === 0) return null;

  const hasCritical = conflicts.some(c => c.severity === 'critical');
  const hasWarning = conflicts.some(c => c.severity === 'warning');

  const sizeClasses = {
    sm: 'w-3 h-3 text-xs',
    md: 'w-4 h-4 text-xs',
    lg: 'w-5 h-5 text-sm'
  };

  const bgColor = hasCritical
    ? 'bg-red-500'
    : hasWarning
    ? 'bg-yellow-500'
    : 'bg-blue-500';

  return (
    <div className="relative inline-block">
      <div
        className={`${sizeClasses[size]} ${bgColor} rounded-full flex items-center justify-center text-white font-bold cursor-pointer animate-pulse`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {conflicts.length > 9 ? '!' : conflicts.length}
      </div>

      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
          <div className="font-medium mb-2">
            {conflicts.length} {conflicts.length === 1 ? 'Πρόβλημα' : 'Προβλήματα'}
          </div>
          <ul className="space-y-1">
            {conflicts.slice(0, 3).map((conflict, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                  conflict.severity === 'critical'
                    ? 'bg-red-400'
                    : conflict.severity === 'warning'
                    ? 'bg-yellow-400'
                    : 'bg-blue-400'
                }`} />
                <span>{conflict.message}</span>
              </li>
            ))}
            {conflicts.length > 3 && (
              <li className="text-gray-400">
                ... και {conflicts.length - 3} ακόμα
              </li>
            )}
          </ul>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
            <div className="border-8 border-transparent border-t-gray-900" />
          </div>
        </div>
      )}
    </div>
  );
}

// Conflict summary badge for the header
interface ConflictSummaryProps {
  critical: number;
  warnings: number;
  info: number;
  onClick?: () => void;
}

export function ConflictSummary({ critical, warnings, info, onClick }: ConflictSummaryProps) {
  const total = critical + warnings + info;

  if (total === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm">
        <span className="w-2 h-2 bg-green-500 rounded-full" />
        Χωρίς προβλήματα
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors"
    >
      {critical > 0 && (
        <span className="flex items-center gap-1 text-red-600">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          {critical}
        </span>
      )}
      {warnings > 0 && (
        <span className="flex items-center gap-1 text-yellow-600">
          <span className="w-2 h-2 bg-yellow-500 rounded-full" />
          {warnings}
        </span>
      )}
      {info > 0 && (
        <span className="flex items-center gap-1 text-blue-600">
          <span className="w-2 h-2 bg-blue-500 rounded-full" />
          {info}
        </span>
      )}
    </button>
  );
}

// Conflict panel for detailed view
interface ConflictPanelProps {
  conflicts: Conflict[];
  onClose: () => void;
  onSlotClick?: (slotId: string) => void;
}

export function ConflictPanel({ conflicts, onClose, onSlotClick }: ConflictPanelProps) {
  const criticalConflicts = conflicts.filter(c => c.severity === 'critical');
  const warningConflicts = conflicts.filter(c => c.severity === 'warning');
  const infoConflicts = conflicts.filter(c => c.severity === 'info');

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl z-40 flex flex-col">
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          Προβλήματα Προγράμματος ({conflicts.length})
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {criticalConflicts.length > 0 && (
          <ConflictSection
            title="Κρίσιμα"
            conflicts={criticalConflicts}
            bgColor="bg-red-50"
            borderColor="border-red-200"
            dotColor="bg-red-500"
            onSlotClick={onSlotClick}
          />
        )}

        {warningConflicts.length > 0 && (
          <ConflictSection
            title="Προειδοποιήσεις"
            conflicts={warningConflicts}
            bgColor="bg-yellow-50"
            borderColor="border-yellow-200"
            dotColor="bg-yellow-500"
            onSlotClick={onSlotClick}
          />
        )}

        {infoConflicts.length > 0 && (
          <ConflictSection
            title="Πληροφορίες"
            conflicts={infoConflicts}
            bgColor="bg-blue-50"
            borderColor="border-blue-200"
            dotColor="bg-blue-500"
            onSlotClick={onSlotClick}
          />
        )}

        {conflicts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">✅</div>
            <div>Δεν υπάρχουν προβλήματα!</div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConflictSection({
  title,
  conflicts,
  bgColor,
  borderColor,
  dotColor,
  onSlotClick
}: {
  title: string;
  conflicts: Conflict[];
  bgColor: string;
  borderColor: string;
  dotColor: string;
  onSlotClick?: (slotId: string) => void;
}) {
  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-2">
        {title} ({conflicts.length})
      </h4>
      <div className="space-y-2">
        {conflicts.map((conflict) => (
          <div
            key={conflict.id}
            className={`${bgColor} border ${borderColor} rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow`}
            onClick={() => onSlotClick?.(conflict.affectedSlots[0])}
          >
            <div className="flex items-start gap-2">
              <span className={`mt-1 w-2 h-2 rounded-full ${dotColor} flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm">
                  {conflict.message}
                </div>
                <div className="text-xs text-gray-600 mt-0.5">
                  {conflict.description}
                </div>
                {conflict.suggestion && (
                  <div className="text-xs text-gray-500 mt-1 italic">
                    💡 {conflict.suggestion}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
