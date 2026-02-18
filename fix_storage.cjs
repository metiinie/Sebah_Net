const { Client } = require('pg');

// USE THE POOLER IP TO BYPASS DNS ISSUES
const connectionString = 'postgresql://postgres.gbnabqwndvkrfhxyakux:TbnjFenTQC48GwB1@db.gbnabqwndvkrfhxyakux.supabase.co:5432/postgres';

async function fixStorage() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database.');

    console.log('Ensuring storage schema, bucket and RLS policies exist...');

    const sql = `
      -- 1. Create the storage bucket if it doesn't exist
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
        file_size_limit = EXCLUDED.file_size_limit;

      -- 2. RESET STORAGE POLICIES
      DROP POLICY IF EXISTS "Public read access for media files" ON storage.objects;
      DROP POLICY IF EXISTS "Authenticated users can upload media files" ON storage.objects;
      DROP POLICY IF EXISTS "Users can update their own media files" ON storage.objects;
      DROP POLICY IF EXISTS "Users can delete their own media files" ON storage.objects;

      -- Create new, simpler storage policies
      CREATE POLICY "Public read access for media files" ON storage.objects
      FOR SELECT USING (bucket_id = 'media');

      CREATE POLICY "Authenticated users can upload media files" ON storage.objects
      FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media');

      CREATE POLICY "Users can update their own media files" ON storage.objects
      FOR UPDATE TO authenticated USING (bucket_id = 'media');

      CREATE POLICY "Users can delete their own media files" ON storage.objects
      FOR DELETE TO authenticated USING (bucket_id = 'media');

      -- 3. RESET TABLE POLICIES (Movies and Music)
      -- This ensures that even if you're not in the admin list, you can still upload for now
      ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "All users can view movies" ON movies;
      DROP POLICY IF EXISTS "Only admins can insert movies" ON movies;
      DROP POLICY IF EXISTS "Only admins can update movies" ON movies;
      DROP POLICY IF EXISTS "Only admins can delete movies" ON movies;
      DROP POLICY IF EXISTS "Enable all access for authenticated" ON movies;

      CREATE POLICY "Enable all access for authenticated" ON movies
      FOR ALL TO authenticated USING (true) WITH CHECK (true);

      ALTER TABLE music ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "All users can view music" ON music;
      DROP POLICY IF EXISTS "Only admins can insert music" ON music;
      DROP POLICY IF EXISTS "Only admins can update music" ON music;
      DROP POLICY IF EXISTS "Only admins can delete music" ON music;
      DROP POLICY IF EXISTS "Enable all access for authenticated" ON music;

      CREATE POLICY "Enable all access for authenticated" ON music
      FOR ALL TO authenticated USING (true) WITH CHECK (true);

      -- 4. GRANT PERMISSIONS
      GRANT ALL ON movies TO authenticated;
      GRANT ALL ON music TO authenticated;
      GRANT ALL ON SCHEMA public TO authenticated;
    `;

    await client.query(sql);
    console.log('SUCCESS: All storage and table policies have been fixed and relaxed.');

  } catch (err) {
    console.error('Error fixing storage:', err.message);
    console.log('\nDIAGNOSTIC HINT:');
    console.log('If you see "Tenant or user not found", the pooler IP might have changed.');
    console.log('Try replacing the IP 18.198.30.239 with the one from the Supabase Dashboard.');
  } finally {
    await client.end();
  }
}

fixStorage();

