import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Heart, 
  Clock, 
  Star, 
  TrendingUp, 
  Users, 
  Sparkles,
  ThumbsUp,
  Eye,
  Bookmark,
  Share2,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react';
import { searchService, Recommendation, RecommendationContext } from '../lib/searchService';

interface RecommendationEngineProps {
  context: RecommendationContext;
  title?: string;
  showTitle?: boolean;
  maxItems?: number;
  layout?: 'grid' | 'list' | 'carousel';
  onItemClick?: (recommendation: Recommendation) => void;
  onItemLike?: (recommendation: Recommendation) => void;
  onItemBookmark?: (recommendation: Recommendation) => void;
  onItemShare?: (recommendation: Recommendation) => void;
  onRefresh?: () => void;
}

export const RecommendationEngine = ({
  context,
  title = "Recommended for You",
  showTitle = true,
  maxItems = 12,
  layout = 'grid',
  onItemClick,
  onItemLike,
  onItemBookmark,
  onItemShare,
  onRefresh
}: RecommendationEngineProps) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadRecommendations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const recs = await searchService.getRecommendations(context);
      setRecommendations(recs.slice(0, maxItems));
    } catch (err) {
      setError('Failed to load recommendations');
      console.error('Recommendation error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [context, maxItems]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRecommendations();
    setRefreshing(false);
    onRefresh?.();
  }, [loadRecommendations, onRefresh]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const handleItemClick = useCallback((recommendation: Recommendation) => {
    searchService.trackRecommendationClick(recommendation.id, recommendation.reason);
    onItemClick?.(recommendation);
  }, [onItemClick]);

  const handleItemLike = useCallback((recommendation: Recommendation) => {
    onItemLike?.(recommendation);
  }, [onItemLike]);

  const handleItemBookmark = useCallback((recommendation: Recommendation) => {
    onItemBookmark?.(recommendation);
  }, [onItemBookmark]);

  const handleItemShare = useCallback((recommendation: Recommendation) => {
    onItemShare?.(recommendation);
  }, [onItemShare]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  const formatReason = (reason: string) => {
    // Truncate long reasons
    if (reason.length > 50) {
      return reason.substring(0, 50) + '...';
    }
    return reason;
  };

  if (isLoading) {
    return (
      <div className="recommendation-engine">
        {showTitle && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">{title}</h2>
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="aspect-[2/3] bg-slate-800 rounded-lg mb-3"></div>
              <div className="h-4 bg-slate-800 rounded mb-2"></div>
              <div className="h-3 bg-slate-800 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recommendation-engine">
        {showTitle && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">{title}</h2>
          </div>
        )}
        <div className="text-center py-8">
          <div className="text-red-400 mb-2">⚠️</div>
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="recommendation-engine">
        {showTitle && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">{title}</h2>
          </div>
        )}
        <div className="text-center py-8">
          <Sparkles className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400">No recommendations available</p>
          <p className="text-slate-500 text-sm mt-2">
            Watch some content to get personalized recommendations
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="recommendation-engine">
      {showTitle && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      )}

      {layout === 'grid' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {recommendations.map((recommendation, index) => (
            <motion.div
              key={recommendation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -8 }}
              onClick={() => handleItemClick(recommendation)}
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
                    <Play className="w-12 h-12 text-slate-500" />
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

                {/* Confidence Badge */}
                <div className="absolute top-2 right-2">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium bg-black/70 backdrop-blur-sm ${getConfidenceColor(recommendation.confidence)}`}>
                    {getConfidenceText(recommendation.confidence)}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleItemLike(recommendation);
                    }}
                    className="p-1.5 bg-black/70 backdrop-blur-sm rounded-full text-white hover:bg-red-500 transition-colors"
                    title="Like"
                  >
                    <Heart className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleItemBookmark(recommendation);
                    }}
                    className="p-1.5 bg-black/70 backdrop-blur-sm rounded-full text-white hover:bg-blue-500 transition-colors"
                    title="Bookmark"
                  >
                    <Bookmark className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-white font-medium text-sm line-clamp-1 group-hover:text-blue-400 transition-colors">
                  {recommendation.title}
                </h3>
                <p className="text-slate-400 text-xs">{recommendation.genre}</p>
                <p className="text-slate-500 text-xs line-clamp-2" title={recommendation.reason}>
                  {formatReason(recommendation.reason)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {layout === 'list' && (
        <div className="space-y-3">
          {recommendations.map((recommendation, index) => (
            <motion.div
              key={recommendation.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleItemClick(recommendation)}
              className="group flex items-center gap-4 p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
            >
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
                {recommendation.thumbnailUrl ? (
                  <img
                    src={recommendation.thumbnailUrl}
                    alt={recommendation.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="w-6 h-6 text-slate-500" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium group-hover:text-blue-400 transition-colors">
                  {recommendation.title}
                </h3>
                <p className="text-slate-400 text-sm">{recommendation.genre}</p>
                <p className="text-slate-500 text-xs mt-1" title={recommendation.reason}>
                  {recommendation.reason}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className={`px-2 py-1 rounded-full text-xs font-medium bg-slate-700 ${getConfidenceColor(recommendation.confidence)}`}>
                  {getConfidenceText(recommendation.confidence)}
                </div>
                
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleItemLike(recommendation);
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                    title="Like"
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleItemBookmark(recommendation);
                    }}
                    className="p-1.5 text-slate-400 hover:text-blue-400 transition-colors"
                    title="Bookmark"
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleItemShare(recommendation);
                    }}
                    className="p-1.5 text-slate-400 hover:text-green-400 transition-colors"
                    title="Share"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {layout === 'carousel' && (
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {recommendations.map((recommendation, index) => (
              <motion.div
                key={recommendation.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => handleItemClick(recommendation)}
                className="group cursor-pointer flex-shrink-0 w-48"
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
                      <Play className="w-12 h-12 text-slate-500" />
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                    </div>
                  </div>

                  <div className="absolute top-2 right-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium bg-black/70 backdrop-blur-sm ${getConfidenceColor(recommendation.confidence)}`}>
                      {getConfidenceText(recommendation.confidence)}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-white font-medium text-sm line-clamp-1 group-hover:text-blue-400 transition-colors">
                    {recommendation.title}
                  </h3>
                  <p className="text-slate-400 text-xs">{recommendation.genre}</p>
                  <p className="text-slate-500 text-xs line-clamp-2" title={recommendation.reason}>
                    {formatReason(recommendation.reason)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation Insights */}
      {recommendations.length > 0 && (
        <div className="mt-6 p-4 bg-slate-800/50 rounded-lg">
          <h4 className="text-white font-medium mb-3">Why these recommendations?</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            {recommendations.slice(0, 3).map((rec) => (
              <div key={rec.id} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-slate-300">{rec.title}</span>
                <span className="text-slate-500">- {rec.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

