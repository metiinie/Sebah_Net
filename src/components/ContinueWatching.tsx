import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Clock, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Tv,
  RotateCcw,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { personalizationService, ContinueWatching as ContinueWatchingType, UserProfile } from '../lib/personalizationService';
import { supabase } from '../lib/supabase';

interface ContinueWatchingProps {
  profile: UserProfile;
  onPlayContent?: (contentId: string, contentType: 'movie' | 'music', resumeTime?: number) => void;
  className?: string;
}

interface ContentItem {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  duration?: number;
  genre?: string;
  rating?: number;
  type: 'movie' | 'music';
  artist?: string;
  album?: string;
}

export const ContinueWatching: React.FC<ContinueWatchingProps> = ({
  profile,
  onPlayContent,
  className = ''
}) => {
  const [continueWatchingItems, setContinueWatchingItems] = useState<ContinueWatchingType[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      loadContinueWatching();
    }
  }, [profile]);

  const loadContinueWatching = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      const items = await personalizationService.getContinueWatching(profile.id);
      setContinueWatchingItems(items);

      // Load content details for each continue watching item
      const contentPromises = items.map(async (item) => {
        const table = item.content_type === 'movie' ? 'movies' : 'music';
        const { data } = await supabase
          .from(table)
          .select('*')
          .eq('id', item.content_id)
          .single();

        if (data) {
          return {
            id: data.id,
            title: data.title,
            description: data.description,
            thumbnail_url: data.thumbnail_url,
            duration: data.duration,
            genre: data.genre,
            rating: data.rating,
            type: item.content_type,
            artist: data.artist,
            album: data.album,
          };
        }
        return null;
      });

      const contentResults = await Promise.all(contentPromises);
      setContentItems(contentResults.filter(Boolean) as ContentItem[]);
    } catch (error) {
      console.error('Error loading continue watching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromContinueWatching = async (contentId: string) => {
    if (!profile) return;

    try {
      await personalizationService.removeFromContinueWatching(profile.id, contentId);
      setContinueWatchingItems(prev => prev.filter(item => item.content_id !== contentId));
      setContentItems(prev => prev.filter(item => item.id !== contentId));
    } catch (error) {
      console.error('Error removing from continue watching:', error);
    }
  };

  const getDeviceIcon = (deviceInfo: string) => {
    const device = deviceInfo.toLowerCase();
    if (device.includes('mobile') || device.includes('phone')) {
      return <Smartphone className="w-4 h-4" />;
    } else if (device.includes('tablet') || device.includes('ipad')) {
      return <Tablet className="w-4 h-4" />;
    } else if (device.includes('tv') || device.includes('roku') || device.includes('apple tv')) {
      return <Tv className="w-4 h-4" />;
    } else {
      return <Monitor className="w-4 h-4" />;
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const getProgressPercentage = (currentTime: number, totalDuration: number) => {
    return Math.min((currentTime / totalDuration) * 100, 100);
  };

  const getRemainingTime = (currentTime: number, totalDuration: number) => {
    const remaining = totalDuration - currentTime;
    return formatDuration(remaining);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (continueWatchingItems.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <RotateCcw className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Nothing to continue watching
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Start watching some content to see it here
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Continue Watching
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Pick up where you left off
          </p>
        </div>
      </div>

      {/* Continue Watching Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {continueWatchingItems.map((item) => {
          const contentItem = contentItems.find(c => c.id === item.content_id);
          if (!contentItem) return null;

          const progressPercentage = getProgressPercentage(item.current_time, item.total_duration);
          const remainingTime = getRemainingTime(item.current_time, item.total_duration);

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                {contentItem.thumbnail_url ? (
                  <img
                    src={contentItem.thumbnail_url}
                    alt={contentItem.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {contentItem.type === 'movie' ? (
                      <Play className="w-12 h-12 text-gray-400" />
                    ) : (
                      <Clock className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                )}
                
                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                  <button
                    onClick={() => onPlayContent?.(contentItem.id, contentItem.type, item.current_time)}
                    className="opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 bg-white/90 hover:bg-white rounded-full p-3"
                  >
                    <Play className="w-6 h-6 text-gray-900 ml-1" />
                  </button>
                </div>
                
                {/* Remove Button */}
                <button
                  onClick={() => handleRemoveFromContinueWatching(item.content_id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-all duration-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              {/* Content Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                  {contentItem.title}
                </h3>
                
                {contentItem.type === 'music' && contentItem.artist && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    by {contentItem.artist}
                  </p>
                )}
                
                {/* Progress Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      {formatDuration(item.current_time)} / {formatDuration(item.total_duration)}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {remainingTime} left
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      {getDeviceIcon(item.device_info)}
                      <span>{item.device_info}</span>
                    </div>
                    <span>{formatTimeAgo(item.last_watched)}</span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center space-x-2 mt-3">
                  <button
                    onClick={() => onPlayContent?.(contentItem.id, contentItem.type, item.current_time)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded-lg transition-colors flex items-center justify-center space-x-1"
                  >
                    <Play className="w-4 h-4" />
                    <span>Resume</span>
                  </button>
                  
                  <button
                    onClick={() => onPlayContent?.(contentItem.id, contentItem.type, 0)}
                    className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm border border-gray-300 dark:border-gray-600 rounded-lg transition-colors"
                  >
                    Restart
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
