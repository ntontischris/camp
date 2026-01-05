// App constants
export const APP_NAME = 'CampWise';
export const APP_DESCRIPTION = 'Intelligent Camp Scheduling Platform';

// Date/Time
export const TIMEZONE = 'Europe/Athens';
export const DATE_FORMAT = 'dd/MM/yyyy';
export const TIME_FORMAT = 'HH:mm';
export const DATETIME_FORMAT = 'dd/MM/yyyy HH:mm';

// Locale
export const LOCALE = 'el-GR';
export const WEEK_STARTS_ON = 1; // Monday

// Subscription tiers
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  BASIC: 'basic',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const;

// Organization roles
export const ORG_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MANAGER: 'manager',
  INSTRUCTOR: 'instructor',
  VIEWER: 'viewer',
} as const;

// Session status
export const SESSION_STATUS = {
  DRAFT: 'draft',
  PLANNING: 'planning',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// Slot types
export const SLOT_TYPES = {
  ACTIVITY: 'activity',
  MEAL: 'meal',
  BREAK: 'break',
  REST: 'rest',
  FREE: 'free',
  ASSEMBLY: 'assembly',
  TRANSITION: 'transition',
} as const;
