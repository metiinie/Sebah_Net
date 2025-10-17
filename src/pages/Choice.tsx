import { motion } from 'framer-motion';
import { Film, Music, LogOut, Upload, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { RoleIndicator } from '../components/RoleIndicator';
import { PermissionGuard } from '../components/PermissionGuard';
import { usePageNavigation } from '../hooks/usePageNavigation';

export const Choice = () => {
  const { goToAuth, goToUpload, goToAdmin, goToMovies, goToMusic } = usePageNavigation();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    goToAuth();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-12"
        >
          <div className="flex items-center gap-6">
            
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                Welcome to Combine Site
              </h1>
              <p className="text-slate-400 text-lg mb-4">Choose your entertainment experience</p>
              <RoleIndicator showPermissions={false} size="sm" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <PermissionGuard permission="upload_movies" fallback={
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled
                className="flex items-center gap-2 px-6 py-2 bg-slate-600 text-slate-400 rounded-lg font-medium cursor-not-allowed opacity-50"
              >
                <Upload className="w-4 h-4" />
                Upload
              </motion.button>
            }>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToUpload}
                className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload
              </motion.button>
            </PermissionGuard>
            
            <PermissionGuard permission="access_admin_panel" fallback={null}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToAdmin}
                className="flex items-center gap-2 px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
              >
                <Crown className="w-4 h-4" />
                Admin Panel
              </motion.button>
            </PermissionGuard>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSignOut}
              className="flex items-center gap-2 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </motion.button>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02, y: -8 }}
            onClick={goToMovies}
            className="group relative cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-12 border border-cyan-500/30 hover:border-cyan-500/60 transition-all overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-cyan-500/20 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                  <Film className="w-10 h-10 text-cyan-400" />
                </div>
                <h2 className="text-4xl font-bold text-white mb-4">Movies</h2>
                <p className="text-slate-300 text-lg mb-6">
                  Dive into a vast collection of films with stunning visuals and immersive storytelling
                </p>
                <div className="flex items-center gap-2 text-cyan-400 font-medium">
                  Explore Movies
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    →
                  </motion.span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02, y: -8 }}
            onClick={goToMusic}
            className="group relative cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-12 border border-pink-500/30 hover:border-pink-500/60 transition-all overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-pink-500/20 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                  <Music className="w-10 h-10 text-pink-400" />
                </div>
                <h2 className="text-4xl font-bold text-white mb-4">Music</h2>
                <p className="text-slate-300 text-lg mb-6">
                  Stream your favorite tracks, discover new artists, and create personalized playlists
                </p>
                <div className="flex items-center gap-2 text-pink-400 font-medium">
                  Explore Music
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    →
                  </motion.span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 grid grid-cols-3 gap-4 max-w-3xl mx-auto"
        >
          {[
            { label: '10K+ Movies', color: 'cyan' },
            { label: '50K+ Songs', color: 'pink' },
            { label: 'HD Streaming', color: 'purple' }
          ].map((stat, idx) => (
            <div
              key={idx}
              className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700 text-center"
            >
              <div className={`text-2xl font-bold text-${stat.color}-400 mb-1`}>
                {stat.label.split(' ')[0]}
              </div>
              <div className="text-slate-400 text-sm">{stat.label.split(' ').slice(1).join(' ')}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
