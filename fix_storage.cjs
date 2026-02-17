const { Client } = require('pg');

const connectionString = 'postgresql://postgres.gbnabqwndvkrfhxyakux:uTf6wtuNoH9Bj8Uj@18.198.30.239:6543/postgres';

async function fixStorage() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to database.');

        console.log('Ensuring storage schema and bucket exist...');

        // 1. Ensure storage schema exists (Supabase should have it, but just in case)
        // 2. Create the 'media' bucket if it doesn't exist
        const sql = `
      -- Create the storage bucket if it doesn't exist
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES (
        'media', 
        'media', 
        true, 
        2147483648, 
        ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv', 'video/webm', 'audio/mpeg', 'audio/wav', 'audio/flac', 'audio/ogg', 'image/jpeg', 'image/png', 'image/webp']
      )
      ON CONFLICT (id) DO UPDATE SET 
        public = EXCLUDED.public,
        file_size_limit = EXCLUDED.file_size_limit,
        allowed_mime_types = EXCLUDED.allowed_mime_types;

      -- Ensure policies exist for the bucket
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read access for media files') THEN
          CREATE POLICY "Public read access for media files" ON storage.objects
          FOR SELECT USING (bucket_id = 'media');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload media files') THEN
          CREATE POLICY "Authenticated users can upload media files" ON storage.objects
          FOR INSERT WITH CHECK (
            bucket_id = 'media' 
            AND auth.role() = 'authenticated'
          );
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own media files') THEN
          CREATE POLICY "Users can update their own media files" ON storage.objects
          FOR UPDATE USING (
            bucket_id = 'media'
            AND (owner = auth.uid())
          );
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own media files') THEN
          CREATE POLICY "Users can delete their own media files" ON storage.objects
          FOR DELETE USING (
            bucket_id = 'media'
            AND (owner = auth.uid())
          );
        END IF;
      END
      $$;
    `;

        await client.query(sql);
        console.log('SUCCESS: "media" bucket created/updated and storage policies applied.');

    } catch (err) {
        console.error('Error fixing storage:', err.message);
        console.log('\nDIAGNOSTIC HINT:');
        console.log('If you see "getaddrinfo ENOTFOUND", your network has DNS issues with Supabase IPv6.');
        console.log('Try connecting to your phone hotspot or a different network, then run this script again.');
    } finally {
        await client.end();
    }
}

fixStorage();
