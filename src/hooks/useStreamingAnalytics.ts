import { useState, useEffect, useCallback, useRef } from 'react';
import { streamingService, StreamingAnalytics, QualityMetric, BufferEvent, PlaybackError, DropOffPoint } from '../lib/streamingService';

export interface UseStreamingAnalyticsOptions {
  mediaId: string;
  userId?: string;
  enableAnalytics?: boolean;
  enableRealTimeTracking?: boolean;
}

export interface UseStreamingAnalyticsReturn {
  // Session management
  sessionId: string | null;
  startSession: () => void;
  endSession: () => StreamingAnalytics | null;
  
  // Analytics data
  analytics: StreamingAnalytics | null;
  qualityMetrics: QualityMetric[];
  bufferEvents: BufferEvent[];
  playbackErrors: PlaybackError[];
  dropOffPoints: DropOffPoint[];
  
  // Real-time tracking
  currentQuality: string;
  totalWatchTime: number;
  bufferTime: number;
  errorCount: number;
  qualitySwitches: number;
  
  // Tracking functions
  trackQualitySwitch: (quality: string, bitrate: number, resolution: string) => void;
  trackBufferEvent: (duration: number, reason: string, quality: string) => void;
  trackPlaybackError: (errorType: string, errorCode: string, message: string, recoverable: boolean) => void;
  trackDropOff: (position: number, reason: string, context?: any) => void;
  trackSeek: (from: number, to: number) => void;
  trackPause: (position: number, duration: number) => void;
  trackResume: (position: number) => void;
  
  // Analytics queries
  getWatchTimeByQuality: () => { [quality: string]: number };
  getBufferRate: () => number;
  getErrorRate: () => number;
  getCompletionRate: () => number;
  getQualityDistribution: () => { [quality: string]: number };
  
  // Configuration
  isTracking: boolean;
  enableTracking: (enabled: boolean) => void;
}

