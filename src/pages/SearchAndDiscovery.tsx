import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  TrendingUp, 
  Clock, 
  Star,
  Play,
  Heart,
  Bookmark,
  Share2,
  Eye,
  ThumbsUp,
  Sparkles,
  Users,
  Calendar,
  Music,
  Film
} from 'lucide-react';
import { AdvancedSearchEngine } from '../components/AdvancedSearchEngine';
import { RecommendationEngine } from '../components/RecommendationEngine';
import { PersonalizedHomeFeed } from '../components/PersonalizedHomeFeed';
import { searchService, SearchResult, SearchFilters, RecommendationContext, TrendingSearch } from '../lib/searchService';
import { usePageNavigation } from '../hooks/usePageNavigation';

export const SearchAndDiscovery = () => {
  const { goToChoice } = usePageNavigation();
  const [activeTab, setActiveTab] = useState<'search' | 'discover' | 'trending'>('search');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<TrendingSearch[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});

  // Mock user context for recommendations
  const [userContext, setUserContext] = useState<RecommendationContext>({
    userId: 'user-123',
    viewingHistory: [
      {
        id: '1',
        type: 'movie',
        genre: 'Action',
        rating: 8.5,
        watchTime: 7200, // 2 hours
        completed: true,
        timestamp: new Date(Date.now() - 86400000) // 1 day ago
      },
      {
        id: '2',
        type: 'music',
        genre: 'Rock',
        rating: 9.0,
        watchTime: 300, // 5 minutes
        completed: true,
        timestamp: new Date(Date.now() - 172800000) // 2 days ago
      }
    ],
    preferences: {
      favoriteGenres: ['Action', 'Rock', 'Sci-Fi'],
      preferredLanguages: ['English'],
      averageWatchTime: 45,
      completionRate: 75
    },
    timeOfDay: 'evening',
    deviceType: 'desktop'
  });

  useEffect(() => {
    loadTrendingSearches();
  }, []);

  const loadTrendingSearches = async () => {
    const trending = searchService.getTrendingSearches(20);
    setTrendingSearches(trending);
  };

  const handleSearch = useCallback(async (query: string, filters: SearchFilters) => {
    setSearchQuery(query);
    setSearchFilters(filters);
    setIsSearching(true);

    try {
      const results = await searchService.search({ ...filters, query });
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleResultClick = useCallback((result: SearchResult) => {
    // Track click and navigate to content
    searchService.trackSearchClick(searchQuery, result.id);
    console.log('Navigate to:', result);
  }, [searchQuery]);

  const handleRecommendationClick = useCallback((recommendation: any) => {
    console.log('Recommendation clicked:', recommendation);
  }, []);

  const handleItemLike = useCallback((item: any) => {
    console.log('Item liked:', item);
  }, []);

  const handleItemBookmark = useCallback((item: any) => {
    console.log('Item bookmarked:', item);
  }, []);

  const handleItemShare = useCallback((item: any) => {
    console.log('Item shared:', item);
  }, []);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatRating = (rating: number) => {
    return rating.toFixed(1);
  };

  const tabs = [
    { id: 'search', label: 'Search', icon: Search },
    { id: 'discover', label: 'Discover', icon: Sparkles },
    { id: 'trending', label: 'Trending', icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={goToChoice}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </motion.button>
            <h1 className="text-3xl font-bold text-white">Search & Discovery</h1>
            <div className="w-20" />
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Tab */}
        {activeTab === 'search' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Search Engine */}
            <div className="max-w-4xl mx-auto">
              <AdvancedSearchEngine
                onResultsChange={setSearchResults}
                onSearch={handleSearch}
                placeholder="Search movies, music, actors, genres..."
                showFilters={true}
                showSuggestions={true}
                showTrending={true}
                autoFocus={true}
              />
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-6">
                  Search Results ({searchResults.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {searchResults.map((result, index) => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.05, y: -8 }}
                      onClick={() => handleResultClick(result)}
                      className="group cursor-pointer"
                    >
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-slate-800 mb-3">
                        {result.thumbnailUrl ? (
                          <img
                            src={result.thumbnailUrl}
                            alt={result.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {result.type === 'movie' ? (
                              <Film className="w-12 h-12 text-slate-500" />
                            ) : (
                              <Music className="w-12 h-12 text-slate-500" />
                            )}
                          </div>
                        )}
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <Play className="w-8 h-8 text-white ml-1" fill="white" />
                          </div>
                        </div>

                        {/* Rating Badge */}
                        {result.rating && (
                          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                            <span className="text-white text-sm font-medium">{formatRating(result.rating)}</span>
                          </div>
                        )}

                        {/* Type Badge */}
                        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg">
                          <span className="text-white text-xs font-medium uppercase">
                            {result.type}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-white font-semibold line-clamp-1 group-hover:text-blue-400 transition-colors">
                          {result.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <span>{result.genre}</span>
                          {result.releaseYear && (
                            <>
                              <span>•</span>
                              <span>{result.releaseYear}</span>
                            </>
                          )}
                          {result.duration && (
                            <>
                              <span>•</span>
                              <span>{formatDuration(result.duration)}</span>
                            </>
                          )}
                        </div>
                        {result.description && (
                          <p className="text-slate-500 text-sm line-clamp-2">
                            {result.description}
                          </p>
                        )}
                        {result.actors && result.actors.length > 0 && (
                          <p className="text-slate-400 text-xs">
                            {result.actors.slice(0, 2).join(', ')}
                            {result.actors.length > 2 && '...'}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {searchQuery && searchResults.length === 0 && !isSearching && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
                <p className="text-slate-400 mb-4">
                  Try adjusting your search terms or filters
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Clear Search
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Discover Tab */}
        {activeTab === 'discover' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <PersonalizedHomeFeed
              userId={userContext.userId}
              viewingHistory={userContext.viewingHistory}
              preferences={userContext.preferences}
              onItemClick={handleRecommendationClick}
              onItemLike={handleItemLike}
              onItemBookmark={handleItemBookmark}
              onItemShare={handleItemShare}
            />
          </motion.div>
        )}

        {/* Trending Tab */}
        {activeTab === 'trending' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Trending Searches</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trendingSearches.map((trending, index) => (
                  <motion.div
                    key={trending.query}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => {
                      setActiveTab('search');
                      handleSearch(trending.query, {});
                    }}
                    className="p-4 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-medium">{trending.query}</h3>
                      <div className="flex items-center gap-1">
                        {trending.trend === 'up' ? (
                          <TrendingUp className="w-4 h-4 text-green-400" />
                        ) : trending.trend === 'down' ? (
                          <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />
                        ) : (
                          <div className="w-4 h-4 bg-slate-400 rounded-full"></div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-400">
                      <span>{trending.count} searches</span>
                      <span className="capitalize">{trending.category}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Trending Content Recommendations */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Trending Content</h2>
              <RecommendationEngine
                context={{
                  ...userContext,
                  currentContent: undefined
                }}
                title=""
                showTitle={false}
                maxItems={12}
                layout="grid"
                onItemClick={handleRecommendationClick}
                onItemLike={handleItemLike}
                onItemBookmark={handleItemBookmark}
                onItemShare={handleItemShare}
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

