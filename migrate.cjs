const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// THE DATABASE URL
const DB_HOST = 'db.gbnabqwndvkrfhxyakux.supabase.co';
const DB_IP = '2a05:d018:135e:1649:9156:c85a:bdd3:fc12';
const DB_PASSWORD = 'TbnjFenTQC48GwB1';
const DB_USER = 'postgres';
const DB_NAME = 'postgres';
const PROJECT_REF = 'gbnabqwndvkrfhxyakux';

const migrations = [
  '20251010000003_simple_tables_only.sql',
  '20250110000004_add_rating_to_music.sql',
  '20250110000007_personalization_profiles.sql',
  '20250110000008_secure_admin_functions.sql'
];

async function tryConnect(config) {
  const client = new Client(config);
  try {
    await client.connect();
    return client;
  } catch (err) {
    console.log(`Connection failed (${config.host || config.connectionString.split('@')[1]}): ${err.message}`);
    return null;
  }
}

async function runMigrations() {
  console.log('--- Database Migration Diagnostic ---');

  let client = null;

  // Attempt 1: Default Hostname
  console.log('Attempting connection via hostname (Standard)...');
  client = await tryConnect({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: 5432,
    ssl: { rejectUnauthorized: false }
  });

  // Attempt 2: IPv6 Literal (Fallback for DNS ENOTFOUND)
  if (!client) {
    console.log('Attempting connection via direct IPv6...');
    client = await tryConnect({
      host: DB_IP,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      port: 5432,
      ssl: { rejectUnauthorized: false }
    });
  }

  // Attempt 3: Pooler (Fallback for IPv6-unfriendly networks)
  if (!client) {
    console.log('Attempting connection via Supabase Pooler (IPv4 Fallback)...');
    // We try common poolers
    const regions = ['eu-central-1', 'us-east-1'];
    for (const region of regions) {
      console.log(`Trying ${region} pooler...`);
      client = await tryConnect({
        host: `aws-0-${region}.pooler.supabase.com`,
        user: `${DB_USER}.${PROJECT_REF}`,
        password: DB_PASSWORD,
        database: DB_NAME,
        port: 6543, // Transaction mode port for pooler
        ssl: { rejectUnauthorized: false }
      });
      if (client) break;
    }
  }

  if (!client) {
    console.error('\nERROR: All connection attempts failed.');
    console.error('Possible issues:');
    console.error('1. Your network/ISP is blocking Supabase or has no IPv6 support.');
    console.error('2. The password or project ID is incorrect.');
    console.error('3. Check your Supabase Dashboard -> Settings -> Database for the correct Connection String.');
    return;
  }

  console.log('\n--- Connection Established! Running Migrations ---');

  try {
    for (const migration of migrations) {
      console.log(`Running migration: ${migration}`);
      const filePath = path.join(__dirname, 'supabase', 'migrations', migration);
      const sql = fs.readFileSync(filePath, 'utf8');

      try {
        await client.query(sql);
        console.log(`Successfully completed: ${migration}`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log('Skipping (already exists).');
        } else {
          console.error(`Error in ${migration}:`, err.message);
          throw err;
        }
      }
    }
    console.log('\nSUCCESS: All migrations matched the database schema!');
  } catch (err) {
    console.error('Migration execution failed:', err);
  } finally {
    await client.end();
  }
}

runMigrations();