export const useStreamingAnalytics = (options: UseStreamingAnalyticsOptions): UseStreamingAnalyticsReturn => {
  const {
    mediaId,
    userId,
    enableAnalytics = true,
    enableRealTimeTracking = true
  } = options;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<StreamingAnalytics | null>(null);
  const [isTracking, setIsTracking] = useState(enableAnalytics);
  
  // Real-time metrics
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [totalWatchTime, setTotalWatchTime] = useState(0);
  const [bufferTime, setBufferTime] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [qualitySwitches, setQualitySwitches] = useState(0);
  
  // Analytics data
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetric[]>([]);
  const [bufferEvents, setBufferEvents] = useState<BufferEvent[]>([]);
  const [playbackErrors, setPlaybackErrors] = useState<PlaybackError[]>([]);
  const [dropOffPoints, setDropOffPoints] = useState<DropOffPoint[]>([]);
  
  // Refs for tracking
  const sessionStartTime = useRef<Date | null>(null);
  const lastQualitySwitchTime = useRef<Date | null>(null);
  const pauseStartTime = useRef<Date | null>(null);
  const totalPauseTime = useRef(0);
  const watchTimeInterval = useRef<NodeJS.Timeout | null>(null);

  // Start analytics session
  const startSession = useCallback(() => {
    if (!isTracking) return;
    
    const newSessionId = streamingService.startAnalyticsSession(mediaId, userId);
    setSessionId(newSessionId);
    sessionStartTime.current = new Date();
    
    // Start real-time tracking
    if (enableRealTimeTracking) {
      startWatchTimeTracking();
    }
  }, [mediaId, userId, isTracking, enableRealTimeTracking]);

  // End analytics session
  const endSession = useCallback((): StreamingAnalytics | null => {
    if (!sessionId) return null;
    
    // Stop real-time tracking
    if (watchTimeInterval.current) {
      clearInterval(watchTimeInterval.current);
      watchTimeInterval.current = null;
    }
    
    const finalAnalytics = streamingService.endAnalyticsSession(sessionId);
    setAnalytics(finalAnalytics);
    setSessionId(null);
    sessionStartTime.current = null;
    
    return finalAnalytics;
  }, [sessionId]);

  // Start watch time tracking
  const startWatchTimeTracking = useCallback(() => {
    if (watchTimeInterval.current) {
      clearInterval(watchTimeInterval.current);
    }
    
    watchTimeInterval.current = setInterval(() => {
      if (sessionStartTime.current && !pauseStartTime.current) {
        const elapsed = Date.now() - sessionStartTime.current.getTime() - totalPauseTime.current;
        setTotalWatchTime(elapsed);
      }
    }, 1000);
  }, []);

  // Track quality switch
  const trackQualitySwitch = useCallback((quality: string, bitrate: number, resolution: string) => {
    if (!sessionId || !isTracking) return;
    
    streamingService.recordQualitySwitch(sessionId, quality, bitrate, resolution);
    setCurrentQuality(quality);
    setQualitySwitches(prev => prev + 1);
    
    // Update quality metrics
    setQualityMetrics(prev => {
      const existing = prev.find(q => q.quality === quality);
      if (existing) {
        existing.switchCount++;
        return [...prev];
      } else {
        return [...prev, {
          quality,
          bitrate,
          resolution,
          timeSpent: 0,
          switchCount: 1
        }];
      }
    });
    
    lastQualitySwitchTime.current = new Date();
  }, [sessionId, isTracking]);

  // Track buffer event
  const trackBufferEvent = useCallback((duration: number, reason: string, quality: string) => {
    if (!sessionId || !isTracking) return;
    
    streamingService.recordBufferEvent(sessionId, duration, reason, quality);
    setBufferTime(prev => prev + duration);
    
    const bufferEvent: BufferEvent = {
      timestamp: new Date(),
      duration,
      reason: reason as any,
      quality
    };
    
    setBufferEvents(prev => [...prev, bufferEvent]);
  }, [sessionId, isTracking]);

  // Track playback error
  const trackPlaybackError = useCallback((errorType: string, errorCode: string, message: string, recoverable: boolean) => {
    if (!sessionId || !isTracking) return;
    
    streamingService.recordPlaybackError(sessionId, errorType, errorCode, message, recoverable);
    setErrorCount(prev => prev + 1);
    
    const error: PlaybackError = {
      timestamp: new Date(),
      errorType: errorType as any,
      errorCode,
      message,
      recoverable
    };
    
    setPlaybackErrors(prev => [...prev, error]);
  }, [sessionId, isTracking]);

  // Track drop-off
  const trackDropOff = useCallback((position: number, reason: string, context?: any) => {
    if (!sessionId || !isTracking) return;
    
    streamingService.recordDropOff(sessionId, position, reason, context);
    
    const dropOff: DropOffPoint = {
      timestamp: new Date(),
      position,
      reason: reason as any,
      context
    };
    
    setDropOffPoints(prev => [...prev, dropOff]);
  }, [sessionId, isTracking]);

  // Track seek
  const trackSeek = useCallback((from: number, to: number) => {
    if (!sessionId || !isTracking) return;
    
    // Track seek as a special event
    const seekEvent = {
      timestamp: new Date(),
      from,
      to,
      type: 'seek' as const
    };
    
    // This could be sent to analytics service
    console.log('Seek event:', seekEvent);
  }, [sessionId, isTracking]);

  // Track pause
  const trackPause = useCallback((position: number, duration: number) => {
    if (!sessionId || !isTracking) return;
    
    pauseStartTime.current = new Date();
    
    // Track pause event
    const pauseEvent = {
      timestamp: new Date(),
      position,
      duration,
      type: 'pause' as const
    };
    
    console.log('Pause event:', pauseEvent);
  }, [sessionId, isTracking]);

  // Track resume
  const trackResume = useCallback((position: number) => {
    if (!sessionId || !isTracking) return;
    
    if (pauseStartTime.current) {
      const pauseDuration = Date.now() - pauseStartTime.current.getTime();
      totalPauseTime.current += pauseDuration;
      pauseStartTime.current = null;
    }
    
    // Track resume event
    const resumeEvent = {
      timestamp: new Date(),
      position,
      type: 'resume' as const
    };
    
    console.log('Resume event:', resumeEvent);
  }, [sessionId, isTracking]);

  // Analytics queries
  const getWatchTimeByQuality = useCallback(() => {
    const watchTime: { [quality: string]: number } = {};
    
    qualityMetrics.forEach(metric => {
      watchTime[metric.quality] = (watchTime[metric.quality] || 0) + metric.timeSpent;
    });
    
    return watchTime;
  }, [qualityMetrics]);

  const getBufferRate = useCallback(() => {
    if (totalWatchTime === 0) return 0;
    return (bufferTime / totalWatchTime) * 100;
  }, [bufferTime, totalWatchTime]);

  const getErrorRate = useCallback(() => {
    if (totalWatchTime === 0) return 0;
    return (errorCount / (totalWatchTime / 60000)) * 100; // Errors per minute
  }, [errorCount, totalWatchTime]);

  const getCompletionRate = useCallback(() => {
    // This would typically be calculated based on media duration
    // For now, return a placeholder
    return 0;
  }, []);

  const getQualityDistribution = useCallback(() => {
    const distribution: { [quality: string]: number } = {};
    
    qualityMetrics.forEach(metric => {
      distribution[metric.quality] = (distribution[metric.quality] || 0) + metric.timeSpent;
    });
    
    return distribution;
  }, [qualityMetrics]);

  // Enable/disable tracking
  const enableTracking = useCallback((enabled: boolean) => {
    setIsTracking(enabled);
    
    if (!enabled && sessionId) {
      endSession();
    }
  }, [sessionId, endSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchTimeInterval.current) {
        clearInterval(watchTimeInterval.current);
      }
      if (sessionId) {
        endSession();
      }
    };
  }, [sessionId, endSession]);

  // Auto-start session when tracking is enabled
  useEffect(() => {
    if (isTracking && !sessionId) {
      startSession();
    }
  }, [isTracking, sessionId, startSession]);

  return {
    sessionId,
    startSession,
    endSession,
    analytics,
    qualityMetrics,
    bufferEvents,
    playbackErrors,
    dropOffPoints,
    currentQuality,
    totalWatchTime,
    bufferTime,
    errorCount,
    qualitySwitches,
    trackQualitySwitch,
    trackBufferEvent,
    trackPlaybackError,
    trackDropOff,
    trackSeek,
    trackPause,
    trackResume,
    getWatchTimeByQuality,
    getBufferRate,
    getErrorRate,
    getCompletionRate,
    getQualityDistribution,
    isTracking,
    enableTracking
  };
};

