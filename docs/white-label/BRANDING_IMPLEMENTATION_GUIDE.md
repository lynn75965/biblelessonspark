# Branding Configuration Implementation Guide

## Overview

This guide explains how to integrate `branding.ts` into your BibleBibleLessonSpark codebase to prepare for white-label deployments.

---

## Step 1: Add the File to Your Project

1. In your local repository (`C:\Users\Lynn\lesson-spark-usa`), create the config folder if it doesn't exist:
   ```
   src/config/
   ```

2. Copy `branding.ts` into this folder:
   ```
   src/config/branding.ts
   ```

---

## Step 2: Update Values for Your Site

Open `branding.ts` and verify/update these values to match your current site:

### Priority Updates (verify these match your current setup):

| Property | What to Check |
|----------|---------------|
| `colors.primary` | Match your current Tailwind primary color |
| `colors.secondary` | Match your current Tailwind secondary color |
| `logo.primary` | Verify path to your logo file |
| `contact.supportEmail` | Your actual support email |
| `urls.baseUrl` | Your production URL |

### Get Your Current Colors from Tailwind

Look in your `tailwind.config.ts` or `tailwind.config.js` for the current color values and update the branding file to match.

---

## Step 3: Find and Replace Hardcoded References

Search your codebase for these patterns and replace with branding imports:

### Search for App Name References

```bash
# In your project, search for:
"BibleLessonSpark"
"Lesson Spark"
"BibleBibleLessonSpark"
```

### Common Files to Check

| File/Pattern | What to Replace |
|--------------|-----------------|
| `index.html` | `<title>` tag, meta descriptions |
| `Layout.tsx` or similar | Header logo, app name |
| `Footer.tsx` | Copyright notice, links |
| `Login.tsx` / `Register.tsx` | Welcome text, app name |
| Email templates | Subject lines, footer text |
| `package.json` | `name` and `description` fields |

---

## Step 4: Example Replacements

### Before (hardcoded):

```tsx
// Header.tsx
<h1 className="text-xl font-bold">BibleBibleLessonSpark</h1>
<img src="/logo.svg" alt="BibleLessonSpark Logo" />
```

### After (using branding):

```tsx
// Header.tsx
import { BRANDING } from '@/config/branding';

<h1 className="text-xl font-bold">{BRANDING.appName}</h1>
<img src={BRANDING.logo.primary} alt={BRANDING.logo.altText} />
```

---

### Before (hardcoded page title):

```tsx
// SomePage.tsx
<title>Dashboard - BibleBibleLessonSpark</title>
```

### After (using helper function):

```tsx
// SomePage.tsx
import { getPageTitle } from '@/config/branding';

<title>{getPageTitle('Dashboard')}</title>
// Outputs: "Dashboard | BibleBibleLessonSpark"
```

---

### Before (hardcoded copyright):

```tsx
// Footer.tsx
<p>© 2024 BibleBibleLessonSpark. All rights reserved.</p>
```

### After (dynamic copyright):

```tsx
// Footer.tsx
import { BRANDING } from '@/config/branding';

<p>{BRANDING.legal.copyrightNotice}</p>
// Outputs: "© 2024-2025 BibleBibleLessonSpark. All rights reserved."
```

---

### Before (hardcoded colors in CSS):

```css
.primary-button {
  background-color: #4F46E5;
}
```

### After (using CSS variables):

First, add to your main CSS file (e.g., `index.css` or `globals.css`):

```tsx
// In your app initialization or layout
import { generateCSSVariables } from '@/config/branding';

// Inject CSS variables (or add them statically to your CSS)
```

Then use in CSS:
```css
.primary-button {
  background-color: var(--color-primary);
}
```

---

## Step 5: Integration Checklist

Use this checklist as you work through your codebase:

### High Priority
- [ ] Header component - logo and app name
- [ ] Footer component - copyright, links
- [ ] Document `<title>` and meta tags
- [ ] Login/Register pages - branding
- [ ] Email templates - sender name, subjects, footer

### Medium Priority
- [ ] Landing page - headlines, CTAs
- [ ] Error pages (404, 500) - branding
- [ ] Loading states - messages
- [ ] Empty states - messages
- [ ] Success/error toasts - messages

### Lower Priority
- [ ] Social media meta tags (og:image, etc.)
- [ ] PWA manifest (if applicable)
- [ ] Favicon and apple-touch-icon
- [ ] PDF exports (if lessons export to PDF)

---

## Step 6: Testing Your Changes

After integration, verify branding appears correctly:

1. **Visual check**: Navigate through the app and look for:
   - Logo displays correctly
   - App name appears consistently
   - Copyright shows current year
   - Colors match expectations

2. **Search verification**: Run a final search for hardcoded values:
   ```bash
   # Should return only the branding.ts file
   grep -r "BibleLessonSpark" src/
   ```

3. **White-label test**: Temporarily change values in `branding.ts` and verify the app updates throughout.

---

## For White-Label Deployments

When preparing a white-label package:

1. **Copy entire codebase**
2. **Buyer updates ONLY `branding.ts`** with their:
   - Organization name
   - Logo files
   - Colors
   - Contact information
   - Domain URLs
3. **Buyer updates `.env`** with their:
   - Supabase credentials
   - API keys
4. **Deploy** - entire app is rebranded

This is the power of centralized branding configuration!

---

## Questions or Issues?

If you encounter components that are difficult to update, make note of them. Some may require additional refactoring, which we can address together.
