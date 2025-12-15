import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Star, Clock, ArrowLeft, X, Film, Plus, Heart } from 'lucide-react';
import { Movie } from '../lib/supabase';
import { SearchFilters } from '../lib/searchService';
import { dataService } from '../lib/dataService';
import { Spinner } from '../components/Spinner';
import { UnifiedSearch } from '../components/UnifiedSearch';
import { SmartMediaPlayer } from '../components/SmartMediaPlayer';
import { GridMovieList } from '../components/GridMovieList';
import { usePageNavigation } from '../hooks/usePageNavigation';
import { useLoading } from '../hooks/useLoading';

export const Movies = () => {
  const { goToChoice } = usePageNavigation();
  const { loading, stopLoading } = useLoading(true);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [currentMovieIndex, setCurrentMovieIndex] = useState(0);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    category: '',
    genre: '',
    year: '',
    rating: 0,
    duration: '',
    sortBy: 'title',
    sortOrder: 'asc'
  });
  const [dataError, setDataError] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchMovies();
  }, []);

  useEffect(() => {
    filterMovies();
  }, [searchFilters, movies]);

  const fetchMovies = async () => {
    try {
      setDataError(null);
      const result = await dataService.fetchMovies();
      console.log('Fetched movies:', result);

      // Log fetched movies for debugging
      console.log('Successfully fetched movies:', result.length);

      if (result && Array.isArray(result)) {
        setMovies(result);
      } else {
        setDataError('Failed to load movies. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
      setDataError('Failed to load movies. Please check your connection and try again.');
    } finally {
      stopLoading();
    }
  };

  const filterMovies = () => {
    let filtered = movies;

    // Text search
    if (searchFilters.query) {
      filtered = filtered.filter(
        (movie) =>
          movie.title.toLowerCase().includes((searchFilters.query || '').toLowerCase()) ||
          movie.description?.toLowerCase().includes((searchFilters.query || '').toLowerCase())
      );
    }

    // Category filter
    if (searchFilters.category) {
      filtered = filtered.filter((movie) => movie.category === searchFilters.category);
    }

    // Genre filter
    if (searchFilters.genre) {
      filtered = filtered.filter((movie) => movie.category === searchFilters.genre);
    }

    // Year filter
    if (searchFilters.year) {
      const year = parseInt(searchFilters.year);
      filtered = filtered.filter((movie) => movie.release_year === year);
    }

    // Rating filter
    if (searchFilters.rating) {
      const r = searchFilters.rating;
      const minRating = typeof r === 'number' ? r : (r.min || 0);
      filtered = filtered.filter((movie) => movie.rating >= minRating);
    }

    // Duration filter
    if (searchFilters.duration) {
      filtered = filtered.filter((movie) => {
        const duration = movie.duration || 0;
        const d = searchFilters.duration;

        // Handle explicit string enum values
        if (typeof d === 'string') {
          switch (d) {
            case 'short': return duration < 5400; // < 90 min
            case 'medium': return duration >= 5400 && duration <= 9000; // 90-150 min
            case 'long': return duration > 9000; // > 150 min
            default: return true;
          }
        }
        // Handle object range if ever used here (though UI uses string enum)
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (searchFilters.sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'date':
          aValue = a.release_year;
          bValue = b.release_year;
          break;
        case 'rating':
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case 'duration':
          aValue = a.duration || 0;
          bValue = b.duration || 0;
          break;
        default:
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
      }

      if (searchFilters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredMovies(filtered);
  };

  const categories = Array.from(new Set(movies.map((m) => m.category).filter(Boolean)));
  const genres = Array.from(new Set(movies.map((m) => m.category).filter(Boolean)));
  const years = Array.from(new Set(movies.map((m) => m.release_year).filter(Boolean))).sort((a, b) => b - a);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const handleMovieSelect = (movie: Movie) => {
    console.log('Selected movie:', movie.title);
    setSelectedMovie(movie);
    const index = filteredMovies.findIndex(m => m.id === movie.id);
    setCurrentMovieIndex(index);
  };

  const handleNextMovie = () => {
    if (currentMovieIndex < filteredMovies.length - 1) {
      const nextIndex = currentMovieIndex + 1;
      setCurrentMovieIndex(nextIndex);
      setSelectedMovie(filteredMovies[nextIndex]);
    }
  };

  const retryFetchMovies = () => {
    setDataError(null);
    fetchMovies();
  };

  const handlePreviousMovie = () => {
    if (currentMovieIndex > 0) {
      const prevIndex = currentMovieIndex - 1;
      setCurrentMovieIndex(prevIndex);
      setSelectedMovie(filteredMovies[prevIndex]);
    }
  };

  const handleAddToWatchlist = (movie: Movie) => {
    setWatchlist(prev => {
      const newSet = new Set(prev);
      if (newSet.has(movie.id)) {
        newSet.delete(movie.id);
      } else {
        newSet.add(movie.id);
      }
      return newSet;
    });
  };

  const handleMovieInfo = (movie: Movie) => {
    setSelectedMovie(movie);
    const index = filteredMovies.findIndex(m => m.id === movie.id);
    setCurrentMovieIndex(index);
  };

  if (loading) {
    return <Spinner label="Loading movies..." />;
  }

  if (dataError) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-800/60 border border-slate-700 rounded-xl p-6 text-center">
          <Film className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <h1 className="text-white text-xl font-semibold mb-2">Unable to Load Movies</h1>
          <p className="text-slate-400 mb-4">{dataError}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={retryFetchMovies}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={goToChoice}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
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
            <h1 className="text-3xl font-bold text-white">Movies</h1>
          </div>

          <UnifiedSearch
            onFiltersChange={setSearchFilters}
            type="movies"
            placeholder="Search movies, actors, directors..."
            showAdvanced={true}
          />
        </div>
      </div>


      <div className="max-w-7xl mx-auto px-4 py-8">
        {filteredMovies.length === 0 ? (
          <div className="text-center py-20">
            <Film className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-2">
              {movies.length === 0 ? 'No movies available' : 'No movies found'}
            </p>
            {movies.length === 0 ? (
              <p className="text-slate-500 text-sm">
                Movies will appear here once they've been uploaded
              </p>
            ) : (
              <p className="text-slate-500 text-sm">
                Try adjusting your search or filter criteria
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            {/* All Movies in 3-Column Grid */}
            <GridMovieList
              movies={filteredMovies}
              title="Movie Library"
              subtitle={`${filteredMovies.length} ${filteredMovies.length === 1 ? 'movie' : 'movies'} available`}
              onPlay={handleMovieSelect}
              onInfo={handleMovieInfo}
              onAddToList={handleAddToWatchlist}
              isInList={(movie) => watchlist.has(movie.id)}
            />
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedMovie && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedMovie(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-6xl bg-slate-900 rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4 text-slate-400">
                    {selectedMovie.release_year && <span>{selectedMovie.release_year}</span>}
                    {selectedMovie.duration && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatDuration(selectedMovie.duration)}</span>
                      </div>
                    )}
                    {selectedMovie.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                        <span className="text-white">{selectedMovie.rating}/10</span>
                      </div>
                    )}
                    {selectedMovie.category && (
                      <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-sm">
                        {selectedMovie.category.charAt(0).toUpperCase() + selectedMovie.category.slice(1)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedMovie(null)}
                    className="w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition-colors"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>

                {selectedMovie.description && (
                  <p className="text-slate-300 leading-relaxed mb-6">{selectedMovie.description}</p>
                )}


                {/* Smart Media Player */}
                <SmartMediaPlayer
                  src={selectedMovie.video_url}
                  title={selectedMovie.title}
                  contentId={selectedMovie.id}
                  duration={selectedMovie.duration}
                  poster={selectedMovie.thumbnail_url}
                  type="video"
                  onNext={handleNextMovie}
                  onPrevious={handlePreviousMovie}
                  qualityLevels={[
                    { id: 'auto', label: 'Auto', height: 0, bitrate: 0, url: selectedMovie.video_url },
                    { id: '720p', label: '720p HD', height: 720, bitrate: 2500000, url: selectedMovie.video_url },
                    { id: '1080p', label: '1080p FHD', height: 1080, bitrate: 5000000, url: selectedMovie.video_url },
                    { id: '4k', label: '4K UHD', height: 2160, bitrate: 15000000, url: selectedMovie.video_url }
                  ]}
                  subtitleTracks={[
                    { id: 'none', label: 'None', language: 'none', url: '' },
                    { id: 'en', label: 'English', language: 'en', url: '' },
                    { id: 'es', label: 'Spanish', language: 'es', url: '' },
                    { id: 'fr', label: 'French', language: 'fr', url: '' }
                  ]}
                  audioTracks={[
                    { id: 'default', label: 'Default', language: 'en', url: '' },
                    { id: 'en', label: 'English', language: 'en', url: '' },
                    { id: 'es', label: 'Spanish', language: 'es', url: '' }
                  ]}
                  skipSegments={[]}
                  enableAutoPlay={true}
                  enableResume={true}
                  enablePiP={true}
                  enableAdaptiveBitrate={true}
                />

                {/* Playlist Info */}
                {filteredMovies.length > 1 && (
                  <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-slate-400 text-sm">
                      Movie {currentMovieIndex + 1} of {filteredMovies.length} •
                      Use ← → keys or player controls to navigate
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
