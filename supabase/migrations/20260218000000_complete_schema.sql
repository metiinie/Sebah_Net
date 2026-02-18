-- =============================================
-- COMPLETE RESET & SCHEMA FOR MEDIASTREAM
-- Generated for the new Supabase project
-- WARNING: This will drop ALL existing tables in the public schema!
-- =============================================

-- 1. DROP EVERYTHING (Clean slate)
-- Drop triggers with safety check (Postgres requires the table to exist to check for the trigger)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'movies') THEN
        DROP TRIGGER IF EXISTS movies_audit_trigger ON movies;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'music') THEN
        DROP TRIGGER IF EXISTS music_audit_trigger ON music;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_profiles') THEN
        DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'personalized_carousels') THEN
        DROP TRIGGER IF EXISTS update_personalized_carousels_updated_at ON personalized_carousels;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_preferences') THEN
        DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
    END IF;
END $$;

-- Drop tables (in order of dependency)
DROP TABLE IF EXISTS watchlist CASCADE;
DROP TABLE IF EXISTS recently_watched CASCADE;
DROP TABLE IF EXISTS continue_watching CASCADE;
DROP TABLE IF EXISTS personalized_carousels CASCADE;
DROP TABLE IF EXISTS parental_controls CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS movies CASCADE;
DROP TABLE IF EXISTS music CASCADE;
DROP TABLE IF EXISTS content_ratings CASCADE;
DROP TABLE IF EXISTS admin_audit_log CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS is_admin_by_email(text) CASCADE;
DROP FUNCTION IF EXISTS is_admin_by_id(uuid) CASCADE;
DROP FUNCTION IF EXISTS log_admin_action(text, text, uuid, jsonb) CASCADE;
DROP FUNCTION IF EXISTS trigger_admin_audit() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS get_profile_analytics(uuid) CASCADE;

-- 2. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. TABLES
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
  rating decimal(3,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 10),
  age_rating integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  uploaded_by text
);

-- Music table
CREATE TABLE music (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist text NOT NULL,
  album text,
  album_art_url text,
  audio_url text NOT NULL,
  video_url text, 
  duration integer DEFAULT 0,
  genre text,
  rating decimal(3,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 10),
  age_rating integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  uploaded_by text
);

-- User Profiles Table
CREATE TABLE user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    is_kids_profile BOOLEAN DEFAULT FALSE,
    age_rating_limit INTEGER DEFAULT 18 CHECK (age_rating_limit >= 0 AND age_rating_limit <= 21),
    parental_controls_enabled BOOLEAN DEFAULT FALSE,
    viewing_preferences JSONB DEFAULT '{
        "subtitle_size": "medium",
        "playback_speed": 1.0,
        "theme": "dark",
        "auto_play": true,
        "skip_intro": false,
        "skip_credits": false,
        "preferred_quality": "auto",
        "preferred_language": "en",
        "closed_captions": false,
        "audio_description": false
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_profile_name_per_user UNIQUE (user_id, name),
    CONSTRAINT valid_profile_name CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 100)
);

-- Watchlist Table
CREATE TABLE watchlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    content_id UUID NOT NULL,
    content_type VARCHAR(10) NOT NULL CHECK (content_type IN ('movie', 'music')),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    priority INTEGER DEFAULT 0,
    CONSTRAINT unique_watchlist_item UNIQUE (profile_id, content_id),
    CONSTRAINT valid_priority CHECK (priority >= 0)
);

-- Recently Watched Table
CREATE TABLE recently_watched (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    content_id UUID NOT NULL,
    content_type VARCHAR(10) NOT NULL CHECK (content_type IN ('movie', 'music')),
    watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    watch_time INTEGER NOT NULL CHECK (watch_time >= 0),
    total_duration INTEGER NOT NULL CHECK (total_duration > 0),
    completion_percentage DECIMAL(5,2) NOT NULL CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    device_info TEXT,
    CONSTRAINT valid_completion CHECK (completion_percentage <= 100)
);

