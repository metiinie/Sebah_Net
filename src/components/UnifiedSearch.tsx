import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, SortAsc, SortDesc, Calendar, Star, Clock, Music, Film } from 'lucide-react';
import { SearchFilters } from '../lib/searchService';

interface UnifiedSearchProps {
  onFiltersChange: (filters: SearchFilters) => void;
  type: 'movies' | 'music' | 'all';
  availableCategories?: string[];
  availableGenres?: string[];
  availableYears?: number[];
  placeholder?: string;
  showAdvanced?: boolean;
}

export const UnifiedSearch = ({ 
  onFiltersChange, 
  type, 
  availableCategories = [], 
  availableGenres = [], 
  availableYears = [],
  placeholder,
  showAdvanced = true
}: UnifiedSearchProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    type: type === 'movies' ? 'movie' : type === 'music' ? 'music' : 'all',
    sortBy: 'title',
    sortOrder: 'asc'
  });

  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(filters.query || '');
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.query]);

  // Update parent component when filters change
  useEffect(() => {
    onFiltersChange({ ...filters, query: debouncedQuery });
  }, [debouncedQuery, filters, onFiltersChange]);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      type: type === 'movies' ? 'movie' : type === 'music' ? 'music' : 'all',
      sortBy: 'title',
      sortOrder: 'asc'
    });
  };

  const hasActiveFilters = filters.genre?.length || filters.releaseYear || filters.rating || filters.duration;

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    switch (type) {
      case 'movies':
        return 'Search movies, actors, directors...';
      case 'music':
        return 'Search songs, artists, albums...';
      default:
        return 'Search movies, music, artists...';
    }
  };

  const getGenres = () => {
    if (type === 'music') {
      return ['all', 'pop', 'rock', 'hip-hop', 'electronic', 'jazz', 'classical', 'country', 'r&b', 'alternative'];
    } else if (type === 'movies') {
      return ['all', 'action', 'comedy', 'drama', 'horror', 'sci-fi', 'romance', 'thriller', 'documentary', 'animation'];
    }
    return ['all', ...availableGenres];
  };

  const getCategories = () => {
    if (type === 'music') {
      return ['all', 'songs', 'albums', 'artists', 'playlists'];
    } else if (type === 'movies') {
      return ['all', 'feature films', 'series', 'documentaries', 'shorts'];
    }
    return ['all', ...availableCategories];
  };

  return (
    <div className="w-full">
      {/* Main Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={filters.query || ''}
          onChange={(e) => handleFilterChange('query', e.target.value)}
          placeholder={getPlaceholder()}
          className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
        />
        {filters.query && (
          <button
            onClick={() => handleFilterChange('query', '')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Advanced Filters Toggle */}
      {showAdvanced && (
        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
          >
            <Filter className="w-4 h-4" />
            Advanced Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
            )}
          </button>
          
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-slate-400 hover:text-white transition-colors text-sm"
            >
              Clear All
            </button>
          )}
        </div>
      )}

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {isExpanded && showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  {getCategories().map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Genre Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Genre
                </label>
                <select
                  value={filters.genre}
                  onChange={(e) => handleFilterChange('genre', e.target.value)}
                  className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  {getGenres().map(genre => (
                    <option key={genre} value={genre}>
                      {genre.charAt(0).toUpperCase() + genre.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Year
                </label>
                <select
                  value={filters.year}
                  onChange={(e) => handleFilterChange('year', e.target.value)}
                  className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="">All Years</option>
                  {availableYears.length > 0 ? (
                    availableYears.map(year => (
                      <option key={year} value={year.toString()}>
                        {year}
                      </option>
                    ))
                  ) : (
                    Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year.toString()}>
                        {year}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Min Rating
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={filters.rating}
                    onChange={(e) => handleFilterChange('rating', parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-white text-sm min-w-[2rem]">
                    {filters.rating > 0 ? filters.rating.toFixed(1) : 'Any'}
                  </span>
                </div>
              </div>
            </div>

            {/* Sort Options */}
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-300">Sort by:</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="p-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="title">Title</option>
                  <option value="date">Date</option>
                  <option value="rating">Rating</option>
                  <option value="duration">Duration</option>
                </select>
              </div>
              
              <button
                onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                className="flex items-center gap-1 p-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded text-white text-sm transition-colors"
              >
                {filters.sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                {filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
