'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  WEATHER_LABELS,
  WEATHER_ICONS,
  checkWeatherImpact,
  type DayWeather,
  type WeatherSubstitution
} from '@/lib/scheduling/weather';
import type { Database, WeatherCondition } from '@/lib/types/database';

type Activity = Database['public']['Tables']['activities']['Row'];
type ScheduleSlot = Database['public']['Tables']['schedule_slots']['Row'];
type Constraint = Database['public']['Tables']['constraints']['Row'];

interface WeatherPanelProps {
  dateRange: { start: string; end: string };
  slots: ScheduleSlot[];
  activities: Activity[];
  constraints: Constraint[];
  onApplySubstitutions: (substitutions: { slotId: string; activityId: string }[]) => Promise<void>;
  onClose: () => void;
}

const WEATHER_CONDITIONS: WeatherCondition[] = [
  'sunny', 'cloudy', 'rainy', 'stormy', 'very_hot', 'very_cold'
];

export function WeatherPanel({
  dateRange,
  slots,
  activities,
  constraints,
  onApplySubstitutions,
  onClose
}: WeatherPanelProps) {
  const [weatherData, setWeatherData] = useState<DayWeather[]>(() => {
    // Initialize with sunny weather for all days
    const dates = getDateRange(dateRange.start, dateRange.end);
    return dates.map(date => ({
      date,
      condition: 'sunny' as WeatherCondition,
      source: 'manual' as const
    }));
  });

  const [selectedSubstitutions, setSelectedSubstitutions] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState(false);

  // Check weather impact
  const impact = checkWeatherImpact(slots, activities, constraints, weatherData);

  const handleWeatherChange = (date: string, condition: WeatherCondition) => {
    setWeatherData(prev =>
      prev.map(w =>
        w.date === date ? { ...w, condition } : w
      )
    );
    // Reset selections when weather changes
    setSelectedSubstitutions(new Set());
  };

  const toggleSubstitution = (slotId: string) => {
    setSelectedSubstitutions(prev => {
      const next = new Set(prev);
      if (next.has(slotId)) {
        next.delete(slotId);
      } else {
        next.add(slotId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedSubstitutions(new Set(impact.substitutions.map(s => s.slotId)));
  };

  const selectNone = () => {
    setSelectedSubstitutions(new Set());
  };

  const handleApply = async () => {
    const toApply = impact.substitutions
      .filter(s => selectedSubstitutions.has(s.slotId))
      .map(s => ({
        slotId: s.slotId,
        activityId: s.substituteActivityId
      }));

    if (toApply.length === 0) return;

    setApplying(true);
    try {
      await onApplySubstitutions(toApply);
      onClose();
    } catch (error) {
      console.error('Error applying substitutions:', error);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            🌤️ Διαχείριση Καιρού
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Weather Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Καιρός ανά Ημέρα</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(120px, 1fr))` }}>
                {weatherData.map(weather => (
                  <div
                    key={weather.date}
                    className="border rounded-lg p-3 text-center"
                  >
                    <div className="text-xs text-gray-500 mb-1">
                      {formatDayName(weather.date)}
                    </div>
                    <div className="text-sm font-medium mb-2">
                      {formatDateShort(weather.date)}
                    </div>
                    <select
                      value={weather.condition}
                      onChange={(e) => handleWeatherChange(weather.date, e.target.value as WeatherCondition)}
                      className="w-full text-sm rounded border-gray-300 text-center"
                    >
                      {WEATHER_CONDITIONS.map(condition => (
                        <option key={condition} value={condition}>
                          {WEATHER_ICONS[condition]} {WEATHER_LABELS[condition]}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Impact Summary */}
          {impact.warnings.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-lg text-yellow-800">
                  ⚠️ Επηρεαζόμενες Δραστηριότητες ({impact.affectedSlots.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm text-yellow-700">
                  {impact.warnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Substitutions */}
          {impact.substitutions.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Προτεινόμενες Αντικαταστάσεις ({impact.substitutions.length})
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAll}>
                      Επιλογή Όλων
                    </Button>
                    <Button variant="outline" size="sm" onClick={selectNone}>
                      Καμία Επιλογή
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-auto">
                  {impact.substitutions.map(sub => (
                    <label
                      key={sub.slotId}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedSubstitutions.has(sub.slotId)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSubstitutions.has(sub.slotId)}
                        onChange={() => toggleSubstitution(sub.slotId)}
                        className="rounded text-primary-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-red-600 line-through">
                            {sub.originalActivityName}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="font-medium text-green-600">
                            {sub.substituteActivityName}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">{sub.reason}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {impact.affectedSlots.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">☀️</div>
              <div>Δεν υπάρχουν επηρεαζόμενες δραστηριότητες!</div>
              <div className="text-sm">Όλες οι δραστηριότητες είναι εντάξει με τον καιρό.</div>
            </div>
          )}
        </div>

        <div className="border-t px-6 py-4 flex justify-between bg-gray-50">
          <div className="text-sm text-gray-500">
            {selectedSubstitutions.size > 0 && (
              <span>{selectedSubstitutions.size} αντικαταστάσεις επιλεγμένες</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={applying}>
              Κλείσιμο
            </Button>
            {impact.substitutions.length > 0 && (
              <Button
                onClick={handleApply}
                disabled={applying || selectedSubstitutions.size === 0}
              >
                {applying ? 'Εφαρμογή...' : `Εφαρμογή (${selectedSubstitutions.size})`}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = new Date(start);
  const endDate = new Date(end);

  while (current <= endDate) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function formatDayName(date: string): string {
  const days = ['Κυρ', 'Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ'];
  return days[new Date(date).getDay()];
}

function formatDateShort(date: string): string {
  return new Date(date).toLocaleDateString('el-GR', {
    day: '2-digit',
    month: '2-digit'
  });
}
