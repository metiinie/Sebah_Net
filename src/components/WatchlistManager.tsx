import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Bookmark, 
  Play, 
  Clock, 
  Star, 
  Filter, 
  Search, 
  Grid, 
  List,
  Trash2,
  MoreVertical,
  Calendar,
  Eye,
  EyeOff
} from 'lucide-react';
import { personalizationService, WatchlistItem, UserProfile } from '../lib/personalizationService';
import { supabase } from '../lib/supabase';

interface WatchlistManagerProps {
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
  release_date?: string;
  type: 'movie' | 'music';
  artist?: string;
  album?: string;
}

export const WatchlistManager: React.FC<WatchlistManagerProps> = ({
  profile,
  onPlayContent,
  className = ''
}) => {
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'music'>('all');
  const [sortBy, setSortBy] = useState<'added' | 'title' | 'rating' | 'duration'>('added');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavorites, setShowFavorites] = useState(false);

  useEffect(() => {
    if (profile) {
      loadWatchlist();
    }
  }, [profile]);

  const loadWatchlist = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      const items = await personalizationService.getWatchlist(profile.id);
      setWatchlistItems(items);

      // Load content details for each watchlist item
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
            release_date: data.release_date,
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
      console.error('Error loading watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWatchlist = async (contentId: string) => {
    if (!profile) return;

    try {
      await personalizationService.removeFromWatchlist(profile.id, contentId);
      setWatchlistItems(prev => prev.filter(item => item.content_id !== contentId));
      setContentItems(prev => prev.filter(item => item.id !== contentId));
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  };

  const handleUpdatePriority = async (contentId: string, priority: number) => {
    if (!profile) return;

    try {
      await personalizationService.updateWatchlistPriority(profile.id, contentId, priority);
      setWatchlistItems(prev => 
        prev.map(item => 
          item.content_id === contentId ? { ...item, priority } : item
        )
      );
    } catch (error) {
      console.error('Error updating priority:', error);
    }
  };

  const filteredAndSortedItems = contentItems
    .filter(item => {
      // Filter by type
      if (filterType !== 'all' && item.type !== filterType) return false;
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.artist?.toLowerCase().includes(query) ||
          item.album?.toLowerCase().includes(query) ||
          item.genre?.toLowerCase().includes(query)
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      const itemA = watchlistItems.find(w => w.content_id === a.id);
      const itemB = watchlistItems.find(w => w.content_id === b.id);
      
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'duration':
          return (b.duration || 0) - (a.duration || 0);
        case 'added':
        default:
          return new Date(itemB?.added_at || 0).getTime() - new Date(itemA?.added_at || 0).getTime();
      }
    });

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Watchlist
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredAndSortedItems.length} items in your watchlist
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

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search your watchlist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
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
            <option value="added">Recently Added</option>
            <option value="title">Title A-Z</option>
            <option value="rating">Highest Rated</option>
            <option value="duration">Duration</option>
          </select>
        </div>
      </div>

      {/* Watchlist Items */}
      {filteredAndSortedItems.length === 0 ? (
        <div className="text-center py-12">
          <Bookmark className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {searchQuery ? 'No items found' : 'Your watchlist is empty'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery 
              ? 'Try adjusting your search terms' 
              : 'Start adding movies and music to your watchlist'
            }
          </p>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }>
          {filteredAndSortedItems.map((item) => {
            const watchlistItem = watchlistItems.find(w => w.content_id === item.id);
            
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
                      {item.thumbnail_url ? (
                        <img
                          src={item.thumbnail_url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {item.type === 'movie' ? (
                            <Play className="w-12 h-12 text-gray-400" />
                          ) : (
                            <Heart className="w-12 h-12 text-gray-400" />
                          )}
                        </div>
                      )}
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                        <button
                          onClick={() => onPlayContent?.(item.id, item.type)}
                          className="opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 bg-white/90 hover:bg-white rounded-full p-3"
                        >
                          <Play className="w-6 h-6 text-gray-900 ml-1" />
                        </button>
                      </div>
                      
                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveFromWatchlist(item.id)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-all duration-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                        {item.title}
                      </h3>
                      
                      {item.type === 'music' && item.artist && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          by {item.artist}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-2">
                          {item.duration && (
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatDuration(item.duration)}</span>
                            </div>
                          )}
                          {item.rating && (
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span>{item.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                        
                        {watchlistItem && (
                          <span className="text-xs">
                            Added {formatDate(watchlistItem.added_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* List View */}
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                        {item.thumbnail_url ? (
                          <img
                            src={item.thumbnail_url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {item.type === 'movie' ? (
                              <Play className="w-8 h-8 text-gray-400" />
                            ) : (
                              <Heart className="w-8 h-8 text-gray-400" />
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {item.title}
                        </h3>
                        
                        {item.type === 'music' && item.artist && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            by {item.artist}
                          </p>
                        )}
                        
                        {item.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                            {item.description}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          {item.duration && (
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatDuration(item.duration)}</span>
                            </div>
                          )}
                          {item.rating && (
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span>{item.rating.toFixed(1)}</span>
                            </div>
                          )}
                          {item.genre && (
                            <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                              {item.genre}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onPlayContent?.(item.id, item.type)}
                          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          <Play className="w-5 h-5" />
                        </button>
                        
                        <button
                          onClick={() => handleRemoveFromWatchlist(item.id)}
                          className="p-2 text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
