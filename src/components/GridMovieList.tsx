import { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Star, 
  Clock, 
  Plus, 
  Check, 
  Info, 
  ChevronUp, 
  ChevronDown
} from 'lucide-react';
import { Movie } from '../lib/supabase';
import { AutoThumbnail } from './AutoThumbnail';

interface GridMovieListProps {
  movies: Movie[];
  title: string;
  subtitle?: string;
  onPlay: (movie: Movie) => void;
  onInfo?: (movie: Movie) => void;
  onAddToList?: (movie: Movie) => void;
  isInList?: (movie: Movie) => boolean;
  className?: string;
}

export const GridMovieList = memo(({
  movies,
  title,
  subtitle,
  onPlay,
  onInfo,
  onAddToList,
  isInList,
  className = ''
}: GridMovieListProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  // Check scroll capabilities
  const updateScrollState = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const { scrollTop, scrollHeight, clientHeight } = container;
    
    setScrollPosition(scrollTop);
    setCanScrollUp(scrollTop > 0);
    setCanScrollDown(scrollTop < scrollHeight - clientHeight - 1);
  }, []);

  // Smooth scroll functions
  const scrollTo = useCallback((direction: 'up' | 'down', amount: number = 300) => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const currentScroll = container.scrollTop;
    const targetScroll = direction === 'up' 
      ? Math.max(0, currentScroll - amount)
      : currentScroll + amount;

    container.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });
  }, []);

  // Handle scroll events
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      updateScrollState();
      setIsScrolling(true);
      
      // Clear scrolling state after scroll ends
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => setIsScrolling(false), 150);
    };

    let scrollTimeout: NodeJS.Timeout;
    container.addEventListener('scroll', handleScroll, { passive: true });
    updateScrollState();

    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [updateScrollState]);

  const formatDuration = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }, []);

  if (movies.length === 0) {
    return (
      <div className={`mb-8 ${className}`}>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
          {subtitle && <p className="text-slate-400">{subtitle}</p>}
        </div>
        <div className="bg-slate-800/30 rounded-xl p-8 text-center">
          <p className="text-slate-400">No movies available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        {subtitle && <p className="text-slate-400">{subtitle}</p>}
      </div>

      {/* Scroll Buttons */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => scrollTo('up')}
        disabled={!canScrollUp}
        className={`absolute right-4 top-16 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          canScrollUp
            ? 'bg-slate-700 hover:bg-slate-600 text-white shadow-lg'
            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
        }`}
      >
        <ChevronUp className="w-5 h-5" />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => scrollTo('down')}
        disabled={!canScrollDown}
        className={`absolute right-4 bottom-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          canScrollDown
            ? 'bg-slate-700 hover:bg-slate-600 text-white shadow-lg'
            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
        }`}
      >
        <ChevronDown className="w-5 h-5" />
      </motion.button>

      {/* Grid Container with Vertical Scrolling */}
      <div
        ref={scrollContainerRef}
        className="relative overflow-y-auto scrollbar-hide pr-4"
        style={{ 
          maxHeight: '600px',
          scrollBehavior: 'smooth'
        }}
      >
        {/* 3-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useMemo(() => movies.map((movie, index) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onPlay(movie)}
              className="group relative cursor-pointer transition-all duration-300"
            >
              {/* Movie Card */}
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg group-hover:shadow-2xl transition-all duration-300">
                <AutoThumbnail
                  videoUrl={movie.video_url}
                  fallbackUrl={movie.thumbnail_url}
                  alt={movie.title}
                  className="w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out"
                  width={400}
                  height={225}
                  timeOffset={5}
                  quality={0.8}
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Top Badges */}
                <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {movie.rating && (
                    <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
                      <Star className="w-3 h-3 text-yellow-400" fill="currentColor" />
                      <span className="text-white text-xs font-medium">{movie.rating}</span>
                    </div>
                  )}
                </div>

                {/* Duration Badge */}
                {movie.duration && (
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-white" />
                      <span className="text-white text-xs">{formatDuration(movie.duration)}</span>
                    </div>
                  </div>
                )}

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-16 h-16 bg-white/95 hover:bg-white rounded-full flex items-center justify-center shadow-2xl"
                  >
                    <Play className="w-6 h-6 text-slate-900 ml-1" fill="currentColor" />
                  </motion.div>
                </div>

                {/* Action Buttons */}
                <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  {onAddToList && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToList(movie);
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        isInList?.(movie)
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-black/60 hover:bg-black/80 text-white'
                      }`}
                    >
                      {isInList?.(movie) ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </motion.button>
                  )}

                  {onInfo && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onInfo(movie);
                      }}
                      className="w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
                    >
                      <Info className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Movie Info */}
              <div className="mt-4 px-1">
                <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2 group-hover:text-blue-300 transition-colors">
                  {movie.title}
                </h3>
                
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                  {movie.release_year && <span>{movie.release_year}</span>}
                  {movie.category && (
                    <>
                      <span>•</span>
                      <span className="truncate">{movie.category}</span>
                    </>
                  )}
                </div>

                {/* Description */}
                {movie.description && (
                  <p className="text-slate-400 text-sm line-clamp-2">
                    {movie.description}
                  </p>
                )}
              </div>
            </motion.div>
          )), [movies, onPlay, onInfo, onAddToList, isInList, formatDuration])}
        </div>
      </div>

      {/* Scroll Progress Indicator */}
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          className="w-full bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"
          initial={{ height: 0 }}
          animate={{ 
            height: scrollContainerRef.current 
              ? `${(scrollPosition / (scrollContainerRef.current.scrollHeight - scrollContainerRef.current.clientHeight)) * 100}%`
              : 0
          }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Scroll Status */}
      <AnimatePresence>
        {isScrolling && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-800/90 backdrop-blur-sm px-3 py-1 rounded-lg"
          >
            <p className="text-white text-sm">
              {Math.round((scrollPosition / (scrollContainerRef.current?.scrollHeight || 1)) * 100)}%
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
