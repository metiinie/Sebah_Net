import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Music as MusicIcon } from 'lucide-react';
import { Music as MusicType } from '../lib/supabase';
import { dataService } from '../lib/dataService';
import { Spinner } from '../components/Spinner';
import { SmartMediaPlayer } from '../components/SmartMediaPlayer';
import { UnifiedSearch } from '../components/UnifiedSearch';
import { GridMusicList } from '../components/GridMusicList';
import { usePageNavigation } from '../hooks/usePageNavigation';
import { useLoading } from '../hooks/useLoading';
import { SearchFilters } from '../lib/searchService';

export const Music = () => {
  const { goToChoice } = usePageNavigation();
  const { loading, stopLoading } = useLoading(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [tracks, setTracks] = useState<MusicType[]>([]);
  const [filteredTracks, setFilteredTracks] = useState<MusicType[]>([]);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    type: 'music',
    sortBy: 'title',
    sortOrder: 'asc'
  });
  const [currentTrack, setCurrentTrack] = useState<MusicType | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());

  const fetchTracks = useCallback(async () => {
    try {
      setDataError(null);
      const result = await dataService.fetchMusic();
      if (result && Array.isArray(result)) {
        setTracks(result);
      } else {
        setDataError('Failed to load music. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching music:', error);
      setDataError('Failed to load music. Please check your connection and try again.');
    } finally {
      stopLoading();
    }
  }, [stopLoading]);

  const filterTracks = useCallback(() => {
    let filtered = tracks;

    // Text search
    if (searchFilters.query) {
      filtered = filtered.filter(
        (track) =>
          track.title.toLowerCase().includes(searchFilters.query!.toLowerCase()) ||
          track.artist.toLowerCase().includes(searchFilters.query!.toLowerCase()) ||
          track.album?.toLowerCase().includes(searchFilters.query!.toLowerCase())
      );
    }

    // Genre filter
    if (searchFilters.genre) {
      const g = searchFilters.genre;
      if (Array.isArray(g)) {
        if (g.length > 0) {
          filtered = filtered.filter((track) =>
            g.some(genre => track.genre.toLowerCase().includes(genre.toLowerCase()))
          );
        }
      } else if (g !== 'all') {
        filtered = filtered.filter((track) =>
          track.genre.toLowerCase().includes(g.toLowerCase())
        );
      }
    }

    // Rating filter
    if (searchFilters.rating) {
      const r = searchFilters.rating;
      // If number, treat as min rating; if object, treat as range
      const minRating = typeof r === 'number' ? r : (r.min || 0);
      const maxRating = typeof r === 'number' ? 10 : (r.max || 10);

      filtered = filtered.filter((track) => {
        const trackRating = track.rating || 0;
        return trackRating >= minRating && trackRating <= maxRating;
      });
    }

    // Sort tracks
    filtered.sort((a, b) => {
      let aValue: string | number, bValue: string | number;

      switch (searchFilters.sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'rating':
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case 'popularity':
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case 'date':
          // For music, we might not have date, so fallback to title
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
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

    setFilteredTracks(filtered);
  }, [tracks, searchFilters]);

  useEffect(() => {
    fetchTracks();
  }, [fetchTracks]);

  useEffect(() => {
    filterTracks();
  }, [filterTracks]);


  const playTrack = async (track: MusicType) => {
    if (currentTrack?.id === track.id) {
      togglePlayPause();
    } else {
      setCurrentTrack(track);
      const index = filteredTracks.findIndex(t => t.id === track.id);
      setCurrentTrackIndex(index);
      setAudioError(null);
      setIsPlaying(true);
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const playNext = () => {
    if (!currentTrack) return;
    const nextIndex = (currentTrackIndex + 1) % filteredTracks.length;
    setCurrentTrackIndex(nextIndex);
    setCurrentTrack(filteredTracks[nextIndex]);
    setIsPlaying(true);
  };

  const playPrevious = () => {
    if (!currentTrack) return;
    const prevIndex = currentTrackIndex === 0 ? filteredTracks.length - 1 : currentTrackIndex - 1;
    setCurrentTrackIndex(prevIndex);
    setCurrentTrack(filteredTracks[prevIndex]);
    setIsPlaying(true);
  };


  const handleTimeUpdate = () => {
    // Time update handled by SmartMediaPlayer
  };

  const handleLoadedMetadata = () => {
    setAudioError(null);
  };

  const handleAudioError = () => {
    setAudioError('Failed to load audio. The file may be corrupted or unavailable.');
    setIsPlaying(false);
  };

  const handleAudioLoadStart = () => {
    setAudioError(null);
  };

  const handleAudioCanPlay = () => {
    setAudioError(null);
  };

  const retryFetchTracks = () => {
    setDataError(null);
    fetchTracks();
  };

  const handleLikeTrack = (track: MusicType) => {
    setLikedTracks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(track.id)) {
        newSet.delete(track.id);
      } else {
        newSet.add(track.id);
      }
      return newSet;
    });
  };



  if (loading) {
    return <Spinner label="Loading music..." />;
  }

  if (dataError) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-800/60 border border-slate-700 rounded-xl p-6 text-center">
          <MusicIcon className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <h1 className="text-white text-xl font-semibold mb-2">Unable to Load Music</h1>
          <p className="text-slate-400 mb-4">{dataError}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={retryFetchTracks}
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
    <div className="min-h-screen bg-slate-900 pb-32">
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
            <h1 className="text-3xl font-bold text-white">Music</h1>
          </div>

          <div className="flex flex-col gap-4">
            <UnifiedSearch
              onFiltersChange={setSearchFilters}
              type="music"
              placeholder="Search songs, artists, albums..."
              showAdvanced={true}
            />
          </div>
        </div>
      </div>


      <div className="max-w-7xl mx-auto px-4 py-8">
        {filteredTracks.length === 0 ? (
          <div className="text-center py-20">
            <MusicIcon className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-2">
              {tracks.length === 0 ? 'No music available' : 'No tracks found'}
            </p>
            {tracks.length === 0 ? (
              <p className="text-slate-500 text-sm">
                Music will appear here once it's been uploaded
              </p>
            ) : (
              <p className="text-slate-500 text-sm">
                Try adjusting your search or filter criteria
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            {/* All Tracks in 3-Column Grid */}
            <GridMusicList
              tracks={filteredTracks}
              title="Music Library"
              subtitle={`${filteredTracks.length} ${filteredTracks.length === 1 ? 'track' : 'tracks'} available`}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onTrackSelect={playTrack}
              onLike={handleLikeTrack}
              isLiked={(track) => likedTracks.has(track.id)}
            />
          </div>
        )}
      </div>

      {currentTrack && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-slate-900 via-slate-900 to-slate-900/95 backdrop-blur-lg border-t border-slate-800"
        >
          <div className="max-w-7xl mx-auto px-4 py-4">
            {/* Audio Error Display */}
            {audioError && (
              <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm text-center">{audioError}</p>
              </div>
            )}

            {/* Smart Media Player */}
            <SmartMediaPlayer
              src={currentTrack.audio_url}
              title={currentTrack.title}
              contentId={currentTrack.id}
              artist={currentTrack.artist}
              album={currentTrack.album}
              duration={currentTrack.duration}
              type="audio"
              onNext={playNext}
              onPrevious={playPrevious}
              externalRef={audioRef}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onError={handleAudioError}
              onLoadStart={handleAudioLoadStart}
              onCanPlay={handleAudioCanPlay}
              onEnded={() => {
                // Just stop playing, don't auto-advance
                setIsPlaying(false);
              }}
              autoPlay={isPlaying}
              preload="metadata"
              crossOrigin="anonymous"
              audioTracks={[
                { id: 'default', label: 'Default', language: 'en', url: '' },
                { id: 'en', label: 'English', language: 'en', url: '' },
                { id: 'es', label: 'Spanish', language: 'es', url: '' }
              ]}
              skipSegments={[]}
              enableAutoPlay={false}
              enableResume={true}
              enablePiP={false}
              enableAdaptiveBitrate={false}
            />

            {/* Playlist Info */}
            {filteredTracks.length > 1 && (
              <div className="mt-3 p-2 bg-slate-800/50 rounded-lg">
                <p className="text-slate-400 text-xs text-center">
                  Track {currentTrackIndex + 1} of {filteredTracks.length} •
                  Use ← → keys or player controls to navigate
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

    </div>
  );
};
