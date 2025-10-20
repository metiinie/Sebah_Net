import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  Settings,
  Repeat,
  Shuffle,
  Heart,
  Share2,
  Download,
  FastForward,
  Rewind,
  Square,
  PictureInPicture,
  Monitor,
  Wifi,
  WifiOff,
  CheckCircle
} from 'lucide-react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useStreamingAnalytics } from '../hooks/useStreamingAnalytics';
import { usePersonalization } from '../hooks/usePersonalization';

// Type declarations for external libraries
declare global {
  interface Window {
    Hls: typeof import('hls.js').default;
    dashjs: typeof import('dashjs').MediaPlayer;
  }
}

// Types for advanced features
interface QualityLevel {
  id: string;
  label: string;
  height: number;
  bitrate: number;
  url: string;
}

interface SubtitleTrack {
  id: string;
  label: string;
  language: string;
  url: string;
  isDefault?: boolean;
}

interface AudioTrack {
  id: string;
  label: string;
  language: string;
  url: string;
  isDefault?: boolean;
}

interface SkipSegment {
  start: number;
  end: number;
  type: 'intro' | 'recap' | 'credits';
}

interface MediaPlayerProps {
  src: string;
  title: string;
  contentId?: string; // For personalization tracking
  artist?: string;
  album?: string;
  duration?: number;
  poster?: string;
  type: 'audio' | 'video';
  onNext?: () => void;
  onPrevious?: () => void;
  onLike?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
  externalRef?: React.RefObject<HTMLAudioElement | HTMLVideoElement>;
  onTimeUpdate?: () => void;
  onLoadedMetadata?: () => void;
  onError?: () => void;
  onLoadStart?: () => void;
  onCanPlay?: () => void;
  onEnded?: () => void;
  autoPlay?: boolean;
  preload?: string;
  crossOrigin?: string;
  // Advanced features props
  qualityLevels?: QualityLevel[];
  subtitleTracks?: SubtitleTrack[];
  audioTracks?: AudioTrack[];
  skipSegments?: SkipSegment[];
  enableAutoPlay?: boolean;
  enableResume?: boolean;
  enablePiP?: boolean;
  enableAdaptiveBitrate?: boolean;
}

