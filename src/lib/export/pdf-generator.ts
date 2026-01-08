// PDF Export System for CampWise
// Uses jsPDF for generation

import type { Database } from '@/lib/types/database';

type Session = Database['public']['Tables']['sessions']['Row'];
type Group = Database['public']['Tables']['groups']['Row'];
type Activity = Database['public']['Tables']['activities']['Row'];
type Facility = Database['public']['Tables']['facilities']['Row'];
type ScheduleSlot = Database['public']['Tables']['schedule_slots']['Row'];

export interface ExportData {
  session: Session;
  groups: Group[];
  activities: Activity[];
  facilities: Facility[];
  slots: ScheduleSlot[];
  dateRange: { start: string; end: string };
}

export interface ExportOptions {
  type: 'master' | 'group' | 'daily' | 'facility';
  groupId?: string;
  date?: string;
  facilityId?: string;
  includeStaff?: boolean;
  includeNotes?: boolean;
  orientation?: 'portrait' | 'landscape';
  paperSize?: 'a4' | 'letter';
}

// Generate HTML for print-friendly schedule view
export function generatePrintableHTML(data: ExportData, options: ExportOptions): string {
  const { session, groups, activities, facilities, slots } = data;
  const activityMap = new Map(activities.map(a => [a.id, a]));
  const facilityMap = new Map(facilities.map(f => [f.id, f]));
  const groupMap = new Map(groups.map(g => [g.id, g]));

  let html = `
<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="UTF-8">
  <title>Πρόγραμμα - ${session.name}</title>
  <style>
    @page {
      size: ${options.paperSize === 'letter' ? 'letter' : 'A4'} ${options.orientation || 'landscape'};
      margin: 1cm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 10px;
      color: #333;
      line-height: 1.3;
    }
    .header {
      text-align: center;
      margin-bottom: 15px;
      border-bottom: 2px solid #333;
      padding-bottom: 10px;
    }
    .header h1 {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .header .subtitle {
      font-size: 12px;
      color: #666;
    }
    .header .dates {
      font-size: 11px;
      margin-top: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
    }
    th, td {
      border: 1px solid #ccc;
      padding: 4px 6px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background-color: #f5f5f5;
      font-weight: bold;
      font-size: 9px;
      text-transform: uppercase;
    }
    .day-header {
      background-color: #e0e0e0;
      font-weight: bold;
      text-align: center;
    }
    .time-col {
      width: 60px;
      font-weight: bold;
      background-color: #fafafa;
    }
    .slot {
      min-height: 30px;
    }
    .activity-name {
      font-weight: bold;
      font-size: 9px;
    }
    .facility-name {
      font-size: 8px;
      color: #666;
    }
    .group-header {
      background-color: #333;
      color: white;
      text-align: center;
      padding: 8px;
      font-size: 12px;
      page-break-before: always;
    }
    .group-header:first-child {
      page-break-before: auto;
    }
    .footer {
      margin-top: 20px;
      text-align: center;
      font-size: 8px;
      color: #999;
    }
    .color-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 4px;
    }
    @media print {
      .no-print { display: none; }
    }
  </style>
</head>
<body>
`;

  // Header
  html += `
  <div class="header">
    <h1>${session.name}</h1>
    <div class="subtitle">Πρόγραμμα Δραστηριοτήτων</div>
    <div class="dates">
      ${formatDateGR(data.dateRange.start)} - ${formatDateGR(data.dateRange.end)}
    </div>
  </div>
`;

  switch (options.type) {
    case 'master':
      html += generateMasterSchedule(data, activityMap, facilityMap, groupMap);
      break;
    case 'group':
      html += generateGroupSchedule(data, options.groupId!, activityMap, facilityMap, groupMap);
      break;
    case 'daily':
      html += generateDailySchedule(data, options.date!, activityMap, facilityMap, groupMap);
      break;
    case 'facility':
      html += generateFacilitySchedule(data, options.facilityId!, activityMap, facilityMap, groupMap);
      break;
  }

  // Footer
  html += `
  <div class="footer">
    Δημιουργήθηκε από CampWise • ${new Date().toLocaleDateString('el-GR')}
  </div>
</body>
</html>
`;

  return html;
}

