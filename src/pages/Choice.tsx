import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Film, Music, Upload, Crown, ArrowRight, Play, Mic2, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { RoleIndicator } from '../components/RoleIndicator';
import { PermissionGuard } from '../components/PermissionGuard';
import { usePageNavigation } from '../hooks/usePageNavigation';
import React from 'react';

const StatCard = ({ label, value, icon: Icon, colorClass }: { label: string, value: string, icon: any, colorClass: string }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="glass-dark p-6 rounded-2xl border border-white/5 flex flex-col items-center text-center group"
  >
    <div className={`p-3 rounded-xl bg-white/5 ${colorClass} mb-4 group-hover:scale-110 transition-transform`}>
      <Icon className="w-6 h-6" />
    </div>
    <div className="text-2xl font-bold text-white mb-1">{value}</div>
    <div className="text-slate-400 text-sm font-medium">{label}</div>
  </motion.div>
);

const ChoiceCard = ({
  title,
  description,
  icon: Icon,
  onClick,
  gradient,
  accentColor,
  delay
}: {
  title: string,
  description: string,
  icon: any,
  onClick: () => void,
  gradient: string,
  accentColor: string,
  delay: number
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="perspective-1000"
    >
      <motion.div
        style={{ rotateX, rotateY }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        className={`relative group cursor-pointer overflow-hidden rounded-[2.5rem] bg-slate-900 border border-white/10 p-1 transition-all duration-300 hover:border-${accentColor}-500/50 shadow-2xl hover:shadow-${accentColor}-500/20`}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-20 group-hover:opacity-30 transition-opacity`} />

        {/* Badge */}
        <div className="absolute top-6 right-6 z-20">
          <div className={`px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-bold text-${accentColor}-400 uppercase tracking-widest`}>
            {title === "Cinema" ? "Trending" : "Featured"}
          </div>
        </div>

        <div className="relative z-10 p-10 md:p-12 h-full flex flex-col">
          <div className={`mb-8 inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/5 border border-white/10 text-${accentColor}-400 group-hover:scale-110 transition-transform duration-500`}>
            <Icon className="w-10 h-10" />
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            {title}
          </h2>

          <p className="text-slate-400 text-lg leading-relaxed mb-8 flex-grow">
            {description}
          </p>

          <div className="flex items-center gap-3 text-white font-semibold group/btn">
            <span className={`px-6 py-3 rounded-full bg-white/10 group-hover:bg-${accentColor}-500 transition-colors duration-300 flex items-center gap-2`}>
              Explore {title}
              <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
            </span>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors" />
      </motion.div>
    </motion.div>
  );
};

export const Choice = () => {
  const { goToAuth, goToUpload, goToAdmin, goToMovies, goToMusic } = usePageNavigation();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    goToAuth();
  };

  return (
    <div className="min-h-screen mesh-gradient noise-bg selection:bg-purple-500/30 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 lg:py-24 relative z-10">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] -z-10 animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Navbar-like Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-20"
        >
          <div className="flex flex-col gap-2">
            <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tighter">
              Choice <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">Your Destination</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <PermissionGuard permission="upload_movies">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={goToUpload}
                className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-semibold border border-white/10 transition-all shimmer-btn"
              >
                <Upload className="w-4 h-4 text-emerald-400" />
                Upload
              </motion.button>
            </PermissionGuard>

            <PermissionGuard permission="access_admin_panel">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={goToAdmin}
                className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-semibold border border-white/10 transition-all shimmer-btn"
              >
                <Crown className="w-4 h-4 text-amber-400" />
                Admin Panel
              </motion.button>
            </PermissionGuard>

          </div>
        </motion.div>

        {/* Hero Cards Grid */}
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 mb-20">
          <ChoiceCard
            title="Cinema"
            description="Experience blockbuster movies and exclusive series with stunning 4K visuals and immersive spatial audio."
            icon={Film}
            onClick={goToMovies}
            gradient="from-blue-600 to-cyan-500"
            accentColor="cyan"
            delay={0.2}
          />
          <ChoiceCard
            title="Music"
            description="Discover millions of high-fidelity tracks, curated playlists, and live performances tailored to your taste."
            icon={Music}
            onClick={goToMusic}
            gradient="from-purple-600 to-pink-500"
            accentColor="pink"
            delay={0.3}
          />
        </div>

        {/* Stats Section with Glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        >
          <div className="lg:col-span-1 flex flex-col justify-center pr-8 mb-4 lg:mb-0 text-center lg:text-left">
            <h3 className="text-2xl font-bold text-white mb-2">Platform At A Glance</h3>
            <p className="text-slate-400 text-sm">Real-time statistics from our growing entertainment global network.</p>
          </div>
          <StatCard label="Premium Movies" value="12,480" icon={Play} colorClass="text-blue-400" />
          <StatCard label="Audio Tracks" value="2.5M+" icon={Mic2} colorClass="text-pink-400" />
          <StatCard label="Global Users" value="850K" icon={Sparkles} colorClass="text-purple-400" />
        </motion.div>
      </div>
    </div>
  );
};
