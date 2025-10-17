import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Clock, 
  Star, 
  TrendingUp,
  Heart,
  Sparkles,
  Filter,
  RefreshCw
} from 'lucide-react';
import { personalizationService, PersonalizedCarousel, UserProfile } from '../lib/personalizationService';
import { supabase } from '../lib/supabase';

interface PersonalizedCarouselsProps {
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

const CAROUSEL_ALGORITHMS = {
  trending: { icon: TrendingUp, label: 'Trending Now', color: 'text-red-500' },
  recommended: { icon: Sparkles, label: 'Recommended for You', color: 'text-blue-500' },
  similar: { icon: Heart, label: 'More Like This', color: 'text-pink-500' },
  genre: { icon: Filter, label: 'Genre Picks', color: 'text-green-500' },
  recent: { icon: Clock, label: 'Recently Added', color: 'text-purple-500' },
};

export const PersonalizedCarousels: React.FC<PersonalizedCarouselsProps> = ({
  profile,
  onPlayContent,
  className = ''
}) => {
  const [carousels, setCarousels] = useState<PersonalizedCarousel[]>([]);
  const [carouselContent, setCarouselContent] = useState<Record<string, ContentItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [scrollPositions, setScrollPositions] = useState<Record<string, number>>({});

  useEffect(() => {
    if (profile) {
      loadCarousels();
    }
  }, [profile]);

  const loadCarousels = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      let userCarousels = await personalizationService.getPersonalizedCarousels(profile.id);
      
      // If no carousels exist, generate them
      if (userCarousels.length === 0) {
        userCarousels = await personalizationService.generatePersonalizedCarousels(profile.id);
      }

      setCarousels(userCarousels);

      // Load content for each carousel
      const contentPromises = userCarousels.map(async (carousel) => {
        if (carousel.content_ids.length === 0) {
          // Generate content based on algorithm
          const content = await generateCarouselContent(carousel);
          await personalizationService.updateCarouselContent(carousel.id, content.map(c => c.id));
          return content;
        } else {
          // Load existing content
          return await loadCarouselContent(carousel.content_ids, carousel.content_type);
        }
      });

      const contentResults = await Promise.all(contentPromises);
      const contentMap: Record<string, ContentItem[]> = {};
      
      userCarousels.forEach((carousel, index) => {
        contentMap[carousel.id] = contentResults[index] || [];
      });

      setCarouselContent(contentMap);
    } catch (error) {
      console.error('Error loading carousels:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCarouselContent = async (contentIds: string[], contentType: 'movie' | 'music'): Promise<ContentItem[]> => {
    if (contentIds.length === 0) return [];

    const table = contentType === 'movie' ? 'movies' : 'music';
    const { data } = await supabase
      .from(table)
      .select('*')
      .in('id', contentIds);

    if (!data) return [];

    return data.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      thumbnail_url: item.thumbnail_url,
      duration: item.duration,
      genre: item.genre,
      rating: item.rating,
      release_date: item.release_date,
      type: contentType,
      artist: item.artist,
      album: item.album,
    }));
  };

  const generateCarouselContent = async (carousel: PersonalizedCarousel): Promise<ContentItem[]> => {
    const table = carousel.content_type === 'movie' ? 'movies' : 'music';
    let query = supabase.from(table).select('*');

    switch (carousel.algorithm) {
      case 'trending':
        // Get most recently added content
        query = query.order('created_at', { ascending: false });
        break;
      case 'recommended':
        // Get highly rated content
        query = query.order('rating', { ascending: false });
        break;
      case 'similar':
        // Get content with similar genres (would be more sophisticated in real implementation)
        query = query.order('rating', { ascending: false });
        break;
      case 'genre':
        // Get content from popular genres
        query = query.order('rating', { ascending: false });
        break;
      case 'recent':
        // Get recently added content
        query = query.order('created_at', { ascending: false });
        break;
    }

    const { data } = await query.limit(20);

    if (!data) return [];

    return data.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      thumbnail_url: item.thumbnail_url,
      duration: item.duration,
      genre: item.genre,
      rating: item.rating,
      release_date: item.release_date,
      type: carousel.content_type,
      artist: item.artist,
      album: item.album,
    }));
  };

  const scrollCarousel = (carouselId: string, direction: 'left' | 'right') => {
    const container = document.getElementById(`carousel-${carouselId}`);
    if (!container) return;

    const scrollAmount = 300;
    const currentPosition = scrollPositions[carouselId] || 0;
    const newPosition = direction === 'left' 
      ? Math.max(0, currentPosition - scrollAmount)
      : currentPosition + scrollAmount;

    container.scrollTo({
      left: newPosition,
      behavior: 'smooth'
    });

    setScrollPositions(prev => ({
      ...prev,
      [carouselId]: newPosition
    }));
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const refreshCarousel = async (carouselId: string) => {
    const carousel = carousels.find(c => c.id === carouselId);
    if (!carousel) return;

    try {
      const newContent = await generateCarouselContent(carousel);
      await personalizationService.updateCarouselContent(carouselId, newContent.map(c => c.id));
      
      setCarouselContent(prev => ({
        ...prev,
        [carouselId]: newContent
      }));
    } catch (error) {
      console.error('Error refreshing carousel:', error);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (carousels.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Sparkles className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No personalized content available
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Start watching content to get personalized recommendations
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {carousels.map((carousel) => {
        const content = carouselContent[carousel.id] || [];
        const algorithmInfo = CAROUSEL_ALGORITHMS[carousel.algorithm];
        const AlgorithmIcon = algorithmInfo.icon;

        if (content.length === 0) return null;

        return (
          <div key={carousel.id} className="space-y-4">
            {/* Carousel Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 ${algorithmInfo.color}`}>
                  <AlgorithmIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {carousel.title}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {algorithmInfo.label}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => refreshCarousel(carousel.id)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="Refresh recommendations"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => scrollCarousel(carousel.id, 'left')}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                
                <button
                  onClick={() => scrollCarousel(carousel.id, 'right')}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Carousel Content */}
            <div className="relative">
              <div
                id={`carousel-${carousel.id}`}
                className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {content.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative flex-shrink-0 w-64 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
                  >
                    {/* Thumbnail */}
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
                      
                      {/* Rating Badge */}
                      {item.rating && (
                        <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center space-x-1">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{item.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Content Info */}
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
                          {item.genre && (
                            <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                              {item.genre}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
