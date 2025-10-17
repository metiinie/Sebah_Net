import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, User, Settings, LogOut, Crown, Shield, ChevronDown, Settings2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePageNavigation } from '../hooks/usePageNavigation';
import { usePermissions } from '../hooks/usePermissions';
import { personalizationService, UserProfile } from '../lib/personalizationService';

interface UnifiedProfileProps {
  showProfileMenu?: boolean;
  showUserInfo?: boolean;
  className?: string;
}

export const UnifiedProfile = ({ 
  showProfileMenu = true, 
  showUserInfo = true,
  className = ""
}: UnifiedProfileProps) => {
  const { user, signOut } = useAuth();
  const { goToPersonalization, goToAdmin } = usePageNavigation();
  const { isAdmin, canAccessAdmin, role } = usePermissions();
  const [isOpen, setIsOpen] = useState(false);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfiles();
    }
  }, [user]);

  const loadProfiles = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userProfiles = await personalizationService.getProfiles(user.id);
      setProfiles(userProfiles);
      
      // Auto-select first profile if available
      if (userProfiles.length > 0 && !selectedProfile) {
        setSelectedProfile(userProfiles[0]);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleProfileSelect = (profile: UserProfile) => {
    setSelectedProfile(profile);
    setIsOpen(false);
  };

  if (!user) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Profile Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-lg transition-all"
      >
        {/* User Avatar */}
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
          {selectedProfile ? (
            <span className="text-white text-sm font-medium">
              {selectedProfile.name.charAt(0).toUpperCase()}
            </span>
          ) : (
            <User className="w-4 h-4 text-white" />
          )}
        </div>

        {/* User Info */}
        {showUserInfo && (
          <div className="flex flex-col items-start">
            <span className="text-white text-sm font-medium">
              {selectedProfile ? selectedProfile.name : user.email?.split('@')[0]}
            </span>
            <div className="flex items-center gap-2">
              {selectedProfile ? (
                <div className="flex items-center gap-1">
                  {selectedProfile.is_kids_profile && (
                    <Shield className="w-3 h-3 text-pink-400" />
                  )}
                  <span className="text-slate-400 text-xs">
                    {selectedProfile.is_kids_profile ? 'Kids Profile' : 'Adult Profile'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  {isAdmin ? (
                    <Crown className="w-3 h-3 text-purple-400" />
                  ) : (
                    <User className="w-3 h-3 text-slate-400" />
                  )}
                  <span className={`text-xs font-medium ${
                    isAdmin ? 'text-purple-400' : 'text-slate-400'
                  }`}>
                    {isAdmin ? 'Administrator' : 'User'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      {/* Profile Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50"
          >
            {/* User Info Header */}
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  {selectedProfile ? (
                    <span className="text-white text-lg font-medium">
                      {selectedProfile.name.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <User className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium">
                    {selectedProfile ? selectedProfile.name : user.email?.split('@')[0]}
                  </h3>
                  <p className="text-slate-400 text-sm">
                    {user.email}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedProfile ? (
                      <>
                        {selectedProfile.is_kids_profile && (
                          <span className="px-2 py-1 bg-pink-500/20 text-pink-400 rounded-full text-xs">
                            Kids Profile
                          </span>
                        )}
                        {selectedProfile.parental_controls_enabled && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                            Parental Controls
                          </span>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-1">
                        {isAdmin ? (
                          <Crown className="w-3 h-3 text-purple-400" />
                        ) : (
                          <User className="w-3 h-3 text-slate-400" />
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isAdmin 
                            ? 'bg-purple-500/20 text-purple-400' 
                            : 'bg-slate-500/20 text-slate-400'
                        }`}>
                          {isAdmin ? 'Administrator' : 'User'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Profiles Section */}
            {profiles.length > 0 && (
              <div className="p-4 border-b border-slate-700">
                <h4 className="text-slate-300 text-sm font-medium mb-3">Switch Profile</h4>
                <div className="space-y-2">
                  {profiles.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => handleProfileSelect(profile)}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                        selectedProfile?.id === profile.id
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {profile.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{profile.name}</div>
                        <div className="text-xs text-slate-400">
                          {profile.is_kids_profile ? 'Kids Profile' : 'Adult Profile'}
                        </div>
                      </div>
                      {profile.is_kids_profile && (
                        <Shield className="w-4 h-4 text-pink-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Menu Actions */}
            <div className="p-2">
              {/* Administration Button - Only for Admins */}
              {isAdmin && canAccessAdmin && (
                <button
                  onClick={() => {
                    goToAdmin();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-colors mb-2"
                >
                  <Settings2 className="w-5 h-5" />
                  <span>Administration</span>
                  <Crown className="w-4 h-4 ml-auto" />
                </button>
              )}

              <button
                onClick={() => {
                  goToPersonalization();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
              >
                <Users className="w-5 h-5" />
                <span>Manage Profiles</span>
              </button>

              <button
                onClick={() => {
                  goToPersonalization();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </button>

              <div className="border-t border-slate-700 my-2"></div>

              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 p-3 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
