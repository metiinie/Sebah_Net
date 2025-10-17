import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Play, 
  Eye, 
  Calendar,
  Filter,
  Grid,
  List,
  RotateCcw
} from 'lucide-react';
import { personalizationService, RecentlyWatched as RecentlyWatchedType, UserProfile } from '../lib/personalizationService';
import { supabase } from '../lib/supabase';

interface RecentlyWatchedProps {
  profile: UserProfile;
  onPlayContent?: (contentId: string, contentType: 'movie' | 'music') => void;
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

export const RecentlyWatched: React.FC<RecentlyWatchedProps> = ({
  profile,
  onPlayContent,
  className = ''
}) => {
  const [recentlyWatchedItems, setRecentlyWatchedItems] = useState<RecentlyWatchedType[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'music'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'completion'>('recent');

  useEffect(() => {
    if (profile) {
      loadRecentlyWatched();
    }
  }, [profile]);

  const loadRecentlyWatched = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      const items = await personalizationService.getRecentlyWatched(profile.id, 50);
      setRecentlyWatchedItems(items);

      // Load content details for each recently watched item
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
      console.error('Error loading recently watched:', error);
    } finally {
      setLoading(false);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-500';
    if (percentage >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getCompletionLabel = (percentage: number) => {
    if (percentage >= 90) return 'Completed';
    if (percentage >= 50) return 'Mostly Watched';
    return 'Started';
  };

  const filteredAndSortedItems = recentlyWatchedItems
    .filter(item => {
      if (filterType !== 'all' && item.content_type !== filterType) return false;
      return true;
    })
    .sort((a, b) => {
      const contentA = contentItems.find(c => c.id === a.content_id);
      const contentB = contentItems.find(c => c.id === b.content_id);
      
      switch (sortBy) {
        case 'title':
          return (contentA?.title || '').localeCompare(contentB?.title || '');
        case 'completion':
          return b.completion_percentage - a.completion_percentage;
        case 'recent':
        default:
          return new Date(b.watched_at).getTime() - new Date(a.watched_at).getTime();
      }
    });

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (recentlyWatchedItems.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Eye className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No recently watched content
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Start watching some content to see your history here
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
            Recently Watched
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredAndSortedItems.length} items in your history
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${
              viewMode === 'grid' 
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${
              viewMode === 'list' 
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">All Content</option>
          <option value="movie">Movies</option>
          <option value="music">Music</option>
        </select>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="recent">Most Recent</option>
          <option value="title">Title A-Z</option>
          <option value="completion">Completion %</option>
        </select>
      </div>

      {/* Recently Watched Items */}
      <div className={
        viewMode === 'grid' 
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
          : 'space-y-4'
      }>
        {filteredAndSortedItems.map((item) => {
          const contentItem = contentItems.find(c => c.id === item.content_id);
          if (!contentItem) return null;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`group relative ${
                viewMode === 'grid' 
                  ? 'bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow'
                  : 'bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow'
              }`}
            >
              {viewMode === 'grid' ? (
                <>
                  {/* Grid View */}
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
                    
                    {/* Completion Badge */}
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.completion_percentage >= 90 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : item.completion_percentage >= 50
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {Math.round(item.completion_percentage)}%
                      </span>
                    </div>
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                      <button
                        onClick={() => onPlayContent?.(contentItem.id, contentItem.type)}
                        className="opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 bg-white/90 hover:bg-white rounded-full p-3"
                      >
                        <Play className="w-6 h-6 text-gray-900 ml-1" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                      {contentItem.title}
                    </h3>
                    
                    {contentItem.type === 'music' && contentItem.artist && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        by {contentItem.artist}
                      </p>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className={`font-medium ${getCompletionColor(item.completion_percentage)}`}>
                          {getCompletionLabel(item.completion_percentage)}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {formatDuration(item.watch_time)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(item.watched_at)}</span>
                        </div>
                        {item.device_info && (
                          <span className="truncate max-w-20">{item.device_info}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* List View */}
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0 relative">
                      {contentItem.thumbnail_url ? (
                        <img
                          src={contentItem.thumbnail_url}
                          alt={contentItem.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {contentItem.type === 'movie' ? (
                            <Play className="w-8 h-8 text-gray-400" />
                          ) : (
                            <Clock className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                      )}
                      
                      {/* Completion Badge */}
                      <div className="absolute top-1 left-1">
                        <span className={`px-1 py-0.5 rounded text-xs font-medium ${
                          item.completion_percentage >= 90 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : item.completion_percentage >= 50
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {Math.round(item.completion_percentage)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {contentItem.title}
                      </h3>
                      
                      {contentItem.type === 'music' && contentItem.artist && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          by {contentItem.artist}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-2">
                        <span className={`font-medium ${getCompletionColor(item.completion_percentage)}`}>
                          {getCompletionLabel(item.completion_percentage)}
                        </span>
                        <span>{formatDuration(item.watch_time)} watched</span>
                        <span>{formatDate(item.watched_at)}</span>
                      </div>
                      
                      {contentItem.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {contentItem.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onPlayContent?.(contentItem.id, contentItem.type)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        <Play className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
