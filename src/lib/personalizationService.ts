import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  avatar_url?: string;
  is_kids_profile: boolean;
  age_rating_limit?: number;
  parental_controls_enabled: boolean;
  viewing_preferences: ViewingPreferences;
  created_at: string;
  updated_at: string;
}

export interface ViewingPreferences {
  subtitle_size: 'small' | 'medium' | 'large';
  playback_speed: number;
  theme: 'light' | 'dark' | 'auto';
  auto_play: boolean;
  skip_intro: boolean;
  skip_credits: boolean;
  preferred_quality: 'auto' | '720p' | '1080p' | '4k';
  preferred_language: string;
  closed_captions: boolean;
  audio_description: boolean;
}

export interface WatchlistItem {
  id: string;
  profile_id: string;
  content_id: string;
  content_type: 'movie' | 'music';
  added_at: string;
  priority: number;
}

export interface RecentlyWatched {
  id: string;
  profile_id: string;
  content_id: string;
  content_type: 'movie' | 'music';
  watched_at: string;
  watch_time: number;
  total_duration: number;
  completion_percentage: number;
  device_info: string;
}

export interface ContinueWatching {
  id: string;
  profile_id: string;
  content_id: string;
  content_type: 'movie' | 'music';
  current_time: number;
  total_duration: number;
  last_watched: string;
  device_info: string;
  session_id: string;
}

export interface PersonalizedCarousel {
  id: string;
  profile_id: string;
  title: string;
  content_ids: string[];
  content_type: 'movie' | 'music';
  algorithm: 'trending' | 'recommended' | 'similar' | 'genre' | 'recent';
  position: number;
  created_at: string;
  updated_at: string;
}

export interface ParentalControlSettings {
  id: string;
  profile_id: string;
  max_age_rating: number;
  blocked_genres: string[];
  blocked_content: string[];
  time_restrictions: {
    start_time: string;
    end_time: string;
    days: number[];
  }[];
  require_pin: boolean;
  pin_code?: string;
}

