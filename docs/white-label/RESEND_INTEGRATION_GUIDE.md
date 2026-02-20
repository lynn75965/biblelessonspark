# Resend Email Integration with Branding

This guide shows how to use `branding.ts` in your Supabase Edge Functions for Resend emails.

---

## Example: Organization Invitation Email

### Before (hardcoded values scattered throughout):

```typescript
// supabase/functions/send-invitation/index.ts

import { Resend } from 'resend';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

async function sendInvitation(email: string, orgName: string, inviterName: string, inviteUrl: string) {
  await resend.emails.send({
    from: 'BibleBibleLessonSpark <noreply@bibleBibleLessonSpark.com>',  // Hardcoded
    to: email,
    replyTo: 'support@bibleBibleLessonSpark.com',  // Hardcoded
    subject: `You've been invited to join ${orgName} on BibleBibleLessonSpark`,  // Hardcoded
    html: `
      <div style="background-color: #F9FAFB; padding: 40px;">
        <div style="max-width: 600px; margin: 0 auto; background: white;">
          <div style="background-color: #4F46E5; padding: 24px; text-align: center;">
            <img src="https://bibleBibleLessonSpark.com/logo.png" alt="BibleBibleLessonSpark" />
          </div>
          <div style="padding: 32px;">
            <h1>You've Been Invited!</h1>
            <p>${inviterName} has invited you to join ${orgName} on BibleBibleLessonSpark.</p>
            <a href="${inviteUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px;">
              Accept Invitation
            </a>
          </div>
          <div style="background-color: #F3F4F6; padding: 24px; text-align: center;">
            <p style="color: #6B7280; font-size: 12px;">
              © 2024 BibleBibleLessonSpark. All rights reserved.
            </p>
            <p style="color: #6B7280; font-size: 12px;">
              BibleBibleLessonSpark, Nacogdoches, TX 75965, USA
            </p>
          </div>
        </div>
      </div>
    `,
  });
}
```

### After (using branding.ts):

```typescript
// supabase/functions/send-invitation/index.ts

import { Resend } from 'resend';
import { 
  BRANDING, 
  getEmailSubject, 
  getEmailTemplate,
  getEmailGreeting,
  getEmailSignoff,
  getEmailInlineStyles,
  getResendEmailOptions 
} from '../_shared/branding.ts';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

