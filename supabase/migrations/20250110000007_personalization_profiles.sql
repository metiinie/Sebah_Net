-- Personalization & Profiles System
-- This migration creates all tables needed for user profiles, watchlists, parental controls, and personalization

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
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
    
    -- Constraints
    CONSTRAINT unique_profile_name_per_user UNIQUE (user_id, name),
    CONSTRAINT valid_profile_name CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 100)
);

-- Watchlist Table
CREATE TABLE IF NOT EXISTS watchlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    content_id UUID NOT NULL,
    content_type VARCHAR(10) NOT NULL CHECK (content_type IN ('movie', 'music')),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    priority INTEGER DEFAULT 0,
    
    -- Constraints
    CONSTRAINT unique_watchlist_item UNIQUE (profile_id, content_id),
    CONSTRAINT valid_priority CHECK (priority >= 0)
);

-- Recently Watched Table
CREATE TABLE IF NOT EXISTS recently_watched (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    content_id UUID NOT NULL,
    content_type VARCHAR(10) NOT NULL CHECK (content_type IN ('movie', 'music')),
    watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    watch_time INTEGER NOT NULL CHECK (watch_time >= 0), -- in seconds
    total_duration INTEGER NOT NULL CHECK (total_duration > 0), -- in seconds
    completion_percentage DECIMAL(5,2) NOT NULL CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    device_info TEXT,
    
    -- Constraints
    CONSTRAINT valid_completion CHECK (completion_percentage <= 100)
);

-- Continue Watching Table
CREATE TABLE IF NOT EXISTS continue_watching (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    content_id UUID NOT NULL,
    content_type VARCHAR(10) NOT NULL CHECK (content_type IN ('movie', 'music')),
    current_time INTEGER NOT NULL CHECK (current_time >= 0), -- in seconds
    total_duration INTEGER NOT NULL CHECK (total_duration > 0), -- in seconds
    last_watched TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    device_info TEXT,
    session_id UUID,
    
    -- Constraints
    CONSTRAINT unique_continue_watching UNIQUE (profile_id, content_id),
    CONSTRAINT valid_current_time CHECK (current_time <= total_duration)
);

-- Personalized Carousels Table
CREATE TABLE IF NOT EXISTS personalized_carousels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content_ids UUID[] DEFAULT '{}',
    content_type VARCHAR(10) NOT NULL CHECK (content_type IN ('movie', 'music')),
    algorithm VARCHAR(20) NOT NULL CHECK (algorithm IN ('trending', 'recommended', 'similar', 'genre', 'recent')),
    position INTEGER NOT NULL CHECK (position >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_carousel_position UNIQUE (profile_id, position)
);

-- Parental Controls Table
CREATE TABLE IF NOT EXISTS parental_controls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    max_age_rating INTEGER DEFAULT 18 CHECK (max_age_rating >= 0 AND max_age_rating <= 21),
    blocked_genres TEXT[] DEFAULT '{}',
    blocked_content UUID[] DEFAULT '{}',
    time_restrictions JSONB DEFAULT '[]'::jsonb,
    require_pin BOOLEAN DEFAULT FALSE,
    pin_code VARCHAR(10),
    
    -- Constraints
    CONSTRAINT unique_parental_controls UNIQUE (profile_id),
    CONSTRAINT valid_pin_code CHECK (pin_code IS NULL OR (LENGTH(pin_code) >= 4 AND LENGTH(pin_code) <= 10))
);

-- User Preferences Table (for global preferences)
CREATE TABLE IF NOT EXISTS user_preferences (
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
    
    -- Constraints
    CONSTRAINT unique_user_preferences UNIQUE (user_id)
);

-- Content Ratings Table (for age-based filtering)
CREATE TABLE IF NOT EXISTS content_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL,
    content_type VARCHAR(10) NOT NULL CHECK (content_type IN ('movie', 'music')),
    rating_system VARCHAR(20) NOT NULL, -- e.g., 'MPAA', 'TV-MA', 'PEGI', 'ESRB'
    rating_value VARCHAR(10) NOT NULL, -- e.g., 'PG-13', 'R', 'TV-MA', 'M'
    age_rating INTEGER, -- numeric age rating for easier filtering
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_content_rating UNIQUE (content_id, content_type, rating_system)
);

