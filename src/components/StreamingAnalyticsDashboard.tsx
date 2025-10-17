import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  AlertTriangle,
  Wifi,
  WifiOff,
  Monitor,
  Smartphone,
  Globe,
  Play,
  Pause,
  SkipForward,
  Eye,
  Download,
  Share2
} from 'lucide-react';
import { streamingService } from '../lib/streamingService';

interface AnalyticsData {
  totalViews: number;
  totalWatchTime: number;
  averageWatchTime: number;
  completionRate: number;
  bufferRate: number;
  errorRate: number;
  qualityDistribution: { [key: string]: number };
  deviceBreakdown: { [key: string]: number };
  geographicDistribution: { [key: string]: number };
  hourlyViews: { [key: string]: number };
  topContent: Array<{ id: string; title: string; views: number; watchTime: number }>;
  recentErrors: Array<{ timestamp: Date; error: string; count: number }>;
}

interface StreamingAnalyticsDashboardProps {
  mediaId?: string;
  timeRange?: '24h' | '7d' | '30d' | '90d';
  onDataUpdate?: (data: AnalyticsData) => void;
}

export const StreamingAnalyticsDashboard = ({ 
  mediaId, 
  timeRange = '7d',
  onDataUpdate 
}: StreamingAnalyticsDashboardProps) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<string>('views');
  const [showDetails, setShowDetails] = useState(false);

  // Mock data generator for demonstration
  const generateMockData = useCallback((): AnalyticsData => {
    const now = new Date();
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
      return hour.getHours().toString().padStart(2, '0') + ':00';
    });

    return {
      totalViews: Math.floor(Math.random() * 10000) + 5000,
      totalWatchTime: Math.floor(Math.random() * 1000000) + 500000,
      averageWatchTime: Math.floor(Math.random() * 300) + 120,
      completionRate: Math.random() * 40 + 50,
      bufferRate: Math.random() * 10 + 2,
      errorRate: Math.random() * 5 + 1,
      qualityDistribution: {
        '4K': Math.floor(Math.random() * 20) + 5,
        '1080p': Math.floor(Math.random() * 40) + 30,
        '720p': Math.floor(Math.random() * 30) + 20,
        '480p': Math.floor(Math.random() * 15) + 5,
        '360p': Math.floor(Math.random() * 10) + 2
      },
      deviceBreakdown: {
        'Desktop': Math.floor(Math.random() * 50) + 30,
        'Mobile': Math.floor(Math.random() * 40) + 25,
        'Tablet': Math.floor(Math.random() * 20) + 10,
        'TV': Math.floor(Math.random() * 15) + 5
      },
      geographicDistribution: {
        'North America': Math.floor(Math.random() * 40) + 25,
        'Europe': Math.floor(Math.random() * 30) + 20,
        'Asia': Math.floor(Math.random() * 25) + 15,
        'South America': Math.floor(Math.random() * 15) + 8,
        'Africa': Math.floor(Math.random() * 10) + 5,
        'Oceania': Math.floor(Math.random() * 8) + 3
      },
      hourlyViews: hours.reduce((acc, hour) => {
        acc[hour] = Math.floor(Math.random() * 100) + 20;
        return acc;
      }, {} as { [key: string]: number }),
      topContent: [
        { id: '1', title: 'Sample Movie 1', views: 1250, watchTime: 45000 },
        { id: '2', title: 'Sample Movie 2', views: 980, watchTime: 32000 },
        { id: '3', title: 'Sample Movie 3', views: 750, watchTime: 28000 },
        { id: '4', title: 'Sample Movie 4', views: 620, watchTime: 22000 },
        { id: '5', title: 'Sample Movie 5', views: 580, watchTime: 19000 }
      ],
      recentErrors: [
        { timestamp: new Date(Date.now() - 3600000), error: 'Network timeout', count: 12 },
        { timestamp: new Date(Date.now() - 7200000), error: 'Codec not supported', count: 8 },
        { timestamp: new Date(Date.now() - 10800000), error: 'Buffer underrun', count: 15 },
        { timestamp: new Date(Date.now() - 14400000), error: 'Authentication failed', count: 3 }
      ]
    };
  }, []);

  // Load analytics data
  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      
      try {
        // In a real implementation, this would fetch from your analytics API
        const data = generateMockData();
        setAnalyticsData(data);
        onDataUpdate?.(data);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [mediaId, timeRange, generateMockData, onDataUpdate]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'views':
        return <Eye className="w-5 h-5" />;
      case 'watchTime':
        return <Clock className="w-5 h-5" />;
      case 'completion':
        return <TrendingUp className="w-5 h-5" />;
      case 'buffer':
        return <Wifi className="w-5 h-5" />;
      case 'errors':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <BarChart3 className="w-5 h-5" />;
    }
  };

  const getMetricColor = (metric: string) => {
    switch (metric) {
      case 'views':
        return 'text-blue-400 bg-blue-500/20';
      case 'watchTime':
        return 'text-green-400 bg-green-500/20';
      case 'completion':
        return 'text-purple-400 bg-purple-500/20';
      case 'buffer':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'errors':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-slate-400 bg-slate-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="streaming-analytics-dashboard p-6 bg-slate-900 rounded-xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-400">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="streaming-analytics-dashboard p-6 bg-slate-900 rounded-xl">
        <div className="text-center py-8">
          <BarChart3 className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400">No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="streaming-analytics-dashboard p-6 bg-slate-900 rounded-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Streaming Analytics</h2>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => {/* Handle time range change */}}
            className="px-3 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-white text-sm transition-colors"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-4 bg-slate-800 rounded-lg border border-slate-700"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${getMetricColor('views')}`}>
              {getMetricIcon('views')}
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Views</p>
              <p className="text-2xl font-bold text-white">{formatNumber(analyticsData.totalViews)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-green-400 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>+12.5% from last period</span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-4 bg-slate-800 rounded-lg border border-slate-700"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${getMetricColor('watchTime')}`}>
              {getMetricIcon('watchTime')}
            </div>
            <div>
              <p className="text-slate-400 text-sm">Watch Time</p>
              <p className="text-2xl font-bold text-white">{formatDuration(analyticsData.totalWatchTime)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-green-400 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>+8.3% from last period</span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-4 bg-slate-800 rounded-lg border border-slate-700"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${getMetricColor('completion')}`}>
              {getMetricIcon('completion')}
            </div>
            <div>
              <p className="text-slate-400 text-sm">Completion Rate</p>
              <p className="text-2xl font-bold text-white">{analyticsData.completionRate.toFixed(1)}%</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-red-400 text-sm">
            <TrendingDown className="w-4 h-4" />
            <span>-2.1% from last period</span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-4 bg-slate-800 rounded-lg border border-slate-700"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${getMetricColor('buffer')}`}>
              {getMetricIcon('buffer')}
            </div>
            <div>
              <p className="text-slate-400 text-sm">Buffer Rate</p>
              <p className="text-2xl font-bold text-white">{analyticsData.bufferRate.toFixed(1)}%</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-green-400 text-sm">
            <TrendingDown className="w-4 h-4" />
            <span>-0.5% from last period</span>
          </div>
        </motion.div>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quality Distribution */}
        <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Quality Distribution</h3>
          <div className="space-y-3">
            {Object.entries(analyticsData.qualityDistribution).map(([quality, percentage]) => (
              <div key={quality} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300">{quality}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-slate-700 rounded-full">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-white font-medium w-12 text-right">{percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Device Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(analyticsData.deviceBreakdown).map(([device, percentage]) => (
              <div key={device} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {device === 'Mobile' ? (
                    <Smartphone className="w-4 h-4 text-slate-400" />
                  ) : device === 'Desktop' ? (
                    <Monitor className="w-4 h-4 text-slate-400" />
                  ) : (
                    <Globe className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="text-slate-300">{device}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-slate-700 rounded-full">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-white font-medium w-12 text-right">{percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Content */}
        <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Top Content</h3>
          <div className="space-y-3">
            {analyticsData.topContent.map((content, index) => (
              <div key={content.id} className="flex items-center justify-between p-2 bg-slate-700/50 rounded">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-sm w-6">#{index + 1}</span>
                  <div>
                    <p className="text-white font-medium text-sm">{content.title}</p>
                    <p className="text-slate-400 text-xs">{formatNumber(content.views)} views</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white text-sm font-medium">{formatDuration(content.watchTime)}</p>
                  <p className="text-slate-400 text-xs">watch time</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Errors */}
        <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Errors</h3>
          <div className="space-y-3">
            {analyticsData.recentErrors.map((error, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-red-500/10 border border-red-500/20 rounded">
                <div>
                  <p className="text-red-400 font-medium text-sm">{error.error}</p>
                  <p className="text-slate-400 text-xs">
                    {error.timestamp.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-red-400 text-sm font-medium">{error.count}</p>
                  <p className="text-slate-400 text-xs">occurrences</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-6 p-4 bg-slate-800 rounded-lg border border-slate-700"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Detailed Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="text-white font-medium mb-2">Geographic Distribution</h4>
              <div className="space-y-2">
                {Object.entries(analyticsData.geographicDistribution).map(([region, percentage]) => (
                  <div key={region} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{region}</span>
                    <span className="text-white">{percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-2">Performance Metrics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-300">Average Watch Time</span>
                  <span className="text-white">{formatDuration(analyticsData.averageWatchTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Error Rate</span>
                  <span className="text-white">{analyticsData.errorRate.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Buffer Events</span>
                  <span className="text-white">{analyticsData.bufferRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-2">Hourly Views</h4>
              <div className="space-y-1">
                {Object.entries(analyticsData.hourlyViews).slice(-6).map(([hour, views]) => (
                  <div key={hour} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{hour}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 bg-slate-700 rounded-full">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(views / 100) * 100}%` }}
                        />
                      </div>
                      <span className="text-white w-8 text-right">{views}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

