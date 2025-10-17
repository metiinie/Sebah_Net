import { useState, useEffect, useCallback } from 'react';
import { personalizationService, UserProfile, ViewingPreferences } from '../lib/personalizationService';
import { useAuth } from '../contexts/AuthContext';

interface UsePersonalizationOptions {
  autoLoadProfile?: boolean;
  enableContinueWatching?: boolean;
  enableWatchlist?: boolean;
  enableRecentlyWatched?: boolean;
}

export const usePersonalization = (options: UsePersonalizationOptions = {}) => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    autoLoadProfile = true,
    enableContinueWatching = true,
    enableWatchlist = true,
    enableRecentlyWatched = true,
  } = options;

  // Load user profiles
  const loadProfiles = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const userProfiles = await personalizationService.getProfiles(user.id);
      setProfiles(userProfiles);
      
      // Auto-select first profile if available and autoLoadProfile is enabled
      if (autoLoadProfile && userProfiles.length > 0 && !selectedProfile) {
        setSelectedProfile(userProfiles[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profiles');
      console.error('Error loading profiles:', err);
    } finally {
      setLoading(false);
    }
  }, [user, autoLoadProfile]);

  // Select a profile
  const selectProfile = useCallback((profile: UserProfile) => {
    setSelectedProfile(profile);
  }, []);

  // Get viewing preferences for current profile
  const getViewingPreferences = useCallback((): ViewingPreferences | null => {
    return selectedProfile?.viewing_preferences || null;
  }, [selectedProfile]);

  // Check if content is allowed for current profile
  const isContentAllowed = useCallback(async (contentId: string, contentType: 'movie' | 'music'): Promise<boolean> => {
    if (!selectedProfile) return true;
    
    try {
      return await personalizationService.isContentAllowed(selectedProfile.id, contentId, contentType);
    } catch (err) {
      console.error('Error checking content permission:', err);
      return true; // Default to allowed if check fails
    }
  }, [selectedProfile]);

  // Add to watchlist
  const addToWatchlist = useCallback(async (contentId: string, contentType: 'movie' | 'music') => {
    if (!selectedProfile || !enableWatchlist) return false;

    try {
      await personalizationService.addToWatchlist(selectedProfile.id, contentId, contentType);
      return true;
    } catch (err) {
      console.error('Error adding to watchlist:', err);
      return false;
    }
  }, [selectedProfile, enableWatchlist]);

  // Remove from watchlist
  const removeFromWatchlist = useCallback(async (contentId: string) => {
    if (!selectedProfile || !enableWatchlist) return false;

    try {
      await personalizationService.removeFromWatchlist(selectedProfile.id, contentId);
      return true;
    } catch (err) {
      console.error('Error removing from watchlist:', err);
      return false;
    }
  }, [selectedProfile, enableWatchlist]);

  // Update continue watching
  const updateContinueWatching = useCallback(async (
    contentId: string,
    contentType: 'movie' | 'music',
    currentTime: number,
    totalDuration: number,
    deviceInfo: string,
    sessionId: string
  ) => {
    if (!selectedProfile || !enableContinueWatching) return;

    try {
      await personalizationService.updateContinueWatching(
        selectedProfile.id,
        contentId,
        contentType,
        currentTime,
        totalDuration,
        deviceInfo,
        sessionId
      );
    } catch (err) {
      console.error('Error updating continue watching:', err);
    }
  }, [selectedProfile, enableContinueWatching]);

  // Add to recently watched
  const addToRecentlyWatched = useCallback(async (
    contentId: string,
    contentType: 'movie' | 'music',
    watchTime: number,
    totalDuration: number,
    deviceInfo: string
  ) => {
    if (!selectedProfile || !enableRecentlyWatched) return;

    try {
      await personalizationService.addToRecentlyWatched(
        selectedProfile.id,
        contentId,
        contentType,
        watchTime,
        totalDuration,
        deviceInfo
      );
    } catch (err) {
      console.error('Error adding to recently watched:', err);
    }
  }, [selectedProfile, enableRecentlyWatched]);

  // Get continue watching data
  const getContinueWatching = useCallback(async () => {
    if (!selectedProfile || !enableContinueWatching) return [];

    try {
      return await personalizationService.getContinueWatching(selectedProfile.id);
    } catch (err) {
      console.error('Error getting continue watching:', err);
      return [];
    }
  }, [selectedProfile, enableContinueWatching]);

  // Get watchlist
  const getWatchlist = useCallback(async () => {
    if (!selectedProfile || !enableWatchlist) return [];

    try {
      return await personalizationService.getWatchlist(selectedProfile.id);
    } catch (err) {
      console.error('Error getting watchlist:', err);
      return [];
    }
  }, [selectedProfile, enableWatchlist]);

  // Get recently watched
  const getRecentlyWatched = useCallback(async (limit: number = 20) => {
    if (!selectedProfile || !enableRecentlyWatched) return [];

    try {
      return await personalizationService.getRecentlyWatched(selectedProfile.id, limit);
    } catch (err) {
      console.error('Error getting recently watched:', err);
      return [];
    }
  }, [selectedProfile, enableRecentlyWatched]);

  // Check if content is in watchlist
  const isInWatchlist = useCallback(async (contentId: string): Promise<boolean> => {
    if (!selectedProfile || !enableWatchlist) return false;

    try {
      const watchlist = await personalizationService.getWatchlist(selectedProfile.id);
      return watchlist.some(item => item.content_id === contentId);
    } catch (err) {
      console.error('Error checking watchlist:', err);
      return false;
    }
  }, [selectedProfile, enableWatchlist]);

  // Get resume time for content
  const getResumeTime = useCallback(async (contentId: string): Promise<number | null> => {
    if (!selectedProfile || !enableContinueWatching) return null;

    try {
      const continueWatching = await personalizationService.getContinueWatching(selectedProfile.id);
      const item = continueWatching.find(item => item.content_id === contentId);
      return item ? item.current_time : null;
    } catch (err) {
      console.error('Error getting resume time:', err);
      return null;
    }
  }, [selectedProfile, enableContinueWatching]);

  // Load profiles on mount
  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  return {
    // State
    profiles,
    selectedProfile,
    loading,
    error,
    
    // Actions
    selectProfile,
    loadProfiles,
    
    // Preferences
    getViewingPreferences,
    isContentAllowed,
    
    // Watchlist
    addToWatchlist,
    removeFromWatchlist,
    getWatchlist,
    isInWatchlist,
    
    // Continue Watching
    updateContinueWatching,
    getContinueWatching,
    getResumeTime,
    
    // Recently Watched
    addToRecentlyWatched,
    getRecentlyWatched,
  };
};
