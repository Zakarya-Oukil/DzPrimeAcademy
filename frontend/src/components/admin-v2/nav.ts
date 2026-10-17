import { Permission } from '@/lib/rbac';

/** Admin sections. The ids are the old #hash ids, so existing links keep working. The old Landing content tab is not here: the redesigned landing does not read those settings. */
export type AdminTab =
  | 'home'
  | 'operations'
  | 'financial'
  | 'students'
  | 'teachers'
  | 'ambassadors'
  | 'staff'
  | 'courses'
  | 'sessions'
  | 'bundles'
  | 'footer'
  | 'card'
  | 'settings';

export const ADMIN_TAB_IDS: AdminTab[] = ['home', 'operations', 'financial', 'students', 'teachers', 'ambassadors', 'staff', 'courses', 'sessions', 'bundles', 'footer', 'card', 'settings'];

/** Same permission map as before. Home, the admin card and settings (own profile and password) are open to every staff role. */
export const ADMIN_PERMS: Partial<Record<AdminTab, Permission | Permission[]>> = {
  operations: 'operations.manage',
  financial: 'finance.manage',
  staff: 'staff.manage',
  teachers: ['users.manage', 'finance.manage'],
  students: 'users.manage',
  sessions: 'catalog.manage',
  ambassadors: ['users.manage', 'catalog.manage'],
  courses: 'catalog.manage',
  bundles: 'catalog.manage',
  footer: 'settings.manage',
};
