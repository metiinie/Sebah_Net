import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Check, 
  ArrowLeft,
  Film,
  Music,
  Shield,
  Upload as UploadIcon
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '../lib/supabase';
import { RoleIndicator } from '../components/RoleIndicator';
import { usePermissions } from '../hooks/usePermissions';
import { usePageNavigation } from '../hooks/usePageNavigation';
import { handleError } from '../lib/errorHandler';
import toast from 'react-hot-toast';

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  url?: string;
  thumbnailUrl?: string;
}

interface MovieMetadata {
  title: string;
  description: string;
  genre: string;
  releaseDate: string;
  rating: number;
}

interface MusicMetadata {
  trackName: string;
  artist: string;
  album: string;
  genre: string;
  rating: number;
}

export default function Upload() {
  const { goToChoice, goToMovies, goToMusic } = usePageNavigation();
  const { canUpload, isAdmin } = usePermissions();
  
  const [uploadType, setUploadType] = useState<'movie' | 'music' | null>(null);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [movieMetadata, setMovieMetadata] = useState<MovieMetadata>({
    title: '',
    description: '',
    genre: '',
    releaseDate: '',
    rating: 0
  });
  const [musicMetadata, setMusicMetadata] = useState<MusicMetadata>({
    trackName: '',
    artist: '',
    album: '',
    genre: '',
    rating: 0
  });

  const validateFile = useCallback((file: File, type: 'movie' | 'music'): string | null => {
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
    if (file.size > maxSize) {
      return 'File size must be less than 2GB';
    }

    if (type === 'movie') {
      const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv', 'video/webm'];
      if (!allowedTypes.includes(file.type)) {
        return 'Please upload a valid video file (MP4, MOV, AVI, WMV, WebM)';
      }
    } else {
      const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/ogg'];
      if (!allowedTypes.includes(file.type)) {
        return 'Please upload a valid audio file (MP3, WAV, FLAC, OGG)';
      }
    }

    return null;
  }, []);

  const getPublicUrl = useCallback((filePath: string): string => {
    const { data } = supabase.storage.from('media').getPublicUrl(filePath);
    return data.publicUrl;
  }, []);

  const generateVideoThumbnail = useCallback(async (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.addEventListener('loadedmetadata', () => {
        // Set canvas size to video dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Seek to 1 second
        video.currentTime = 1;
      });
      
      video.addEventListener('seeked', () => {
        if (ctx) {
          // Draw the video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert to blob and create URL
          canvas.toBlob((blob) => {
            if (blob) {
              const thumbnailUrl = URL.createObjectURL(blob);
              resolve(thumbnailUrl);
            } else {
              resolve(null);
            }
          }, 'image/jpeg', 0.8);
        }
      });
      
      video.addEventListener('error', () => {
        resolve(null);
      });
      
      // Load the video file
      video.src = URL.createObjectURL(file);
      video.load();
    });
  }, []);

  const generateMusicIcon = useCallback(async (): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas size
      canvas.width = 400;
      canvas.height = 400;
      
      if (ctx) {
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, 400, 400);
        gradient.addColorStop(0, '#8B5CF6');
        gradient.addColorStop(1, '#3B82F6');
        
        // Fill background
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 400, 400);
        
        // Draw music note
        ctx.fillStyle = 'white';
        ctx.font = '200px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('♪', 200, 200);
        
        // Convert to blob and create URL
        canvas.toBlob((blob) => {
          if (blob) {
            const iconUrl = URL.createObjectURL(blob);
            resolve(iconUrl);
          } else {
            resolve('');
          }
        }, 'image/png');
      } else {
        resolve('');
      }
    });
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${uploadType}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const publicUrl = getPublicUrl(filePath);
      
      // Generate thumbnail for videos or icon for music
      let thumbnailUrl = null;
      if (uploadType === 'movie') {
        thumbnailUrl = await generateVideoThumbnail(file);
      } else if (uploadType === 'music') {
        thumbnailUrl = await generateMusicIcon();
      }
      
      return { url: publicUrl, filePath, thumbnailUrl };
    } catch (error: unknown) {
      const errorMessage = handleError(error, 'Upload');
      throw new Error(`Upload failed: ${errorMessage}`);
    }
  }, [uploadType, getPublicUrl, generateVideoThumbnail, generateMusicIcon]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!uploadType) return;

    setIsUploading(true);
    const newUploads: UploadProgress[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }));

    setUploads(prev => [...prev, ...newUploads]);

    // Process files sequentially to avoid conflicts
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      try {
        // Validate file
        const validationError = validateFile(file, uploadType);
        if (validationError) {
          setUploads(prev => prev.map(upload => 
            upload.file === file 
              ? { ...upload, status: 'error', error: validationError }
              : upload
          ));
          continue;
        }

        // Upload file with retry logic
        let retryCount = 0;
        const maxRetries = 3;
        let result: { url: string; filePath: string; thumbnailUrl: string | null } | null = null;
        
        while (retryCount < maxRetries) {
          try {
            result = await uploadFile(file);
            break;
          } catch (error: any) {
            retryCount++;
            if (retryCount >= maxRetries) {
              throw error;
            }
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        }
        
        if (!result) {
          throw new Error('Upload failed after all retries');
        }
        
        setUploads(prev => prev.map(upload => 
          upload.file === file 
            ? { 
                ...upload, 
                progress: 100, 
                status: 'completed',
                url: result.url,
                thumbnailUrl: result.thumbnailUrl
              }
            : upload
        ));

        toast.success(`${file.name} uploaded successfully!`);
      } catch (error: unknown) {
        const errorMessage = handleError(error, 'Upload');
        setUploads(prev => prev.map(upload => 
          upload.file === file 
            ? { ...upload, status: 'error', error: errorMessage }
            : upload
        ));
        toast.error(`Failed to upload ${file.name}: ${errorMessage}`);
      }
    }

    setIsUploading(false);
  }, [uploadType, validateFile, uploadFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: uploadType === 'movie' 
      ? { 'video/*': ['.mp4', '.mov', '.avi', '.wmv', '.webm'] }
      : { 'audio/*': ['.mp3', '.wav', '.flac', '.ogg'] },
    multiple: true,
    disabled: !uploadType || isUploading
  });

  const saveMetadata = useCallback(async () => {
    if (!uploadType) return;

    const completedUploads = uploads.filter(upload => upload.status === 'completed');
    if (completedUploads.length === 0) {
      toast.error('No completed uploads to save');
      return;
    }

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error('User not authenticated. Please sign in again.');
      }

      const userId = session.user.id;

      for (const upload of completedUploads) {
        try {
          if (uploadType === 'movie') {
            const { error: movieError } = await supabase
              .from('movies')
              .insert({
                title: movieMetadata.title || upload.file.name.split('.')[0],
                video_url: upload.url,
                thumbnail_url: upload.thumbnailUrl || null,
                description: movieMetadata.description,
                category: movieMetadata.genre,
                release_year: movieMetadata.releaseDate ? new Date(movieMetadata.releaseDate).getFullYear() : null,
                rating: movieMetadata.rating || null,
                duration: 0,
                uploaded_by: session.user.email || userId
              });

            if (movieError) {
              console.error('Failed to save movie metadata:', movieError);
              toast.error(`Failed to save movie metadata: ${movieError.message}`);
            } else {
              console.log('Movie metadata saved successfully');
            }
          } else {
            const { error: musicError } = await supabase
              .from('music')
              .insert({
                title: musicMetadata.trackName || upload.file.name.split('.')[0],
                artist: musicMetadata.artist,
                audio_url: upload.url,
                album: musicMetadata.album,
                album_art_url: upload.thumbnailUrl || null,
                genre: musicMetadata.genre.toLowerCase(),
                rating: musicMetadata.rating || null,
                duration: 0,
                uploaded_by: session.user.email || userId
              });

            if (musicError) {
              console.error('Failed to save music metadata:', musicError);
              toast.error(`Failed to save music metadata: ${musicError.message}`);
            } else {
              console.log('Music metadata saved successfully');
            }
          }
        } catch (error: unknown) {
          handleError(error, 'Saving metadata');
        }
      }

      toast.success('Files uploaded and metadata saved successfully!');
      // Stay on upload dashboard instead of redirecting
      resetUpload();
    } catch (error: unknown) {
      handleError(error, 'Saving metadata');
    }
  }, [uploadType, uploads, movieMetadata, musicMetadata, goToMovies, goToMusic]);

  const resetUpload = useCallback(() => {
    setUploadType(null);
    setUploads([]);
    setMovieMetadata({ title: '', description: '', genre: '', releaseDate: '', rating: 0 });
    setMusicMetadata({ trackName: '', artist: '', album: '', genre: '', rating: 0 });
    setIsUploading(false);
  }, []);

  // Check if user can upload
  if (!canUpload || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-300 mb-6">
            Admin privileges are required to upload content.
          </p>
          <button
            onClick={goToChoice}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!uploadType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 max-w-2xl w-full">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white">Upload Content</h1>
            <RoleIndicator />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setUploadType('movie')}
              className="bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 p-6 rounded-xl text-white transition-all duration-200 group"
            >
              <Film className="w-12 h-12 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-semibold mb-2">Upload Movie</h3>
              <p className="text-red-100">Upload video files and add metadata</p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setUploadType('music')}
              className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 p-6 rounded-xl text-white transition-all duration-200 group"
            >
              <Music className="w-12 h-12 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-semibold mb-2">Upload Music</h3>
              <p className="text-blue-100">Upload audio files and add metadata</p>
            </motion.button>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={goToChoice}
              className="text-slate-300 hover:text-white transition-colors flex items-center justify-center mx-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={resetUpload}
                className="text-slate-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2">
                {uploadType === 'movie' ? (
                  <Film className="w-6 h-6 text-red-400" />
                ) : (
                  <Music className="w-6 h-6 text-blue-400" />
                )}
                <h1 className="text-2xl font-bold text-white">
                  Upload {uploadType === 'movie' ? 'Movie' : 'Music'}
                </h1>
              </div>
            </div>
            <RoleIndicator />
          </div>

          {/* File Upload Area */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
              isDragActive
                ? 'border-purple-400 bg-purple-900/20'
                : 'border-slate-600 hover:border-purple-400 hover:bg-purple-900/10'
            } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            <UploadIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-300 mb-2">
              {isDragActive
                ? 'Drop files here...'
                : `Drag & drop ${uploadType} files here, or click to select`}
            </p>
            <p className="text-sm text-slate-500">
              {uploadType === 'movie' 
                ? 'Supports MP4, MOV, AVI, WMV, WebM (max 2GB)'
                : 'Supports MP3, WAV, FLAC, OGG (max 2GB)'}
            </p>
          </div>

          {/* Upload Progress */}
          {uploads.length > 0 && (
            <div className="mt-6 space-y-3">
              {uploads.map((upload, index) => (
                <div key={index} className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{upload.file.name}</span>
                    <span className={`text-sm px-2 py-1 rounded ${
                      upload.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      upload.status === 'error' ? 'bg-red-500/20 text-red-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {upload.status}
                    </span>
                  </div>
                  {upload.status === 'uploading' && (
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                  )}
                  {upload.error && (
                    <p className="text-red-400 text-sm mt-2">{upload.error}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Metadata Form */}
          {uploads.some(upload => upload.status === 'completed') && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Metadata</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {uploadType === 'movie' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                      <input
                        type="text"
                        value={movieMetadata.title}
                        onChange={(e) => setMovieMetadata(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-purple-400 focus:outline-none"
                        placeholder="Movie title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Genre</label>
                      <input
                        type="text"
                        value={movieMetadata.genre}
                        onChange={(e) => setMovieMetadata(prev => ({ ...prev, genre: e.target.value }))}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-purple-400 focus:outline-none"
                        placeholder="Action, Comedy, Drama..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Release Date</label>
                      <input
                        type="date"
                        value={movieMetadata.releaseDate}
                        onChange={(e) => setMovieMetadata(prev => ({ ...prev, releaseDate: e.target.value }))}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-purple-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Rating (1-10)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        step="0.1"
                        value={movieMetadata.rating}
                        onChange={(e) => setMovieMetadata(prev => ({ ...prev, rating: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-purple-400 focus:outline-none"
                        placeholder="8.5"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                      <textarea
                        value={movieMetadata.description}
                        onChange={(e) => setMovieMetadata(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-purple-400 focus:outline-none"
                        rows={3}
                        placeholder="Movie description"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Track Name</label>
                      <input
                        type="text"
                        value={musicMetadata.trackName}
                        onChange={(e) => setMusicMetadata(prev => ({ ...prev, trackName: e.target.value }))}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-purple-400 focus:outline-none"
                        placeholder="Song title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Artist</label>
                      <input
                        type="text"
                        value={musicMetadata.artist}
                        onChange={(e) => setMusicMetadata(prev => ({ ...prev, artist: e.target.value }))}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-purple-400 focus:outline-none"
                        placeholder="Artist name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Album</label>
                      <input
                        type="text"
                        value={musicMetadata.album}
                        onChange={(e) => setMusicMetadata(prev => ({ ...prev, album: e.target.value }))}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-purple-400 focus:outline-none"
                        placeholder="Album name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Genre</label>
                      <input
                        type="text"
                        value={musicMetadata.genre}
                        onChange={(e) => setMusicMetadata(prev => ({ ...prev, genre: e.target.value }))}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-purple-400 focus:outline-none"
                        placeholder="Rock, Pop, Jazz..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Rating (1-10)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        step="0.1"
                        value={musicMetadata.rating}
                        onChange={(e) => setMusicMetadata(prev => ({ ...prev, rating: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-purple-400 focus:outline-none"
                        placeholder="8.5"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 flex space-x-4">
                <button
                  onClick={saveMetadata}
                  disabled={isUploading}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white px-6 py-2 rounded-lg transition-colors flex items-center"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Save Metadata
                </button>
                <button
                  onClick={resetUpload}
                  className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}