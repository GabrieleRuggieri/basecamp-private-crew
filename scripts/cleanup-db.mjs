#!/usr/bin/env node
/**
 * BASECAMP DB cleanup
 * Svuota: reactions, gym_sets, gym_prs, gym_sessions, thoughts, travels, watchlist, moments
 * Svuota anche Storage bucket "moments" (foto)
 * Mantiene: members, admin_config
 * Uso: npm run db:cleanup
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Carica .env
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
try {
  const env = readFileSync(join(root, '.env'), 'utf-8');
  for (const line of env.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
} catch (_) {}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('❌ Imposta NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
  console.log('🧹 BASECAMP cleanup...\n');

  // Ordine: dipendenze prima
  const tables = ['reactions', 'gym_sets', 'gym_prs', 'gym_sessions', 'thoughts', 'travels', 'watchlist', 'moments'];
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
      console.log(`  ${table}: ${error.message}`);
    } else {
      console.log(`  ✓ ${table} pulito`);
    }
  }

  // Storage moments
  const { data: files } = await supabase.storage.from('moments').list('', { limit: 1000 });
  const toRemove = files?.filter((f) => f.name && !f.name.startsWith('.')).map((f) => f.name) ?? [];
  if (toRemove.length) {
    const { error } = await supabase.storage.from('moments').remove(toRemove);
    if (error) console.log('  Storage moments:', error.message);
    else console.log(`  ✓ Storage moments: ${toRemove.length} file rimossi`);
  } else {
    console.log('  ✓ Storage moments: già vuoto');
  }

  console.log('\n✅ Cleanup completato');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
