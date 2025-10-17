/**
 * Thumbnail Generator Utility
 * Generates thumbnails from videos at the 5-second mark
 */

export interface ThumbnailOptions {
  timeOffset?: number; // Time in seconds to capture thumbnail (default: 5)
  width?: number; // Thumbnail width (default: 320)
  height?: number; // Thumbnail height (default: 180)
  quality?: number; // JPEG quality 0-1 (default: 0.8)
}

export interface ThumbnailResult {
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
}

/**
 * Generate a thumbnail from a video URL at a specific time
 */
export const generateVideoThumbnail = async (
  videoUrl: string,
  options: ThumbnailOptions = {}
): Promise<ThumbnailResult> => {
  const {
    timeOffset = 5,
    width = 320,
    height = 180,
    quality = 0.8
  } = options;

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Handle video load
    video.addEventListener('loadedmetadata', () => {
      // Set video dimensions to match canvas
      video.width = width;
      video.height = height;
      
      // Seek to the specified time
      video.currentTime = Math.min(timeOffset, video.duration - 0.1);
    });

    // Handle video seeked (when we've reached the target time)
    video.addEventListener('seeked', () => {
      try {
        // Draw the video frame to canvas
        ctx.drawImage(video, 0, 0, width, height);
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to generate thumbnail blob'));
            return;
          }

          // Generate data URL
          const dataUrl = canvas.toDataURL('image/jpeg', quality);

          resolve({
            dataUrl,
            blob,
            width,
            height
          });

          // Cleanup
          video.remove();
          canvas.remove();
        }, 'image/jpeg', quality);
      } catch (error) {
        reject(error);
      }
    });

    // Handle errors
    video.addEventListener('error', (e) => {
      console.warn('Video load error:', e);
      reject(new Error(`Video load error: ${e}`));
    });

    // Set video properties
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    // Start loading the video
    video.src = videoUrl;
  });
};

/**
 * Generate multiple thumbnails at different time points
 */
export const generateMultipleThumbnails = async (
  videoUrl: string,
  timePoints: number[] = [1, 3, 5, 10, 15],
  options: Omit<ThumbnailOptions, 'timeOffset'> = {}
): Promise<ThumbnailResult[]> => {
  const promises = timePoints.map(timeOffset => 
    generateVideoThumbnail(videoUrl, { ...options, timeOffset })
  );

  return Promise.all(promises);
};

/**
 * Generate a thumbnail and return as base64 string
 */
export const generateThumbnailBase64 = async (
  videoUrl: string,
  options: ThumbnailOptions = {}
): Promise<string> => {
  const result = await generateVideoThumbnail(videoUrl, options);
  return result.dataUrl;
};

/**
 * Generate a thumbnail and return as Blob
 */
export const generateThumbnailBlob = async (
  videoUrl: string,
  options: ThumbnailOptions = {}
): Promise<Blob> => {
  const result = await generateVideoThumbnail(videoUrl, options);
  return result.blob;
};

/**
 * Cache for generated thumbnails
 */
class ThumbnailCache {
  private cache = new Map<string, ThumbnailResult>();
  private readonly maxSize = 100; // Maximum number of cached thumbnails

  set(key: string, thumbnail: ThumbnailResult): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, thumbnail);
  }

  get(key: string): ThumbnailResult | undefined {
    return this.cache.get(key);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const thumbnailCache = new ThumbnailCache();

/**
 * Generate thumbnail with caching
 */
export const generateCachedThumbnail = async (
  videoUrl: string,
  options: ThumbnailOptions = {}
): Promise<ThumbnailResult> => {
  const cacheKey = `${videoUrl}_${options.timeOffset || 5}_${options.width || 320}_${options.height || 180}`;
  
  // Check cache first
  if (thumbnailCache.has(cacheKey)) {
    return thumbnailCache.get(cacheKey)!;
  }

  // Generate new thumbnail
  const thumbnail = await generateVideoThumbnail(videoUrl, options);
  
  // Cache the result
  thumbnailCache.set(cacheKey, thumbnail);
  
  return thumbnail;
};

/**
 * Utility to create a thumbnail URL from video URL
 */
export const createThumbnailUrl = (videoUrl: string, timeOffset: number = 5): string => {
  // This could be used for server-side thumbnail generation
  // For now, we'll use a placeholder that indicates thumbnail generation is needed
  return `thumbnail://${encodeURIComponent(videoUrl)}?t=${timeOffset}`;
};

/**
 * Check if a URL is a generated thumbnail URL
 */
export const isThumbnailUrl = (url: string): boolean => {
  return url.startsWith('thumbnail://');
};

/**
 * Extract video URL from thumbnail URL
 */
export const extractVideoUrlFromThumbnail = (thumbnailUrl: string): string | null => {
  if (!isThumbnailUrl(thumbnailUrl)) {
    return null;
  }
  
  try {
    const url = new URL(thumbnailUrl.replace('thumbnail://', 'http://'));
    return decodeURIComponent(url.pathname);
  } catch {
    return null;
  }
};
