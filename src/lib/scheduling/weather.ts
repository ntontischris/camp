// Weather System for CampWise
// Handles weather-based activity substitutions

import type { Database, WeatherCondition } from '@/lib/types/database';

type Activity = Database['public']['Tables']['activities']['Row'];
type ScheduleSlot = Database['public']['Tables']['schedule_slots']['Row'];
type Constraint = Database['public']['Tables']['constraints']['Row'];

export interface DayWeather {
  date: string;
  condition: WeatherCondition;
  temperature?: number;
  description?: string;
  source: 'manual' | 'api';
}

export interface WeatherSubstitution {
  slotId: string;
  originalActivityId: string;
  originalActivityName: string;
  substituteActivityId: string;
  substituteActivityName: string;
  reason: string;
}

export interface WeatherCheckResult {
  affectedSlots: ScheduleSlot[];
  substitutions: WeatherSubstitution[];
  warnings: string[];
}

// Weather condition labels in Greek
export const WEATHER_LABELS: Record<WeatherCondition, string> = {
  sunny: 'Ηλιοφάνεια',
  cloudy: 'Συννεφιά',
  rainy: 'Βροχή',
  stormy: 'Καταιγίδα',
  very_hot: 'Καύσωνας',
  very_cold: 'Έντονο Κρύο'
};

// Weather icons
export const WEATHER_ICONS: Record<WeatherCondition, string> = {
  sunny: '☀️',
  cloudy: '⛅',
  rainy: '🌧️',
  stormy: '⛈️',
  very_hot: '🥵',
  very_cold: '🥶'
};

// Check which conditions are considered "bad weather" for outdoor activities
export function isBadWeatherForOutdoor(condition: WeatherCondition): boolean {
  return ['rainy', 'stormy', 'very_hot', 'very_cold'].includes(condition);
}

// Check if an activity is affected by weather
export function isActivityAffectedByWeather(
  activity: Activity,
  weather: WeatherCondition
): boolean {
  if (!activity.weather_dependent) return false;
  return isBadWeatherForOutdoor(weather);
}

// Get affected slots for a given weather condition
export function getAffectedSlots(
  slots: ScheduleSlot[],
  activities: Activity[],
  weather: DayWeather
): ScheduleSlot[] {
  const activityMap = new Map(activities.map(a => [a.id, a]));

  return slots.filter(slot => {
    if (slot.date !== weather.date) return false;
    if (!slot.activity_id) return false;

    const activity = activityMap.get(slot.activity_id);
    if (!activity) return false;

    return isActivityAffectedByWeather(activity, weather.condition);
  });
}

// Find substitute activities from weather constraints
export function findSubstituteActivity(
  originalActivityId: string,
  constraints: Constraint[]
): string | null {
  // Look for weather_substitute constraints
  const weatherConstraints = constraints.filter(
    c => c.constraint_type === 'weather_substitute' && c.is_active
  );

  for (const constraint of weatherConstraints) {
    const condition = constraint.condition as {
      original_activity_id?: string;
      substitute_activity_id?: string;
    } | null;

    if (condition?.original_activity_id === originalActivityId) {
      return condition.substitute_activity_id || null;
    }
  }

  return null;
}

// Get suggested substitutions based on weather
export function getSuggestedSubstitutions(
  affectedSlots: ScheduleSlot[],
  activities: Activity[],
  constraints: Constraint[]
): WeatherSubstitution[] {
  const activityMap = new Map(activities.map(a => [a.id, a]));
  const substitutions: WeatherSubstitution[] = [];

  for (const slot of affectedSlots) {
    if (!slot.activity_id) continue;

    const originalActivity = activityMap.get(slot.activity_id);
    if (!originalActivity) continue;

    // Find substitute from constraints
    const substituteId = findSubstituteActivity(slot.activity_id, constraints);

    if (substituteId) {
      const substituteActivity = activityMap.get(substituteId);
      if (substituteActivity) {
        substitutions.push({
          slotId: slot.id,
          originalActivityId: slot.activity_id,
          originalActivityName: originalActivity.name,
          substituteActivityId: substituteId,
          substituteActivityName: substituteActivity.name,
          reason: 'Αντικατάσταση λόγω καιρού'
        });
      }
    } else {
      // Find any indoor activity as fallback
      const indoorActivities = activities.filter(
        a => a.is_active && !a.weather_dependent && a.id !== slot.activity_id
      );

      if (indoorActivities.length > 0) {
        const fallback = indoorActivities[0];
        substitutions.push({
          slotId: slot.id,
          originalActivityId: slot.activity_id,
          originalActivityName: originalActivity.name,
          substituteActivityId: fallback.id,
          substituteActivityName: fallback.name,
          reason: 'Εναλλακτική δραστηριότητα εσωτερικού χώρου'
        });
      }
    }
  }

  return substitutions;
}

// Full weather check for a session
export function checkWeatherImpact(
  slots: ScheduleSlot[],
  activities: Activity[],
  constraints: Constraint[],
  weatherData: DayWeather[]
): WeatherCheckResult {
  const affectedSlots: ScheduleSlot[] = [];
  const substitutions: WeatherSubstitution[] = [];
  const warnings: string[] = [];

  for (const weather of weatherData) {
    if (!isBadWeatherForOutdoor(weather.condition)) continue;

    const dayAffectedSlots = getAffectedSlots(slots, activities, weather);
    affectedSlots.push(...dayAffectedSlots);

    if (dayAffectedSlots.length > 0) {
      warnings.push(
        `${formatDateGR(weather.date)}: ${WEATHER_ICONS[weather.condition]} ${WEATHER_LABELS[weather.condition]} - ${dayAffectedSlots.length} δραστηριότητες επηρεάζονται`
      );

      const daySubstitutions = getSuggestedSubstitutions(
        dayAffectedSlots,
        activities,
        constraints
      );
      substitutions.push(...daySubstitutions);
    }
  }

  return {
    affectedSlots,
    substitutions,
    warnings
  };
}

// Apply weather substitutions to slots
export function applySubstitutions(
  substitutions: WeatherSubstitution[]
): { slotId: string; activityId: string; reason: string }[] {
  return substitutions.map(sub => ({
    slotId: sub.slotId,
    activityId: sub.substituteActivityId,
    reason: `Αντικατάσταση: ${sub.originalActivityName} → ${sub.substituteActivityName}`
  }));
}

// Helper function
function formatDateGR(date: string): string {
  return new Date(date).toLocaleDateString('el-GR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit'
  });
}

// Get weather summary for a date range
export function getWeatherSummary(weatherData: DayWeather[]): {
  goodDays: number;
  badDays: number;
  byCondition: Record<WeatherCondition, number>;
} {
  const byCondition: Record<WeatherCondition, number> = {
    sunny: 0,
    cloudy: 0,
    rainy: 0,
    stormy: 0,
    very_hot: 0,
    very_cold: 0
  };

  let goodDays = 0;
  let badDays = 0;

  for (const weather of weatherData) {
    byCondition[weather.condition]++;
    if (isBadWeatherForOutdoor(weather.condition)) {
      badDays++;
    } else {
      goodDays++;
    }
  }

  return { goodDays, badDays, byCondition };
}
