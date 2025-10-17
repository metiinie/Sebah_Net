import { useState, useEffect, useCallback, useRef } from 'react';
import { generateCachedThumbnail, ThumbnailResult, ThumbnailOptions } from '../lib/thumbnailGenerator';

interface UseThumbnailGeneratorOptions extends ThumbnailOptions {
  autoGenerate?: boolean; // Automatically generate thumbnail when video URL changes
  fallbackUrl?: string; // Fallback image URL if generation fails
}

interface UseThumbnailGeneratorReturn {
  thumbnail: string | null;
  isLoading: boolean;
  error: string | null;
  generateThumbnail: () => Promise<void>;
  clearThumbnail: () => void;
}

/**
 * Hook for generating and managing video thumbnails
 */
export const useThumbnailGenerator = (
  videoUrl: string | null,
  options: UseThumbnailGeneratorOptions = {}
): UseThumbnailGeneratorReturn => {
  const {
    autoGenerate = true,
    fallbackUrl,
    timeOffset = 5,
    width = 320,
    height = 180,
    quality = 0.8
  } = options;

  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generateThumbnail = useCallback(async () => {
    if (!videoUrl) {
      setThumbnail(null);
      return;
    }

    // Cancel any ongoing generation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsLoading(true);
    setError(null);

    try {
      const result = await generateCachedThumbnail(videoUrl, {
        timeOffset,
        width,
        height,
        quality
      });

      // Check if the operation was aborted
      if (signal.aborted) {
        return;
      }

      setThumbnail(result.dataUrl);
    } catch (err) {
      if (signal.aborted) {
        return;
      }

      // Log error for debugging but don't throw
      console.warn('Thumbnail generation failed:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate thumbnail';
      setError(errorMessage);
      
      // Use fallback URL if available
      if (fallbackUrl) {
        setThumbnail(fallbackUrl);
      }
    } finally {
      if (!signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [videoUrl, timeOffset, width, height, quality, fallbackUrl]);

  const clearThumbnail = useCallback(() => {
    setThumbnail(null);
    setError(null);
    setIsLoading(false);
    
    // Cancel any ongoing generation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Auto-generate thumbnail when video URL changes
  useEffect(() => {
    if (autoGenerate && videoUrl) {
      generateThumbnail();
    } else if (!videoUrl) {
      clearThumbnail();
    }

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [videoUrl, autoGenerate, generateThumbnail, clearThumbnail]);

  return {
    thumbnail,
    isLoading,
    error,
    generateThumbnail,
    clearThumbnail
  };
};

/**
 * Hook for generating multiple thumbnails from a video
 */
export const useMultipleThumbnails = (
  videoUrl: string | null,
  timePoints: number[] = [1, 3, 5, 10, 15],
  options: Omit<UseThumbnailGeneratorOptions, 'timeOffset'> = {}
) => {
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAllThumbnails = useCallback(async () => {
    if (!videoUrl) {
      setThumbnails({});
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results: Record<number, string> = {};
      
      // Generate thumbnails for each time point
      for (const timePoint of timePoints) {
        try {
          const result = await generateCachedThumbnail(videoUrl, {
            ...options,
            timeOffset: timePoint
          });
          results[timePoint] = result.dataUrl;
        } catch (err) {
          console.warn(`Failed to generate thumbnail at ${timePoint}s:`, err);
        }
      }

      setThumbnails(results);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate thumbnails';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [videoUrl, timePoints, options]);

  useEffect(() => {
    if (videoUrl) {
      generateAllThumbnails();
    } else {
      setThumbnails({});
    }
  }, [videoUrl, generateAllThumbnails]);

  return {
    thumbnails,
    isLoading,
    error,
    generateAllThumbnails
  };
};
