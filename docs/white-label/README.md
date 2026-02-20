# White-Label Preparation Documentation

This folder contains documentation and code for preparing BibleBibleLessonSpark 
for white-label enterprise sales.

## Contents

| File | Purpose |
|------|---------|
| `BRANDING_IMPLEMENTATION_GUIDE.md` | How to integrate branding.ts into the codebase |
| `RESEND_INTEGRATION_GUIDE.md` | How to use branding with Resend email |
| `ENTERPRISE_INTEGRATION_GUIDE.md` | Webhook, CRM, and SSO integration architecture |
| `examples/branding-integrations-section.ts` | Code to add enterprise integration config |

## Main Branding File

The main branding configuration file is located at:

```
src/config/branding.ts
```

## Implementation Status

- [ ] branding.ts added to src/config/
- [ ] Hardcoded brand references replaced
- [ ] Email templates updated to use branding
- [ ] Webhook system implemented
- [ ] Admin UI for integration settings
- [ ] Database schema for webhook configs
- [ ] Documentation package complete

## For White-Label Buyers

When preparing a white-label package, buyer needs to update:

1. `src/config/branding.ts` (all branding values)
2. `.env` (Supabase, API keys, domain)
3. Logo/image assets

See `BRANDING_IMPLEMENTATION_GUIDE.md` for detailed instructions.

## Pricing Reference

| Buyer Type | Suggested License Fee |
|------------|----------------------|
| Large single church (5,000+ members) | $15,000 - $35,000 |
| State convention (BGCT, etc.) | $50,000 - $100,000 |
| National entity (SBC-affiliated) | $100,000 - $250,000 |

Optional add-ons:
- Implementation support: $5,000 - $10,000
- Annual maintenance/updates: $10,000 - $15,000/year
- Training sessions: $1,500 - $3,000 per session

## Created

December 17, 2025
