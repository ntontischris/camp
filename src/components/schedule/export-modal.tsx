'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  generatePrintableHTML,
  openPrintPreview,
  type ExportData,
  type ExportOptions
} from '@/lib/export/pdf-generator';
import type { Database } from '@/lib/types/database';

type Group = Database['public']['Tables']['groups']['Row'];
type Facility = Database['public']['Tables']['facilities']['Row'];

interface ExportModalProps {
  data: ExportData;
  groups: Group[];
  facilities: Facility[];
  onClose: () => void;
}

export function ExportModal({ data, groups, facilities, onClose }: ExportModalProps) {
  const [exportType, setExportType] = useState<ExportOptions['type']>('master');
  const [selectedGroupId, setSelectedGroupId] = useState<string>(groups[0]?.id || '');
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(facilities[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState<string>(data.dateRange.start);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [includeNotes, setIncludeNotes] = useState(false);

  const handleExport = () => {
    const options: ExportOptions = {
      type: exportType,
      orientation,
      includeNotes,
      paperSize: 'a4'
    };

    if (exportType === 'group') {
      options.groupId = selectedGroupId;
    } else if (exportType === 'daily') {
      options.date = selectedDate;
    } else if (exportType === 'facility') {
      options.facilityId = selectedFacilityId;
    }

    const html = generatePrintableHTML(data, options);
    openPrintPreview(html);
  };

  // Generate date options
  const dates: string[] = [];
  const current = new Date(data.dateRange.start);
  const end = new Date(data.dateRange.end);
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Εξαγωγή Προγράμματος
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Export Type */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Τύπος Εξαγωγής
            </label>
            <div className="grid grid-cols-2 gap-3">
              <ExportTypeCard
                title="Master"
                description="Όλες οι ομάδες, όλες οι μέρες"
                icon="📋"
                selected={exportType === 'master'}
                onClick={() => setExportType('master')}
              />
              <ExportTypeCard
                title="Ανά Ομάδα"
                description="Μία ομάδα, όλες οι μέρες"
                icon="👥"
                selected={exportType === 'group'}
                onClick={() => setExportType('group')}
              />
              <ExportTypeCard
                title="Ημερήσιο"
                description="Όλες οι ομάδες, μία μέρα"
                icon="📅"
                selected={exportType === 'daily'}
                onClick={() => setExportType('daily')}
              />
              <ExportTypeCard
                title="Ανά Χώρο"
                description="Ένας χώρος, όλες οι μέρες"
                icon="🏟️"
                selected={exportType === 'facility'}
                onClick={() => setExportType('facility')}
              />
            </div>
          </div>

          {/* Type-specific options */}
          {exportType === 'group' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Επίλεξε Ομάδα
              </label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {exportType === 'daily' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Επίλεξε Ημέρα
              </label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                {dates.map((date) => (
                  <option key={date} value={date}>
                    {new Date(date).toLocaleDateString('el-GR', {
                      weekday: 'long',
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </option>
                ))}
              </select>
            </div>
          )}

          {exportType === 'facility' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Επίλεξε Χώρο
              </label>
              <select
                value={selectedFacilityId}
                onChange={(e) => setSelectedFacilityId(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                {facilities.map((facility) => (
                  <option key={facility.id} value={facility.id}>
                    {facility.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Orientation */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Προσανατολισμός
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="orientation"
                  checked={orientation === 'landscape'}
                  onChange={() => setOrientation('landscape')}
                  className="text-primary-600"
                />
                <span className="text-sm">Οριζόντιο (Landscape)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="orientation"
                  checked={orientation === 'portrait'}
                  onChange={() => setOrientation('portrait')}
                  className="text-primary-600"
                />
                <span className="text-sm">Κάθετο (Portrait)</span>
              </label>
            </div>
          </div>

          {/* Additional options */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeNotes}
                onChange={(e) => setIncludeNotes(e.target.checked)}
                className="rounded text-primary-600"
              />
              <span className="text-sm text-gray-700">Συμπερίληψη σημειώσεων</span>
            </label>
          </div>

          {/* Info */}
          <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            💡 Θα ανοίξει παράθυρο προεπισκόπησης εκτύπωσης. Μπορείς να εκτυπώσεις ή να αποθηκεύσεις ως PDF.
          </div>
        </div>

        <div className="border-t px-6 py-4 flex justify-end gap-2 bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Ακύρωση
          </Button>
          <Button onClick={handleExport}>
            🖨️ Εκτύπωση / PDF
          </Button>
        </div>
      </div>
    </div>
  );
}

function ExportTypeCard({
  title,
  description,
  icon,
  selected,
  onClick
}: {
  title: string;
  description: string;
  icon: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-lg border-2 text-left transition-all ${
        selected
          ? 'border-primary-500 bg-primary-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="text-xl mb-1">{icon}</div>
      <div className="font-medium text-gray-900 text-sm">{title}</div>
      <div className="text-xs text-gray-500">{description}</div>
    </button>
  );
}
