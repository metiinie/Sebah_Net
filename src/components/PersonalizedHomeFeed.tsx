import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  TrendingUp, 
  Clock, 
  Star, 
  Heart, 
  Bookmark,
  Share2,
  RefreshCw,
  Sparkles,
  Users,
  Eye,
  ThumbsUp,
  Calendar,
  Music,
  Film
} from 'lucide-react';
import { searchService, Recommendation, RecommendationContext } from '../lib/searchService';
import { RecommendationEngine } from './RecommendationEngine';

interface PersonalizedHomeFeedProps {
  userId?: string;
  viewingHistory?: Array<{
    id: string;
    type: 'movie' | 'music';
    genre: string;
    rating?: number;
    watchTime: number;
    completed: boolean;
    timestamp: Date;
  }>;
  preferences?: {
    favoriteGenres: string[];
    preferredLanguages: string[];
    averageWatchTime: number;
    completionRate: number;
  };
  onItemClick?: (item: Recommendation) => void;
  onItemLike?: (item: Recommendation) => void;
  onItemBookmark?: (item: Recommendation) => void;
  onItemShare?: (item: Recommendation) => void;
}

interface FeedSection {
  id: string;
  title: string;
  type: 'trending' | 'recommended' | 'continue_watching' | 'new_releases' | 'top_rated' | 'similar_to_watched';
  recommendations: Recommendation[];
  isLoading: boolean;
  error?: string;
}

