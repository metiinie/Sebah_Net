import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { useThumbnailGenerator } from '../hooks/useThumbnailGenerator';

interface AutoThumbnailProps {
  videoUrl: string;
  fallbackUrl?: string;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
  timeOffset?: number;
  quality?: number;
  showLoadingState?: boolean;
  showErrorState?: boolean;
  onClick?: () => void;
}

export const AutoThumbnail = ({
  videoUrl,
  fallbackUrl,
  alt = 'Video thumbnail',
  className = '',
  width = 320,
  height = 180,
  timeOffset = 5,
  quality = 0.8,
  showLoadingState = true,
  showErrorState = true,
  onClick
}: AutoThumbnailProps) => {
  const [imageError, setImageError] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const {
    thumbnail,
    isLoading,
    error,
    generateThumbnail
  } = useThumbnailGenerator(videoUrl, {
    timeOffset,
    width,
    height,
    quality,
    fallbackUrl,
    autoGenerate: true
  });

  // Handle errors gracefully
  React.useEffect(() => {
    if (error) {
      console.warn('Thumbnail generation error:', error);
      setHasError(true);
    }
  }, [error]);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleRetry = () => {
    setImageError(false);
    generateThumbnail();
  };

  const displayUrl = imageError ? fallbackUrl : thumbnail;

  return (
    <div 
      className={`relative overflow-hidden bg-slate-800 rounded-lg ${className}`}
      style={{ width, height }}
      onClick={onClick}
    >
      <AnimatePresence mode="wait">
        {/* Loading State */}
        {isLoading && showLoadingState && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-slate-800"
          >
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Generating thumbnail...</p>
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {(hasError || (error && showErrorState)) && !displayUrl && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-slate-800"
          >
            <div className="text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-red-400 text-sm mb-2">Failed to generate thumbnail</p>
              <button
                onClick={handleRetry}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded transition-colors"
              >
                Retry
              </button>
            </div>
          </motion.div>
        )}

        {/* Thumbnail Image */}
        {displayUrl && (
          <motion.img
            key="thumbnail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            src={displayUrl}
            alt={alt}
            className="w-full h-full object-cover"
            onError={handleImageError}
            loading="lazy"
          />
        )}

        {/* Fallback Icon */}
        {!displayUrl && !isLoading && !error && (
          <motion.div
            key="fallback"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-slate-800"
          >
            <div className="text-center">
              <ImageIcon className="w-12 h-12 text-slate-500 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No thumbnail available</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Thumbnail Generation Indicator */}
      {thumbnail && (
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
          {timeOffset}s
        </div>
      )}
    </div>
  );
};

/**
 * Component for displaying multiple thumbnails from different time points
 */
interface MultiThumbnailProps {
  videoUrl: string;
  timePoints?: number[];
  className?: string;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  onThumbnailClick?: (timePoint: number) => void;
}

export const MultiThumbnail = ({
  videoUrl,
  timePoints = [1, 3, 5, 10, 15],
  className = '',
  thumbnailWidth = 160,
  thumbnailHeight = 90,
  onThumbnailClick
}: MultiThumbnailProps) => {
  return (
    <div className={`flex gap-2 overflow-x-auto ${className}`}>
      {timePoints.map((timePoint) => (
        <AutoThumbnail
          key={timePoint}
          videoUrl={videoUrl}
          timeOffset={timePoint}
          width={thumbnailWidth}
          height={thumbnailHeight}
          className="flex-shrink-0"
          onClick={() => onThumbnailClick?.(timePoint)}
        />
      ))}
    </div>
  );
};

/**
 * Thumbnail with hover preview
 */
interface ThumbnailWithPreviewProps extends AutoThumbnailProps {
  previewTimePoints?: number[];
  showPreviewOnHover?: boolean;
}

export const ThumbnailWithPreview = ({
  videoUrl,
  previewTimePoints = [1, 3, 5, 10, 15],
  showPreviewOnHover = true,
  ...props
}: ThumbnailWithPreviewProps) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => showPreviewOnHover && setShowPreview(true)}
      onMouseLeave={() => showPreviewOnHover && setShowPreview(false)}
    >
      <AutoThumbnail {...props} videoUrl={videoUrl} />
      
      {/* Hover Preview */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 mt-2 bg-slate-900/95 backdrop-blur-lg rounded-lg p-4 shadow-2xl border border-slate-700 z-50"
          >
            <h4 className="text-white font-semibold mb-3">Video Preview</h4>
            <MultiThumbnail
              videoUrl={videoUrl}
              timePoints={previewTimePoints}
              thumbnailWidth={120}
              thumbnailHeight={68}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
