import { createClient } from '@/lib/supabase/server';

export interface ActivityInput {
  name: string;
  description?: string;
  duration_minutes?: number;
  min_participants?: number;
  max_participants?: number;
  min_age?: number;
  max_age?: number;
  required_staff?: number;
  weather_dependent?: boolean;
  allowed_weather?: string[];
  tags?: string[];
}

export interface FacilityInput {
  name: string;
  description?: string;
  capacity?: number;
  is_indoor?: boolean;
  location?: string;
  equipment?: string[];
  tags?: string[];
}

export interface StaffInput {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  role?: 'instructor' | 'supervisor' | 'coordinator' | 'support';
  certifications?: string[];
  specialties?: string[];
}

export interface TemplateSlotInput {
  name: string;
  start_time: string;
  end_time: string;
  slot_type: 'activity' | 'meal' | 'break' | 'rest' | 'free' | 'assembly';
  is_schedulable?: boolean;
}

export interface TemplateInput {
  name: string;
  description?: string;
  slots: TemplateSlotInput[];
}

export async function createActivities(
  organizationId: string,
  activities: ActivityInput[]
): Promise<{ success: boolean; created: number; error?: string }> {
  const supabase = await createClient();

  const activitiesToInsert = activities.map((activity, index) => ({
    organization_id: organizationId,
    name: activity.name,
    description: activity.description || null,
    duration_minutes: activity.duration_minutes || 45,
    min_participants: activity.min_participants || 1,
    max_participants: activity.max_participants || 30,
    min_age: activity.min_age || null,
    max_age: activity.max_age || null,
    required_staff_count: activity.required_staff || 1,
    weather_dependent: activity.weather_dependent || false,
    is_active: true,
    color: getColorForIndex(index),
  }));

  const { data, error } = await supabase
    .from('activities')
    .insert(activitiesToInsert)
    .select();

  if (error) {
    return { success: false, created: 0, error: error.message };
  }

  return { success: true, created: data?.length || 0 };
}

export async function createFacilities(
  organizationId: string,
  facilities: FacilityInput[]
): Promise<{ success: boolean; created: number; error?: string }> {
  const supabase = await createClient();

  const facilitiesToInsert = facilities.map((facility) => ({
    organization_id: organizationId,
    name: facility.name,
    description: facility.description || null,
    capacity: facility.capacity || 30,
    indoor: facility.is_indoor || false,
    location: facility.location || null,
    is_active: true,
  }));

  const { data, error } = await supabase
    .from('facilities')
    .insert(facilitiesToInsert)
    .select();

  if (error) {
    return { success: false, created: 0, error: error.message };
  }

  return { success: true, created: data?.length || 0 };
}

export async function createStaff(
  organizationId: string,
  staff: StaffInput[]
): Promise<{ success: boolean; created: number; error?: string }> {
  const supabase = await createClient();

  const staffToInsert = staff.map((member, index) => ({
    organization_id: organizationId,
    employee_code: `EMP-${Date.now()}-${index}`,
    first_name: member.first_name,
    last_name: member.last_name,
    email: member.email || null,
    phone: member.phone || null,
    role: member.role || 'instructor',
    is_active: true,
  }));

  const { data, error } = await supabase
    .from('staff')
    .insert(staffToInsert)
    .select();

  if (error) {
    return { success: false, created: 0, error: error.message };
  }

  return { success: true, created: data?.length || 0 };
}

export async function createDayTemplate(
  organizationId: string,
  template: TemplateInput
): Promise<{ success: boolean; templateId?: string; error?: string }> {
  const supabase = await createClient();

  // Create template
  const { data: templateData, error: templateError } = await supabase
    .from('day_templates')
    .insert({
      organization_id: organizationId,
      name: template.name,
      description: template.description || null,
      is_default: false,
    })
    .select()
    .single();

  if (templateError) {
    return { success: false, error: templateError.message };
  }

  // Create slots
  const slotsToInsert = template.slots.map((slot, index) => ({
    day_template_id: templateData.id,
    name: slot.name,
    start_time: slot.start_time,
    end_time: slot.end_time,
    slot_type: slot.slot_type,
    is_schedulable: slot.is_schedulable ?? (slot.slot_type === 'activity'),
    sort_order: index,
  }));

  const { error: slotsError } = await supabase
    .from('day_template_slots')
    .insert(slotsToInsert);

  if (slotsError) {
    return { success: false, error: slotsError.message };
  }

  return { success: true, templateId: templateData.id };
}

function getColorForIndex(index: number): string {
  const colors = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308',
    '#84CC16', '#22C55E', '#10B981', '#14B8A6',
    '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
  ];
  return colors[index % colors.length];
}