// Master schedule - all groups, all days
function generateMasterSchedule(
  data: ExportData,
  activityMap: Map<string, Activity>,
  facilityMap: Map<string, Facility>,
  groupMap: Map<string, Group>
): string {
  const { groups, slots } = data;
  const dates = getDateRange(data.dateRange.start, data.dateRange.end);
  const timeSlots = getUniqueTimeSlots(slots);

  let html = '<table>';

  // Header row with days
  html += '<thead><tr><th class="time-col">Ώρα</th>';
  for (const date of dates) {
    html += `<th class="day-header" colspan="${groups.length}">${formatDayName(date)} ${formatDateShort(date)}</th>`;
  }
  html += '</tr>';

  // Sub-header with groups
  html += '<tr><th></th>';
  for (const date of dates) {
    for (const group of groups) {
      html += `<th><span class="color-dot" style="background-color: ${group.color || '#666'}"></span>${group.name}</th>`;
    }
  }
  html += '</tr></thead>';

  // Body
  html += '<tbody>';
  for (const timeSlot of timeSlots) {
    html += `<tr><td class="time-col">${timeSlot.start} - ${timeSlot.end}</td>`;

    for (const date of dates) {
      for (const group of groups) {
        const slot = slots.find(
          s => s.date === date &&
               s.group_id === group.id &&
               s.start_time.slice(0, 5) === timeSlot.start
        );

        if (slot && slot.activity_id) {
          const activity = activityMap.get(slot.activity_id);
          const facility = slot.facility_id ? facilityMap.get(slot.facility_id) : null;

          html += `<td class="slot" style="border-left: 3px solid ${activity?.color || '#666'}">`;
          html += `<div class="activity-name">${activity?.name || '-'}</div>`;
          if (facility) {
            html += `<div class="facility-name">${facility.name}</div>`;
          }
          html += '</td>';
        } else {
          html += '<td class="slot">-</td>';
        }
      }
    }
    html += '</tr>';
  }
  html += '</tbody></table>';

  return html;
}

// Group schedule - one group, all days
function generateGroupSchedule(
  data: ExportData,
  groupId: string,
  activityMap: Map<string, Activity>,
  facilityMap: Map<string, Facility>,
  groupMap: Map<string, Group>
): string {
  const group = groupMap.get(groupId);
  if (!group) return '<p>Η ομάδα δεν βρέθηκε</p>';

  const { slots } = data;
  const groupSlots = slots.filter(s => s.group_id === groupId);
  const dates = getDateRange(data.dateRange.start, data.dateRange.end);
  const timeSlots = getUniqueTimeSlots(slots);

  let html = `<div class="group-header" style="background-color: ${group.color || '#333'}">`;
  html += `Ομάδα: ${group.name}</div>`;

  html += '<table><thead><tr><th class="time-col">Ώρα</th>';
  for (const date of dates) {
    html += `<th>${formatDayName(date)}<br>${formatDateShort(date)}</th>`;
  }
  html += '</tr></thead><tbody>';

  for (const timeSlot of timeSlots) {
    html += `<tr><td class="time-col">${timeSlot.start} - ${timeSlot.end}</td>`;

    for (const date of dates) {
      const slot = groupSlots.find(
        s => s.date === date && s.start_time.slice(0, 5) === timeSlot.start
      );

      if (slot && slot.activity_id) {
        const activity = activityMap.get(slot.activity_id);
        const facility = slot.facility_id ? facilityMap.get(slot.facility_id) : null;

        html += `<td class="slot" style="background-color: ${activity?.color}20; border-left: 3px solid ${activity?.color || '#666'}">`;
        html += `<div class="activity-name">${activity?.name || '-'}</div>`;
        if (facility) {
          html += `<div class="facility-name">${facility.name}</div>`;
        }
        html += '</td>';
      } else {
        html += '<td class="slot">-</td>';
      }
    }
    html += '</tr>';
  }

  html += '</tbody></table>';
  return html;
}

