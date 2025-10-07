import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface Movie {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  video_url: string;
  category: string;
  duration: number;
  release_year: number;
  rating: number;
  created_at: string;
}

export interface Music {
  id: string;
  title: string;
  artist: string;
  album: string;
  album_art_url: string;
  audio_url: string;
  duration: number;
  genre: string;
  created_at: string;
}

export interface Playlist {
  id: string;
  name: string;
  user_id: string;
  is_public: boolean;
  created_at: string;
}
