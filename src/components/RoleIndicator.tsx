import { Crown, User, Shield, Zap } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { motion } from 'framer-motion';

interface RoleIndicatorProps {
  showPermissions?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const RoleIndicator = ({ 
  showPermissions = false, 
  size = 'md',
  className = '' 
}: RoleIndicatorProps) => {
  const { role, isAdmin, permissions, canUpload, canManageContent } = usePermissions();

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  if (!role) {
    return null;
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Role Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`inline-flex items-center gap-2 rounded-full font-medium border ${
          isAdmin
            ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
            : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
        } ${sizeClasses[size]}`}
      >
        {isAdmin ? (
          <Crown className={iconSizes[size]} />
        ) : (
          <User className={iconSizes[size]} />
        )}
        <span className="font-semibold">
          {isAdmin ? 'Administrator' : 'User'}
        </span>
        {isAdmin && <Shield className={iconSizes[size]} />}
      </motion.div>

      {/* Permissions List */}
      {showPermissions && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 rounded-lg p-3 border border-slate-700"
        >
          <h4 className="text-slate-300 text-sm font-semibold mb-2 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Permissions
          </h4>
          <div className="space-y-1">
            {permissions.map((permission) => (
              <div
                key={permission}
                className="flex items-center gap-2 text-xs text-slate-400"
              >
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <span className="capitalize">
                  {permission.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
          
          {/* Quick Access Info */}
          <div className="mt-3 pt-3 border-t border-slate-700">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${canUpload ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-slate-400">Upload</span>
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${canManageContent ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-slate-400">Manage</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