-- Continue Watching Table
CREATE TABLE continue_watching (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    content_id UUID NOT NULL,
    content_type VARCHAR(10) NOT NULL CHECK (content_type IN ('movie', 'music')),
    playback_time INTEGER NOT NULL CHECK (playback_time >= 0),
    total_duration INTEGER NOT NULL CHECK (total_duration > 0),
    last_watched TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    device_info TEXT,
    session_id UUID,
    CONSTRAINT unique_continue_watching UNIQUE (profile_id, content_id),
    CONSTRAINT valid_playback_time CHECK (playback_time <= total_duration)
);

-- Personalized Carousels Table
CREATE TABLE personalized_carousels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content_ids UUID[] DEFAULT '{}',
    content_type VARCHAR(10) NOT NULL CHECK (content_type IN ('movie', 'music')),
    algorithm VARCHAR(20) NOT NULL CHECK (algorithm IN ('trending', 'recommended', 'similar', 'genre', 'recent')),
    position INTEGER NOT NULL CHECK (position >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_carousel_position UNIQUE (profile_id, position)
);

-- Parental Controls Table
CREATE TABLE parental_controls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    max_age_rating INTEGER DEFAULT 18 CHECK (max_age_rating >= 0 AND max_age_rating <= 21),
    blocked_genres TEXT[] DEFAULT '{}',
    blocked_content UUID[] DEFAULT '{}',
    time_restrictions JSONB DEFAULT '[]'::jsonb,
    require_pin BOOLEAN DEFAULT FALSE,
    pin_code VARCHAR(10),
    CONSTRAINT unique_parental_controls UNIQUE (profile_id),
    CONSTRAINT valid_pin_code CHECK (pin_code IS NULL OR (LENGTH(pin_code) >= 4 AND LENGTH(pin_code) <= 10))
);

-- User Preferences Table
CREATE TABLE user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    default_profile_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    auto_switch_profiles BOOLEAN DEFAULT FALSE,
    sync_across_devices BOOLEAN DEFAULT TRUE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT FALSE,
    push_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_preferences UNIQUE (user_id)
);

-- Content Ratings Table
CREATE TABLE content_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL,
    content_type VARCHAR(10) NOT NULL CHECK (content_type IN ('movie', 'music')),
    rating_system VARCHAR(20) NOT NULL,
    rating_value VARCHAR(10) NOT NULL,
    age_rating INTEGER,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_content_rating UNIQUE (content_id, content_type, rating_system)
);

-- Admin Audit Log Table
CREATE TABLE admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  admin_email text NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- 4. INDEXES
CREATE INDEX idx_movies_category ON movies(category);
CREATE INDEX idx_movies_uploaded_by ON movies(uploaded_by);
CREATE INDEX idx_music_genre ON music(genre);
CREATE INDEX idx_music_uploaded_by ON music(uploaded_by);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_watchlist_profile_id ON watchlist(profile_id);
CREATE INDEX idx_recently_watched_profile_id ON recently_watched(profile_id);
CREATE INDEX idx_recently_watched_watched_at ON recently_watched(watched_at DESC);
CREATE INDEX idx_continue_watching_profile_id ON continue_watching(profile_id);
CREATE INDEX idx_continue_watching_last_watched ON continue_watching(last_watched DESC);
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- 5. FUNCTIONS
CREATE OR REPLACE FUNCTION is_admin_by_email(user_email text)
RETURNS boolean AS $$
DECLARE
  admin_emails text[];
