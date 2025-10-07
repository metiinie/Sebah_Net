/*
  # StreamChoice Database Schema

  ## Overview
  This migration creates the complete database schema for StreamChoice, a streaming platform
  for movies and music with user authentication and role-based access control.

  ## 1. New Tables
  
  ### `profiles`
  - `id` (uuid, primary key, references auth.users)
  - `email` (text, unique, not null)
  - `role` (text, default 'user') - Either 'user' or 'admin'
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

  ### `movies`
  - `id` (uuid, primary key)
  - `title` (text, not null)
  - `description` (text)
  - `thumbnail_url` (text)
  - `video_url` (text)
  - `category` (text) - e.g., 'action', 'comedy', 'drama'
  - `duration` (integer) - Duration in seconds
  - `release_year` (integer)
  - `rating` (numeric) - Rating out of 10
  - `created_at` (timestamptz, default now())
  - `uploaded_by` (uuid, references profiles)

  ### `music`
  - `id` (uuid, primary key)
  - `title` (text, not null)
  - `artist` (text, not null)
  - `album` (text)
  - `album_art_url` (text)
  - `audio_url` (text)
  - `duration` (integer) - Duration in seconds
  - `genre` (text)
  - `created_at` (timestamptz, default now())
  - `uploaded_by` (uuid, references profiles)

  ### `playlists`
  - `id` (uuid, primary key)
  - `name` (text, not null)
  - `user_id` (uuid, references profiles)
  - `is_public` (boolean, default false)
  - `created_at` (timestamptz, default now())

  ### `playlist_tracks`
  - `id` (uuid, primary key)
  - `playlist_id` (uuid, references playlists)
  - `music_id` (uuid, references music)
  - `position` (integer, not null)
  - `added_at` (timestamptz, default now())

  ## 2. Security (Row Level Security)
  
  ### Profiles Table
  - Enable RLS
  - Users can read all profiles
  - Users can update only their own profile
  - New users can insert their own profile on signup

  ### Movies Table
  - Enable RLS
  - All authenticated users can read movies
  - Only admins can insert, update, or delete movies

  ### Music Table
  - Enable RLS
  - All authenticated users can read music
  - Only admins can insert, update, or delete music

  ### Playlists Table
  - Enable RLS
  - Users can read their own playlists and public playlists
  - Users can create, update, and delete only their own playlists

  ### Playlist Tracks Table
  - Enable RLS
  - Users can read tracks from their playlists or public playlists
  - Users can manage tracks only in their own playlists

  ## 3. Functions
  - Trigger function to automatically create profile on user signup
  - Function to update updated_at timestamp on profile changes

  ## 4. Indexes
  - Index on movies.category for faster filtering
  - Index on music.genre for faster filtering
  - Index on music.artist for search optimization
  - Index on playlists.user_id for user playlist queries
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create movies table
CREATE TABLE IF NOT EXISTS movies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  thumbnail_url text,
  video_url text,
  category text,
  duration integer,
  release_year integer,
  rating numeric(3,1) CHECK (rating >= 0 AND rating <= 10),
  created_at timestamptz DEFAULT now(),
  uploaded_by uuid REFERENCES profiles(id)
);

-- Create music table
CREATE TABLE IF NOT EXISTS music (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist text NOT NULL,
  album text,
  album_art_url text,
  audio_url text,
  duration integer,
  genre text,
  created_at timestamptz DEFAULT now(),
  uploaded_by uuid REFERENCES profiles(id)
);

-- Create playlists table
CREATE TABLE IF NOT EXISTS playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create playlist_tracks table
CREATE TABLE IF NOT EXISTS playlist_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid REFERENCES playlists(id) ON DELETE CASCADE,
  music_id uuid REFERENCES music(id) ON DELETE CASCADE,
  position integer NOT NULL,
  added_at timestamptz DEFAULT now(),
  UNIQUE(playlist_id, music_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_movies_category ON movies(category);
CREATE INDEX IF NOT EXISTS idx_music_genre ON music(genre);
CREATE INDEX IF NOT EXISTS idx_music_artist ON music(artist);
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id);

-- Function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE music ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Movies policies
CREATE POLICY "Authenticated users can view movies"
  ON movies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert movies"
  ON movies FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update movies"
  ON movies FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete movies"
  ON movies FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Music policies
CREATE POLICY "Authenticated users can view music"
  ON music FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert music"
  ON music FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update music"
  ON music FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete music"
  ON music FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Playlists policies
CREATE POLICY "Users can view own and public playlists"
  ON playlists FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_public = true);

CREATE POLICY "Users can create own playlists"
  ON playlists FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own playlists"
  ON playlists FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own playlists"
  ON playlists FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Playlist tracks policies
CREATE POLICY "Users can view tracks in accessible playlists"
  ON playlist_tracks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_tracks.playlist_id
      AND (playlists.user_id = auth.uid() OR playlists.is_public = true)
    )
  );

CREATE POLICY "Users can add tracks to own playlists"
  ON playlist_tracks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_tracks.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove tracks from own playlists"
  ON playlist_tracks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_tracks.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

-- Insert sample data
-- Sample movies
INSERT INTO movies (title, description, thumbnail_url, video_url, category, duration, release_year, rating) VALUES
('The Digital Frontier', 'A thrilling journey through cyberspace and virtual reality.', 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'action', 7200, 2023, 8.5),
('Midnight Tales', 'A compilation of mysterious stories that unfold after dark.', 'https://images.pexels.com/photos/2873486/pexels-photo-2873486.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'drama', 6300, 2022, 7.8),
('Cosmic Journey', 'An epic space adventure across the galaxy.', 'https://images.pexels.com/photos/956999/milky-way-starry-sky-night-sky-star-956999.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'scifi', 8100, 2024, 9.2),
('Laugh Out Loud', 'The funniest comedy of the year that will leave you in stitches.', 'https://images.pexels.com/photos/1117132/pexels-photo-1117132.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 'comedy', 5400, 2023, 7.5),
('Ocean Deep', 'Explore the mysteries of the deep blue sea.', 'https://images.pexels.com/photos/1007657/pexels-photo-1007657.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 'documentary', 4500, 2023, 8.9),
('Urban Legends', 'Modern myths come alive in this gripping thriller.', 'https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 'thriller', 6900, 2024, 8.1)
ON CONFLICT DO NOTHING;

-- Sample music
INSERT INTO music (title, artist, album, album_art_url, audio_url, duration, genre) VALUES
('Neon Nights', 'Electric Pulse', 'Synthwave Dreams', 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=400', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 240, 'electronic'),
('Sunset Boulevard', 'The Wanderers', 'Road Trip Anthems', 'https://images.pexels.com/photos/1666316/pexels-photo-1666316.jpeg?auto=compress&cs=tinysrgb&w=400', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 195, 'rock'),
('Midnight Jazz', 'Smooth Operators', 'Late Night Sessions', 'https://images.pexels.com/photos/1864642/pexels-photo-1864642.jpeg?auto=compress&cs=tinysrgb&w=400', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', 312, 'jazz'),
('Digital Dreams', 'Cyber Beats', 'Future Sounds', 'https://images.pexels.com/photos/1387037/pexels-photo-1387037.jpeg?auto=compress&cs=tinysrgb&w=400', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', 268, 'electronic'),
('Acoustic Sunrise', 'Folk Tales', 'Morning Melodies', 'https://images.pexels.com/photos/1738986/pexels-photo-1738986.jpeg?auto=compress&cs=tinysrgb&w=400', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', 223, 'folk'),
('Urban Rhythm', 'Street Poets', 'City Sounds', 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=400', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', 187, 'hiphop'),
('Ocean Waves', 'Nature Collective', 'Ambient Journeys', 'https://images.pexels.com/photos/1630039/pexels-photo-1630039.jpeg?auto=compress&cs=tinysrgb&w=400', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', 345, 'ambient'),
('Rock Revolution', 'Thunder Strike', 'Power Chords', 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=400', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', 256, 'rock')
ON CONFLICT DO NOTHING;