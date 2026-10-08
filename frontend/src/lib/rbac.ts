import { Role, User } from '@/types';

export const ROLE_HIERARCHY: Record<Role, number> = {
  OWNER: 100,
  ADMIN: 90,
  MODERATOR: 70,
  AMBASSADOR: 50,
  TEACHER: 40,
  STUDENT_PAID: 20,
  STUDENT_FREE: 10,
};

export type AdminRoleType =
  | 'SUPER_ADMIN'
  | 'GENERAL_ADMIN'
  | 'HR_MANAGER'
  | 'COMMERCIAL'
  | 'HR_EMPLOYEE'
  | 'FINANCE'
  | 'ADMIN'
  | 'MODERATOR';

type RoleUser = { role: Role; adminRole?: string | null } | null | undefined;

// adminRole is only meaningful for staff accounts. A student, teacher or ambassador
// whose adminRole column holds a value must never gain staff powers from it.
const STAFF_BASE_ROLES: Role[] = ['OWNER', 'ADMIN', 'MODERATOR'];

export function effectiveAdminRole(user?: RoleUser): string | null {
  if (!user || !STAFF_BASE_ROLES.includes(user.role)) return null;
  return user.adminRole || null;
}

export function getUserHierarchyLevel(user?: RoleUser): number {
  if (!user) return 0;
  const ar = effectiveAdminRole(user);
  if (user.role === 'OWNER' || ar === 'SUPER_ADMIN') return 100;
  if (ar === 'GENERAL_ADMIN') return 95;
  if (ar === 'HR_MANAGER') return 85;
  if (ar === 'COMMERCIAL') return 80;
  if (ar === 'HR_EMPLOYEE') return 75;
  if (ar === 'FINANCE') return 65;
  if (user.role === 'ADMIN') return 65;
  if (user.role === 'MODERATOR' || ar === 'MODERATOR') return 60;
  if (user.role === 'AMBASSADOR') return 50;
  if (user.role === 'TEACHER') return 40;
  if (user.role === 'STUDENT_PAID') return 20;
  return 10; // STUDENT_FREE
}

export function isSuperAdmin(user?: RoleUser): boolean {
  if (!user) return false;
  return user.role === 'OWNER' || effectiveAdminRole(user) === 'SUPER_ADMIN';
}

export function isGeneralAdmin(user?: RoleUser): boolean {
  if (!user) return false;
  return isSuperAdmin(user) || effectiveAdminRole(user) === 'GENERAL_ADMIN';
}

export function isHRManager(user?: RoleUser): boolean {
  if (!user) return false;
  return isGeneralAdmin(user) || effectiveAdminRole(user) === 'HR_MANAGER';
}

export function isHRPerson(user?: RoleUser): boolean {
  if (!user) return false;
  return isHRManager(user) || effectiveAdminRole(user) === 'HR_EMPLOYEE';
}

export function isCommercial(user?: RoleUser): boolean {
  if (!user) return false;
  return isGeneralAdmin(user) || effectiveAdminRole(user) === 'COMMERCIAL' || (user.role === 'ADMIN' && !user.adminRole);
}

export function canManageDawaratAndOffers(user?: RoleUser): boolean {
  return isCommercial(user);
}

export function canManagePromotions(user?: RoleUser): boolean {
  return canManageDawaratAndOffers(user);
}

// Central permission map: one place that says which staff role may do what.
// Every admin API route asks for a permission here instead of just "is staff".
export type Permission =
  | 'users.manage' // students, teachers, ambassadors (list, create, edit, delete)
  | 'staff.manage' // staff accounts
  | 'catalog.manage' // courses, modules, bundles, live sessions, promotions
  | 'operations.manage' // payment / upgrade operations queue
  | 'finance.manage' // financial center, teacher payouts
  | 'settings.manage'; // platform settings, footer, landing

const ALL_PERMISSIONS: Permission[] = [
  'users.manage',
  'staff.manage',
  'catalog.manage',
  'operations.manage',
  'finance.manage',
  'settings.manage',
];

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: ALL_PERMISSIONS,
  GENERAL_ADMIN: ALL_PERMISSIONS,
  HR_MANAGER: ['users.manage', 'staff.manage'],
  HR_EMPLOYEE: ['users.manage'],
  COMMERCIAL: ['catalog.manage', 'operations.manage'],
  FINANCE: ['operations.manage', 'finance.manage'],
  ADMIN: ['catalog.manage', 'operations.manage'], // legacy plain admin
  MODERATOR: [], // moderates the community only, no admin API access
};

export function permissionsOf(user?: RoleUser): Permission[] {
  if (!user || !STAFF_BASE_ROLES.includes(user.role)) return [];
  if (user.role === 'OWNER') return ALL_PERMISSIONS;
  const ar = effectiveAdminRole(user) || (user.role === 'MODERATOR' ? 'MODERATOR' : 'ADMIN');
  return ROLE_PERMISSIONS[ar] || [];
}

export function hasAnyPermission(user: RoleUser, wanted: Permission | Permission[]): boolean {
  const list = permissionsOf(user);
  return (Array.isArray(wanted) ? wanted : [wanted]).some((p) => list.includes(p));
}

