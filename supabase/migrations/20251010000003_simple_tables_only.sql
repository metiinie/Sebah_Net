/*
  # Simple Tables Only - Music and Movies
  
  This migration creates only the music and movies tables with simple admin system.
  No profiles table, no complex dependencies.
*/

-- =============================================
-- 1. DROP EXISTING TABLES (if they exist)
-- =============================================

-- Drop existing policies first
DROP POLICY IF EXISTS "All users can view movies" ON movies;
DROP POLICY IF EXISTS "Only admins can insert movies" ON movies;
DROP POLICY IF EXISTS "Only admins can update movies" ON movies;
DROP POLICY IF EXISTS "Only admins can delete movies" ON movies;

DROP POLICY IF EXISTS "All users can view music" ON music;
DROP POLICY IF EXISTS "Only admins can insert music" ON music;
DROP POLICY IF EXISTS "Only admins can update music" ON music;
DROP POLICY IF EXISTS "Only admins can delete music" ON music;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Public read access for media files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload media files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own media files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own media files" ON storage.objects;

-- Drop tables if they exist
DROP TABLE IF EXISTS movies CASCADE;
DROP TABLE IF EXISTS music CASCADE;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS is_admin_by_email(text) CASCADE;
DROP FUNCTION IF EXISTS is_admin_by_id(uuid) CASCADE;

-- =============================================
-- 2. CREATE SIMPLE TABLES
-- =============================================

-- Movies table
CREATE TABLE movies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  thumbnail_url text,
  video_url text NOT NULL,
  category text,
  duration integer DEFAULT 0,
  release_year integer,
  rating decimal(3,1) CHECK (rating >= 0 AND rating <= 10),
  created_at timestamptz DEFAULT now(),
  uploaded_by text -- Store email as text
);

-- Music table
CREATE TABLE music (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist text NOT NULL,
  album text,
  album_art_url text,
  audio_url text NOT NULL,
  duration integer DEFAULT 0,
  genre text,
  created_at timestamptz DEFAULT now(),
  uploaded_by text -- Store email as text
);

-- =============================================
-- 3. CREATE INDEXES
-- =============================================

CREATE INDEX idx_movies_category ON movies(category);
CREATE INDEX idx_movies_uploaded_by ON movies(uploaded_by);
CREATE INDEX idx_music_genre ON music(genre);
CREATE INDEX idx_music_uploaded_by ON music(uploaded_by);

-- =============================================
-- 4. CREATE ADMIN FUNCTIONS
-- =============================================

-- Function to check if user is admin (by email)
CREATE OR REPLACE FUNCTION is_admin_by_email(user_email text)
RETURNS boolean AS $$
BEGIN
  -- Add your admin emails here
  RETURN user_email IN (
    'abumahilkerim@gmail.com',
    'admin@example.com'
    -- Add more admin emails as needed
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin (by user ID)
CREATE OR REPLACE FUNCTION is_admin_by_id(user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Get user email from auth.users
  DECLARE
    user_email text;
  BEGIN
    SELECT email INTO user_email 
    FROM auth.users 
    WHERE id = user_id;
    
    RETURN is_admin_by_email(user_email);
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE music ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 6. CREATE RLS POLICIES
-- =============================================

-- Movies policies
CREATE POLICY "All users can view movies"
  ON movies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert movies"
  ON movies FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin_by_id(auth.uid())
  );

CREATE POLICY "Only admins can update movies"
  ON movies FOR UPDATE
  TO authenticated
  USING (
    is_admin_by_id(auth.uid())
  )
  WITH CHECK (
    is_admin_by_id(auth.uid())
  );

CREATE POLICY "Only admins can delete movies"
  ON movies FOR DELETE
  TO authenticated
  USING (
    is_admin_by_id(auth.uid())
  );

-- Music policies (identical to movies)
CREATE POLICY "All users can view music"
  ON music FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert music"
  ON music FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin_by_id(auth.uid())
  );

CREATE POLICY "Only admins can update music"
  ON music FOR UPDATE
  TO authenticated
  USING (
    is_admin_by_id(auth.uid())
  )
  WITH CHECK (
    is_admin_by_id(auth.uid())
  );

CREATE POLICY "Only admins can delete music"
  ON music FOR DELETE
  TO authenticated
  USING (
    is_admin_by_id(auth.uid())
  );

-- =============================================
-- 7. STORAGE CONFIGURATION
-- =============================================

-- Create storage bucket for media files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media', 
  'media', 
  true, 
  2147483648, 
  ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv', 'video/webm', 'audio/mpeg', 'audio/wav', 'audio/flac', 'audio/ogg', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public read access for media files" ON storage.objects
FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Authenticated users can upload media files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own media files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'media'
  AND (
    owner = auth.uid() OR is_admin_by_id(auth.uid())
  )
);

CREATE POLICY "Users can delete their own media files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'media'
  AND (
    owner = auth.uid() OR is_admin_by_id(auth.uid())
  )
);

-- =============================================
-- 8. PERMISSIONS
-- =============================================

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON movies TO authenticated;
GRANT ALL ON music TO authenticated;

-- =============================================
-- 9. SAMPLE DATA
-- =============================================

-- Sample movies
INSERT INTO movies (title, description, thumbnail_url, video_url, category, duration, release_year, rating, uploaded_by) VALUES
('The Digital Frontier', 'A thrilling journey through cyberspace and virtual reality.', 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'action', 7200, 2023, 8.5, 'abumahilkerim@gmail.com'),
('Midnight Tales', 'A compilation of mysterious stories that unfold after dark.', 'https://images.pexels.com/photos/2873486/pexels-photo-2873486.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'drama', 6300, 2022, 7.8, 'abumahilkerim@gmail.com'),
('Cosmic Journey', 'An epic space adventure across the galaxy.', 'https://images.pexels.com/photos/956999/milky-way-starry-sky-night-sky-star-956999.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'scifi', 8100, 2024, 9.2, 'abumahilkerim@gmail.com')
ON CONFLICT DO NOTHING;

-- Sample music
INSERT INTO music (title, artist, album, album_art_url, audio_url, duration, genre, uploaded_by) VALUES
('Neon Nights', 'Electric Pulse', 'Synthwave Dreams', 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=400', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 240, 'electronic', 'abumahilkerim@gmail.com'),
('Sunset Boulevard', 'The Wanderers', 'Road Trip Anthems', 'https://images.pexels.com/photos/1666316/pexels-photo-1666316.jpeg?auto=compress&cs=tinysrgb&w=400', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 195, 'rock', 'abumahilkerim@gmail.com'),
('Midnight Jazz', 'Smooth Operators', 'Late Night Sessions', 'https://images.pexels.com/photos/1864642/pexels-photo-1864642.jpeg?auto=compress&cs=tinysrgb&w=400', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', 312, 'jazz', 'abumahilkerim@gmail.com')
ON CONFLICT DO NOTHING;

-- =============================================
-- 10. COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE movies IS 'Movie content with simple admin-only uploads';
COMMENT ON TABLE music IS 'Music content with simple admin-only uploads';
COMMENT ON FUNCTION is_admin_by_email IS 'Check if email is in admin allowlist';
COMMENT ON FUNCTION is_admin_by_id IS 'Check if user ID belongs to admin email';
