// Schedule Analytics for CampWise Dashboard

import type { Database } from '@/lib/types/database';

type Session = Database['public']['Tables']['sessions']['Row'];
type Group = Database['public']['Tables']['groups']['Row'];
type Activity = Database['public']['Tables']['activities']['Row'];
type Facility = Database['public']['Tables']['facilities']['Row'];
type ScheduleSlot = Database['public']['Tables']['schedule_slots']['Row'];
type Staff = Database['public']['Tables']['staff']['Row'];

export interface ScheduleAnalytics {
  overview: OverviewStats;
  activityDistribution: ActivityDistribution[];
  facilityUtilization: FacilityUtilization[];
  groupStats: GroupStats[];
  dailyStats: DailyStats[];
  completionRate: number;
}

export interface OverviewStats {
  totalSlots: number;
  filledSlots: number;
  emptySlots: number;
  totalGroups: number;
  totalActivities: number;
  totalFacilities: number;
  totalStaff: number;
  sessionDays: number;
  averageSlotsPerDay: number;
}

export interface ActivityDistribution {
  activityId: string;
  activityName: string;
  color: string;
  count: number;
  percentage: number;
  totalMinutes: number;
}

export interface FacilityUtilization {
  facilityId: string;
  facilityName: string;
  totalSlots: number;
  usedSlots: number;
  utilizationRate: number;
  topActivities: { name: string; count: number }[];
}

export interface GroupStats {
  groupId: string;
  groupName: string;
  color: string;
  totalSlots: number;
  filledSlots: number;
  uniqueActivities: number;
  mostFrequentActivity: string;
}

export interface DailyStats {
  date: string;
  dayName: string;
  totalSlots: number;
  filledSlots: number;
  activityBreakdown: { name: string; count: number; color: string }[];
}

