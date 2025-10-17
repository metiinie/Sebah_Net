import { useState, useEffect, useCallback } from 'react';
import { supabase, Movie, Music } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Spinner } from '../components/Spinner';
import { usePageNavigation } from '../hooks/usePageNavigation';
import { useLoading } from '../hooks/useLoading';
import toast from 'react-hot-toast';
import { ArrowLeft, Film, Music as MusicIcon, Trash2, Edit2, Save, X } from 'lucide-react';

export const Admin = () => {
  const { goToChoice } = usePageNavigation();
  const { user } = useAuth();
  const { loading, stopLoading } = useLoading(true);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [music, setMusic] = useState<Music[]>([]);
  const [editingMovie, setEditingMovie] = useState<string | null>(null);
  const [editingMusic, setEditingMusic] = useState<string | null>(null);
  const [editMovieData, setEditMovieData] = useState<Partial<Movie>>({});
  const [editMusicData, setEditMusicData] = useState<Partial<Music>>({});
  const [activeTab, setActiveTab] = useState<'movies' | 'music'>('movies');

  const fetchData = useCallback(async () => {
    try {
      console.log('Fetching admin data...');
      const [moviesRes, musicRes] = await Promise.all([
        supabase.from('movies').select('*').order('created_at', { ascending: false }),
        supabase.from('music').select('*').order('created_at', { ascending: false })
      ]);

      if (moviesRes.error) {
        console.error('Movies error:', moviesRes.error);
        throw moviesRes.error;
      }
      if (musicRes.error) {
        console.error('Music error:', musicRes.error);
        throw musicRes.error;
      }

      setMovies(moviesRes.data || []);
      setMusic(musicRes.data || []);
      console.log('Data loaded successfully');
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error(`Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      stopLoading();
    }
  }, [stopLoading]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteMovie = async (id: string) => {
    if (!confirm('Are you sure you want to delete this movie?')) return;

    try {
      const { error } = await supabase.from('movies').delete().eq('id', id);
      if (error) {
        console.error('Delete movie error:', error);
        toast.error(`Failed to delete movie: ${error.message}`);
        return;
      }
      setMovies(movies.filter((m) => m.id !== id));
      toast.success('Movie deleted successfully');
    } catch (error: unknown) {
      console.error('Delete movie error:', error);
      toast.error(`Failed to delete movie: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteMusic = async (id: string) => {
    if (!confirm('Are you sure you want to delete this track?')) return;

    try {
      const { error } = await supabase.from('music').delete().eq('id', id);
      if (error) {
        console.error('Delete music error:', error);
        toast.error(`Failed to delete track: ${error.message}`);
        return;
      }
      setMusic(music.filter((m) => m.id !== id));
      toast.success('Track deleted successfully');
    } catch (error: unknown) {
      console.error('Delete music error:', error);
      toast.error(`Failed to delete track: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleEditMovie = (movie: Movie) => {
    setEditingMovie(movie.id);
    setEditMovieData({
      title: movie.title,
      description: movie.description,
      category: movie.category,
      release_year: movie.release_year,
      rating: movie.rating
    });
  };

  const handleEditMusic = (track: Music) => {
    setEditingMusic(track.id);
    setEditMusicData({
      title: track.title,
      artist: track.artist,
      album: track.album,
      genre: track.genre,
      rating: track.rating
    });
  };

  const handleSaveMovie = async (id: string, data: Partial<Movie>) => {
    try {
      const { error } = await supabase
        .from('movies')
        .update(data)
        .eq('id', id);
      
      if (error) {
        console.error('Update movie error:', error);
        toast.error(`Failed to update movie: ${error.message}`);
        return;
      }
      
      setMovies(prev => prev.map(movie => 
        movie.id === id ? { ...movie, ...data } : movie
      ));
      
      setEditingMovie(null);
      setEditMovieData({});
      toast.success('Movie updated successfully');
    } catch (error: unknown) {
      console.error('Update movie error:', error);
      toast.error(`Failed to update movie: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSaveMusic = async (id: string, data: Partial<Music>) => {
    try {
      const { error } = await supabase
        .from('music')
        .update(data)
        .eq('id', id);
      
      if (error) {
        console.error('Update music error:', error);
        toast.error(`Failed to update track: ${error.message}`);
        return;
      }
      
      setMusic(prev => prev.map(track => 
        track.id === id ? { ...track, ...data } : track
      ));
      
      setEditingMusic(null);
      setEditMusicData({});
      toast.success('Music track updated successfully');
    } catch (error: unknown) {
      console.error('Update music error:', error);
      toast.error(`Failed to update track: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCancelEdit = () => {
    setEditingMovie(null);
    setEditingMusic(null);
    setEditMovieData({});
    setEditMusicData({});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-lg border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={goToChoice}
                className="w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-slate-400">Manage your content library</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm">Welcome,</p>
              <p className="text-white font-medium">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('movies')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'movies'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Film className="w-5 h-5" />
            Movies ({movies.length})
          </button>
          <button
            onClick={() => setActiveTab('music')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'music'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <MusicIcon className="w-5 h-5" />
            Music ({music.length})
          </button>
        </div>

        {/* Movies Tab */}
        {activeTab === 'movies' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Movies</h2>
            {movies.length === 0 ? (
              <div className="bg-slate-800/50 rounded-xl p-8 text-center">
                <Film className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">No movies found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {movies.map((movie) => (
                  <div key={movie.id} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                    {editingMovie === movie.id ? (
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={editMovieData.title || ''}
                          onChange={(e) => setEditMovieData({ ...editMovieData, title: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                          placeholder="Movie title"
                        />
                        <textarea
                          value={editMovieData.description || ''}
                          onChange={(e) => setEditMovieData({ ...editMovieData, description: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                          placeholder="Description"
                          rows={3}
                        />
                        <input
                          type="text"
                          value={editMovieData.category || ''}
                          onChange={(e) => setEditMovieData({ ...editMovieData, category: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                          placeholder="Category"
                        />
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={editMovieData.release_year || ''}
                            onChange={(e) => setEditMovieData({ ...editMovieData, release_year: parseInt(e.target.value) })}
                            className="flex-1 px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                            placeholder="Year"
                          />
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={editMovieData.rating || ''}
                            onChange={(e) => setEditMovieData({ ...editMovieData, rating: parseFloat(e.target.value) })}
                            className="flex-1 px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                            placeholder="Rating"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveMovie(movie.id, editMovieData)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                          >
                            <Save className="w-4 h-4" />
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="aspect-video bg-slate-700 rounded-lg mb-4 flex items-center justify-center">
                          {movie.thumbnail_url ? (
                            <img
                              src={movie.thumbnail_url}
                              alt={movie.title}
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <Film className="w-12 h-12 text-slate-500" />
                          )}
                        </div>
                        <h3 className="text-white font-semibold mb-2">{movie.title}</h3>
                        <p className="text-slate-400 text-sm mb-2">{movie.description}</p>
                        <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                          <span>{movie.category}</span>
                          <span>{movie.release_year}</span>
                          <span>⭐ {movie.rating}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditMovie(movie)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteMovie(movie.id)}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Music Tab */}
        {activeTab === 'music' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Music</h2>
            {music.length === 0 ? (
              <div className="bg-slate-800/50 rounded-xl p-8 text-center">
                <MusicIcon className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">No music found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {music.map((track) => (
                  <div key={track.id} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                    {editingMusic === track.id ? (
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={editMusicData.title || ''}
                          onChange={(e) => setEditMusicData({ ...editMusicData, title: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                          placeholder="Track title"
                        />
                        <input
                          type="text"
                          value={editMusicData.artist || ''}
                          onChange={(e) => setEditMusicData({ ...editMusicData, artist: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                          placeholder="Artist"
                        />
                        <input
                          type="text"
                          value={editMusicData.album || ''}
                          onChange={(e) => setEditMusicData({ ...editMusicData, album: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                          placeholder="Album"
                        />
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editMusicData.genre || ''}
                            onChange={(e) => setEditMusicData({ ...editMusicData, genre: e.target.value })}
                            className="flex-1 px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                            placeholder="Genre"
                          />
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={editMusicData.rating || ''}
                            onChange={(e) => setEditMusicData({ ...editMusicData, rating: parseFloat(e.target.value) })}
                            className="flex-1 px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                            placeholder="Rating"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveMusic(track.id, editMusicData)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                          >
                            <Save className="w-4 h-4" />
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="aspect-square bg-slate-700 rounded-lg mb-4 flex items-center justify-center">
                          {track.album_art_url ? (
                            <img
                              src={track.album_art_url}
                              alt={track.album}
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <MusicIcon className="w-12 h-12 text-slate-500" />
                          )}
                        </div>
                        <h3 className="text-white font-semibold mb-1">{track.title}</h3>
                        <p className="text-slate-400 text-sm mb-1">{track.artist}</p>
                        <p className="text-slate-500 text-sm mb-4">{track.album}</p>
                        <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                          <span>{track.genre}</span>
                          <span>⭐ {track.rating}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditMusic(track)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteMusic(track.id)}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};