export const SmartMediaPlayer = ({
  src,
  title,
  contentId,
  artist,
  album,
  duration,
  poster,
  type,
  onNext,
  onPrevious,
  onLike,
  onShare,
  onDownload,
  externalRef,
  onTimeUpdate,
  onLoadedMetadata,
  onError,
  onLoadStart,
  onCanPlay,
  onEnded,
  autoPlay,
  preload,
  crossOrigin,
  qualityLevels = [],
  subtitleTracks = [],
  audioTracks = [],
  skipSegments: _skipSegments = [], // eslint-disable-line @typescript-eslint/no-unused-vars
  enableAutoPlay = true,
  enableResume = true,
  enablePiP = true,
  enableAdaptiveBitrate = true
}: MediaPlayerProps) => {
  const internalMediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<import('hls.js').default | null>(null);
  const dashRef = useRef<unknown>(null);
  
  // Basic player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [mediaDuration, setMediaDuration] = useState(duration || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSeekPreview, setShowSeekPreview] = useState(false);
  const [seekTime, setSeekTime] = useState(0);
  const [seekPosition, setSeekPosition] = useState({ x: 0, y: 0 });
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Advanced features state
  const [selectedQuality, setSelectedQuality] = useState<string>('auto');
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>('none');
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<string>('default');
  const [isPiPActive, setIsPiPActive] = useState(false);
  const [networkQuality, setNetworkQuality] = useState<'high' | 'medium' | 'low'>('high');
  const [resumeTime, setResumeTime] = useState(0);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [adaptiveBitrateEnabled, setAdaptiveBitrateEnabled] = useState(enableAdaptiveBitrate);
  
  // Cover page state
  const [showCoverPage, setShowCoverPage] = useState(true);
  const [coverPageTime, setCoverPageTime] = useState(0);

  const mediaRef = externalRef || internalMediaRef;
  const mediaElement = mediaRef.current;

  // Initialize streaming analytics
  const analytics = useStreamingAnalytics({
    mediaId: contentId || title, // Use contentId if available, fallback to title
    enableAnalytics: true,
    enableRealTimeTracking: true
  });

  // Initialize personalization
  const personalization = usePersonalization({
    autoLoadProfile: true,
    enableContinueWatching: enableResume,
    enableWatchlist: true,
    enableRecentlyWatched: true,
  });

  // Load HLS.js and Dash.js dynamically
  useEffect(() => {
    const loadStreamingLibraries = async () => {
      try {
        if (enableAdaptiveBitrate) {
          // Load HLS.js
          const Hls = (await import('hls.js')).default;
          if (Hls.isSupported() && src.includes('.m3u8')) {
            hlsRef.current = new Hls({
              enableWorker: true,
              lowLatencyMode: true,
              backBufferLength: 90
            });
          }

          // Load Dash.js
          const dashjs = await import('dashjs');
          if (src.includes('.mpd')) {
            dashRef.current = dashjs.MediaPlayer().create();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (dashRef.current as any).initialize(mediaElement as HTMLVideoElement, src, false);
          }
        }
      } catch (error) {
        console.warn('Failed to load streaming libraries:', error);
      }
    };

    loadStreamingLibraries();
    
    // Cleanup function
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (dashRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (dashRef.current as any).destroy();
        dashRef.current = null;
      }
    };
  }, [src, enableAdaptiveBitrate, mediaElement]);

  // Resume watching functionality
  useEffect(() => {
    if (enableResume && title) {
      const savedTime = localStorage.getItem(`resume_${title}`);
      if (savedTime) {
        setResumeTime(parseFloat(savedTime));
      }
    }
  }, [title, enableResume]);

  // Save progress for resume watching
  const saveProgress = useCallback(() => {
    const id = contentId || title;
    if (enableResume && id && currentTime > 10) {
      localStorage.setItem(`resume_${id}`, currentTime.toString());
      
      // Update continue watching in personalization
      if (personalization.selectedProfile && mediaDuration > 0) {
        const deviceInfo = navigator.userAgent;
        const sessionId = `session_${Date.now()}`;
        personalization.updateContinueWatching(
          id,
          type === 'video' ? 'movie' : 'music',
          currentTime,
          mediaDuration,
          deviceInfo,
          sessionId
        );
      }
    }
  }, [currentTime, contentId, title, enableResume, personalization, mediaDuration, type]);


  // Network quality detection
  useEffect(() => {
    const updateNetworkQuality = () => {
      if ('connection' in navigator) {
        const connection = (navigator as Navigator & { connection?: { effectiveType: string } }).connection;
        if (connection?.effectiveType === '4g') {
          setNetworkQuality('high');
        } else if (connection?.effectiveType === '3g') {
          setNetworkQuality('medium');
        } else {
          setNetworkQuality('low');
        }
      }
    };

    updateNetworkQuality();
    window.addEventListener('online', updateNetworkQuality);
    window.addEventListener('offline', () => setNetworkQuality('low'));

    return () => {
      window.removeEventListener('online', updateNetworkQuality);
      window.removeEventListener('offline', () => setNetworkQuality('low'));
    };
  }, []);

  // Apply personalization settings
  useEffect(() => {
    if (personalization.selectedProfile) {
      const preferences = personalization.getViewingPreferences();
      if (preferences) {
        // Apply viewing preferences
        setPlaybackRate(preferences.playback_speed);
        setSelectedQuality(preferences.preferred_quality);
        setSelectedSubtitle(preferences.closed_captions ? 'en' : 'none');
        
        // Apply theme if needed (this would typically be handled at app level)
        if (preferences.theme && preferences.theme !== 'auto') {
          document.documentElement.setAttribute('data-theme', preferences.theme);
        }
      }
    }
  }, [personalization]);

  // Load resume time on mount
  useEffect(() => {
    const loadResumeTime = async () => {
      const id = contentId || title;
      if (id && enableResume) {
        const resumeTime = await personalization.getResumeTime(id);
        if (resumeTime && resumeTime > 0) {
          setResumeTime(resumeTime);
          // Auto-resume if enabled in preferences
          const preferences = personalization.getViewingPreferences();
          if (preferences?.auto_play && mediaElement) {
            mediaElement.currentTime = resumeTime;
          }
        }
      }
    };

    loadResumeTime();
  }, [contentId, title, enableResume, personalization, mediaElement]);

  // Reset cover page when video source changes
  useEffect(() => {
    if (type === 'video') {
      setShowCoverPage(true);
      setCoverPageTime(0);
    }
  }, [src, type]);

  // Check content permissions
  useEffect(() => {
    const checkContentPermission = async () => {
      const id = contentId || title;
      if (id) {
        const isAllowed = await personalization.isContentAllowed(id, type === 'video' ? 'movie' : 'music');
        if (!isAllowed) {
          console.warn('This content is not available for your profile');
        }
      }
    };

    checkContentPermission();
  }, [contentId, title, type, personalization]);

  // Check if content is in watchlist
  useEffect(() => {
    const checkWatchlistStatus = async () => {
      const id = contentId || title;
      if (id && personalization.selectedProfile) {
        const inWatchlist = await personalization.isInWatchlist(id);
        setIsLiked(inWatchlist);
      }
    };

    checkWatchlistStatus();
  }, [contentId, title, personalization]);

  // Keyboard shortcuts for advanced features
  const shortcuts = [
    {
      key: ' ',
      action: () => {
        togglePlay();
      },
      description: 'Play/Pause'
    },
    {
      key: 'ArrowLeft',
      action: () => {
        if (mediaElement) {
          const newTime = Math.max(0, mediaElement.currentTime - 10);
          mediaElement.currentTime = newTime;
          setCurrentTime(newTime);
        }
      },
      description: 'Skip back 10 seconds'
    },
    {
      key: 'ArrowRight',
      action: () => {
        if (mediaElement) {
          const newTime = Math.min(mediaElement.duration, mediaElement.currentTime + 10);
          mediaElement.currentTime = newTime;
          setCurrentTime(newTime);
        }
      },
      description: 'Skip forward 10 seconds'
    },
    {
      key: 'ArrowUp',
      action: () => {
        setVolume(Math.min(1, volume + 0.1));
      },
      description: 'Increase volume'
    },
    {
      key: 'ArrowDown',
      action: () => {
        setVolume(Math.max(0, volume - 0.1));
      },
      description: 'Decrease volume'
    },
    {
      key: 'm',
      action: () => {
        toggleMute();
      },
      description: 'Mute/Unmute'
    },
    {
      key: 'f',
      action: () => {
        if (type === 'video') {
          toggleFullscreen();
        }
      },
      description: 'Toggle fullscreen'
    },
    {
      key: 's',
      action: () => {
        setShowSettings(!showSettings);
      },
      description: 'Toggle settings'
    },
    {
      key: 'p',
      action: () => {
        if (type === 'video' && enablePiP) {
          togglePictureInPicture();
        }
      },
      description: 'Toggle Picture-in-Picture'
    },
    {
      key: 'c',
      action: () => {
        setShowSubtitleMenu(!showSubtitleMenu);
      },
      description: 'Toggle subtitles'
    },
    {
      key: 'a',
      action: () => {
        setShowAudioMenu(!showAudioMenu);
      },
      description: 'Toggle audio tracks'
    },
    {
      key: 'q',
      action: () => {
        setShowQualityMenu(!showQualityMenu);
      },
      description: 'Toggle quality menu'
    }
  ];

  useKeyboardShortcuts(shortcuts);

  // Enhanced media event handlers
  const handleTimeUpdate = useCallback(() => {
    if (mediaElement) {
      const time = mediaElement.currentTime;
      setCurrentTime(time);
      saveProgress();
      onTimeUpdate?.();
      
      // Handle cover page logic
      if (showCoverPage && type === 'video') {
        setCoverPageTime(time);
        // Auto-hide cover page after 5 seconds
        if (time >= 5) {
          setShowCoverPage(false);
        }
      }
    }
  }, [mediaElement, onTimeUpdate, saveProgress, showCoverPage, type]);

  const handleLoadedMetadata = useCallback(() => {
    if (mediaElement) {
      setMediaDuration(mediaElement.duration);
      
      // Resume from saved time
      if (resumeTime > 0 && enableResume) {
        mediaElement.currentTime = resumeTime;
        setResumeTime(0);
      }
      
      onLoadedMetadata?.();
    }
  }, [mediaElement, resumeTime, enableResume, onLoadedMetadata]);

  const handleProgress = useCallback(() => {
    if (mediaElement && mediaElement.buffered.length > 0) {
      const bufferedEnd = mediaElement.buffered.end(mediaElement.buffered.length - 1);
      const progress = (bufferedEnd / mediaElement.duration) * 100;
      
      // Track buffering events
      if (progress < 100 && isPlaying) {
        analytics.trackBufferEvent(1000, 'network', selectedQuality);
      }
    }
  }, [mediaElement, isPlaying, selectedQuality, analytics]);

  const togglePlay = useCallback(() => {
    if (mediaElement) {
      if (isPlaying) {
        mediaElement.pause();
        setIsPlaying(false);
        analytics.trackPause(currentTime, 0);
      } else {
        mediaElement.play().then(() => {
          setIsPlaying(true);
          analytics.trackResume(currentTime);
        }).catch((error) => {
          console.error('Error playing media:', error);
          setIsPlaying(false);
          analytics.trackPlaybackError('format', 'PLAY_ERROR', error.message, false);
        });
      }
    }
  }, [isPlaying, mediaElement, currentTime, analytics]);

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
  }, [isMuted]);

  const toggleFullscreen = useCallback(() => {
    if (type === 'video' && mediaElement) {
      if (!isFullscreen) {
        if (mediaElement.requestFullscreen) {
          mediaElement.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
      setIsFullscreen(!isFullscreen);
    }
  }, [isFullscreen, mediaElement, type]);

  const togglePictureInPicture = useCallback(async () => {
    if (type === 'video' && mediaElement && enablePiP) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
          setIsPiPActive(false);
        } else {
          await (mediaElement as HTMLVideoElement).requestPictureInPicture();
          setIsPiPActive(true);
        }
      } catch (error) {
        console.error('Picture-in-Picture error:', error);
      }
    }
  }, [mediaElement, type, enablePiP]);

  const handleQualityChange = useCallback((qualityId: string) => {
    setSelectedQuality(qualityId);
    setShowQualityMenu(false);
    
    if (qualityId === 'auto') {
      // Enable adaptive bitrate
      setAdaptiveBitrateEnabled(true);
    } else {
      // Set specific quality
      const quality = qualityLevels.find(q => q.id === qualityId);
      if (quality && mediaElement) {
        mediaElement.src = quality.url;
        mediaElement.load();
        
        // Track quality switch in analytics
        analytics.trackQualitySwitch(qualityId, quality.bitrate, quality.height.toString());
      }
    }
  }, [qualityLevels, mediaElement, analytics]);

  const handleSubtitleChange = useCallback((subtitleId: string) => {
    setSelectedSubtitle(subtitleId);
    setShowSubtitleMenu(false);
    
    if (subtitleId === 'none') {
      // Remove all subtitle tracks
      if (mediaElement) {
        const tracks = mediaElement.textTracks;
        for (let i = 0; i < tracks.length; i++) {
          tracks[i].mode = 'disabled';
        }
      }
    } else {
      // Enable specific subtitle track
      const subtitle = subtitleTracks.find(s => s.id === subtitleId);
      if (subtitle && mediaElement) {
        // Add subtitle track (simplified implementation)
        const track = mediaElement.addTextTrack('subtitles', subtitle.label, subtitle.language);
        track.mode = 'showing';
      }
    }
  }, [subtitleTracks, mediaElement]);

  const handleAudioTrackChange = useCallback((audioId: string) => {
    setSelectedAudioTrack(audioId);
    setShowAudioMenu(false);
    
    if (audioId === 'default') {
      // Use default audio track
      if (mediaElement && 'audioTracks' in mediaElement) {
        const tracks = (mediaElement as HTMLVideoElement & { audioTracks?: { enabled: boolean; label: string }[] }).audioTracks;
        if (tracks && tracks.length > 0) {
          for (let i = 0; i < tracks.length; i++) {
            tracks[i].enabled = i === 0;
          }
        }
      }
    } else {
      // Switch to specific audio track
      const audioTrack = audioTracks.find(a => a.id === audioId);
      if (audioTrack && mediaElement && 'audioTracks' in mediaElement) {
        // Switch audio track (simplified implementation)
        const tracks = (mediaElement as HTMLVideoElement & { audioTracks?: { enabled: boolean; label: string }[] }).audioTracks;
        if (tracks && tracks.length > 0) {
          for (let i = 0; i < tracks.length; i++) {
            tracks[i].enabled = tracks[i].label === audioTrack.label;
          }
        }
      }
    }
  }, [audioTracks, mediaElement]);


  const handleEnded = useCallback(() => {
    // Add to recently watched
    const id = contentId || title;
    if (personalization.selectedProfile && id && mediaDuration > 0) {
      const deviceInfo = navigator.userAgent;
      personalization.addToRecentlyWatched(
        id,
        type === 'video' ? 'movie' : 'music',
        mediaDuration, // Full duration since it ended
        mediaDuration,
        deviceInfo
      );
    }

    if (isRepeat) {
      // Repeat current track
      if (mediaElement) {
        mediaElement.currentTime = 0;
        mediaElement.play().then(() => {
          setIsPlaying(true);
        }).catch((error) => {
          console.error('Error repeating media:', error);
          setIsPlaying(false);
        });
      }
    } else if (enableAutoPlay && onNext) {
      // Auto-play next episode
      onNext();
    } else {
      // Stop playing
      setIsPlaying(false);
      onEnded?.();
    }
  }, [isRepeat, mediaElement, enableAutoPlay, onNext, onEnded, personalization, title, mediaDuration, type, contentId]);

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Play function
  const play = useCallback(() => {
    if (mediaElement) {
      mediaElement.play().then(() => {
        setIsPlaying(true);
        analytics.trackResume(currentTime);
      }).catch((error) => {
        console.error('Error playing media:', error);
        setIsPlaying(false);
      });
    }
  }, [mediaElement, analytics, currentTime]);

  // Cover page play handler
  const handleCoverPagePlay = useCallback(() => {
    setShowCoverPage(false);
    play();
  }, [play]);

  // Video seek functionality
  const handleVideoClick = useCallback((e: React.MouseEvent<HTMLVideoElement>) => {
    try {
      // If cover page is showing, just start playing
      if (showCoverPage) {
        handleCoverPagePlay();
        return;
      }
      
      if (mediaElement && type === 'video' && isVideoReady && mediaElement.duration && !isNaN(mediaElement.duration)) {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const videoWidth = rect.width;
        
        if (videoWidth > 0) {
          const clickPercentage = clickX / videoWidth;
          const newTime = clickPercentage * mediaElement.duration;
          
          if (newTime >= 0 && newTime <= mediaElement.duration && !isNaN(newTime)) {
            mediaElement.currentTime = newTime;
            setCurrentTime(newTime);
          }
        }
      }
    } catch (error) {
      console.error('Error in video click handler:', error);
    }
  }, [mediaElement, type, isVideoReady, showCoverPage, handleCoverPagePlay]);

  const handleVideoMouseMove = useCallback((e: React.MouseEvent<HTMLVideoElement>) => {
    try {
      if (mediaElement && type === 'video' && isVideoReady && mediaElement.duration && !isNaN(mediaElement.duration) && mediaElement.duration > 0) {
        const rect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const videoWidth = rect.width;
        
        if (videoWidth > 0) {
          const hoverPercentage = mouseX / videoWidth;
          const hoverTime = hoverPercentage * mediaElement.duration;
          
          if (!isNaN(hoverTime)) {
            setSeekTime(hoverTime);
            setSeekPosition({ x: e.clientX, y: e.clientY });
            setShowSeekPreview(true);
          }
        }
      }
    } catch (error) {
      console.error('Error in video mouse move handler:', error);
    }
  }, [mediaElement, type, isVideoReady]);

  const handleVideoMouseLeave = useCallback(() => {
    setShowSeekPreview(false);
  }, []);

  const progress = (mediaDuration && mediaDuration > 0) ? (currentTime / mediaDuration) * 100 : 0;

  return (
    <div className="smart-media-player-container rounded-xl p-6">
      {/* Header with title and action buttons */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-lg truncate">{title}</h3>
          {artist && <p className="text-slate-400 text-sm truncate">{artist}</p>}
          {album && <p className="text-slate-300 text-xs truncate">{album}</p>}
        </div>
        
        {/* Advanced action buttons */}
        <div className="flex items-center gap-2 ml-4">
          {/* Network Quality Indicator */}
          <div className="flex items-center gap-1 px-2 py-1 bg-slate-800 rounded-lg">
            {networkQuality === 'high' ? (
              <Wifi className="w-4 h-4 text-green-400" />
            ) : networkQuality === 'medium' ? (
              <Wifi className="w-4 h-4 text-yellow-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-400" />
            )}
            <span className="text-xs text-slate-300 capitalize">{networkQuality}</span>
          </div>

          {/* Adaptive Bitrate Toggle */}
          {enableAdaptiveBitrate && (
            <button
              onClick={() => setAdaptiveBitrateEnabled(!adaptiveBitrateEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                adaptiveBitrateEnabled ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Adaptive Bitrate"
            >
              <Monitor className="w-4 h-4" />
            </button>
          )}

          {/* Settings */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-slate-400 hover:text-white transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute top-full right-0 mt-2 bg-slate-700 rounded-lg p-3 min-w-64 z-10"
                >
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Playback Speed</label>
                      <select
                        value={playbackRate}
                        onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                        className="w-full p-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                      >
                        <option value={0.5}>0.5x</option>
                        <option value={0.75}>0.75x</option>
                        <option value={1}>1x</option>
                        <option value={1.25}>1.25x</option>
                        <option value={1.5}>1.5x</option>
                        <option value={2}>2x</option>
                      </select>
                    </div>
                    
                    {/* Quality Selection */}
                    {qualityLevels.length > 0 && (
                      <div>
                        <label className="block text-xs text-slate-300 mb-1">Quality</label>
                        <select
                          value={selectedQuality}
                          onChange={(e) => handleQualityChange(e.target.value)}
                          className="w-full p-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                        >
                          <option value="auto">Auto</option>
                          {qualityLevels.map(quality => (
                            <option key={quality.id} value={quality.id}>
                              {quality.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Subtitle Selection */}
                    {subtitleTracks.length > 0 && (
                      <div>
                        <label className="block text-xs text-slate-300 mb-1">Subtitles</label>
                        <select
                          value={selectedSubtitle}
                          onChange={(e) => handleSubtitleChange(e.target.value)}
                          className="w-full p-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                        >
                          <option value="none">None</option>
                          {subtitleTracks.map(subtitle => (
                            <option key={subtitle.id} value={subtitle.id}>
                              {subtitle.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Audio Track Selection */}
                    {audioTracks.length > 0 && (
                      <div>
                        <label className="block text-xs text-slate-300 mb-1">Audio</label>
                        <select
                          value={selectedAudioTrack}
                          onChange={(e) => handleAudioTrackChange(e.target.value)}
                          className="w-full p-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                        >
                          <option value="default">Default</option>
                          {audioTracks.map(audio => (
                            <option key={audio.id} value={audio.id}>
                              {audio.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Favorite */}
          <button
            onClick={async () => {
              const newLikedState = !isLiked;
              setIsLiked(newLikedState);
              
              // Add/remove from watchlist
              const id = contentId || title;
              if (id && personalization.selectedProfile) {
                if (newLikedState) {
                  await personalization.addToWatchlist(id, type === 'video' ? 'movie' : 'music');
                } else {
                  await personalization.removeFromWatchlist(id);
                }
              }
              
              onLike?.();
            }}
            className={`p-2 transition-colors ${
              isLiked ? 'text-red-500' : 'text-slate-400 hover:text-white'
            }`}
            title={isLiked ? "Remove from Watchlist" : "Add to Watchlist"}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          </button>
          
          {/* Share */}
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: title,
                  text: artist ? `${title} by ${artist}` : title,
                  url: window.location.href
                }).catch(console.error);
              } else {
                navigator.clipboard.writeText(window.location.href).then(() => {
                  alert('Link copied to clipboard!');
                }).catch(() => {
                  alert('Unable to share. Please copy the URL manually.');
                });
              }
              onShare?.();
            }}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            title="Share"
          >
            <Share2 className="w-5 h-5" />
          </button>
          
          {/* Download */}
          <button
            onClick={() => {
              if (src) {
                const link = document.createElement('a');
                link.href = src;
                link.download = `${title}.${type === 'video' ? 'mp4' : 'mp3'}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }
              onDownload?.();
            }}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {type === 'video' && (
        <div className="w-full max-w-4xl mx-auto">
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden group">
            <video
              ref={mediaRef as React.RefObject<HTMLVideoElement>}
              src={src}
              poster={poster}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
              onLoadedMetadata={handleLoadedMetadata}
              onProgress={handleProgress}
              onError={(e) => {
                const video = e.currentTarget;
                console.error(`Video failed to load: ${video.error?.message || 'Unknown error'}`);
                onError?.();
              }}
              onLoadStart={() => {
                setIsVideoReady(false);
                onLoadStart?.();
              }}
              onCanPlay={() => {
                setIsVideoReady(true);
                onCanPlay?.();
                // Auto-play for cover page preview
                if (showCoverPage && type === 'video') {
                  play();
                }
              }}
              onClick={handleVideoClick}
              onMouseMove={handleVideoMouseMove}
              onMouseLeave={handleVideoMouseLeave}
              className="w-full h-full object-contain cursor-pointer"
              autoPlay={showCoverPage || autoPlay}
              preload="metadata"
              crossOrigin={(crossOrigin as "anonymous" | "use-credentials" | "") || "anonymous"}
              controls={false}
              playsInline
              muted={showCoverPage}
            />
            
            {/* Seek Preview Overlay */}
            <AnimatePresence>
              {showSeekPreview && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="absolute pointer-events-none z-20"
                  style={{
                    left: seekPosition.x - 40,
                    top: seekPosition.y - 60,
                  }}
                >
                  <div className="bg-black/80 text-white px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap">
                    {formatTime(seekTime)}
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/80"></div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Seek Progress Indicator */}
            <AnimatePresence>
              {showSeekPreview && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-0 left-0 h-1 bg-white/50 z-10"
                  style={{
                    width: `${(seekTime / mediaDuration) * 100}%`,
                  }}
                />
              )}
            </AnimatePresence>

            {/* Cover Page Overlay */}
            <AnimatePresence>
              {showCoverPage && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-30"
                >
                  <div className="text-center">
                    {/* Cover Page Content */}
                    <div className="mb-8">
                      <h2 className="text-4xl font-bold text-white mb-4">{title}</h2>
                      {artist && <p className="text-xl text-slate-300 mb-2">{artist}</p>}
                      {album && <p className="text-lg text-slate-400">{album}</p>}
                    </div>

                    {/* Large Play Button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCoverPagePlay}
                      className="w-24 h-24 bg-white/95 hover:bg-white rounded-full flex items-center justify-center shadow-2xl transition-all duration-300"
                    >
                      <Play className="w-10 h-10 text-slate-900 ml-1" fill="currentColor" />
                    </motion.button>

                    {/* Cover Page Timer */}
                    <div className="mt-6">
                      <div className="flex items-center justify-center gap-2 text-slate-300">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span className="text-sm">Preview: {formatTime(coverPageTime)} / 5:00</span>
                      </div>
                      <div className="mt-2 w-48 h-1 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-white rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${(coverPageTime / 5) * 100}%` }}
                          transition={{ duration: 0.1 }}
                        />
                      </div>
                    </div>

                    {/* Skip Preview Button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCoverPagePlay}
                      className="mt-4 px-6 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-white rounded-lg transition-colors"
                    >
                      Skip Preview
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {type === 'audio' && (
        <>
          <audio
            ref={mediaRef as React.RefObject<HTMLAudioElement>}
            src={src}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onLoadedMetadata={handleLoadedMetadata}
            onProgress={handleProgress}
            onError={onError}
            onLoadStart={onLoadStart}
            onCanPlay={onCanPlay}
            autoPlay={autoPlay}
            preload={preload}
              crossOrigin={(crossOrigin as "anonymous" | "use-credentials" | "")}
            className="hidden"
          />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Volume2 className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-slate-400 text-sm">Now Playing</p>
            </div>
          </div>
        </>
      )}

      {/* Progress Bar - Compact for video, full for audio */}
      <div className={`${type === 'video' ? 'mb-2' : 'mb-4'}`}>
        <div
          ref={progressRef}
          className={`w-full bg-slate-700 rounded-full cursor-pointer transition-all duration-200 relative ${
            type === 'video' ? 'h-2 hover:h-3' : 'h-3 hover:h-4'
          }`}
          onClick={(e) => {
            try {
              if (mediaElement && progressRef.current && isVideoReady && mediaElement.duration && !isNaN(mediaElement.duration)) {
                const rect = progressRef.current.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const progressWidth = rect.width;
                
                if (progressWidth > 0) {
                  const clickPercentage = clickX / progressWidth;
                  const newTime = clickPercentage * mediaElement.duration;
                  
                  if (newTime >= 0 && newTime <= mediaElement.duration && !isNaN(newTime)) {
                    mediaElement.currentTime = newTime;
                    setCurrentTime(newTime);
                  }
                }
              }
            } catch (error) {
              console.error('Error in progress bar click handler:', error);
            }
          }}
        >
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
          {/* Seek preview on progress bar */}
          {showSeekPreview && type === 'video' && (
            <div
              className="absolute top-0 h-full w-0.5 bg-white/70 rounded-full"
              style={{ left: `${(seekTime / mediaDuration) * 100}%` }}
            />
          )}
        </div>
        <div className={`flex justify-between text-slate-300 ${
          type === 'video' ? 'text-xs mt-1' : 'text-sm mt-2'
        }`}>
          <span className="font-medium">{formatTime(currentTime)}</span>
          <span className="font-medium">{formatTime(mediaDuration)}</span>
        </div>
      </div>

      {/* Enhanced Controls - Compact for video */}
      <div className={`flex items-center justify-between bg-slate-800/50 rounded-lg ${
        type === 'video' ? 'p-2' : 'p-4'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsShuffle(!isShuffle)}
            className={`${type === 'video' ? 'p-1' : 'p-2'} rounded-lg transition-colors ${
              isShuffle ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shuffle className={`${type === 'video' ? 'w-3 h-3' : 'w-4 h-4'}`} />
          </button>
          
          <button
            onClick={() => {
              if (mediaElement) {
                mediaElement.currentTime = Math.max(0, mediaElement.currentTime - 300);
              }
            }}
            className={`${type === 'video' ? 'p-1' : 'p-2'} text-slate-400 hover:text-white transition-colors`}
            title="Rewind 5 minutes"
          >
            <Rewind className={`${type === 'video' ? 'w-3 h-3' : 'w-4 h-4'}`} />
          </button>
          
          <button
            onClick={onPrevious}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            title="Previous track"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          
          <button
            onClick={togglePlay}
            className="p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-all duration-200 hover:scale-110 shadow-lg"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </button>
          
          <button
            onClick={() => {
              if (mediaElement) {
                mediaElement.pause();
                mediaElement.currentTime = 0;
                setIsPlaying(false);
              }
            }}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            title="Stop"
          >
            <Square className="w-4 h-4" />
          </button>
          
          <button
            onClick={onNext}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            title="Next track"
          >
            <SkipForward className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => {
              if (mediaElement) {
                mediaElement.currentTime = Math.min(mediaElement.duration, mediaElement.currentTime + 300);
              }
            }}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            title="Skip forward 5 minutes"
          >
            <FastForward className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setIsRepeat(!isRepeat)}
            className={`p-2 rounded-lg transition-colors ${
              isRepeat ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Volume Control */}
          <div className="relative">
            <button
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
              onClick={toggleMute}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            
            <AnimatePresence>
              {showVolumeSlider && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-700 rounded-lg p-2"
                >
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      const newVolume = parseFloat(e.target.value);
                      setVolume(newVolume);
                      setIsMuted(newVolume === 0);
                    }}
                    className="w-20 h-1 focus-ring"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Picture-in-Picture */}
          {type === 'video' && enablePiP && (
            <button
              onClick={togglePictureInPicture}
              className={`p-2 transition-colors ${
                isPiPActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Picture-in-Picture"
            >
              <PictureInPicture className="w-5 h-5" />
            </button>
          )}

          {/* Fullscreen */}
          {type === 'video' && (
            <button
              onClick={toggleFullscreen}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Resume Watching Notification */}
      {resumeTime > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-blue-600/20 border border-blue-500/30 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-400" />
            <p className="text-blue-300 text-sm">
              Resume from {formatTime(resumeTime)}?
            </p>
            <button
              onClick={() => {
                if (mediaElement) {
                  mediaElement.currentTime = resumeTime;
                  setResumeTime(0);
                }
              }}
              className="ml-auto px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
            >
              Resume
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