BEGIN
  admin_emails := string_to_array(
    COALESCE(
      current_setting('app.admin_emails', true),
      'abumahilkerim@gmail.com,admin@example.com'
    ),
    ','
  );
  RETURN lower(user_email) = ANY(
    SELECT lower(trim(email)) FROM unnest(admin_emails) AS email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin_by_id(user_id uuid)
RETURNS boolean AS $$
DECLARE
  user_email text;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = user_id;
  IF user_email IS NULL THEN RETURN false; END IF;
  RETURN is_admin_by_email(user_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION log_admin_action(
  action_type text,
  target_type text DEFAULT NULL,
  target_id uuid DEFAULT NULL,
  action_details jsonb DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  admin_email text;
BEGIN
  SELECT email INTO admin_email FROM auth.users WHERE id = auth.uid();
  INSERT INTO admin_audit_log (
    admin_id, admin_email, action, target_type, target_id, details, ip_address, user_agent
  ) VALUES (
    auth.uid(), admin_email, action_type, target_type, target_id, action_details, 
    inet_client_addr(), current_setting('request.headers', true)::jsonb->>'user-agent'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION trigger_admin_audit()
RETURNS trigger AS $$
BEGIN
  -- Only log if there is an authenticated user (prevents failure during migrations/seeding)
  IF auth.uid() IS NOT NULL THEN
    PERFORM log_admin_action(TG_OP, TG_TABLE_NAME, COALESCE(NEW.id, OLD.id), jsonb_build_object('old_data', to_jsonb(OLD), 'new_data', to_jsonb(NEW)));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_profile_analytics(profile_uuid UUID)
RETURNS JSONB AS $$
BEGIN
    RETURN jsonb_build_object(
        'watchlist_count', (SELECT COUNT(*) FROM watchlist WHERE profile_id = profile_uuid),
        'recently_watched_count', (SELECT COUNT(*) FROM recently_watched WHERE profile_id = profile_uuid),
        'continue_watching_count', (SELECT COUNT(*) FROM continue_watching WHERE profile_id = profile_uuid),
        'total_watch_time', (SELECT COALESCE(SUM(watch_time), 0) FROM recently_watched WHERE profile_id = profile_uuid),
        'average_completion_rate', (SELECT COALESCE(AVG(completion_percentage), 0) FROM recently_watched WHERE profile_id = profile_uuid)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. TRIGGERS
CREATE TRIGGER movies_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON movies FOR EACH ROW EXECUTE FUNCTION trigger_admin_audit();
CREATE TRIGGER music_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON music FOR EACH ROW EXECUTE FUNCTION trigger_admin_audit();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_personalized_carousels_updated_at BEFORE UPDATE ON personalized_carousels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. RLS POLICIES
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE music ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE recently_watched ENABLE ROW LEVEL SECURITY;
ALTER TABLE continue_watching ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalized_carousels ENABLE ROW LEVEL SECURITY;
ALTER TABLE parental_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read movies" ON movies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage movies" ON movies FOR ALL TO authenticated USING (is_admin_by_id(auth.uid())) WITH CHECK (is_admin_by_id(auth.uid()));
CREATE POLICY "Public read music" ON music FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage music" ON music FOR ALL TO authenticated USING (is_admin_by_id(auth.uid())) WITH CHECK (is_admin_by_id(auth.uid()));
CREATE POLICY "User manage profiles" ON user_profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User manage watchlist" ON watchlist FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = profile_id AND user_id = auth.uid()));
CREATE POLICY "User manage recently watched" ON recently_watched FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = profile_id AND user_id = auth.uid()));
CREATE POLICY "User manage continue watching" ON continue_watching FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = profile_id AND user_id = auth.uid()));
CREATE POLICY "User manage carousels" ON personalized_carousels FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = profile_id AND user_id = auth.uid()));
CREATE POLICY "User manage parental controls" ON parental_controls FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = profile_id AND user_id = auth.uid()));
CREATE POLICY "User manage preferences" ON user_preferences FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin view audit logs" ON admin_audit_log FOR SELECT TO authenticated USING (is_admin_by_id(auth.uid()));

-- 8. STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media', 'media', true, 2147483648, 
  ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv', 'video/webm', 'audio/mpeg', 'audio/wav', 'audio/flac', 'audio/ogg', 'image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit;

-- Storage Policies
CREATE POLICY "Public read storage" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Authenticated upload storage" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media');
CREATE POLICY "Admin manage storage" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'media' AND (owner = auth.uid() OR is_admin_by_id(auth.uid())));

-- 9. PERMISSIONS
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 10. SAMPLE DATA
INSERT INTO movies (title, description, thumbnail_url, video_url, category, duration, release_year, rating, age_rating) VALUES
('The Digital Frontier', 'A thrilling journey through cyberspace.', 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'action', 7200, 2023, 8.5, 13),
('Cosmic Journey', 'An epic space adventure.', 'https://images.pexels.com/photos/956999/milky-way-starry-sky-night-sky-star-956999.jpeg', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'scifi', 8100, 2024, 9.2, 0)
ON CONFLICT DO NOTHING;

INSERT INTO music (title, artist, album, album_art_url, audio_url, duration, genre, rating) VALUES
('Neon Nights', 'Electric Pulse', 'Synthwave Dreams', 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 240, 'electronic', 8.0)
ON CONFLICT DO NOTHING;
