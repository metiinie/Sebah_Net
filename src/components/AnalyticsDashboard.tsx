import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Play, 
  Clock, 
  Star,
  Eye,
  Heart,
  Download,
  Calendar
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AnalyticsData {
  totalMovies: number;
  totalMusic: number;
  totalUsers: number;
  recentUploads: number;
  popularGenres: Array<{ genre: string; count: number }>;
  monthlyStats: Array<{ month: string; movies: number; music: number }>;
  topRated: Array<{ title: string; rating: number; type: 'movie' | 'music' }>;
}

export const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAnalytics();
    }, 100); // Small delay to prevent rapid re-fetching
    
    return () => clearTimeout(timeoutId);
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch movies and music counts
      const [moviesRes, musicRes] = await Promise.all([
        supabase.from('movies').select('*'),
        supabase.from('music').select('*')
      ]);

      if (moviesRes.error) throw moviesRes.error;
      if (musicRes.error) throw musicRes.error;

      const movies = moviesRes.data || [];
      const music = musicRes.data || [];

      // Calculate analytics
      const totalMovies = movies.length;
      const totalMusic = music.length;
      
      // Get recent uploads (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentUploads = [...movies, ...music].filter(item => 
        new Date(item.created_at) > thirtyDaysAgo
      ).length;

      // Popular genres
      const movieGenres = movies.reduce((acc: Record<string, number>, movie) => {
        if (movie.genre) {
          acc[movie.genre] = (acc[movie.genre] || 0) + 1;
        }
        return acc;
      }, {});

      const musicGenres = music.reduce((acc: Record<string, number>, track) => {
        if (track.genre) {
          acc[track.genre] = (acc[track.genre] || 0) + 1;
        }
        return acc;
      }, {});

      const allGenres = { ...movieGenres, ...musicGenres };
      const popularGenres = Object.entries(allGenres)
        .map(([genre, count]) => ({ genre, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Monthly stats (last 6 months)
      const monthlyStats = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        const monthMovies = movies.filter(movie => {
          const movieDate = new Date(movie.created_at);
          return movieDate.getMonth() === date.getMonth() && 
                 movieDate.getFullYear() === date.getFullYear();
        }).length;

        const monthMusic = music.filter(track => {
          const trackDate = new Date(track.created_at);
          return trackDate.getMonth() === date.getMonth() && 
                 trackDate.getFullYear() === date.getFullYear();
        }).length;

        monthlyStats.push({ month, movies: monthMovies, music: monthMusic });
      }

      // Top rated content
      const topRated = [
        ...movies.filter(m => m.rating).map(m => ({ 
          title: m.title, 
          rating: m.rating, 
          type: 'movie' as const 
        })),
        ...music.filter(m => m.rating).map(m => ({ 
          title: m.title, 
          rating: m.rating, 
          type: 'music' as const 
        }))
      ].sort((a, b) => b.rating - a.rating).slice(0, 5);

      const analyticsData = useMemo(() => ({
        totalMovies,
        totalMusic,
        totalUsers: 1, // Placeholder - would need user tracking
        recentUploads,
        popularGenres,
        monthlyStats,
        topRated
      }), [totalMovies, totalMusic, recentUploads, popularGenres, monthlyStats, topRated]);
      
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 text-center">
        <p className="text-slate-400">Failed to load analytics data</p>
      </div>
    );
  }

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = 'blue',
    trend 
  }: {
    title: string;
    value: number | string;
    icon: any;
    color?: 'blue' | 'green' | 'purple' | 'yellow';
    trend?: string;
  }) => {
    const colorClasses = {
      blue: 'text-blue-400 bg-blue-500/10',
      green: 'text-green-400 bg-green-500/10',
      purple: 'text-purple-400 bg-purple-500/10',
      yellow: 'text-yellow-400 bg-yellow-500/10'
    };

    return (
      <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            {trend && (
              <p className="text-xs text-green-400 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                {trend}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-purple-400" />
          <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
        </div>
        
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-purple-400 focus:outline-none"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Movies"
          value={analytics.totalMovies}
          icon={Play}
          color="blue"
        />
        <StatCard
          title="Total Music"
          value={analytics.totalMusic}
          icon={Heart}
          color="green"
        />
        <StatCard
          title="Recent Uploads"
          value={analytics.recentUploads}
          icon={Calendar}
          color="purple"
        />
        <StatCard
          title="Total Content"
          value={analytics.totalMovies + analytics.totalMusic}
          icon={BarChart3}
          color="yellow"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Genres */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Popular Genres</h3>
          <div className="space-y-3">
            {analytics.popularGenres.map((genre, index) => (
              <div key={genre.genre} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {index + 1}
                  </div>
                  <span className="text-slate-300">{genre.genre}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                      style={{ 
                        width: `${(genre.count / Math.max(...analytics.popularGenres.map(g => g.count))) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="text-slate-400 text-sm w-8 text-right">{genre.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Rated Content */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Top Rated Content</h3>
          <div className="space-y-3">
            {analytics.topRated.map((item, index) => (
              <div key={`${item.type}-${item.title}`} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{item.title}</p>
                    <p className="text-slate-400 text-xs capitalize">{item.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-slate-300 text-sm">{item.rating}/10</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Uploads Chart */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Monthly Uploads</h3>
        <div className="h-64 flex items-end justify-between gap-2">
          {analytics.monthlyStats.map((stat, index) => {
            const maxValue = Math.max(...analytics.monthlyStats.map(s => s.movies + s.music));
            const height = ((stat.movies + stat.music) / maxValue) * 100;
            
            return (
              <div key={stat.month} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col justify-end h-48 gap-1">
                  <div
                    className="bg-gradient-to-t from-purple-500 to-blue-500 rounded-t"
                    style={{ height: `${(stat.music / maxValue) * 100}%` }}
                  />
                  <div
                    className="bg-gradient-to-t from-blue-500 to-cyan-500 rounded-t"
                    style={{ height: `${(stat.movies / maxValue) * 100}%` }}
                  />
                </div>
                <div className="mt-2 text-center">
                  <p className="text-slate-400 text-xs">{stat.month}</p>
                  <p className="text-white text-sm font-medium">{stat.movies + stat.music}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded"></div>
            <span className="text-slate-400 text-sm">Movies</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded"></div>
            <span className="text-slate-400 text-sm">Music</span>
          </div>
        </div>
      </div>
    </div>
  );
};