class PersonalizationService {
  // User Profile Management
  async createProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        name: profileData.name || 'New Profile',
        is_kids_profile: profileData.is_kids_profile || false,
        age_rating_limit: profileData.age_rating_limit || 18,
        parental_controls_enabled: profileData.parental_controls_enabled || false,
        viewing_preferences: profileData.viewing_preferences || this.getDefaultViewingPreferences(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getProfiles(userId: string): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async updateProfile(profileId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteProfile(profileId: string): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', profileId);

    if (error) throw error;
  }

  // Watchlist Management
  async addToWatchlist(profileId: string, contentId: string, contentType: 'movie' | 'music'): Promise<WatchlistItem> {
    const { data, error } = await supabase
      .from('watchlist')
      .insert({
        profile_id: profileId,
        content_id: contentId,
        content_type: contentType,
        priority: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async removeFromWatchlist(profileId: string, contentId: string): Promise<void> {
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('profile_id', profileId)
      .eq('content_id', contentId);

    if (error) throw error;
  }

  async getWatchlist(profileId: string): Promise<WatchlistItem[]> {
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('profile_id', profileId)
      .order('added_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async updateWatchlistPriority(profileId: string, contentId: string, priority: number): Promise<void> {
    const { error } = await supabase
      .from('watchlist')
      .update({ priority })
      .eq('profile_id', profileId)
      .eq('content_id', contentId);

    if (error) throw error;
  }

  // Recently Watched
  async addToRecentlyWatched(
    profileId: string,
    contentId: string,
    contentType: 'movie' | 'music',
    watchTime: number,
    totalDuration: number,
    deviceInfo: string
  ): Promise<RecentlyWatched> {
    const completionPercentage = (watchTime / totalDuration) * 100;

    const { data, error } = await supabase
      .from('recently_watched')
      .insert({
        profile_id: profileId,
        content_id: contentId,
        content_type: contentType,
        watch_time: watchTime,
        total_duration: totalDuration,
        completion_percentage: completionPercentage,
        device_info: deviceInfo,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getRecentlyWatched(profileId: string, limit: number = 20): Promise<RecentlyWatched[]> {
    const { data, error } = await supabase
      .from('recently_watched')
      .select('*')
      .eq('profile_id', profileId)
      .order('watched_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Continue Watching
  async updateContinueWatching(
    profileId: string,
    contentId: string,
    contentType: 'movie' | 'music',
    currentTime: number,
    totalDuration: number,
    deviceInfo: string,
    sessionId: string
  ): Promise<ContinueWatching> {
    // Check if continue watching entry exists
    const { data: existing } = await supabase
      .from('continue_watching')
      .select('*')
      .eq('profile_id', profileId)
      .eq('content_id', contentId)
      .single();

    if (existing) {
      // Update existing entry
      const { data, error } = await supabase
        .from('continue_watching')
        .update({
          current_time: currentTime,
          total_duration: totalDuration,
          last_watched: new Date().toISOString(),
          device_info: deviceInfo,
          session_id: sessionId,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new entry
      const { data, error } = await supabase
        .from('continue_watching')
        .insert({
          profile_id: profileId,
          content_id: contentId,
          content_type: contentType,
          current_time: currentTime,
          total_duration: totalDuration,
          device_info: deviceInfo,
          session_id: sessionId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }

  async getContinueWatching(profileId: string): Promise<ContinueWatching[]> {
    const { data, error } = await supabase
      .from('continue_watching')
      .select('*')
      .eq('profile_id', profileId)
      .order('last_watched', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async removeFromContinueWatching(profileId: string, contentId: string): Promise<void> {
    const { error } = await supabase
      .from('continue_watching')
      .delete()
      .eq('profile_id', profileId)
      .eq('content_id', contentId);

    if (error) throw error;
  }

  // Personalized Carousels
  async generatePersonalizedCarousels(profileId: string): Promise<PersonalizedCarousel[]> {
    // This would typically integrate with the recommendation engine
    // For now, we'll create some basic carousels
    const carousels: Omit<PersonalizedCarousel, 'id' | 'created_at' | 'updated_at'>[] = [
      {
        profile_id: profileId,
        title: 'Continue Watching',
        content_ids: [],
        content_type: 'movie',
        algorithm: 'recent',
        position: 1,
      },
      {
        profile_id: profileId,
        title: 'Trending Now',
        content_ids: [],
        content_type: 'movie',
        algorithm: 'trending',
        position: 2,
      },
      {
        profile_id: profileId,
        title: 'Recommended for You',
        content_ids: [],
        content_type: 'movie',
        algorithm: 'recommended',
        position: 3,
      },
    ];

    const { data, error } = await supabase
      .from('personalized_carousels')
      .insert(carousels)
      .select();

    if (error) throw error;
    return data || [];
  }

  async getPersonalizedCarousels(profileId: string): Promise<PersonalizedCarousel[]> {
    const { data, error } = await supabase
      .from('personalized_carousels')
      .select('*')
      .eq('profile_id', profileId)
      .order('position', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async updateCarouselContent(carouselId: string, contentIds: string[]): Promise<void> {
    const { error } = await supabase
      .from('personalized_carousels')
      .update({
        content_ids: contentIds,
        updated_at: new Date().toISOString(),
      })
      .eq('id', carouselId);

    if (error) throw error;
  }

  // Parental Controls
  async setParentalControls(profileId: string, settings: Partial<ParentalControlSettings>): Promise<ParentalControlSettings> {
    const { data, error } = await supabase
      .from('parental_controls')
      .upsert({
        profile_id: profileId,
        max_age_rating: settings.max_age_rating || 18,
        blocked_genres: settings.blocked_genres || [],
        blocked_content: settings.blocked_content || [],
        time_restrictions: settings.time_restrictions || [],
        require_pin: settings.require_pin || false,
        pin_code: settings.pin_code,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getParentalControls(profileId: string): Promise<ParentalControlSettings | null> {
    const { data, error } = await supabase
      .from('parental_controls')
      .select('*')
      .eq('profile_id', profileId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async verifyParentalPin(profileId: string, pin: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('parental_controls')
      .select('pin_code')
      .eq('profile_id', profileId)
      .single();

    if (error) return false;
    return data?.pin_code === pin;
  }

  // Content Filtering
  async isContentAllowed(profileId: string, contentId: string, contentType: 'movie' | 'music'): Promise<boolean> {
    const profile = await this.getProfile(profileId);
    if (!profile) return false;

    // Check if it's a kids profile
    if (profile.is_kids_profile) {
      // Get content details and check age rating
      const table = contentType === 'movie' ? 'movies' : 'music';
      const { data: content } = await supabase
        .from(table)
        .select('age_rating, genre')
        .eq('id', contentId)
        .single();

      if (content) {
        // Check age rating
        if (content.age_rating && profile.age_rating_limit && content.age_rating > profile.age_rating_limit) {
          return false;
        }

        // Check parental controls
        const parentalControls = await this.getParentalControls(profileId);
        if (parentalControls) {
          // Check blocked genres
          if (content.genre && parentalControls.blocked_genres.includes(content.genre)) {
            return false;
          }

          // Check blocked content
          if (parentalControls.blocked_content.includes(contentId)) {
            return false;
          }

          // Check time restrictions
          const now = new Date();
          const currentHour = now.getHours();
          const currentDay = now.getDay();

          for (const restriction of parentalControls.time_restrictions) {
            if (restriction.days.includes(currentDay)) {
              const startHour = parseInt(restriction.start_time.split(':')[0]);
              const endHour = parseInt(restriction.end_time.split(':')[0]);

              if (currentHour >= startHour && currentHour <= endHour) {
                return false;
              }
            }
          }
        }
      }
    }

    return true;
  }

  // Helper Methods
  private getDefaultViewingPreferences(): ViewingPreferences {
    return {
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
    };
  }

  private async getProfile(profileId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Analytics and Insights
  async getProfileAnalytics(profileId: string): Promise<any> {
    const [watchlist, recentlyWatched, continueWatching] = await Promise.all([
      this.getWatchlist(profileId),
      this.getRecentlyWatched(profileId, 50),
      this.getContinueWatching(profileId),
    ]);

    const totalWatchTime = recentlyWatched.reduce((sum, item) => sum + item.watch_time, 0);
    const averageCompletion = recentlyWatched.reduce((sum, item) => sum + item.completion_percentage, 0) / recentlyWatched.length;

    return {
      watchlist_count: watchlist.length,
      recently_watched_count: recentlyWatched.length,
      continue_watching_count: continueWatching.length,
      total_watch_time: totalWatchTime,
      average_completion_rate: averageCompletion || 0,
      most_watched_genres: this.getMostWatchedGenres(recentlyWatched),
      watch_patterns: this.analyzeWatchPatterns(recentlyWatched),
    };
  }

  private getMostWatchedGenres(recentlyWatched: RecentlyWatched[]): string[] {
    // This would typically query the content tables to get genres
    // For now, return empty array
    return [];
  }

  private analyzeWatchPatterns(recentlyWatched: RecentlyWatched[]): any {
    // Analyze watch patterns (time of day, day of week, etc.)
    return {
      peak_watch_hours: [],
      most_active_days: [],
      average_session_length: 0,
    };
  }
}

export const personalizationService = new PersonalizationService();

