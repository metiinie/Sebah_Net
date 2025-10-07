import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Film, Music as MusicIcon, Trash2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase, Movie, Music } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export const Admin = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'movies' | 'music'>('movies');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [music, setMusic] = useState<Music[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (profile?.role !== 'admin') {
      toast.error('Access denied');
      navigate('/choice');
    } else {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [moviesRes, musicRes] = await Promise.all([
        supabase.from('movies').select('*').order('created_at', { ascending: false }),
        supabase.from('music').select('*').order('created_at', { ascending: false })
      ]);

      if (moviesRes.error) throw moviesRes.error;
      if (musicRes.error) throw musicRes.error;

      setMovies(moviesRes.data || []);
      setMusic(musicRes.data || []);
    } catch (error: any) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMovie = async (id: string) => {
    if (!confirm('Are you sure you want to delete this movie?')) return;

    try {
      const { error } = await supabase.from('movies').delete().eq('id', id);
      if (error) throw error;
      setMovies(movies.filter((m) => m.id !== id));
      toast.success('Movie deleted');
    } catch (error: any) {
      toast.error('Failed to delete movie');
    }
  };

  const handleDeleteMusic = async (id: string) => {
    if (!confirm('Are you sure you want to delete this track?')) return;

    try {
      const { error } = await supabase.from('music').delete().eq('id', id);
      if (error) throw error;
      setMusic(music.filter((m) => m.id !== id));
      toast.success('Track deleted');
    } catch (error: any) {
      toast.error('Failed to delete track');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/choice')}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </motion.button>
            <h1 className="text-3xl font-bold text-amber-400">Admin Panel</h1>
            <div className="w-20" />
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('movies')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'movies'
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <Film className="w-5 h-5" />
              Movies ({movies.length})
            </button>
            <button
              onClick={() => setActiveTab('music')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'music'
                  ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/50'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <MusicIcon className="w-5 h-5" />
              Music ({music.length})
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium shadow-lg shadow-green-500/50 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add New {activeTab === 'movies' ? 'Movie' : 'Track'}
          </motion.button>
        </div>

        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800 rounded-xl p-6 mb-6 border border-slate-700"
          >
            <AddContentForm
              type={activeTab}
              onSuccess={() => {
                setShowAddForm(false);
                fetchData();
              }}
            />
          </motion.div>
        )}

        {activeTab === 'movies' ? (
          <div className="space-y-4">
            {movies.map((movie) => (
              <motion.div
                key={movie.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-4 bg-slate-800/50 rounded-lg p-4 border border-slate-700"
              >
                <img
                  src={movie.thumbnail_url}
                  alt={movie.title}
                  className="w-24 h-36 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg mb-1">{movie.title}</h3>
                  <p className="text-slate-400 text-sm mb-2 line-clamp-2">{movie.description}</p>
                  <div className="flex gap-4 text-sm text-slate-400">
                    <span>{movie.category}</span>
                    <span>•</span>
                    <span>{movie.release_year}</span>
                    <span>•</span>
                    <span>⭐ {movie.rating}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteMovie(movie.id)}
                  className="p-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {music.map((track) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-4 bg-slate-800/50 rounded-lg p-4 border border-slate-700"
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-700">
                  {track.album_art_url ? (
                    <img src={track.album_art_url} alt={track.album} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MusicIcon className="w-8 h-8 text-slate-500" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">{track.title}</h3>
                  <p className="text-slate-400 text-sm">{track.artist}</p>
                  <div className="flex gap-4 text-sm text-slate-400 mt-1">
                    <span>{track.album}</span>
                    <span>•</span>
                    <span>{track.genre}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteMusic(track.id)}
                  className="p-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const AddContentForm = ({ type, onSuccess }: { type: 'movies' | 'music'; onSuccess: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (type === 'movies') {
        const { error } = await supabase.from('movies').insert([{
          title: formData.title,
          description: formData.description,
          thumbnail_url: formData.thumbnail_url,
          video_url: formData.video_url,
          category: formData.category,
          duration: parseInt(formData.duration),
          release_year: parseInt(formData.release_year),
          rating: parseFloat(formData.rating)
        }]);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('music').insert([{
          title: formData.title,
          artist: formData.artist,
          album: formData.album,
          album_art_url: formData.album_art_url,
          audio_url: formData.audio_url,
          duration: parseInt(formData.duration),
          genre: formData.genre
        }]);
        if (error) throw error;
      }

      toast.success(`${type === 'movies' ? 'Movie' : 'Track'} added successfully`);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add content');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-white font-semibold text-lg mb-4">Add New {type === 'movies' ? 'Movie' : 'Track'}</h3>

      {type === 'movies' ? (
        <>
          <input
            type="text"
            placeholder="Title"
            required
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <textarea
            placeholder="Description"
            rows={3}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <input
            type="url"
            placeholder="Thumbnail URL"
            required
            onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <input
            type="url"
            placeholder="Video URL"
            required
            onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Category"
              required
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <input
              type="number"
              placeholder="Duration (seconds)"
              required
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <input
              type="number"
              placeholder="Release Year"
              required
              onChange={(e) => setFormData({ ...formData, release_year: e.target.value })}
              className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <input
              type="number"
              step="0.1"
              placeholder="Rating (0-10)"
              required
              onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
              className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </>
      ) : (
        <>
          <input
            type="text"
            placeholder="Title"
            required
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <input
            type="text"
            placeholder="Artist"
            required
            onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <input
            type="text"
            placeholder="Album"
            onChange={(e) => setFormData({ ...formData, album: e.target.value })}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <input
            type="url"
            placeholder="Album Art URL"
            onChange={(e) => setFormData({ ...formData, album_art_url: e.target.value })}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <input
            type="url"
            placeholder="Audio URL"
            required
            onChange={(e) => setFormData({ ...formData, audio_url: e.target.value })}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Duration (seconds)"
              required
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <input
              type="text"
              placeholder="Genre"
              required
              onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
              className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
      >
        {loading ? 'Adding...' : 'Add Content'}
      </button>
    </form>
  );
};
