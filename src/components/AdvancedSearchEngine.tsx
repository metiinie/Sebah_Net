import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  X, 
  Clock, 
  TrendingUp, 
  Star,
  Calendar,
  Clock as ClockIcon,
  Users,
  Tag,
  Globe,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal
} from 'lucide-react';
import { searchService, SearchFilters, SearchResult, SearchSuggestion, TrendingSearch } from '../lib/searchService';

interface AdvancedSearchEngineProps {
  onResultsChange?: (results: SearchResult[]) => void;
  onSearch?: (query: string, filters: SearchFilters) => void;
  placeholder?: string;
  showFilters?: boolean;
  showSuggestions?: boolean;
  showTrending?: boolean;
  autoFocus?: boolean;
}

export const AdvancedSearchEngine = ({
  onResultsChange,
  onSearch,
  placeholder = "Search movies, music, actors, genres...",
  showFilters = true,
  showSuggestions = true,
  showTrending = true,
  autoFocus = false
}: AdvancedSearchEngineProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<TrendingSearch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [showSuggestionsPanel, setShowSuggestionsPanel] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  // Filter states
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'all',
    sortBy: 'relevance',
    sortOrder: 'desc',
    limit: 20
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsTimeoutRef = useRef<NodeJS.Timeout>();

  // Available filter options
  const genres = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Thriller', 'Romance', 'Adventure', 'Fantasy', 'Mystery', 'Crime', 'Rock', 'Pop', 'Hip-Hop', 'Jazz', 'Classical', 'Electronic'];
  const languages = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian', 'Japanese', 'Korean', 'Chinese'];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  useEffect(() => {
    if (autoFocus && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    loadTrendingSearches();
    loadSearchHistory();
  }, []);

  const loadTrendingSearches = async () => {
    const trending = searchService.getTrendingSearches(10);
    setTrendingSearches(trending);
  };

  const loadSearchHistory = () => {
    const history = searchService.getSearchHistory();
    setSearchHistory(history);
  };

  const handleSearch = useCallback(async (searchQuery: string = query, searchFilters: SearchFilters = filters) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setShowSuggestionsPanel(false);

    try {
      const searchResults = await searchService.search({
        ...searchFilters,
        query: searchQuery
      });

      setResults(searchResults);
      onResultsChange?.(searchResults);
      onSearch?.(searchQuery, searchFilters);

      // Track search
      searchService.trackSearchClick(searchQuery, 'search');
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [query, filters, onResultsChange, onSearch]);

  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);

    // Clear existing timeout
    if (suggestionsTimeoutRef.current) {
      clearTimeout(suggestionsTimeoutRef.current);
    }

    if (newQuery.length >= 2) {
      // Debounce suggestions
      suggestionsTimeoutRef.current = setTimeout(async () => {
        const searchSuggestions = await searchService.getSearchSuggestions(newQuery);
        setSuggestions(searchSuggestions);
        setShowSuggestionsPanel(true);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestionsPanel(false);
    }
  }, []);

  const handleSuggestionClick = useCallback((suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    setShowSuggestionsPanel(false);
    handleSearch(suggestion.text);
  }, [handleSearch]);

  const handleTrendingClick = useCallback((trending: TrendingSearch) => {
    setQuery(trending.query);
    setShowSuggestionsPanel(false);
    handleSearch(trending.query);
  }, [handleSearch]);

  const handleHistoryClick = useCallback((historyItem: string) => {
    setQuery(historyItem);
    setShowSuggestionsPanel(false);
    handleSearch(historyItem);
  }, [handleSearch]);

  const handleFilterChange = useCallback((newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    if (query) {
      handleSearch(query, updatedFilters);
    }
  }, [filters, query, handleSearch]);

  const clearFilters = useCallback(() => {
    const clearedFilters: SearchFilters = {
      type: 'all',
      sortBy: 'relevance',
      sortOrder: 'desc',
      limit: 20
    };
    setFilters(clearedFilters);
    
    if (query) {
      handleSearch(query, clearedFilters);
    }
  }, [query, handleSearch]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
    setShowSuggestionsPanel(false);
    onResultsChange?.([]);
  }, [onResultsChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestionsPanel(false);
      setShowFiltersPanel(false);
    }
  }, [handleSearch]);

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

  return (
    <div className="advanced-search-engine">
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0 || trendingSearches.length > 0 || searchHistory.length > 0) {
                setShowSuggestionsPanel(true);
              }
            }}
            placeholder={placeholder}
            className="w-full pl-11 pr-20 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          {/* Clear and Filter Buttons */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {query && (
              <button
                onClick={clearSearch}
                className="p-1 text-slate-400 hover:text-white transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            
            {showFilters && (
              <button
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                className={`p-1 transition-colors ${
                  showFiltersPanel ? 'text-blue-400' : 'text-slate-400 hover:text-white'
                }`}
                title="Filters"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute right-12 top-1/2 -translate-y-1/2">
            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}

        {/* Suggestions Panel */}
        <AnimatePresence>
          {showSuggestionsPanel && showSuggestions && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto"
            >
              {/* Search Suggestions */}
              {suggestions.length > 0 && (
                <div className="p-2">
                  <div className="text-xs text-slate-400 mb-2 px-2">Suggestions</div>
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full flex items-center gap-3 px-2 py-2 text-left hover:bg-slate-700 rounded transition-colors"
                    >
                      <Search className="w-4 h-4 text-slate-400" />
                      <div className="flex-1">
                        <div className="text-white text-sm">{suggestion.text}</div>
                        {suggestion.category && (
                          <div className="text-xs text-slate-400">{suggestion.category}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Search History */}
              {searchHistory.length > 0 && !query && (
                <div className="p-2 border-t border-slate-700">
                  <div className="text-xs text-slate-400 mb-2 px-2">Recent Searches</div>
                  {searchHistory.slice(0, 5).map((historyItem, index) => (
                    <button
                      key={index}
                      onClick={() => handleHistoryClick(historyItem)}
                      className="w-full flex items-center gap-3 px-2 py-2 text-left hover:bg-slate-700 rounded transition-colors"
                    >
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-white text-sm">{historyItem}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Trending Searches */}
              {trendingSearches.length > 0 && !query && showTrending && (
                <div className="p-2 border-t border-slate-700">
                  <div className="text-xs text-slate-400 mb-2 px-2">Trending</div>
                  {trendingSearches.slice(0, 5).map((trending) => (
                    <button
                      key={trending.query}
                      onClick={() => handleTrendingClick(trending)}
                      className="w-full flex items-center gap-3 px-2 py-2 text-left hover:bg-slate-700 rounded transition-colors"
                    >
                      <TrendingUp className="w-4 h-4 text-slate-400" />
                      <div className="flex-1">
                        <div className="text-white text-sm">{trending.query}</div>
                        <div className="text-xs text-slate-400">{trending.count} searches</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFiltersPanel && showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-slate-800 border border-slate-700 rounded-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">Filters</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Clear all
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Type Filter */}
              <div>
                <label className="block text-sm text-slate-300 mb-2">Type</label>
                <select
                  value={filters.type || 'all'}
                  onChange={(e) => handleFilterChange({ type: e.target.value as any })}
                  className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                >
                  <option value="all">All</option>
                  <option value="movie">Movies</option>
                  <option value="music">Music</option>
                </select>
              </div>

              {/* Genre Filter */}
              <div>
                <label className="block text-sm text-slate-300 mb-2">Genre</label>
                <div className="relative">
                  <select
                    multiple
                    value={filters.genre || []}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      handleFilterChange({ genre: selected });
                    }}
                    className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white text-sm h-20"
                  >
                    {genres.map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Language Filter */}
              <div>
                <label className="block text-sm text-slate-300 mb-2">Language</label>
                <select
                  multiple
                  value={filters.language || []}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    handleFilterChange({ language: selected });
                  }}
                  className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white text-sm h-20"
                >
                  {languages.map(language => (
                    <option key={language} value={language}>{language}</option>
                  ))}
                </select>
              </div>

              {/* Release Year Filter */}
              <div>
                <label className="block text-sm text-slate-300 mb-2">Release Year</label>
                <div className="flex gap-2">
                  <select
                    value={filters.releaseYear?.min || ''}
                    onChange={(e) => handleFilterChange({ 
                      releaseYear: { 
                        ...filters.releaseYear, 
                        min: e.target.value ? parseInt(e.target.value) : undefined 
                      } 
                    })}
                    className="flex-1 p-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  >
                    <option value="">From</option>
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <select
                    value={filters.releaseYear?.max || ''}
                    onChange={(e) => handleFilterChange({ 
                      releaseYear: { 
                        ...filters.releaseYear, 
                        max: e.target.value ? parseInt(e.target.value) : undefined 
                      } 
                    })}
                    className="flex-1 p-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  >
                    <option value="">To</option>
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-sm text-slate-300 mb-2">Rating</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={filters.rating?.min || ''}
                    onChange={(e) => handleFilterChange({ 
                      rating: { 
                        ...filters.rating, 
                        min: e.target.value ? parseFloat(e.target.value) : undefined 
                      } 
                    })}
                    placeholder="Min"
                    className="flex-1 p-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  />
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={filters.rating?.max || ''}
                    onChange={(e) => handleFilterChange({ 
                      rating: { 
                        ...filters.rating, 
                        max: e.target.value ? parseFloat(e.target.value) : undefined 
                      } 
                    })}
                    placeholder="Max"
                    className="flex-1 p-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  />
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-sm text-slate-300 mb-2">Sort by</label>
                <div className="flex gap-2">
                  <select
                    value={filters.sortBy || 'relevance'}
                    onChange={(e) => handleFilterChange({ sortBy: e.target.value as any })}
                    className="flex-1 p-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="title">Title</option>
                    <option value="date">Release Date</option>
                    <option value="rating">Rating</option>
                    <option value="popularity">Popularity</option>
                  </select>
                  <select
                    value={filters.sortOrder || 'desc'}
                    onChange={(e) => handleFilterChange({ sortOrder: e.target.value as any })}
                    className="flex-1 p-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Results Summary */}
      {results.length > 0 && (
        <div className="mt-4 text-sm text-slate-400">
          Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
        </div>
      )}
    </div>
  );
};