// Calculate comprehensive schedule analytics
export function calculateScheduleAnalytics(
  session: Session,
  groups: Group[],
  activities: Activity[],
  facilities: Facility[],
  slots: ScheduleSlot[],
  staff: Staff[]
): ScheduleAnalytics {
  const activityMap = new Map(activities.map(a => [a.id, a]));
  const facilityMap = new Map(facilities.map(f => [f.id, f]));
  const groupMap = new Map(groups.map(g => [g.id, g]));

  // Overview
  const filledSlots = slots.filter(s => s.activity_id).length;
  const sessionDays = calculateDays(session.start_date, session.end_date);

  const overview: OverviewStats = {
    totalSlots: slots.length,
    filledSlots,
    emptySlots: slots.length - filledSlots,
    totalGroups: groups.filter(g => g.is_active).length,
    totalActivities: activities.filter(a => a.is_active).length,
    totalFacilities: facilities.filter(f => f.is_active).length,
    totalStaff: staff.filter(s => s.is_active).length,
    sessionDays,
    averageSlotsPerDay: slots.length > 0 ? Math.round(slots.length / sessionDays) : 0
  };

  // Activity Distribution
  const activityCounts = new Map<string, number>();
  const activityMinutes = new Map<string, number>();

  for (const slot of slots) {
    if (!slot.activity_id) continue;
    activityCounts.set(slot.activity_id, (activityCounts.get(slot.activity_id) || 0) + 1);

    const minutes = calculateSlotMinutes(slot);
    activityMinutes.set(slot.activity_id, (activityMinutes.get(slot.activity_id) || 0) + minutes);
  }

  const activityDistribution: ActivityDistribution[] = Array.from(activityCounts.entries())
    .map(([activityId, count]) => {
      const activity = activityMap.get(activityId);
      return {
        activityId,
        activityName: activity?.name || 'Unknown',
        color: activity?.color || '#666',
        count,
        percentage: filledSlots > 0 ? Math.round((count / filledSlots) * 100) : 0,
        totalMinutes: activityMinutes.get(activityId) || 0
      };
    })
    .sort((a, b) => b.count - a.count);

  // Facility Utilization
  const facilitySlots = new Map<string, ScheduleSlot[]>();
  for (const slot of slots) {
    if (!slot.facility_id) continue;
    if (!facilitySlots.has(slot.facility_id)) {
      facilitySlots.set(slot.facility_id, []);
    }
    facilitySlots.get(slot.facility_id)!.push(slot);
  }

  const facilityUtilization: FacilityUtilization[] = facilities
    .filter(f => f.is_active)
    .map(facility => {
      const fSlots = facilitySlots.get(facility.id) || [];
      const totalPossibleSlots = slots.length / groups.length; // Rough estimate

      // Top activities for this facility
      const activityCountsInFacility = new Map<string, number>();
      for (const slot of fSlots) {
        if (slot.activity_id) {
          activityCountsInFacility.set(
            slot.activity_id,
            (activityCountsInFacility.get(slot.activity_id) || 0) + 1
          );
        }
      }

      const topActivities = Array.from(activityCountsInFacility.entries())
        .map(([id, count]) => ({
          name: activityMap.get(id)?.name || 'Unknown',
          count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      return {
        facilityId: facility.id,
        facilityName: facility.name,
        totalSlots: Math.round(totalPossibleSlots),
        usedSlots: fSlots.length,
        utilizationRate: totalPossibleSlots > 0
          ? Math.round((fSlots.length / totalPossibleSlots) * 100)
          : 0,
        topActivities
      };
    })
    .sort((a, b) => b.utilizationRate - a.utilizationRate);

  // Group Stats
  const groupStats: GroupStats[] = groups
    .filter(g => g.is_active)
    .map(group => {
      const groupSlots = slots.filter(s => s.group_id === group.id);
      const filledGroupSlots = groupSlots.filter(s => s.activity_id);

      // Count unique activities
      const uniqueActivities = new Set(
        filledGroupSlots.map(s => s.activity_id).filter(Boolean)
      ).size;

      // Find most frequent activity
      const activityFrequency = new Map<string, number>();
      for (const slot of filledGroupSlots) {
        if (slot.activity_id) {
          activityFrequency.set(
            slot.activity_id,
            (activityFrequency.get(slot.activity_id) || 0) + 1
          );
        }
      }

      let mostFrequentActivity = '-';
      let maxFreq = 0;
      for (const [actId, freq] of activityFrequency) {
        if (freq > maxFreq) {
          maxFreq = freq;
          mostFrequentActivity = activityMap.get(actId)?.name || actId;
        }
      }

      return {
        groupId: group.id,
        groupName: group.name,
        color: group.color || '#666',
        totalSlots: groupSlots.length,
        filledSlots: filledGroupSlots.length,
        uniqueActivities,
        mostFrequentActivity
      };
    });

  // Daily Stats
  const slotsByDate = new Map<string, ScheduleSlot[]>();
  for (const slot of slots) {
    if (!slotsByDate.has(slot.date)) {
      slotsByDate.set(slot.date, []);
    }
    slotsByDate.get(slot.date)!.push(slot);
  }

  const dailyStats: DailyStats[] = Array.from(slotsByDate.entries())
    .map(([date, daySlots]) => {
      const filledDaySlots = daySlots.filter(s => s.activity_id);

      // Activity breakdown
      const activityBreakdown = new Map<string, number>();
      for (const slot of filledDaySlots) {
        if (slot.activity_id) {
          activityBreakdown.set(
            slot.activity_id,
            (activityBreakdown.get(slot.activity_id) || 0) + 1
          );
        }
      }

      return {
        date,
        dayName: formatDayName(date),
        totalSlots: daySlots.length,
        filledSlots: filledDaySlots.length,
        activityBreakdown: Array.from(activityBreakdown.entries())
          .map(([id, count]) => ({
            name: activityMap.get(id)?.name || 'Unknown',
            count,
            color: activityMap.get(id)?.color || '#666'
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  // Completion rate
  const completionRate = slots.length > 0
    ? Math.round((filledSlots / slots.length) * 100)
    : 0;

  return {
    overview,
    activityDistribution,
    facilityUtilization,
    groupStats,
    dailyStats,
    completionRate
  };
}

// Helper functions
function calculateDays(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

function calculateSlotMinutes(slot: ScheduleSlot): number {
  const [startH, startM] = slot.start_time.slice(0, 5).split(':').map(Number);
  const [endH, endM] = slot.end_time.slice(0, 5).split(':').map(Number);
  return (endH * 60 + endM) - (startH * 60 + startM);
}

function formatDayName(date: string): string {
  const days = ['Κυρ', 'Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ'];
  return days[new Date(date).getDay()];
}

// Quick stats for dashboard
export function getQuickStats(analytics: ScheduleAnalytics): {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}[] {
  return [
    {
      label: 'Ολοκλήρωση',
      value: `${analytics.completionRate}%`,
      icon: '📊',
      color: analytics.completionRate >= 80 ? 'green' : analytics.completionRate >= 50 ? 'yellow' : 'red'
    },
    {
      label: 'Συνολικά Slots',
      value: analytics.overview.totalSlots,
      icon: '📅',
      color: 'blue'
    },
    {
      label: 'Ομάδες',
      value: analytics.overview.totalGroups,
      icon: '👥',
      color: 'purple'
    },
    {
      label: 'Δραστηριότητες',
      value: analytics.overview.totalActivities,
      icon: '🎯',
      color: 'orange'
    }
  ];
}
