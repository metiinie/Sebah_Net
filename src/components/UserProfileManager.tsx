import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  ShieldCheck, 
  Settings, 
  Save, 
  X,
  Users,
  Baby,
  Lock,
  Unlock
} from 'lucide-react';
import { personalizationService, UserProfile, ViewingPreferences, ParentalControlSettings } from '../lib/personalizationService';
import { useAuth } from '../contexts/AuthContext';

interface UserProfileManagerProps {
  onProfileSelect?: (profile: UserProfile) => void;
  selectedProfileId?: string;
  showCreateButton?: boolean;
  className?: string;
}

export const UserProfileManager: React.FC<UserProfileManagerProps> = ({
  onProfileSelect,
  selectedProfileId,
  showCreateButton = true,
  className = ''
}) => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [showParentalControls, setShowParentalControls] = useState(false);
  const [parentalControls, setParentalControls] = useState<ParentalControlSettings | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    is_kids_profile: false,
    age_rating_limit: 18,
    parental_controls_enabled: false,
  });

  const [viewingPreferences, setViewingPreferences] = useState<ViewingPreferences>({
    subtitle_size: 'medium',
    playback_speed: 1.0,
    theme: 'dark',
    auto_play: true,
    skip_intro: false,
    skip_credits: false,
    preferred_quality: 'auto',
    preferred_language: 'en',
    closed_captions: false,
    audio_description: false,
  });

  const [parentalFormData, setParentalFormData] = useState({
    max_age_rating: 18,
    blocked_genres: [] as string[],
    blocked_content: [] as string[],
    time_restrictions: [] as any[],
    require_pin: false,
    pin_code: '',
  });

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
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async () => {
    if (!user || !formData.name.trim()) return;

    try {
      const newProfile = await personalizationService.createProfile(user.id, {
        name: formData.name.trim(),
        is_kids_profile: formData.is_kids_profile,
        age_rating_limit: formData.age_rating_limit,
        parental_controls_enabled: formData.parental_controls_enabled,
        viewing_preferences: viewingPreferences,
      });

      setProfiles(prev => [...prev, newProfile]);
      setShowCreateForm(false);
      resetForm();
      
      // Auto-select the new profile
      if (onProfileSelect) {
        onProfileSelect(newProfile);
      }
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  const handleEditProfile = async () => {
    if (!editingProfile) return;

    try {
      const updatedProfile = await personalizationService.updateProfile(editingProfile.id, {
        name: formData.name.trim(),
        is_kids_profile: formData.is_kids_profile,
        age_rating_limit: formData.age_rating_limit,
        parental_controls_enabled: formData.parental_controls_enabled,
        viewing_preferences: viewingPreferences,
      });

      setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));
      setShowEditForm(false);
      setEditingProfile(null);
      resetForm();
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
      return;
    }

    try {
      await personalizationService.deleteProfile(profileId);
      setProfiles(prev => prev.filter(p => p.id !== profileId));
    } catch (error) {
      console.error('Error deleting profile:', error);
    }
  };

  const handleSaveParentalControls = async () => {
    if (!editingProfile) return;

    try {
      await personalizationService.setParentalControls(editingProfile.id, parentalFormData);
      setShowParentalControls(false);
      // Reload parental controls
      const controls = await personalizationService.getParentalControls(editingProfile.id);
      setParentalControls(controls);
    } catch (error) {
      console.error('Error saving parental controls:', error);
    }
  };

  const openEditForm = (profile: UserProfile) => {
    setEditingProfile(profile);
    setFormData({
      name: profile.name,
      is_kids_profile: profile.is_kids_profile,
      age_rating_limit: profile.age_rating_limit || 18,
      parental_controls_enabled: profile.parental_controls_enabled,
    });
    setViewingPreferences(profile.viewing_preferences);
    setShowEditForm(true);
  };

  const openParentalControls = async (profile: UserProfile) => {
    setEditingProfile(profile);
    const controls = await personalizationService.getParentalControls(profile.id);
    setParentalControls(controls);
    
    if (controls) {
      setParentalFormData({
        max_age_rating: controls.max_age_rating,
        blocked_genres: controls.blocked_genres,
        blocked_content: controls.blocked_content,
        time_restrictions: controls.time_restrictions,
        require_pin: controls.require_pin,
        pin_code: controls.pin_code || '',
      });
    }
    
    setShowParentalControls(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      is_kids_profile: false,
      age_rating_limit: 18,
      parental_controls_enabled: false,
    });
    setViewingPreferences({
      subtitle_size: 'medium',
      playback_speed: 1.0,
      theme: 'dark',
      auto_play: true,
      skip_intro: false,
      skip_credits: false,
      preferred_quality: 'auto',
      preferred_language: 'en',
      closed_captions: false,
      audio_description: false,
    });
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Profiles List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((profile) => (
          <motion.div
            key={profile.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            className={`relative p-6 rounded-2xl border-2 transition-all cursor-pointer ${
              selectedProfileId === profile.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            onClick={() => onProfileSelect?.(profile)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  profile.is_kids_profile 
                    ? 'bg-pink-100 dark:bg-pink-900/30' 
                    : 'bg-blue-100 dark:bg-blue-900/30'
                }`}>
                  {profile.is_kids_profile ? (
                    <Baby className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  ) : (
                    <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {profile.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {profile.is_kids_profile ? 'Kids Profile' : 'Adult Profile'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {profile.parental_controls_enabled && (
                  <ShieldCheck className="w-5 h-5 text-green-500" />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditForm(profile);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center justify-between">
                <span>Age Rating Limit:</span>
                <span className="font-medium">{profile.age_rating_limit}+</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Theme:</span>
                <span className="font-medium capitalize">{profile.viewing_preferences.theme}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Quality:</span>
                <span className="font-medium capitalize">{profile.viewing_preferences.preferred_quality}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openParentalControls(profile);
                }}
                className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                <Shield className="w-4 h-4" />
                <span>Parental Controls</span>
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteProfile(profile.id);
                }}
                className="p-2 text-red-400 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}

        {/* Create Profile Button */}
        {showCreateButton && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => setShowCreateForm(true)}
            className="p-6 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-gray-400 dark:hover:border-gray-500 transition-all"
          >
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <Plus className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 dark:text-white">Add Profile</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Create a new user profile
                </p>
              </div>
            </div>
          </motion.button>
        )}
      </div>

      {/* Create Profile Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowCreateForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Create New Profile
                </h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Profile Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter profile name"
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="kids-profile"
                    checked={formData.is_kids_profile}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_kids_profile: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="kids-profile" className="text-sm text-gray-700 dark:text-gray-300">
                    Kids Profile
                  </label>
                </div>

                {formData.is_kids_profile && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Age Rating Limit
                    </label>
                    <select
                      value={formData.age_rating_limit}
                      onChange={(e) => setFormData(prev => ({ ...prev, age_rating_limit: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value={0}>All Ages</option>
                      <option value={7}>7+</option>
                      <option value={13}>13+</option>
                      <option value={16}>16+</option>
                      <option value={18}>18+</option>
                    </select>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="parental-controls"
                    checked={formData.parental_controls_enabled}
                    onChange={(e) => setFormData(prev => ({ ...prev, parental_controls_enabled: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="parental-controls" className="text-sm text-gray-700 dark:text-gray-300">
                    Enable Parental Controls
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProfile}
                  disabled={!formData.name.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Profile
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditForm && editingProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowEditForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Edit Profile
                </h2>
                <button
                  onClick={() => setShowEditForm(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Basic Settings
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Profile Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="edit-kids-profile"
                      checked={formData.is_kids_profile}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_kids_profile: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="edit-kids-profile" className="text-sm text-gray-700 dark:text-gray-300">
                      Kids Profile
                    </label>
                  </div>

                  {formData.is_kids_profile && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Age Rating Limit
                      </label>
                      <select
                        value={formData.age_rating_limit}
                        onChange={(e) => setFormData(prev => ({ ...prev, age_rating_limit: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value={0}>All Ages</option>
                        <option value={7}>7+</option>
                        <option value={13}>13+</option>
                        <option value={16}>16+</option>
                        <option value={18}>18+</option>
                      </select>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="edit-parental-controls"
                      checked={formData.parental_controls_enabled}
                      onChange={(e) => setFormData(prev => ({ ...prev, parental_controls_enabled: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="edit-parental-controls" className="text-sm text-gray-700 dark:text-gray-300">
                      Enable Parental Controls
                    </label>
                  </div>
                </div>

                {/* Viewing Preferences */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Viewing Preferences
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Theme
                    </label>
                    <select
                      value={viewingPreferences.theme}
                      onChange={(e) => setViewingPreferences(prev => ({ ...prev, theme: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Preferred Quality
                    </label>
                    <select
                      value={viewingPreferences.preferred_quality}
                      onChange={(e) => setViewingPreferences(prev => ({ ...prev, preferred_quality: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="auto">Auto</option>
                      <option value="720p">720p HD</option>
                      <option value="1080p">1080p FHD</option>
                      <option value="4k">4K UHD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subtitle Size
                    </label>
                    <select
                      value={viewingPreferences.subtitle_size}
                      onChange={(e) => setViewingPreferences(prev => ({ ...prev, subtitle_size: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Playback Speed: {viewingPreferences.playback_speed}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.25"
                      value={viewingPreferences.playback_speed}
                      onChange={(e) => setViewingPreferences(prev => ({ ...prev, playback_speed: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="auto-play"
                        checked={viewingPreferences.auto_play}
                        onChange={(e) => setViewingPreferences(prev => ({ ...prev, auto_play: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="auto-play" className="text-sm text-gray-700 dark:text-gray-300">
                        Auto Play
                      </label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="skip-intro"
                        checked={viewingPreferences.skip_intro}
                        onChange={(e) => setViewingPreferences(prev => ({ ...prev, skip_intro: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="skip-intro" className="text-sm text-gray-700 dark:text-gray-300">
                        Skip Intro
                      </label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="closed-captions"
                        checked={viewingPreferences.closed_captions}
                        onChange={(e) => setViewingPreferences(prev => ({ ...prev, closed_captions: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="closed-captions" className="text-sm text-gray-700 dark:text-gray-300">
                        Closed Captions
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditForm(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditProfile}
                  disabled={!formData.name.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Parental Controls Modal */}
      <AnimatePresence>
        {showParentalControls && editingProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowParentalControls(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Parental Controls - {editingProfile.name}
                </h2>
                <button
                  onClick={() => setShowParentalControls(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Maximum Age Rating
                  </label>
                  <select
                    value={parentalFormData.max_age_rating}
                    onChange={(e) => setParentalFormData(prev => ({ ...prev, max_age_rating: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={0}>All Ages</option>
                    <option value={7}>7+</option>
                    <option value={13}>13+</option>
                    <option value={16}>16+</option>
                    <option value={18}>18+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Blocked Genres
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Thriller', 'Sci-Fi', 'Fantasy'].map((genre) => (
                      <label key={genre} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={parentalFormData.blocked_genres.includes(genre)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setParentalFormData(prev => ({
                                ...prev,
                                blocked_genres: [...prev.blocked_genres, genre]
                              }));
                            } else {
                              setParentalFormData(prev => ({
                                ...prev,
                                blocked_genres: prev.blocked_genres.filter(g => g !== genre)
                              }));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{genre}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="require-pin"
                    checked={parentalFormData.require_pin}
                    onChange={(e) => setParentalFormData(prev => ({ ...prev, require_pin: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="require-pin" className="text-sm text-gray-700 dark:text-gray-300">
                    Require PIN to access restricted content
                  </label>
                </div>

                {parentalFormData.require_pin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      PIN Code
                    </label>
                    <input
                      type="password"
                      value={parentalFormData.pin_code}
                      onChange={(e) => setParentalFormData(prev => ({ ...prev, pin_code: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter 4-10 digit PIN"
                      maxLength={10}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowParentalControls(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveParentalControls}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Settings
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

