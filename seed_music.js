import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedMusic() {
    console.log('Checking for existing music...');
    const { count, error: countError } = await supabase
        .from('music')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error('Error checking music:', countError);
        return;
    }

    if (count > 0) {
        console.log(`Found ${count} tracks. Skipping seeding.`);
        return;
    }

    console.log('No tracks found. Seeding sample music...');
    const sampleTracks = [
        {
            title: 'Neon Nights',
            artist: 'Electric Pulse',
            album: 'Synthwave Dreams',
            album_art_url: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg',
            audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
            genre: 'synthwave',
            rating: 8.5,
            duration: 240
        },
        {
            title: 'Midnight Drive',
            artist: 'Retro Wave',
            album: 'Neon Horizons',
            album_art_url: 'https://images.pexels.com/photos/161172/neuschwanstein-castle-castle-neuschwanstein-bavaria-161172.jpeg',
            audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
            genre: 'retro',
            rating: 9.0,
            duration: 180
        }
    ];

    const { error: seedError } = await supabase
        .from('music')
        .insert(sampleTracks);

    if (seedError) {
        console.error('Error seeding music:', seedError);
    } else {
        console.log('Successfully seeded sample music!');
    }
}

seedMusic();
