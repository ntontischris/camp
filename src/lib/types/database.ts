// Database Types - Generated from Supabase
// To regenerate: npm run generate:types

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Enums
export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise'
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing'
export type OrganizationRole = 'owner' | 'admin' | 'manager' | 'instructor' | 'viewer'
export type SessionStatus = 'draft' | 'planning' | 'active' | 'completed' | 'cancelled'
export type StaffRole = 'instructor' | 'supervisor' | 'coordinator' | 'support'
export type SlotType = 'activity' | 'meal' | 'break' | 'rest' | 'free' | 'assembly' | 'transition'
export type ScheduleStatus = 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled'
export type GenerationMethod = 'manual' | 'auto_generated' | 'template' | 'copy'
export type StaffAssignmentRole = 'lead' | 'assistant' | 'supervisor'
export type GenderType = 'mixed' | 'male' | 'female'
export type DayType = 'regular' | 'half_day' | 'theme_day' | 'field_trip' | 'event' | 'holiday'
export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'very_hot' | 'very_cold'
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'all_day'
export type ConstraintType =
  | 'time_restriction'
  | 'sequence'
  | 'daily_limit'
  | 'daily_minimum'
  | 'consecutive_limit'
  | 'staff_limit'
  | 'weather_substitute'
  | 'facility_exclusive'
  | 'gap_required'
  | 'group_separation'
export type FrequencyType = 'per_day' | 'per_week' | 'per_session'
export type AvailabilityType = 'regular' | 'vacation' | 'sick' | 'training'
export type ViolationType = 'hard_violation' | 'soft_violation' | 'warning'
export type TemplateType = 'full_session' | 'constraints' | 'schedule_week' | 'schedule_day'
export type GenerationRunStatus = 'running' | 'completed' | 'failed' | 'cancelled'

