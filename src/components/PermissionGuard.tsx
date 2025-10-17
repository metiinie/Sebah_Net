import { ReactNode } from 'react';
import { usePermissions, Permission } from '../hooks/usePermissions';
import { Shield, Lock, Crown, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface PermissionGuardProps {
  children: ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}

export const PermissionGuard = ({
  children,
  permission,
  permissions = [],
  requireAll = false,
  fallback,
  showAccessDenied = true,
}: PermissionGuardProps) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isAdmin, role } = usePermissions();

  const hasAccess = () => {
    if (permission) {
      return hasPermission(permission);
    }

    if (permissions.length > 0) {
      return requireAll 
        ? hasAllPermissions(permissions)
        : hasAnyPermission(permissions);
    }

    return true;
  };

  if (hasAccess()) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showAccessDenied) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center p-8 bg-slate-800/50 rounded-xl border border-slate-700"
    >
      <div className="flex items-center gap-3 mb-4">
        {isAdmin ? (
          <Crown className="w-8 h-8 text-purple-500" />
        ) : (
          <User className="w-8 h-8 text-slate-500" />
        )}
        <Shield className="w-8 h-8 text-red-500" />
        <Lock className="w-8 h-8 text-red-500" />
      </div>
      
      <h3 className="text-xl font-bold text-white mb-2">Access Denied</h3>
      <p className="text-slate-400 text-center mb-4">
        You don't have permission to access this feature.
      </p>
      
      <div className="bg-slate-700/50 rounded-lg p-4 w-full max-w-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-300 text-sm">Current Role:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            isAdmin 
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
          }`}>
            {isAdmin ? 'Admin' : 'User'}
          </span>
        </div>
        
        <div className="text-xs text-slate-400">
          {isAdmin ? (
            <p>You have full access to all features.</p>
          ) : (
            <p>Contact an administrator to request additional permissions.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};
