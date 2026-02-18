import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMusic() {
    const { data, error } = await supabase
        .from('music')
        .select('id, title, audio_url');

    if (error) {
        console.error('Error fetching music:', error);
        return;
    }

    console.log('Music tracks in database:');
    console.table(data);
}

checkMusic();
