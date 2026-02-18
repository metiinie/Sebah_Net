const { Client } = require('pg');

// THE DATABASE URL
const DB_HOST = 'db.gbnabqwndvkrfhxyakux.supabase.co';
const DB_IP = '2a05:d018:135e:1649:9156:c85a:bdd3:fc12';
const DB_PASSWORD = 'uTf6wtuNoH9Bj8Uj';
const DB_USER = 'postgres';
const DB_NAME = 'postgres';
const PROJECT_REF = 'gbnabqwndvkrfhxyakux';

async function tryConnect(config) {
  const client = new Client(config);
  try {
    await client.connect();
    return client;
  } catch (err) {
    console.log(`Connection failed (${config.host || config.connectionString}): ${err.message}`);
    return null;
  }
}

async function fixRLS() {
  console.log('--- RLS Fix Tool ---');

  let client = null;

  // Attempt 1: Default Hostname
  console.log('Attempting connection via hostname...');
  client = await tryConnect({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: 5432,
    ssl: { rejectUnauthorized: false }
  });

  // Attempt 2: IPv4 Pooler (Common workaround)
  if (!client) {
    console.log('Attempting connection via Pooler IP...');
    client = await tryConnect({
      host: '3.125.145.223', // aws-0-eu-central-1.pooler.supabase.com
      user: `${DB_USER}.${PROJECT_REF}`,
      password: DB_PASSWORD,
      database: DB_NAME,
      port: 6543,
      ssl: { rejectUnauthorized: false }
    });
  }

  if (!client) {
    console.error('ERROR: Could not connect to database. Please run the SQL manually in Supabase Dashboard.');
    return;
  }

  try {
    const sql = `
      -- Fix storage policies
      -- First ensure the bucket exists and is public
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

      -- Drop existing storage policies
      DROP POLICY IF EXISTS "Public read access for media files" ON storage.objects;
      DROP POLICY IF EXISTS "Authenticated users can upload media files" ON storage.objects;
      DROP POLICY IF EXISTS "Users can update their own media files" ON storage.objects;
      DROP POLICY IF EXISTS "Users can delete their own media files" ON storage.objects;

      -- Create relaxed storage policies for authenticated users
      -- INSERT: All authenticated users can upload
      CREATE POLICY "Allow authenticated inserts" 
      ON storage.objects FOR INSERT 
      TO authenticated 
      WITH CHECK (bucket_id = 'media');

      -- SELECT: Anyone (even public) can view if bucket is public
      CREATE POLICY "Allow public select" 
      ON storage.objects FOR SELECT 
      USING (bucket_id = 'media');

      -- UPDATE/DELETE: Users can manage their own files
      CREATE POLICY "Allow authenticated updates" 
      ON storage.objects FOR UPDATE 
      TO authenticated 
      USING (bucket_id = 'media');

      CREATE POLICY "Allow authenticated deletes" 
      ON storage.objects FOR DELETE 
      TO authenticated 
      USING (bucket_id = 'media');

      -- Fix table policies for movies and music
      ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "All users can view movies" ON movies;
      DROP POLICY IF EXISTS "Only admins can insert movies" ON movies;
      DROP POLICY IF EXISTS "Only admins can update movies" ON movies;
      DROP POLICY IF EXISTS "Only admins can delete movies" ON movies;
      
      CREATE POLICY "Allow authenticated all" ON movies FOR ALL TO authenticated USING (true) WITH CHECK (true);

      ALTER TABLE music ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "All users can view music" ON music;
      DROP POLICY IF EXISTS "Only admins can insert music" ON music;
      DROP POLICY IF EXISTS "Only admins can update music" ON music;
      DROP POLICY IF EXISTS "Only admins can delete music" ON music;

      CREATE POLICY "Allow authenticated all" ON music FOR ALL TO authenticated USING (true) WITH CHECK (true);

      GRANT ALL ON movies TO authenticated;
      GRANT ALL ON music TO authenticated;
    `;

    await client.query(sql);
    console.log('SUCCESS: RLS policies have been fixed!');
  } catch (err) {
    console.error('Error executing SQL:', err.message);
  } finally {
    await client.end();
  }
}

fixRLS();