// adminRole values a staff account may be given, with the level each one grants.
export const ASSIGNABLE_ADMIN_ROLES = [
  'SUPER_ADMIN',
  'GENERAL_ADMIN',
  'HR_MANAGER',
  'COMMERCIAL',
  'HR_EMPLOYEE',
  'FINANCE',
  'ADMIN',
  'MODERATOR',
] as const;

export function isAssignableAdminRole(value: unknown): value is (typeof ASSIGNABLE_ADMIN_ROLES)[number] {
  return typeof value === 'string' && (ASSIGNABLE_ADMIN_ROLES as readonly string[]).includes(value);
}

// The actor may hand out an adminRole only if it ranks below their own level
// (Super Admin, level 100, may hand out any).
export function canAssignAdminRole(actor: RoleUser, adminRole: string): boolean {
  const actorLevel = getUserHierarchyLevel(actor);
  if (actorLevel >= 100) return true;
  const grantedLevel = getUserHierarchyLevel({ role: adminRole === 'MODERATOR' ? 'MODERATOR' : 'ADMIN', adminRole });
  return grantedLevel < actorLevel;
}

export function canManageUser(
  actor?: { id: string; role: Role; adminRole?: string | null } | null,
  target?: { id: string; role: Role; adminRole?: string | null } | null
): boolean {
  if (!actor || !target) return false;
  if (actor.id === target.id) return false; // Cannot delete self
  // Managing accounts needs an account-management permission; seniority alone is not enough.
  if (!hasAnyPermission(actor, ['users.manage', 'staff.manage'])) return false;
  // Only an OWNER may touch an OWNER.
  if (target.role === 'OWNER' && actor.role !== 'OWNER') return false;

  const actorLevel = getUserHierarchyLevel(actor);
  const targetLevel = getUserHierarchyLevel(target);

  // Super Admin (Level 100) can manage anyone
  if (actorLevel === 100) return true;

  // General Admin (Level 95) can handle everything the superadmin can, EXCEPT:
  // - He CANNOT add/edit/remove Superadmins (Level 100)
  // - He CANNOT add/edit/remove other General Admins (Level 95)
  if (actorLevel >= 95) {
    return targetLevel < 95;
  }

  // HR Manager can manage anyone with level < 85
  if (actorLevel >= 85) {
    return targetLevel < 85;
  }

  // HR Employees can manage Teachers, Ambassadors, and Students (Levels <= 50)
  if (actorLevel >= 75) {
    return targetLevel <= 50;
  }

  return false;
}

export function canAddTeachersAndStudents(actor?: RoleUser): boolean {
  return isHRPerson(actor);
}

export function hasPermission(userRole: Role, requiredRole: Role): boolean {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0);
}

export function isStaff(role?: Role): boolean {
  if (!role) return false;
  return ['OWNER', 'ADMIN', 'MODERATOR'].includes(role);
}

export function isAmbassador(role?: Role): boolean {
  if (!role) return false;
  return role === 'AMBASSADOR' || isStaff(role);
}

export function isTeacher(role?: Role): boolean {
  if (!role) return false;
  return role === 'TEACHER' || isStaff(role);
}

export function isGoldenMember(user?: User | null): boolean {
  if (!user) return false;
  return user.role === 'STUDENT_PAID' || isStaff(user.role) || user.role === 'AMBASSADOR' || user.role === 'TEACHER';
}

export function canAccessFullExams(user?: User | null): boolean {
  return isGoldenMember(user);
}

export function canModerate(role?: Role): boolean {
  if (!role) return false;
  return ['OWNER', 'ADMIN', 'MODERATOR'].includes(role);
}

export function canEditUserRoles(role?: Role): boolean {
  if (!role) return false;
  return role === 'OWNER' || role === 'ADMIN';
}

export function getDashboardPath(role: Role, locale: string): string {
  if (isStaff(role)) return `/${locale}/admin`;
  if (role === 'TEACHER') return `/${locale}/teacher`;
  if (role === 'AMBASSADOR') return `/${locale}/ambassador`;
  return `/${locale}/student`;
}

export function getHubTitle(role?: Role, name?: string, locale: string = 'ar'): string {
  const cleanName = name || (locale === 'ar' ? 'طالب جزائري' : 'Étudiant');
  
  if (role === 'TEACHER') {
    if (locale === 'ar') return `منصة الأستاذ الأكاديمية - ${cleanName}`;
    if (locale === 'fr') return `Espace Enseignant Universitaire - ${cleanName}`;
    return `Teacher Academic Hub - ${cleanName}`;
  }

  if (role === 'AMBASSADOR') {
    if (locale === 'ar') return `لوحة السفير المعتمد - ${cleanName}`;
    if (locale === 'fr') return `Espace Ambassadeur Officiel - ${cleanName}`;
    return `Ambassador Academic Hub - ${cleanName}`;
  }

  if (role === 'OWNER' || role === 'ADMIN') {
    if (locale === 'ar') return `لوحة الإدارة والحوكمة - ${cleanName}`;
    if (locale === 'fr') return `Panneau d'Administration SaaS - ${cleanName}`;
    return `Governance & Admin Hub - ${cleanName}`;
  }

  if (locale === 'ar') return `فضاء الطالب الأكاديمي - ${cleanName}`;
  if (locale === 'fr') return `Espace Étudiant Universitaire - ${cleanName}`;
  return `Student Academic Hub - ${cleanName}`;
}