async function sendInvitation(
  email: string, 
  recipientName: string,
  orgName: string, 
  inviterName: string, 
  inviteUrl: string
) {
  // Get styles from branding
  const styles = getEmailInlineStyles();
  
  // Get template content with replacements
  const template = getEmailTemplate('orgInvitation', {
    inviterName,
    orgName,
    invitationUrl: inviteUrl,
    expirationDays: '7',
  });
  
  // Get subject with replacements
  const subject = getEmailSubject('orgInvitation', { orgName });
  
  // Build the email HTML
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="${styles.wrapper}">
      <div style="${styles.container}">
        
        <!-- Header -->
        <div style="${styles.header}">
          <img 
            src="${BRANDING.email.images.headerLogo}" 
            alt="${BRANDING.email.images.headerLogoAlt}"
            width="${BRANDING.email.images.headerLogoWidth}"
            height="${BRANDING.email.images.headerLogoHeight}"
          />
        </div>
        
        <!-- Body -->
        <div style="${styles.body}">
          <h1 style="${styles.heading}">${template.heading}</h1>
          
          <p style="${styles.paragraph}">
            ${getEmailGreeting(recipientName)}
          </p>
          
          <p style="${styles.paragraph}">
            ${template.body}
          </p>
          
          <!-- CTA Button -->
          <p style="text-align: center; margin: 32px 0;">
            <a href="${template.buttonUrl}" style="${styles.button}">
              ${template.buttonText}
            </a>
          </p>
          
          <p style="${styles.mutedText}">
            ${template.expirationNote}
          </p>
          
          <hr style="${styles.divider}" />
          
          <p style="${styles.paragraph}">
            ${getEmailSignoff()}<br/>
            ${BRANDING.email.content.signoffs.team}
          </p>
        </div>
        
        <!-- Footer -->
        <div style="${styles.footer}">
          <p style="${styles.footerText}">
            ${BRANDING.email.content.footerTagline}
          </p>
          <p style="${styles.footerText}">
            ${BRANDING.email.content.supportPrompt} 
            <a href="mailto:${BRANDING.contact.supportEmail}" style="${styles.link}">
              ${BRANDING.contact.supportEmail}
            </a>
          </p>
          <p style="${styles.footerText}">
            ${BRANDING.contact.formattedAddress}
          </p>
          <p style="${styles.footerText}">
            ${BRANDING.legal.copyrightNotice}
          </p>
          <p style="${styles.footerText}">
            <a href="${BRANDING.urls.unsubscribe}" style="${styles.link}">
              ${BRANDING.email.content.unsubscribeText}
            </a>
            &nbsp;|&nbsp;
            <a href="${BRANDING.urls.emailPreferences}" style="${styles.link}">
              ${BRANDING.email.content.preferencesText}
            </a>
          </p>
        </div>
        
      </div>
    </body>
    </html>
  `;
  
  // Send using helper that applies branding defaults
  const emailOptions = getResendEmailOptions({
    to: email,
    subject,
    html,
    tags: [
      { name: 'email_type', value: 'org_invitation' },
      { name: 'org_id', value: orgName },
    ],
  });
  
  const result = await resend.emails.send(emailOptions);
  
  return result;
}
```

---

## Setting Up Branding in Edge Functions

### Step 1: Create Shared Branding File

Place a copy of `branding.ts` in your Edge Functions shared folder:

```
supabase/
  functions/
    _shared/
      branding.ts    <-- Place here
    send-invitation/
      index.ts
    send-welcome/
      index.ts
```

### Step 2: Import in Your Functions

```typescript
import { BRANDING, getEmailSubject } from '../_shared/branding.ts';
```

---

## Quick Reference: Email Helper Functions

| Function | Purpose | Example |
|----------|---------|---------|
| `getEmailSubject(key, replacements)` | Get subject with placeholders filled | `getEmailSubject('orgInvitation', { orgName: 'First Baptist' })` |
| `getEmailTemplate(key, replacements)` | Get template content | `getEmailTemplate('welcome', { baseUrl: 'https://...' })` |
| `getEmailGreeting(firstName, style)` | Get personalized greeting | `getEmailGreeting('John')` → "Hello John," |
| `getEmailSignoff(style)` | Get sign-off text | `getEmailSignoff('default')` → "Blessings," |
| `getEmailInlineStyles()` | Get all inline CSS styles | Returns object with all style strings |
| `getResendEmailOptions(overrides)` | Build Resend options with defaults | Applies from, replyTo, tags automatically |
| `BRANDING.email.from` | Get formatted From field | "BibleBibleLessonSpark <noreply@bibleBibleLessonSpark.com>" |

---

## Email Types Covered in branding.ts

| Template Key | Use Case |
|--------------|----------|
| `welcome` | New user registration |
| `orgInvitation` | Invite to organization |
| `passwordReset` | Password reset request |
| `emailVerification` | Email verification |
| `lessonShared` | Someone shared a lesson |

### Adding New Email Templates

To add a new email type, update these sections in `branding.ts`:

1. Add subject to `BRANDING.email.subjects`:
```typescript
subjects: {
  // ... existing
  newTemplate: "Your new email subject with {placeholder}",
}
```

2. Add template to `BRANDING.email.templates`:
```typescript
templates: {
  // ... existing
  newTemplate: {
    heading: "Email Heading",
    body: "Email body with {placeholder}...",
    buttonText: "Call to Action",
    buttonUrl: "{actionUrl}",
  },
}
```

---

## Benefits for White-Label

When you sell a white-label license:

1. **Buyer updates ONE file** (`branding.ts`) with their:
   - Organization name
   - Logo URLs
   - Colors
   - Contact email addresses
   - Physical address (for CAN-SPAM)

2. **All emails automatically update**:
   - From name and address
   - Logo in header
   - Colors throughout
   - Footer content
   - Legal text

3. **No code changes required** in any Edge Functions!

---

## CAN-SPAM Compliance

The branding file includes required elements for CAN-SPAM compliance:

- ✅ Physical mailing address (`BRANDING.contact.address`)
- ✅ Unsubscribe link (`BRANDING.urls.unsubscribe`)
- ✅ Sender identification (`BRANDING.email.fromName`)

Make sure white-label buyers update the physical address to their own!
