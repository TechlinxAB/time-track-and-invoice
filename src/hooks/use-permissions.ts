
import { useProfile } from '@/contexts/UserContext';
import { hasPermission, PermissionAction } from '@/lib/permissions';

export const usePermissions = () => {
  const { profile } = useProfile();

  const can = (action: PermissionAction): boolean => {
    return hasPermission(profile?.role, action);
  };

  return {
    can,
    isAdmin: profile?.role === 'admin',
    isManager: profile?.role === 'manager' || profile?.role === 'admin',
    isUser: profile?.role === 'user',
    role: profile?.role,
    loading: !profile
  };
};
