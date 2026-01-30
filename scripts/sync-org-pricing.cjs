// scripts/sync-org-pricing.cjs
// Syncs src/constants/orgPricingConfig.ts → database tables
// Run with: npm run sync-org-pricing

const { createClient } = require('@supabase/supabase-js');

// ============================================
// SSOT DATA (mirrors orgPricingConfig.ts)
// ============================================

const ORG_TIERS = [
  {
    tier: 'org_starter',
    display_name: 'Ministry Starter',
    lessons_limit: 25,
    price_monthly: 29.00,
    price_annual: 290.00,
    stripe_product_id: 'prod_Tt8suAq0Ba5Kyy',
    stripe_price_id_monthly: 'price_1SvMaWI4GLksxBfVn6FVKKiG',
    stripe_price_id_annual: 'price_1SvMcVI4GLksxBfVLG7k1F12',
    description: '25 lessons per month shared across unlimited teachers',
    best_for: '2-10 teachers',
    display_order: 1,
    is_active: true,
  },
  {
    tier: 'org_growth',
    display_name: 'Ministry Growth',
    lessons_limit: 60,
    price_monthly: 59.00,
    price_annual: 590.00,
    stripe_product_id: 'prod_Tt9AA0Mr8ggFm8',
    stripe_price_id_monthly: 'price_1SvMt9I4GLksxBfV5hc6Rsox',
    stripe_price_id_annual: 'price_1SvMsCI4GLksxBfVDy8YjZYu',
    description: '60 lessons per month shared across unlimited teachers',
    best_for: '10-15 teachers',
    display_order: 2,
    is_active: true,
  },
  {
    tier: 'org_ministry',
    display_name: 'Ministry Full',
    lessons_limit: 120,
    price_monthly: 99.00,
    price_annual: 990.00,
    stripe_product_id: 'prod_Tt9GvWKjoPutRs',
    stripe_price_id_monthly: 'price_1SvN1lI4GLksxBfVEpU7eKq5',
    stripe_price_id_annual: 'price_1SvMxmI4GLksxBfVVOY3cOpb',
    description: '120 lessons per month shared across unlimited teachers',
    best_for: '20-30 teachers',
    display_order: 3,
    is_active: true,
  },
  {
    tier: 'org_enterprise',
    display_name: 'Ministry Enterprise',
    lessons_limit: 250,
    price_monthly: 179.00,
    price_annual: 1790.00,
    stripe_product_id: 'prod_Tt9MztPmhtJnZ2',
    stripe_price_id_monthly: 'price_1SvN5RI4GLksxBfVrtZ2aDN9',
    stripe_price_id_annual: 'price_1SvN4CI4GLksxBfVgdN7qjsr',
    description: '250 lessons per month shared across unlimited teachers',
    best_for: 'Large churches, associations',
    display_order: 4,
    is_active: true,
  },
];

const LESSON_PACKS = [
  {
    pack_type: 'small',
    display_name: 'Lesson Pack - Small',
    lessons_included: 10,
    price: 15.00,
    stripe_product_id: 'prod_Tt9VeUiXCse3Vf',
    stripe_price_id: 'price_1SvNC3I4GLksxBfVzzp79bQP',
    description: '10 bonus lessons - never expire',
    display_order: 1,
    is_active: true,
  },
  {
    pack_type: 'medium',
    display_name: 'Lesson Pack - Medium',
    lessons_included: 25,
    price: 35.00,
    stripe_product_id: 'prod_Tt9c9VetZN2qmn',
    stripe_price_id: 'price_1SvNImI4GLksxBfVl7fegaD8',
    description: '25 bonus lessons - never expire',
    display_order: 2,
    is_active: true,
  },
  {
    pack_type: 'large',
    display_name: 'Lesson Pack - Large',
    lessons_included: 50,
    price: 60.00,
    stripe_product_id: 'prod_Tt9fZtm3WFiKlh',
    stripe_price_id: 'price_1SvNM4I4GLksxBfVhC8Gt23X',
    description: '50 bonus lessons - never expire',
    display_order: 3,
    is_active: true,
  },
];

const ONBOARDING_OPTIONS = [
  {
    onboarding_type: 'self_service',
    display_name: 'Self-Service',
    price: 0,
    stripe_product_id: '',
    stripe_price_id: '',
    description: 'Set up your organization yourself with our documentation and tutorials',
    features: ['Step-by-step documentation', 'Video tutorials', 'Email support'],
    display_order: 0,
    is_active: true,
  },
  {
    onboarding_type: 'guided_setup',
    display_name: 'Guided Setup',
    price: 99.00,
    stripe_product_id: 'prod_Tt9iETbbQosHiR',
    stripe_price_id: 'price_1SvNOjI4GLksxBfVddpRLRoS',
    description: '1-hour video call with hands-on setup assistance',
    features: ['1-hour video call', 'Organization creation', 'Shared Focus configuration', 'Teacher invitation walkthrough', 'Email support for first month'],
    display_order: 1,
    is_active: true,
  },
  {
    onboarding_type: 'white_glove',
    display_name: 'White Glove Onboarding',
    price: 249.00,
    stripe_product_id: 'prod_Tt9lvUjuO8WJXK',
    stripe_price_id: 'price_1SvNRyI4GLksxBfVQCm17bXq',
    description: 'Complete done-for-you setup with training',
    features: ['Full organization setup', 'Shared Focus configured for your calendar', 'All teachers invited', 'Live team training session', '30-day priority support'],
    display_order: 2,
    is_active: true,
  },
];

// ============================================
// SYNC FUNCTION
// ============================================

async function syncOrgPricing() {
  const supabaseUrl = process.env.SUPABASE_URL || 'https://hphebzdftpjbiudpfcrs.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable required');
    console.log('');
    console.log('   Set it with PowerShell:');
    console.log('   $env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
    console.log('');
    console.log('   Then run: npm run sync-org-pricing');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('');
  console.log('========================================');
  console.log(' SSOT Sync: Organization Pricing');
  console.log('========================================');
  console.log('');

  // Sync org_tier_config
  console.log('📦 Syncing org_tier_config...');
  for (const tier of ORG_TIERS) {
    const { error } = await supabase
      .from('org_tier_config')
      .upsert(tier, { onConflict: 'tier' });
    
    if (error) {
      console.error(`   ❌ ${tier.display_name}: ${error.message}`);
    } else {
      console.log(`   ✅ ${tier.display_name}`);
    }
  }

  // Sync lesson_pack_config
  console.log('');
  console.log('📦 Syncing lesson_pack_config...');
  for (const pack of LESSON_PACKS) {
    const { error } = await supabase
      .from('lesson_pack_config')
      .upsert(pack, { onConflict: 'pack_type' });
    
    if (error) {
      console.error(`   ❌ ${pack.display_name}: ${error.message}`);
    } else {
      console.log(`   ✅ ${pack.display_name}`);
    }
  }

  // Sync onboarding_config
  console.log('');
  console.log('📦 Syncing onboarding_config...');
  for (const opt of ONBOARDING_OPTIONS) {
    const { error } = await supabase
      .from('onboarding_config')
      .upsert(opt, { onConflict: 'onboarding_type' });
    
    if (error) {
      console.error(`   ❌ ${opt.display_name}: ${error.message}`);
    } else {
      console.log(`   ✅ ${opt.display_name}`);
    }
  }

  console.log('');
  console.log('========================================');
  console.log(' ✅ Organization pricing sync complete!');
  console.log('========================================');
  console.log('');
}

syncOrgPricing().catch(console.error);
