import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileVideo, 
  Settings,
  Download,
  Trash2,
  RefreshCw,
  AlertCircle,
  Info
} from 'lucide-react';
import { streamingService, TranscodingJob, VideoFormat } from '../lib/streamingService';

interface TranscodingPipelineProps {
  onJobComplete?: (job: TranscodingJob) => void;
  onJobError?: (job: TranscodingJob) => void;
}

export const TranscodingPipeline = ({ onJobComplete, onJobError }: TranscodingPipelineProps) => {
  const [jobs, setJobs] = useState<TranscodingJob[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFormats, setSelectedFormats] = useState<string[]>(['720p', '1080p']);
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState({
    enableHLS: true,
    enableDASH: true,
    enableThumbnails: true,
    qualityOptimization: true,
    compressionLevel: 'medium' as 'low' | 'medium' | 'high'
  });

  // Load existing jobs on mount
  useEffect(() => {
    const existingJobs = streamingService.getAllJobs();
    setJobs(existingJobs);
  }, []);

  // Listen for transcoding progress updates
  useEffect(() => {
    const handleProgress = (event: CustomEvent) => {
      const job = event.detail as TranscodingJob;
      setJobs(prev => prev.map(j => j.id === job.id ? job : j));
      
      if (job.status === 'completed') {
        onJobComplete?.(job);
      } else if (job.status === 'failed') {
        onJobError?.(job);
      }
    };

    window.addEventListener('transcodingProgress', handleProgress as EventListener);
    return () => window.removeEventListener('transcodingProgress', handleProgress as EventListener);
  }, [onJobComplete, onJobError]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate file upload
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setUploadProgress(i);
      }

      // Generate formats based on selection
      const formats: VideoFormat[] = [];
      
      if (selectedFormats.includes('360p')) {
        formats.push({
          id: '360p',
          name: '360p',
          resolution: '640x360',
          bitrate: 500000,
          codec: 'h264',
          container: 'mp4'
        });
      }
      
      if (selectedFormats.includes('720p')) {
        formats.push({
          id: '720p',
          name: '720p HD',
          resolution: '1280x720',
          bitrate: 2500000,
          codec: 'h264',
          container: 'mp4'
        });
      }
      
      if (selectedFormats.includes('1080p')) {
        formats.push({
          id: '1080p',
          name: '1080p FHD',
          resolution: '1920x1080',
          bitrate: 5000000,
          codec: 'h264',
          container: 'mp4'
        });
      }
      
      if (selectedFormats.includes('4k')) {
        formats.push({
          id: '4k',
          name: '4K UHD',
          resolution: '3840x2160',
          bitrate: 15000000,
          codec: 'h264',
          container: 'mp4'
        });
      }

      // Add HLS format if enabled
      if (config.enableHLS) {
        formats.push({
          id: 'hls',
          name: 'HLS Adaptive',
          resolution: 'adaptive',
          bitrate: 0,
          codec: 'h264',
          container: 'm3u8'
        });
      }

      // Add DASH format if enabled
      if (config.enableDASH) {
        formats.push({
          id: 'dash',
          name: 'DASH Adaptive',
          resolution: 'adaptive',
          bitrate: 0,
          codec: 'h264',
          container: 'mpd'
        });
      }

      // Create transcoding job
      const job = await streamingService.createTranscodingJob(URL.createObjectURL(file), formats);
      setJobs(prev => [...prev, job]);

    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [selectedFormats, config]);

  const cancelJob = useCallback((jobId: string) => {
    const success = streamingService.cancelJob(jobId);
    if (success) {
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, status: 'failed', error: 'Cancelled by user' } : job
      ));
    }
  }, []);

  const retryJob = useCallback(async (job: TranscodingJob) => {
    const newJob = await streamingService.createTranscodingJob(job.inputUrl, job.outputFormats);
    setJobs(prev => prev.map(j => j.id === job.id ? newJob : j));
  }, []);

  const deleteJob = useCallback((jobId: string) => {
    setJobs(prev => prev.filter(job => job.id !== jobId));
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'processing':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 border-green-500/30';
      case 'failed':
        return 'bg-red-500/20 border-red-500/30';
      case 'processing':
        return 'bg-blue-500/20 border-blue-500/30';
      default:
        return 'bg-yellow-500/20 border-yellow-500/30';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <div className="transcoding-pipeline p-6 bg-slate-900 rounded-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Transcoding Pipeline</h2>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 text-slate-400 hover:text-white transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Transcoding Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Output Formats</label>
                <div className="space-y-2">
                  {['360p', '720p', '1080p', '4k'].map(format => (
                    <label key={format} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedFormats.includes(format)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFormats(prev => [...prev, format]);
                          } else {
                            setSelectedFormats(prev => prev.filter(f => f !== format));
                          }
                        }}
                        className="rounded border-slate-600 bg-slate-700 text-blue-500"
                      />
                      <span className="text-slate-300">{format}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-slate-300 mb-2">Advanced Options</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.enableHLS}
                      onChange={(e) => setConfig(prev => ({ ...prev, enableHLS: e.target.checked }))}
                      className="rounded border-slate-600 bg-slate-700 text-blue-500"
                    />
                    <span className="text-slate-300">Enable HLS</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.enableDASH}
                      onChange={(e) => setConfig(prev => ({ ...prev, enableDASH: e.target.checked }))}
                      className="rounded border-slate-600 bg-slate-700 text-blue-500"
                    />
                    <span className="text-slate-300">Enable DASH</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.enableThumbnails}
                      onChange={(e) => setConfig(prev => ({ ...prev, enableThumbnails: e.target.checked }))}
                      className="rounded border-slate-600 bg-slate-700 text-blue-500"
                    />
                    <span className="text-slate-300">Generate Thumbnails</span>
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Area */}
      <div className="mb-6">
        <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-slate-500 transition-colors">
          <input
            type="file"
            accept="video/*"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
            id="video-upload"
          />
          <label
            htmlFor="video-upload"
            className="cursor-pointer flex flex-col items-center gap-4"
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
                <div className="text-white">
                  <p className="text-lg font-medium">Uploading...</p>
                  <div className="w-64 h-2 bg-slate-700 rounded-full mt-2">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-slate-400 mt-1">{uploadProgress}%</p>
                </div>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 text-slate-400" />
                <div className="text-slate-300">
                  <p className="text-lg font-medium">Upload Video for Transcoding</p>
                  <p className="text-sm">Click to select or drag and drop</p>
                  <p className="text-xs text-slate-500 mt-2">
                    Supports MP4, AVI, MOV, MKV, WebM
                  </p>
                </div>
              </>
            )}
          </label>
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Transcoding Jobs</h3>
        
        {jobs.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <FileVideo className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No transcoding jobs yet</p>
            <p className="text-sm">Upload a video to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg border ${getStatusColor(job.status)}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <p className="text-white font-medium">Job {job.id.slice(-8)}</p>
                      <p className="text-sm text-slate-400">
                        {job.status === 'processing' ? `${job.progress}% complete` : 
                         job.status === 'completed' ? 'Completed' :
                         job.status === 'failed' ? 'Failed' : 'Pending'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {job.status === 'failed' && (
                      <button
                        onClick={() => retryJob(job)}
                        className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                        title="Retry"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => deleteJob(job.id)}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                {job.status === 'processing' && (
                  <div className="mb-3">
                    <div className="w-full h-2 bg-slate-700 rounded-full">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Output Formats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {job.outputFormats.map((format) => (
                    <div
                      key={format.id}
                      className="flex items-center justify-between p-2 bg-slate-800/50 rounded text-sm"
                    >
                      <div>
                        <p className="text-white font-medium">{format.name}</p>
                        <p className="text-slate-400 text-xs">
                          {format.resolution} • {format.bitrate ? `${(format.bitrate / 1000000).toFixed(1)} Mbps` : 'Adaptive'}
                        </p>
                      </div>
                      
                      {format.url && (
                        <button
                          onClick={() => window.open(format.url, '_blank')}
                          className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Error Message */}
                {job.error && (
                  <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded text-sm">
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      <span>{job.error}</span>
                    </div>
                  </div>
                )}

                {/* Job Info */}
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                  <span>Created: {job.createdAt.toLocaleString()}</span>
                  {job.completedAt && (
                    <span>Completed: {job.completedAt.toLocaleString()}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

