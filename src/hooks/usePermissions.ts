import { useAuth } from '../contexts/AuthContext';
import { useMemo, useCallback } from 'react';
import { Permission, ADMIN_EMAILS, ADMIN_PERMISSIONS, USER_PERMISSIONS } from '../lib/constants';

export type UserRole = 'user' | 'admin';

export const usePermissions = () => {
  const { user } = useAuth();

  const isAdmin = useMemo((): boolean => {
    if (!user?.email) {
      return false;
    }
    return ADMIN_EMAILS.includes(user.email);
  }, [user?.email]);

  const permissions = useMemo(() => {
    if (!user) {
      return [];
    }

    if (isAdmin) {
      return ADMIN_PERMISSIONS;
    }

    return USER_PERMISSIONS;
  }, [user, isAdmin]);

  const hasPermission = useCallback((permission: Permission): boolean => {
    return permissions.includes(permission);
  }, [permissions]);

  const hasAnyPermission = useCallback((permissionsToCheck: Permission[]): boolean => {
    return permissionsToCheck.some(permission => hasPermission(permission));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permissionsToCheck: Permission[]): boolean => {
    return permissionsToCheck.every(permission => hasPermission(permission));
  }, [hasPermission]);

  const isUser = useMemo((): boolean => {
    return !isAdmin;
  }, [isAdmin]);

  const canUpload = useMemo((): boolean => {
    return hasAnyPermission(['upload_movies', 'upload_music']);
  }, [hasAnyPermission]);

  const canManageContent = useMemo((): boolean => {
    return hasAnyPermission(['delete_content', 'upload_movies', 'upload_music']);
  }, [hasAnyPermission]);

  const canAccessAdmin = useMemo((): boolean => {
    return hasPermission('access_admin_panel');
  }, [hasPermission]);

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isUser,
    canUpload,
    canManageContent,
    canAccessAdmin,
    role: isAdmin ? 'admin' : 'user' as UserRole,
    user: user ? { email: user.email, role: isAdmin ? 'admin' : 'user' } : undefined,
  };
};