export const PersonalizedHomeFeed = ({
  userId,
  viewingHistory = [],
  preferences,
  onItemClick,
  onItemLike,
  onItemBookmark,
  onItemShare
}: PersonalizedHomeFeedProps) => {
  const [feedSections, setFeedSections] = useState<FeedSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Get current time context
  const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' | 'night' => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  };

  // Get device type
  const getDeviceType = (): 'desktop' | 'mobile' | 'tablet' | 'tv' => {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    if (width < 1920) return 'desktop';
    return 'tv';
  };

  const createRecommendationContext = useCallback((): RecommendationContext => {
    return {
      userId,
      viewingHistory,
      preferences,
      timeOfDay: getTimeOfDay(),
      deviceType: getDeviceType()
    };
  }, [userId, viewingHistory, preferences]);

  const loadFeedSections = useCallback(async () => {
    setIsLoading(true);
    const context = createRecommendationContext();

    const sections: FeedSection[] = [
      {
        id: 'continue_watching',
        title: 'Continue Watching',
        type: 'continue_watching',
        recommendations: [],
        isLoading: true
      },
      {
        id: 'trending',
        title: 'Trending Now',
        type: 'trending',
        recommendations: [],
        isLoading: true
      },
      {
        id: 'recommended',
        title: 'Recommended for You',
        type: 'recommended',
        recommendations: [],
        isLoading: true
      },
      {
        id: 'new_releases',
        title: 'New Releases',
        type: 'new_releases',
        recommendations: [],
        isLoading: true
      },
      {
        id: 'top_rated',
        title: 'Top Rated',
        type: 'top_rated',
        recommendations: [],
        isLoading: true
      },
      {
        id: 'similar_to_watched',
        title: 'Because You Watched',
        type: 'similar_to_watched',
        recommendations: [],
        isLoading: true
      }
    ];

    setFeedSections(sections);

    // Load each section
    try {
      const updatedSections = await Promise.all(
        sections.map(async (section) => {
          try {
            let recommendations: Recommendation[] = [];

            switch (section.type) {
              case 'continue_watching':
                recommendations = await loadContinueWatching(context);
                break;
              case 'trending':
                recommendations = await loadTrending(context);
                break;
              case 'recommended':
                recommendations = await searchService.getRecommendations(context);
                break;
              case 'new_releases':
                recommendations = await loadNewReleases(context);
                break;
              case 'top_rated':
                recommendations = await loadTopRated(context);
                break;
              case 'similar_to_watched':
                recommendations = await loadSimilarToWatched(context);
                break;
            }

            return {
              ...section,
              recommendations: recommendations.slice(0, 12),
              isLoading: false
            };
          } catch (error) {
            console.error(`Error loading ${section.type}:`, error);
            return {
              ...section,
              recommendations: [],
              isLoading: false,
              error: 'Failed to load recommendations'
            };
          }
        })
      );

      setFeedSections(updatedSections);
    } catch (error) {
      console.error('Error loading feed sections:', error);
    } finally {
      setIsLoading(false);
    }
  }, [createRecommendationContext]);

  const loadContinueWatching = async (context: RecommendationContext): Promise<Recommendation[]> => {
    // Get recently watched but not completed items
    const continueWatching = context.viewingHistory
      ?.filter(item => !item.completed && item.watchTime > 0)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10) || [];

    return continueWatching.map(item => ({
      id: item.id,
      title: `Continue: ${item.id}`, // In real app, this would be the actual title
      type: item.type,
      genre: item.genre,
      reason: `Continue watching (${Math.round(item.watchTime / 60)}m watched)`,
      confidence: 0.9,
      thumbnailUrl: undefined,
      description: undefined
    }));
  };

  const loadTrending = async (context: RecommendationContext): Promise<Recommendation[]> => {
    // Get trending content based on current time and device
    const trendingRecs = await searchService.getRecommendations({
      ...context,
      currentContent: undefined
    });

    return trendingRecs
      .filter(rec => rec.reason.includes('Trending') || rec.reason.includes('Perfect for'))
      .slice(0, 12);
  };

  const loadNewReleases = async (context: RecommendationContext): Promise<Recommendation[]> => {
    // Get new releases from the last 30 days
    const currentYear = new Date().getFullYear();
    const searchResults = await searchService.search({
      releaseYear: { min: currentYear },
      sortBy: 'date',
      sortOrder: 'desc',
      limit: 12
    });

    return searchResults.map(result => ({
      id: result.id,
      title: result.title,
      type: result.type,
      genre: result.genre,
      reason: 'New Release',
      confidence: 0.8,
      thumbnailUrl: result.thumbnailUrl,
      description: result.description
    }));
  };

  const loadTopRated = async (context: RecommendationContext): Promise<Recommendation[]> => {
    // Get top rated content
    const searchResults = await searchService.search({
      rating: { min: 8.0 },
      sortBy: 'rating',
      sortOrder: 'desc',
      limit: 12
    });

    return searchResults.map(result => ({
      id: result.id,
      title: result.title,
      type: result.type,
      genre: result.genre,
      reason: `Top Rated (${result.rating}/10)`,
      confidence: 0.85,
      thumbnailUrl: result.thumbnailUrl,
      description: result.description
    }));
  };

  const loadSimilarToWatched = async (context: RecommendationContext): Promise<Recommendation[]> => {
    if (!context.viewingHistory || context.viewingHistory.length === 0) {
      return [];
    }

    // Get content similar to recently watched items
    const recentWatched = context.viewingHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 3);

    const recommendations: Recommendation[] = [];
    for (const item of recentWatched) {
      const similar = await searchService.getRecommendations({
        ...context,
        currentContent: {
          id: item.id,
          type: item.type,
          genre: item.genre
        }
      });
      recommendations.push(...similar.slice(0, 4));
    }

    return recommendations;
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFeedSections();
    setRefreshing(false);
  }, [loadFeedSections]);

  useEffect(() => {
    loadFeedSections();
  }, [loadFeedSections]);

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'continue_watching':
        return <Clock className="w-5 h-5" />;
      case 'trending':
        return <TrendingUp className="w-5 h-5" />;
      case 'recommended':
        return <Sparkles className="w-5 h-5" />;
      case 'new_releases':
        return <Calendar className="w-5 h-5" />;
      case 'top_rated':
        return <Star className="w-5 h-5" />;
      case 'similar_to_watched':
        return <Users className="w-5 h-5" />;
      default:
        return <Play className="w-5 h-5" />;
    }
  };

  const getSectionColor = (type: string) => {
    switch (type) {
      case 'continue_watching':
        return 'text-blue-400';
      case 'trending':
        return 'text-red-400';
      case 'recommended':
        return 'text-purple-400';
      case 'new_releases':
        return 'text-green-400';
      case 'top_rated':
        return 'text-yellow-400';
      case 'similar_to_watched':
        return 'text-cyan-400';
      default:
        return 'text-slate-400';
    }
  };

  if (isLoading) {
    return (
      <div className="personalized-home-feed">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Your Feed</h1>
        </div>
        
        <div className="space-y-8">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="h-6 bg-slate-800 rounded w-48 mb-4"></div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, itemIndex) => (
                  <div key={itemIndex}>
                    <div className="aspect-[2/3] bg-slate-800 rounded-lg mb-3"></div>
                    <div className="h-4 bg-slate-800 rounded mb-2"></div>
                    <div className="h-3 bg-slate-800 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="personalized-home-feed">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Your Feed</h1>
          <p className="text-slate-400 mt-2">
            Personalized recommendations based on your viewing history and preferences
          </p>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Feed Sections */}
      <div className="space-y-12">
        {feedSections.map((section, sectionIndex) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
          >
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className={`${getSectionColor(section.type)}`}>
                {getSectionIcon(section.type)}
              </div>
              <h2 className="text-xl font-semibold text-white">{section.title}</h2>
              {section.recommendations.length > 0 && (
                <span className="text-slate-400 text-sm">
                  ({section.recommendations.length} items)
                </span>
              )}
            </div>

            {/* Section Content */}
            {section.isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="aspect-[2/3] bg-slate-800 rounded-lg mb-3"></div>
                    <div className="h-4 bg-slate-800 rounded mb-2"></div>
                    <div className="h-3 bg-slate-800 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : section.error ? (
              <div className="text-center py-8">
                <div className="text-red-400 mb-2">⚠️</div>
                <p className="text-slate-400">{section.error}</p>
              </div>
            ) : section.recommendations.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-slate-500 mb-2">
                  {getSectionIcon(section.type)}
                </div>
                <p className="text-slate-400">No {section.title.toLowerCase()} available</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {section.recommendations.map((recommendation, index) => (
                  <motion.div
                    key={recommendation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.05, y: -8 }}
                    onClick={() => onItemClick?.(recommendation)}
                    className="group cursor-pointer"
                  >
                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-slate-800 mb-3">
                      {recommendation.thumbnailUrl ? (
                        <img
                          src={recommendation.thumbnailUrl}
                          alt={recommendation.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {recommendation.type === 'movie' ? (
                            <Film className="w-12 h-12 text-slate-500" />
                          ) : (
                            <Music className="w-12 h-12 text-slate-500" />
                          )}
                        </div>
                      )}
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      {/* Play Button */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <Play className="w-8 h-8 text-white ml-1" fill="white" />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onItemLike?.(recommendation);
                          }}
                          className="p-1.5 bg-black/70 backdrop-blur-sm rounded-full text-white hover:bg-red-500 transition-colors"
                          title="Like"
                        >
                          <Heart className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onItemBookmark?.(recommendation);
                          }}
                          className="p-1.5 bg-black/70 backdrop-blur-sm rounded-full text-white hover:bg-blue-500 transition-colors"
                          title="Bookmark"
                        >
                          <Bookmark className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Confidence Badge */}
                      <div className="absolute top-2 right-2">
                        <div className="px-2 py-1 rounded-full text-xs font-medium bg-black/70 backdrop-blur-sm text-white">
                          {Math.round(recommendation.confidence * 100)}%
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-white font-medium text-sm line-clamp-1 group-hover:text-blue-400 transition-colors">
                        {recommendation.title}
                      </h3>
                      <p className="text-slate-400 text-xs">{recommendation.genre}</p>
                      <p className="text-slate-500 text-xs line-clamp-2" title={recommendation.reason}>
                        {recommendation.reason}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Feed Insights */}
      <div className="mt-12 p-6 bg-slate-800/50 rounded-lg">
        <h3 className="text-white font-semibold mb-4">Your Viewing Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400 mb-1">
              {viewingHistory.length}
            </div>
            <div className="text-slate-400 text-sm">Items Watched</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400 mb-1">
              {preferences?.completionRate ? Math.round(preferences.completionRate) : 0}%
            </div>
            <div className="text-slate-400 text-sm">Completion Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400 mb-1">
              {preferences?.favoriteGenres.length || 0}
            </div>
            <div className="text-slate-400 text-sm">Favorite Genres</div>
          </div>
        </div>
      </div>
    </div>
  );
};

