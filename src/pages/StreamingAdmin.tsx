import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Settings, 
  BarChart3, 
  Video, 
  Server, 
  Globe,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { TranscodingPipeline } from '../components/TranscodingPipeline';
import { StreamingAnalyticsDashboard } from '../components/StreamingAnalyticsDashboard';
import { streamingService } from '../lib/streamingService';
import { usePageNavigation } from '../hooks/usePageNavigation';

export const StreamingAdmin = () => {
  const { goToChoice } = usePageNavigation();
  const [activeTab, setActiveTab] = useState<'overview' | 'transcoding' | 'analytics' | 'cdn'>('overview');
  const [systemStats, setSystemStats] = useState({
    activeJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    totalViews: 0,
    averageWatchTime: 0,
    bufferRate: 0,
    errorRate: 0
  });

  useEffect(() => {
    // Load system statistics
    const loadSystemStats = async () => {
      try {
        const jobs = streamingService.getAllJobs();
        const stats = {
          activeJobs: jobs.filter(job => job.status === 'processing' || job.status === 'pending').length,
          completedJobs: jobs.filter(job => job.status === 'completed').length,
          failedJobs: jobs.filter(job => job.status === 'failed').length,
          totalViews: 0, // This would come from analytics API
          averageWatchTime: 0,
          bufferRate: 0,
          errorRate: 0
        };
        setSystemStats(stats);
      } catch (error) {
        console.error('Failed to load system stats:', error);
      }
    };

    loadSystemStats();
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'transcoding', label: 'Transcoding', icon: Video },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'cdn', label: 'CDN', icon: Globe }
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
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
            <h1 className="text-3xl font-bold text-white">Streaming Intelligence</h1>
            <div className="w-20" />
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* System Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-6 bg-slate-800 rounded-xl border border-slate-700"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <Video className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Active Jobs</p>
                    <p className="text-2xl font-bold text-white">{systemStats.activeJobs}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-6 bg-slate-800 rounded-xl border border-slate-700"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/20 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Completed Jobs</p>
                    <p className="text-2xl font-bold text-white">{systemStats.completedJobs}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-6 bg-slate-800 rounded-xl border border-slate-700"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-500/20 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Failed Jobs</p>
                    <p className="text-2xl font-bold text-white">{systemStats.failedJobs}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-6 bg-slate-800 rounded-xl border border-slate-700"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Total Views</p>
                    <p className="text-2xl font-bold text-white">{systemStats.totalViews.toLocaleString()}</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* System Health */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 bg-slate-800 rounded-xl border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">System Health</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Transcoding Pipeline</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-400 text-sm">Healthy</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">CDN Status</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-400 text-sm">Online</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Analytics Service</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-400 text-sm">Active</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Database</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-400 text-sm">Connected</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-800 rounded-xl border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">CPU Usage</span>
                      <span className="text-white">45%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">Memory Usage</span>
                      <span className="text-white">62%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: '62%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">Storage Usage</span>
                      <span className="text-white">78%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full">
                      <div className="h-full bg-yellow-500 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">Network I/O</span>
                      <span className="text-white">23%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: '23%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="p-6 bg-slate-800 rounded-xl border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <div className="flex-1">
                    <p className="text-white text-sm">Transcoding job completed successfully</p>
                    <p className="text-slate-400 text-xs">Movie: "Sample Movie 1" - 2 minutes ago</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                  <Video className="w-5 h-5 text-blue-400" />
                  <div className="flex-1">
                    <p className="text-white text-sm">New video uploaded for processing</p>
                    <p className="text-slate-400 text-xs">File: "sample_video.mp4" - 5 minutes ago</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  <div className="flex-1">
                    <p className="text-white text-sm">Analytics data updated</p>
                    <p className="text-slate-400 text-xs">1,250 new views recorded - 10 minutes ago</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                  <Globe className="w-5 h-5 text-cyan-400" />
                  <div className="flex-1">
                    <p className="text-white text-sm">CDN cache refreshed</p>
                    <p className="text-slate-400 text-xs">Region: us-east-1 - 15 minutes ago</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Transcoding Tab */}
        {activeTab === 'transcoding' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <TranscodingPipeline
              onJobComplete={(job) => {
                console.log('Job completed:', job);
                // Update system stats
                setSystemStats(prev => ({
                  ...prev,
                  completedJobs: prev.completedJobs + 1,
                  activeJobs: Math.max(0, prev.activeJobs - 1)
                }));
              }}
              onJobError={(job) => {
                console.log('Job failed:', job);
                // Update system stats
                setSystemStats(prev => ({
                  ...prev,
                  failedJobs: prev.failedJobs + 1,
                  activeJobs: Math.max(0, prev.activeJobs - 1)
                }));
              }}
            />
          </motion.div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <StreamingAnalyticsDashboard
              timeRange="7d"
              onDataUpdate={(data) => {
                setSystemStats(prev => ({
                  ...prev,
                  totalViews: data.totalViews,
                  averageWatchTime: data.averageWatchTime,
                  bufferRate: data.bufferRate,
                  errorRate: data.errorRate
                }));
              }}
            />
          </motion.div>
        )}

        {/* CDN Tab */}
        {activeTab === 'cdn' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="p-6 bg-slate-800 rounded-xl border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">CDN Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-white font-medium mb-3">Global Regions</h4>
                  <div className="space-y-2">
                    {['us-east-1', 'eu-west-1', 'ap-southeast-1', 'ap-northeast-1'].map(region => (
                      <div key={region} className="flex items-center justify-between p-2 bg-slate-700/50 rounded">
                        <span className="text-slate-300">{region}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-green-400 text-sm">Active</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-white font-medium mb-3">Cache Statistics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Cache Hit Rate</span>
                      <span className="text-white">94.2%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Total Requests</span>
                      <span className="text-white">1.2M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Bandwidth Saved</span>
                      <span className="text-white">2.4 TB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Average Response Time</span>
                      <span className="text-white">45ms</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-800 rounded-xl border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Cache Management</h3>
              <div className="flex gap-4">
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  Purge All Cache
                </button>
                <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                  Refresh Cache
                </button>
                <button className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors">
                  Preload Content
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