-- Device Sessions Table (for cross-device sync)
CREATE TABLE IF NOT EXISTS device_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet', 'tv'
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_device_session UNIQUE (profile_id, device_id)
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_kids ON user_profiles(is_kids_profile) WHERE is_kids_profile = TRUE;
CREATE INDEX IF NOT EXISTS idx_watchlist_profile_id ON watchlist(profile_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_content ON watchlist(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_recently_watched_profile_id ON recently_watched(profile_id);
CREATE INDEX IF NOT EXISTS idx_recently_watched_watched_at ON recently_watched(watched_at DESC);
CREATE INDEX IF NOT EXISTS idx_continue_watching_profile_id ON continue_watching(profile_id);
CREATE INDEX IF NOT EXISTS idx_continue_watching_last_watched ON continue_watching(last_watched DESC);
CREATE INDEX IF NOT EXISTS idx_personalized_carousels_profile_id ON personalized_carousels(profile_id);
CREATE INDEX IF NOT EXISTS idx_parental_controls_profile_id ON parental_controls(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_content_ratings_content ON content_ratings(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_device_sessions_profile_id ON device_sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_device_sessions_last_active ON device_sessions(last_active DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE recently_watched ENABLE ROW LEVEL SECURITY;
ALTER TABLE continue_watching ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalized_carousels ENABLE ROW LEVEL SECURITY;
ALTER TABLE parental_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_sessions ENABLE ROW LEVEL SECURITY;

-- User Profiles RLS Policies
CREATE POLICY "Users can view their own profiles" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profiles" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profiles" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profiles" ON user_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Watchlist RLS Policies
CREATE POLICY "Users can view their own watchlist" ON watchlist
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = watchlist.profile_id 
            AND user_profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own watchlist" ON watchlist
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = watchlist.profile_id 
            AND user_profiles.user_id = auth.uid()
        )
    );

-- Recently Watched RLS Policies
CREATE POLICY "Users can view their own recently watched" ON recently_watched
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = recently_watched.profile_id 
            AND user_profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own recently watched" ON recently_watched
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = recently_watched.profile_id 
            AND user_profiles.user_id = auth.uid()
        )
    );

-- Continue Watching RLS Policies
CREATE POLICY "Users can view their own continue watching" ON continue_watching
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = continue_watching.profile_id 
            AND user_profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own continue watching" ON continue_watching
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = continue_watching.profile_id 
            AND user_profiles.user_id = auth.uid()
        )
    );

-- Personalized Carousels RLS Policies
CREATE POLICY "Users can view their own carousels" ON personalized_carousels
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = personalized_carousels.profile_id 
            AND user_profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own carousels" ON personalized_carousels
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = personalized_carousels.profile_id 
            AND user_profiles.user_id = auth.uid()
        )
    );

-- Parental Controls RLS Policies
CREATE POLICY "Users can view their own parental controls" ON parental_controls
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = parental_controls.profile_id 
            AND user_profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own parental controls" ON parental_controls
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = parental_controls.profile_id 
            AND user_profiles.user_id = auth.uid()
        )
    );

-- User Preferences RLS Policies
CREATE POLICY "Users can view their own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own preferences" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Content Ratings RLS Policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view content ratings" ON content_ratings
    FOR SELECT USING (auth.role() = 'authenticated');

-- Device Sessions RLS Policies
CREATE POLICY "Users can view their own device sessions" ON device_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = device_sessions.profile_id 
            AND user_profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own device sessions" ON device_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = device_sessions.profile_id 
            AND user_profiles.user_id = auth.uid()
        )
    );

-- Functions for Analytics
CREATE OR REPLACE FUNCTION get_profile_analytics(profile_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    watchlist_count INTEGER;
    recently_watched_count INTEGER;
    continue_watching_count INTEGER;
    total_watch_time INTEGER;
    avg_completion DECIMAL;
BEGIN
    -- Get watchlist count
    SELECT COUNT(*) INTO watchlist_count
    FROM watchlist
    WHERE profile_id = profile_uuid;
    
    -- Get recently watched count
    SELECT COUNT(*) INTO recently_watched_count
    FROM recently_watched
    WHERE profile_id = profile_uuid;
    
    -- Get continue watching count
    SELECT COUNT(*) INTO continue_watching_count
    FROM continue_watching
    WHERE profile_id = profile_uuid;
    
    -- Get total watch time
    SELECT COALESCE(SUM(watch_time), 0) INTO total_watch_time
    FROM recently_watched
    WHERE profile_id = profile_uuid;
    
    -- Get average completion rate
    SELECT COALESCE(AVG(completion_percentage), 0) INTO avg_completion
    FROM recently_watched
    WHERE profile_id = profile_uuid;
    
    -- Build result
    result := jsonb_build_object(
        'watchlist_count', watchlist_count,
        'recently_watched_count', recently_watched_count,
        'continue_watching_count', continue_watching_count,
        'total_watch_time', total_watch_time,
        'average_completion_rate', avg_completion
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old recently watched entries
CREATE OR REPLACE FUNCTION cleanup_old_recently_watched()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete entries older than 90 days
    DELETE FROM recently_watched
    WHERE watched_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update carousel content
CREATE OR REPLACE FUNCTION update_carousel_content(
    carousel_uuid UUID,
    new_content_ids UUID[]
)
RETURNS VOID AS $$
BEGIN
    UPDATE personalized_carousels
    SET 
        content_ids = new_content_ids,
        updated_at = NOW()
    WHERE id = carousel_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personalized_carousels_updated_at
    BEFORE UPDATE ON personalized_carousels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default content ratings for existing content
-- This would typically be populated with real rating data
INSERT INTO content_ratings (content_id, content_type, rating_system, rating_value, age_rating, description)
SELECT 
    id,
    'movie',
    'MPAA',
    'PG-13',
    13,
    'Parents Strongly Cautioned'
FROM movies
WHERE age_rating IS NULL OR age_rating = 0
ON CONFLICT DO NOTHING;

INSERT INTO content_ratings (content_id, content_type, rating_system, rating_value, age_rating, description)
SELECT 
    id,
    'music',
    'ESRB',
    'E',
    0,
    'Everyone'
FROM music
WHERE age_rating IS NULL OR age_rating = 0
ON CONFLICT DO NOTHING;

