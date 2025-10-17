import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Bookmark, 
  Clock, 
  Play, 
  Settings, 
  Shield,
  Sparkles,
  TrendingUp,
  Heart,
  Eye,
  RotateCcw
} from 'lucide-react';
import { UserProfileManager } from '../components/UserProfileManager';
import { WatchlistManager } from '../components/WatchlistManager';
import { ContinueWatching } from '../components/ContinueWatching';
import { RecentlyWatched } from '../components/RecentlyWatched';
import { PersonalizedCarousels } from '../components/PersonalizedCarousels';
import { personalizationService, UserProfile } from '../lib/personalizationService';
import { useAuth } from '../contexts/AuthContext';

type TabType = 'profiles' | 'watchlist' | 'continue' | 'recent' | 'carousels' | 'settings';

const TABS = [
  { id: 'profiles', label: 'Profiles', icon: Users },
  { id: 'watchlist', label: 'Watchlist', icon: Bookmark },
  { id: 'continue', label: 'Continue Watching', icon: Play },
  { id: 'recent', label: 'Recently Watched', icon: Clock },
  { id: 'carousels', label: 'For You', icon: Sparkles },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Personalization: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('profiles');
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleProfileSelect = (profile: UserProfile) => {
    setSelectedProfile(profile);
  };

  const handlePlayContent = (contentId: string, contentType: 'movie' | 'music', resumeTime?: number) => {
    // This would typically navigate to the media player with the content
    console.log('Play content:', { contentId, contentType, resumeTime });
    // For now, we'll just log the action
    // In a real app, this would navigate to the appropriate player page
  };

  const renderTabContent = () => {
    if (!selectedProfile) {
      return (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Profile Selected
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Please select or create a profile to continue
          </p>
        </div>
      );
    }

    switch (activeTab) {
      case 'profiles':
        return (
          <UserProfileManager
            onProfileSelect={handleProfileSelect}
            selectedProfileId={selectedProfile.id}
            showCreateButton={true}
          />
        );
      
      case 'watchlist':
        return (
          <WatchlistManager
            profile={selectedProfile}
            onPlayContent={handlePlayContent}
          />
        );
      
      case 'continue':
        return (
          <ContinueWatching
            profile={selectedProfile}
            onPlayContent={handlePlayContent}
          />
        );
      
      case 'recent':
        return (
          <RecentlyWatched
            profile={selectedProfile}
            onPlayContent={handlePlayContent}
          />
        );
      
      case 'carousels':
        return (
          <PersonalizedCarousels
            profile={selectedProfile}
            onPlayContent={handlePlayContent}
          />
        );
      
      case 'settings':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Profile Settings
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Current Profile
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedProfile.name}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedProfile.is_kids_profile && (
                      <span className="px-2 py-1 bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400 rounded-full text-xs font-medium">
                        Kids Profile
                      </span>
                    )}
                    {selectedProfile.parental_controls_enabled && (
                      <Shield className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Viewing Preferences
                    </h4>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex justify-between">
                        <span>Theme:</span>
                        <span className="capitalize">{selectedProfile.viewing_preferences.theme}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Quality:</span>
                        <span className="capitalize">{selectedProfile.viewing_preferences.preferred_quality}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Subtitle Size:</span>
                        <span className="capitalize">{selectedProfile.viewing_preferences.subtitle_size}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Playback Speed:</span>
                        <span>{selectedProfile.viewing_preferences.playback_speed}x</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Content Settings
                    </h4>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex justify-between">
                        <span>Age Rating Limit:</span>
                        <span>{selectedProfile.age_rating_limit}+</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Auto Play:</span>
                        <span>{selectedProfile.viewing_preferences.auto_play ? 'On' : 'Off'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Skip Intro:</span>
                        <span>{selectedProfile.viewing_preferences.skip_intro ? 'On' : 'Off'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Closed Captions:</span>
                        <span>{selectedProfile.viewing_preferences.closed_captions ? 'On' : 'Off'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Stats
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {profiles.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Profiles
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    -
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Watchlist Items
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    -
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Hours Watched
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    -
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Favorites
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Personalization & Profiles
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your profiles, watchlists, and viewing preferences
          </p>
        </div>

        {/* Profile Selector */}
        {profiles.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center space-x-4 overflow-x-auto pb-2">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => handleProfileSelect(profile)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
                    selectedProfile?.id === profile.id
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    profile.is_kids_profile 
                      ? 'bg-pink-100 dark:bg-pink-900/30' 
                      : 'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    {profile.is_kids_profile ? (
                      <Heart className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                    ) : (
                      <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{profile.name}</div>
                    <div className="text-xs opacity-75">
                      {profile.is_kids_profile ? 'Kids Profile' : 'Adult Profile'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderTabContent()}
        </motion.div>
      </div>
    </div>
  );
};
