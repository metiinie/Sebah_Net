import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres:TbnjFenTQC48GwB1@db.gbnabqwndvkrfhxyakux.supabase.co:5432/postgres';

async function fixStorageLimit() {
    const client = new Client({
        connectionString: connectionString,
    });

    try {
        await client.connect();
        console.log('Connected to database');

        // Check current limit
        const res = await client.query("SELECT name, file_size_limit FROM storage.buckets WHERE name = 'media';");
        if (res.rows.length === 0) {
            console.log("Bucket 'media' not found");
            return;
        }

        const currentLimit = res.rows[0].file_size_limit;
        console.log(`Current file size limit for 'media' bucket: ${currentLimit} bytes`);

        // Set to 2GB (2 * 1024 * 1024 * 1024)
        const newLimit = 2 * 1024 * 1024 * 1024;
        await client.query("UPDATE storage.buckets SET file_size_limit = $1 WHERE name = 'media';", [newLimit]);
        console.log(`Updated file size limit to ${newLimit} bytes (2GB)`);

        // Verify
        const verifyRes = await client.query("SELECT name, file_size_limit FROM storage.buckets WHERE name = 'media';");
        console.log(`Verified new limit: ${verifyRes.rows[0].file_size_limit} bytes`);

    } catch (err) {
        console.error('Error executing query', err.stack);
    } finally {
        await client.end();
    }
}

fixStorageLimit();