// Daily schedule - all groups, one day
function generateDailySchedule(
  data: ExportData,
  date: string,
  activityMap: Map<string, Activity>,
  facilityMap: Map<string, Facility>,
  groupMap: Map<string, Group>
): string {
  const { groups, slots } = data;
  const daySlots = slots.filter(s => s.date === date);
  const timeSlots = getUniqueTimeSlots(daySlots);

  let html = `<h2 style="text-align: center; margin-bottom: 15px;">${formatDayName(date)} ${formatDateGR(date)}</h2>`;

  html += '<table><thead><tr><th class="time-col">Ώρα</th>';
  for (const group of groups) {
    html += `<th><span class="color-dot" style="background-color: ${group.color || '#666'}"></span>${group.name}</th>`;
  }
  html += '</tr></thead><tbody>';

  for (const timeSlot of timeSlots) {
    html += `<tr><td class="time-col">${timeSlot.start} - ${timeSlot.end}</td>`;

    for (const group of groups) {
      const slot = daySlots.find(
        s => s.group_id === group.id && s.start_time.slice(0, 5) === timeSlot.start
      );

      if (slot && slot.activity_id) {
        const activity = activityMap.get(slot.activity_id);
        const facility = slot.facility_id ? facilityMap.get(slot.facility_id) : null;

        html += `<td class="slot" style="border-left: 3px solid ${activity?.color || '#666'}">`;
        html += `<div class="activity-name">${activity?.name || '-'}</div>`;
        if (facility) {
          html += `<div class="facility-name">${facility.name}</div>`;
        }
        html += '</td>';
      } else {
        html += '<td class="slot">-</td>';
      }
    }
    html += '</tr>';
  }

  html += '</tbody></table>';
  return html;
}

// Facility schedule - one facility, all days
function generateFacilitySchedule(
  data: ExportData,
  facilityId: string,
  activityMap: Map<string, Activity>,
  facilityMap: Map<string, Facility>,
  groupMap: Map<string, Group>
): string {
  const facility = facilityMap.get(facilityId);
  if (!facility) return '<p>Η εγκατάσταση δεν βρέθηκε</p>';

  const { slots } = data;
  const facilitySlots = slots.filter(s => s.facility_id === facilityId);
  const dates = getDateRange(data.dateRange.start, data.dateRange.end);
  const timeSlots = getUniqueTimeSlots(slots);

  let html = `<div class="group-header">Χώρος: ${facility.name}</div>`;

  html += '<table><thead><tr><th class="time-col">Ώρα</th>';
  for (const date of dates) {
    html += `<th>${formatDayName(date)}<br>${formatDateShort(date)}</th>`;
  }
  html += '</tr></thead><tbody>';

  for (const timeSlot of timeSlots) {
    html += `<tr><td class="time-col">${timeSlot.start} - ${timeSlot.end}</td>`;

    for (const date of dates) {
      const slot = facilitySlots.find(
        s => s.date === date && s.start_time.slice(0, 5) === timeSlot.start
      );

      if (slot) {
        const activity = slot.activity_id ? activityMap.get(slot.activity_id) : null;
        const group = slot.group_id ? groupMap.get(slot.group_id) : null;

        html += `<td class="slot" style="border-left: 3px solid ${group?.color || '#666'}">`;
        html += `<div class="activity-name">${activity?.name || '-'}</div>`;
        if (group) {
          html += `<div class="facility-name">${group.name}</div>`;
        }
        html += '</td>';
      } else {
        html += '<td class="slot" style="background-color: #f5f5f5;">Διαθέσιμο</td>';
      }
    }
    html += '</tr>';
  }

  html += '</tbody></table>';
  return html;
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

function getUniqueTimeSlots(slots: ScheduleSlot[]): { start: string; end: string }[] {
  const timeMap = new Map<string, string>();

  for (const slot of slots) {
    const start = slot.start_time.slice(0, 5);
    const end = slot.end_time.slice(0, 5);
    timeMap.set(start, end);
  }

  return Array.from(timeMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([start, end]) => ({ start, end }));
}

function formatDateGR(date: string): string {
  return new Date(date).toLocaleDateString('el-GR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function formatDateShort(date: string): string {
  return new Date(date).toLocaleDateString('el-GR', {
    day: '2-digit',
    month: '2-digit'
  });
}

function formatDayName(date: string): string {
  const days = ['Κυρ', 'Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ'];
  return days[new Date(date).getDay()];
}

// Open print preview
export function openPrintPreview(html: string): void {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}
