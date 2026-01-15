/**
 * ============================================================
 * SYNC TIER CONFIG TO DATABASE
 * ============================================================
 * Location: scripts/sync-tier-config-to-db.cjs
 * 
 * SSOT Flow:
 *   src/constants/pricingConfig.ts (FRONTEND MASTER)
 *           ↓ npm run sync-tier-config
 *   Database: tier_config table (BACKEND MIRROR)
 *           ↓
 *   check_lesson_limit() function reads from tier_config
 * 
 * Run: npm run sync-tier-config
 * ============================================================
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables:');
  if (!SUPABASE_URL) console.error('   - VITE_SUPABASE_URL');
  if (!SUPABASE_SERVICE_KEY) console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nAdd SUPABASE_SERVICE_ROLE_KEY to your .env file.');
  console.error('Find it in: Supabase Dashboard → Settings → API → service_role key');
  process.exit(1);
}

// ============================================================
// TIER CONFIGURATION - SYNCED FROM pricingConfig.ts
// ============================================================
// These values MUST match src/constants/pricingConfig.ts
// If you change pricingConfig.ts, update these values and re-run sync
// ============================================================

const TIER_CONFIG = {
  free: {
    lessons_limit: 5,
    sections_allowed: [1, 5, 8],  // From TIER_SECTIONS.free
    includes_teaser: false,
    reset_interval: '1 month',
  },
  personal: {
    lessons_limit: 20,
    sections_allowed: [1, 2, 3, 4, 5, 6, 7, 8],  // From TIER_SECTIONS.personal
    includes_teaser: true,
    reset_interval: '1 month',
  },
  admin: {
    lessons_limit: 9999,
    sections_allowed: [1, 2, 3, 4, 5, 6, 7, 8],  // From TIER_SECTIONS.admin
    includes_teaser: true,
    reset_interval: '1 month',
  },
};

async function syncTierConfig() {
  console.log('🔄 Syncing tier config to database...\n');
  console.log(`   Supabase URL: ${SUPABASE_URL}`);
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  for (const [tier, config] of Object.entries(TIER_CONFIG)) {
    console.log(`\n📦 Syncing tier: ${tier}`);
    console.log(`   lessons_limit: ${config.lessons_limit}`);
    console.log(`   sections_allowed: [${config.sections_allowed.join(', ')}]`);
    console.log(`   includes_teaser: ${config.includes_teaser}`);
    
    const { error } = await supabase
      .from('tier_config')
      .upsert({
        tier: tier,
        lessons_limit: config.lessons_limit,
        sections_allowed: config.sections_allowed,
        includes_teaser: config.includes_teaser,
        reset_interval: config.reset_interval,
      }, { onConflict: 'tier' });

    if (error) {
      console.error(`   ❌ Error syncing ${tier}:`, error.message);
    } else {
      console.log(`   ✅ ${tier} synced successfully`);
    }
  }

  console.log('\n✅ Tier config sync complete!\n');
  console.log('SSOT Flow:');
  console.log('  pricingConfig.ts → sync-tier-config-to-db.cjs → tier_config table');
  console.log('  tier_config table → check_lesson_limit() function → API responses\n');
}

syncTierConfig().catch(console.error);