// Database Tables
export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          logo_url: string | null
          contact_email: string | null
          contact_phone: string | null
          address: string | null
          city: string | null
          country: string | null
          timezone: string | null
          subscription_tier: SubscriptionTier
          subscription_status: SubscriptionStatus
          trial_ends_at: string | null
          subscription_started_at: string | null
          settings: Json
          metadata: Json
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          logo_url?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          timezone?: string | null
          subscription_tier?: SubscriptionTier
          subscription_status?: SubscriptionStatus
          trial_ends_at?: string | null
          subscription_started_at?: string | null
          settings?: Json
          metadata?: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          logo_url?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          timezone?: string | null
          subscription_tier?: SubscriptionTier
          subscription_status?: SubscriptionStatus
          trial_ends_at?: string | null
          subscription_started_at?: string | null
          settings?: Json
          metadata?: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string | null
          phone: string | null
          preferred_language: string | null
          last_login_at: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id: string
          email: string
          full_name: string
          avatar_url?: string | null
          phone?: string | null
          preferred_language?: string | null
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          avatar_url?: string | null
          phone?: string | null
          preferred_language?: string | null
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: OrganizationRole
          permissions: Json
          invited_by: string | null
          invited_at: string
          accepted_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role?: OrganizationRole
          permissions?: Json
          invited_by?: string | null
          invited_at?: string
          accepted_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role?: OrganizationRole
          permissions?: Json
          invited_by?: string | null
          invited_at?: string
          accepted_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          start_date: string
          end_date: string
          status: SessionStatus
          max_campers: number | null
          current_campers: number
          settings: Json
          created_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          start_date: string
          end_date: string
          status?: SessionStatus
          max_campers?: number | null
          current_campers?: number
          settings?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          start_date?: string
          end_date?: string
          status?: SessionStatus
          max_campers?: number | null
          current_campers?: number
          settings?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      activities: {
        Row: {
          id: string
          organization_id: string
          name: string
          code: string | null
          description: string | null
          color: string | null
          icon: string | null
          duration_minutes: number
          setup_minutes: number
          cleanup_minutes: number
          min_participants: number | null
          max_participants: number | null
          min_age: number | null
          max_age: number | null
          required_staff_count: number
          weather_dependent: boolean
          is_active: boolean
          sort_order: number
          metadata: Json
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          code?: string | null
          description?: string | null
          color?: string | null
          icon?: string | null
          duration_minutes: number
          setup_minutes?: number
          cleanup_minutes?: number
          min_participants?: number | null
          max_participants?: number | null
          min_age?: number | null
          max_age?: number | null
          required_staff_count?: number
          weather_dependent?: boolean
          is_active?: boolean
          sort_order?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          code?: string | null
          description?: string | null
          color?: string | null
          icon?: string | null
          duration_minutes?: number
          setup_minutes?: number
          cleanup_minutes?: number
          min_participants?: number | null
          max_participants?: number | null
          min_age?: number | null
          max_age?: number | null
          required_staff_count?: number
          weather_dependent?: boolean
          is_active?: boolean
          sort_order?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      facilities: {
        Row: {
          id: string
          organization_id: string
          name: string
          code: string | null
          description: string | null
          capacity: number | null
          location: string | null
          indoor: boolean
          is_active: boolean
          sort_order: number
          metadata: Json
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          code?: string | null
          description?: string | null
          capacity?: number | null
          location?: string | null
          indoor?: boolean
          is_active?: boolean
          sort_order?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          code?: string | null
          description?: string | null
          capacity?: number | null
          location?: string | null
          indoor?: boolean
          is_active?: boolean
          sort_order?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      staff: {
        Row: {
          id: string
          organization_id: string
          user_id: string | null
          first_name: string
          last_name: string
          email: string | null
          phone: string | null
          employee_code: string | null
          role: string | null
          date_of_birth: string | null
          hire_date: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          is_active: boolean
          metadata: Json
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          user_id?: string | null
          first_name: string
          last_name: string
          email?: string | null
          phone?: string | null
          employee_code?: string | null
          role?: string | null
          date_of_birth?: string | null
          hire_date?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          is_active?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string | null
          first_name?: string
          last_name?: string
          email?: string | null
          phone?: string | null
          employee_code?: string | null
          role?: string | null
          date_of_birth?: string | null
          hire_date?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          is_active?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      groups: {
        Row: {
          id: string
          session_id: string
          name: string
          code: string | null
          description: string | null
          color: string | null
          age_min: number | null
          age_max: number | null
          capacity: number | null
          current_count: number
          gender: GenderType | null
          cabin_location: string | null
          primary_supervisor_id: string | null
          is_active: boolean
          sort_order: number
          metadata: Json
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          session_id: string
          name: string
          code?: string | null
          description?: string | null
          color?: string | null
          age_min?: number | null
          age_max?: number | null
          capacity?: number | null
          current_count?: number
          gender?: GenderType | null
          cabin_location?: string | null
          primary_supervisor_id?: string | null
          is_active?: boolean
          sort_order?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          name?: string
          code?: string | null
          description?: string | null
          color?: string | null
          age_min?: number | null
          age_max?: number | null
          capacity?: number | null
          current_count?: number
          gender?: GenderType | null
          cabin_location?: string | null
          primary_supervisor_id?: string | null
          is_active?: boolean
          sort_order?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      day_templates: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          is_default: boolean
          total_activity_slots: number
          is_active: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          is_default?: boolean
          total_activity_slots?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          is_default?: boolean
          total_activity_slots?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      day_template_slots: {
        Row: {
          id: string
          day_template_id: string
          name: string | null
          start_time: string
          end_time: string
          slot_type: SlotType
          is_schedulable: boolean
          sort_order: number
          default_activity_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          day_template_id: string
          name?: string | null
          start_time: string
          end_time: string
          slot_type: SlotType
          is_schedulable?: boolean
          sort_order?: number
          default_activity_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          day_template_id?: string
          name?: string | null
          start_time?: string
          end_time?: string
          slot_type?: SlotType
          is_schedulable?: boolean
          sort_order?: number
          default_activity_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
      schedule_slots: {
        Row: {
          id: string
          session_id: string
          date: string
          day_template_slot_id: string | null
          start_time: string
          end_time: string
          group_id: string | null
          activity_id: string | null
          facility_id: string | null
          status: ScheduleStatus
          generation_method: GenerationMethod
          generation_run_id: string | null
          is_locked: boolean
          original_activity_id: string | null
          substitution_reason: string | null
          notes: string | null
          metadata: Json
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          date: string
          day_template_slot_id?: string | null
          start_time: string
          end_time: string
          group_id?: string | null
          activity_id?: string | null
          facility_id?: string | null
          status?: ScheduleStatus
          generation_method?: GenerationMethod
          generation_run_id?: string | null
          is_locked?: boolean
          original_activity_id?: string | null
          substitution_reason?: string | null
          notes?: string | null
          metadata?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          date?: string
          day_template_slot_id?: string | null
          start_time?: string
          end_time?: string
          group_id?: string | null
          activity_id?: string | null
          facility_id?: string | null
          status?: ScheduleStatus
          generation_method?: GenerationMethod
          generation_run_id?: string | null
          is_locked?: boolean
          original_activity_id?: string | null
          substitution_reason?: string | null
          notes?: string | null
          metadata?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      constraints: {
        Row: {
          id: string
          session_id: string | null
          organization_id: string | null
          name: string
          description: string | null
          constraint_type: ConstraintType
          is_hard: boolean
          priority: number
          is_active: boolean
          scope: Json
          condition: Json
          action: Json
          error_message: string | null
          created_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          session_id?: string | null
          organization_id?: string | null
          name: string
          description?: string | null
          constraint_type: ConstraintType
          is_hard?: boolean
          priority?: number
          is_active?: boolean
          scope?: Json
          condition?: Json
          action?: Json
          error_message?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string | null
          organization_id?: string | null
          name?: string
          description?: string | null
          constraint_type?: ConstraintType
          is_hard?: boolean
          priority?: number
          is_active?: boolean
          scope?: Json
          condition?: Json
          action?: Json
          error_message?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_has_org_access: {
        Args: { org_id: string }
        Returns: boolean
      }
      user_org_role: {
        Args: { org_id: string }
        Returns: OrganizationRole | null
      }
    }
    Enums: {
      subscription_tier: SubscriptionTier
      subscription_status: SubscriptionStatus
      organization_role: OrganizationRole
      session_status: SessionStatus
      staff_role: StaffRole
      slot_type: SlotType
      schedule_status: ScheduleStatus
      generation_method: GenerationMethod
      staff_assignment_role: StaffAssignmentRole
      gender_type: GenderType
      day_type: DayType
      weather_condition: WeatherCondition
      time_of_day: TimeOfDay
      constraint_type: ConstraintType
      frequency_type: FrequencyType
      availability_type: AvailabilityType
      violation_type: ViolationType
      template_type: TemplateType
      generation_run_status: GenerationRunStatus
    }
  }
}
