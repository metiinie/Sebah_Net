import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail fast with a clear error to prevent misconfigured deployments
  throw new Error('Missing Supabase configuration. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});


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
  video_url?: string; // Added for music videos
  duration: number;
  genre: string;
  rating: number;
  created_at: string;
}

export interface Playlist {
  id: string;
  name: string;
  user_id: string;
  is_public: boolean;
  created_at: string;
}
