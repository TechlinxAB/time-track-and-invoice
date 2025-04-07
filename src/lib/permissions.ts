
// Define available user roles
export type UserRole = 'admin' | 'manager' | 'user';

// Define permission actions
export type PermissionAction = 
  | 'manage_users'
  | 'manage_settings'
  | 'manage_clients' 
  | 'manage_activities'
  | 'manage_products'
  | 'manage_invoices'
  | 'track_time'
  | 'delete_data';

// Role-based permissions mapping
export const PERMISSIONS: Record<UserRole, PermissionAction[]> = {
  admin: [
    'manage_users',
    'manage_settings',
    'manage_clients',
    'manage_activities',
    'manage_products',
    'manage_invoices',
    'track_time',
    'delete_data',
  ],
  manager: [
    'manage_clients',
    'manage_activities',
    'manage_products',
    'manage_invoices',
    'track_time',
  ],
  user: ['track_time'],
};

// Helper function to check if a role has a specific permission
export const hasPermission = (
  role: UserRole | undefined,
  action: PermissionAction
): boolean => {
  if (!role) return false;
  return PERMISSIONS[role].includes(action);
};

// Get human-readable role name
export const getRoleName = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'manager':
      return 'Manager';
    case 'user':
      return 'User';
    default:
      return 'Unknown Role';
  }
};

// Get all available roles for selection
export const getAvailableRoles = (): { value: UserRole; label: string }[] => [
  { value: 'admin', label: 'Administrator' },
  { value: 'manager', label: 'Manager' },
  { value: 'user', label: 'User' },
];
