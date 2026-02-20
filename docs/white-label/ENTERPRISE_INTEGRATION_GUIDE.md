# Enterprise Integration Guide

## Overview

White-label buyers (large churches, state conventions, national entities) typically have existing infrastructure:

- **Membership/CRM Systems**: Planning Center, CCB, Realm, Breeze, Shelby, Fellowship One
- **Email Systems**: Mailchimp, Constant Contact, SendGrid, Exchange, Google Workspace
- **Authentication**: Active Directory, Google SSO, custom identity providers

This guide outlines how to architect BibleBibleLessonSpark for seamless integration with buyer's existing systems.

---

## Integration Architecture Options

### Option A: Webhook Events (Recommended)

BibleBibleLessonSpark fires webhooks when events occur. Buyer's systems receive and handle accordingly.

```
┌─────────────────────┐         ┌─────────────────────┐
│   BibleBibleLessonSpark    │         │   Buyer's Systems   │
│                     │         │                     │
│  User registers ────┼────────►│  CRM adds contact   │
│                     │  POST   │  Email system sends │
│  Invitation sent ───┼────────►│  welcome email      │
│                     │         │                     │
│  Lesson created ────┼────────►│  Log activity       │
│                     │         │  Notify admin       │
└─────────────────────┘         └─────────────────────┘
```

**Advantages:**
- Buyer maintains full control of their communication
- No email provider lock-in
- Real-time event notification
- Buyer can trigger their own workflows

---

### Option B: Email Provider Abstraction

BibleBibleLessonSpark supports multiple email providers. Buyer configures their preferred provider.

```
┌─────────────────────┐
│   BibleBibleLessonSpark    │
│                     │
│   Email Service     │──► Resend (default)
│   Abstraction       │──► SendGrid
│   Layer             │──► SMTP (custom)
│                     │──► Mailchimp Transactional
│                     │──► Disabled (webhooks only)
└─────────────────────┘
```

---

### Option C: Hybrid (Webhooks + Optional Email)

Buyer chooses per-event whether BibleBibleLessonSpark sends email OR just fires webhook.

---

## Recommended Implementation

### 1. Webhook System

#### Database Table: `webhook_configurations`

```sql
CREATE TABLE webhook_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  
  -- Webhook endpoint (buyer provides)
  endpoint_url TEXT NOT NULL,
  
  -- Authentication
  auth_type TEXT DEFAULT 'bearer', -- 'bearer', 'basic', 'header', 'none'
  auth_token TEXT, -- Encrypted
  auth_header_name TEXT, -- For custom header auth
  
  -- Event subscriptions (which events to send)
  events_enabled JSONB DEFAULT '{
    "user.registered": true,
    "user.verified": true,
    "invitation.sent": true,
    "invitation.accepted": true,
    "lesson.created": true,
    "lesson.shared": true,
    "organization.member_added": true,
    "organization.member_removed": true,
    "organization.role_changed": true
  }'::jsonb,
  
  -- Settings
  is_active BOOLEAN DEFAULT true,
  retry_count INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Database Table: `webhook_logs`

```sql
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_config_id UUID REFERENCES webhook_configurations(id),
  
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  
  -- Response tracking
  response_status INTEGER,
  response_body TEXT,
  
  -- Retry tracking
  attempt_number INTEGER DEFAULT 1,
  next_retry_at TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'success', 'failed', 'retrying'
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### Webhook Payload Structure

```typescript
interface WebhookPayload {
  // Event identification
  event_id: string;          // Unique ID for this event
  event_type: string;        // e.g., "user.registered"
  event_timestamp: string;   // ISO 8601
  
  // Source identification
  source: {
    app: string;             // "BibleLessonSpark" or white-label name
    environment: string;     // "production", "staging"
    organization_id?: string;
  };
  
  // Event-specific data
  data: Record<string, any>;
  
  // For verification
  signature: string;         // HMAC signature of payload
}
```

#### Example Webhook Payloads

**User Registered:**
```json
{
  "event_id": "evt_abc123",
  "event_type": "user.registered",
  "event_timestamp": "2025-01-15T10:30:00Z",
  "source": {
    "app": "BibleLessonSpark",
    "environment": "production",
    "organization_id": "org_xyz789"
  },
  "data": {
    "user_id": "user_def456",
    "email": "teacher@example.com",
    "first_name": "Sarah",
    "last_name": "Johnson",
    "registered_at": "2025-01-15T10:30:00Z",
    "registration_source": "invitation",
    "invited_by_user_id": "user_abc123"
  },
  "signature": "sha256=a1b2c3..."
}
```

**Invitation Sent:**
```json
{
  "event_id": "evt_def456",
  "event_type": "invitation.sent",
  "event_timestamp": "2025-01-15T09:00:00Z",
  "source": {
    "app": "BibleLessonSpark",
    "environment": "production",
    "organization_id": "org_xyz789"
  },
  "data": {
    "invitation_id": "inv_ghi789",
    "invitee_email": "newteacher@example.com",
    "invitee_first_name": "John",
    "inviter_user_id": "user_abc123",
    "inviter_name": "Pastor Smith",
    "organization_id": "org_xyz789",
    "organization_name": "First Baptist Church",
    "role_assigned": "teacher",
    "invitation_url": "https://app.example.com/invite/abc123",
    "expires_at": "2025-01-22T09:00:00Z"
  },
  "signature": "sha256=d4e5f6..."
}
```

**Lesson Created:**
```json
{
  "event_id": "evt_ghi789",
  "event_type": "lesson.created",
  "event_timestamp": "2025-01-15T14:22:00Z",
  "source": {
    "app": "BibleLessonSpark",
    "environment": "production",
    "organization_id": "org_xyz789"
  },
  "data": {
    "lesson_id": "lesson_jkl012",
    "title": "The Good Samaritan",
    "scripture_reference": "Luke 10:25-37",
    "created_by_user_id": "user_def456",
    "created_by_name": "Sarah Johnson",
    "language": "en",
    "audience_type": "adult",
    "created_at": "2025-01-15T14:22:00Z"
  },
  "signature": "sha256=g7h8i9..."
}
```

---

### 2. Email Provider Abstraction

#### Configuration: `email_provider_config`

```sql
CREATE TABLE email_provider_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) UNIQUE,
  
  -- Provider selection
  provider TEXT NOT NULL DEFAULT 'resend',
  -- Options: 'resend', 'sendgrid', 'smtp', 'mailchimp', 'disabled'
  
  -- Provider credentials (encrypted)
  api_key TEXT,
  
  -- SMTP-specific settings
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_username TEXT,
  smtp_password TEXT,
  smtp_secure BOOLEAN DEFAULT true,
  
  -- Sender configuration
  from_email TEXT NOT NULL,
  from_name TEXT NOT NULL,
  reply_to_email TEXT,
  
  -- Per-email-type settings
  -- Allows disabling specific emails (let webhook handle instead)
  email_types_enabled JSONB DEFAULT '{
    "welcome": true,
    "email_verification": true,
    "password_reset": true,
    "invitation": true,
    "lesson_shared": true
  }'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Email Service Interface

```typescript
// src/services/email/EmailProvider.ts

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
  }>;
}

export interface EmailProvider {
  name: string;
  send(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }>;
  isConfigured(): boolean;
}
```

#### Provider Implementations

```typescript
// src/services/email/providers/ResendProvider.ts
export class ResendProvider implements EmailProvider {
  name = 'resend';
  
  async send(message: EmailMessage) {
    const resend = new Resend(this.apiKey);
    const result = await resend.emails.send({
      from: this.fromAddress,
      ...message,
    });
    return { success: true, messageId: result.id };
  }
}

// src/services/email/providers/SendGridProvider.ts
export class SendGridProvider implements EmailProvider {
  name = 'sendgrid';
  // Implementation...
}

// src/services/email/providers/SMTPProvider.ts
export class SMTPProvider implements EmailProvider {
  name = 'smtp';
  // Uses nodemailer or similar
}

// src/services/email/providers/DisabledProvider.ts
export class DisabledProvider implements EmailProvider {
  name = 'disabled';
  
  async send(message: EmailMessage) {
    // Don't send - just log and return success
    console.log('Email disabled, skipping:', message.subject);
    return { success: true, messageId: 'disabled' };
  }
}
```

#### Email Service Factory

```typescript
// src/services/email/EmailService.ts

export class EmailService {
  private provider: EmailProvider;
  private webhookService: WebhookService;
  private config: EmailProviderConfig;
  
  constructor(organizationId: string) {
    this.config = await this.loadConfig(organizationId);
    this.provider = this.createProvider(this.config.provider);
    this.webhookService = new WebhookService(organizationId);
  }
  
  async sendInvitation(data: InvitationData) {
    const eventType = 'invitation.sent';
    
    // Always fire webhook (if configured)
    await this.webhookService.fire(eventType, {
      invitation_id: data.invitationId,
      invitee_email: data.email,
      invitee_first_name: data.firstName,
      inviter_name: data.inviterName,
      organization_name: data.orgName,
      invitation_url: data.inviteUrl,
      expires_at: data.expiresAt,
    });
    
    // Send email only if enabled for this type
    if (this.config.email_types_enabled.invitation) {
      const html = this.buildInvitationEmail(data);
      await this.provider.send({
        to: data.email,
        subject: `You've been invited to join ${data.orgName}`,
        html,
      });
    }
  }
  
  // Similar methods for other email types...
}
```

---

### 3. Admin UI for Integration Settings

White-label buyers need an admin interface to configure:

#### Webhook Configuration Screen

```
┌─────────────────────────────────────────────────────────────┐
│ Integration Settings                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ WEBHOOK CONFIGURATION                                       │
│ ─────────────────────                                       │
│                                                             │
│ Endpoint URL:                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ https://your-crm.com/api/webhooks/BibleLessonSpark          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Authentication:                                             │
│ ┌──────────────────┐                                        │
│ │ Bearer Token   ▼ │                                        │
│ └──────────────────┘                                        │
│                                                             │
│ Token:                                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ••••••••••••••••••••••••••••••••                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Events to Send:                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ☑ User registered                                       │ │
│ │ ☑ User verified email                                   │ │
│ │ ☑ Invitation sent                                       │ │
│ │ ☑ Invitation accepted                                   │ │
│ │ ☑ Lesson created                                        │ │
│ │ ☑ Lesson shared                                         │ │
│ │ ☑ Member added to organization                          │ │
│ │ ☑ Member removed from organization                      │ │
│ │ ☐ Member role changed                                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [ Test Webhook ]  [ Save Configuration ]                    │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│ Recent Webhook Deliveries:                                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✓ invitation.sent      2025-01-15 10:30    200 OK      │ │
│ │ ✓ user.registered      2025-01-15 10:31    200 OK      │ │
│ │ ✗ lesson.created       2025-01-15 11:15    Timeout     │ │
│ │   └─ Retry scheduled for 2025-01-15 11:20              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Email Provider Configuration Screen

```
┌─────────────────────────────────────────────────────────────┐
│ Email Settings                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ EMAIL PROVIDER                                              │
│ ──────────────                                              │
│                                                             │
│ Provider:                                                   │
│ ┌──────────────────────────────┐                            │
│ │ ○ Resend (Default)           │                            │
│ │ ○ SendGrid                   │                            │
│ │ ○ Custom SMTP                │                            │
│ │ ○ Mailchimp Transactional    │                            │
│ │ ● Disabled (Webhooks Only)   │  ◄── Common for enterprise │
│ └──────────────────────────────┘                            │
│                                                             │
│ ⓘ When disabled, no emails are sent from this app.         │
│   Configure webhooks to receive events and send emails      │
│   through your own system.                                  │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│ EMAIL TYPES (when provider is enabled)                      │
│ ──────────────────────────────────                          │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ☑ Welcome emails                                        │ │
│ │ ☑ Email verification                                    │ │
│ │ ☑ Password reset                                        │ │
│ │ ☐ Organization invitations (handled by our CRM)         │ │
│ │ ☐ Lesson shared notifications (handled by our CRM)      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [ Save Settings ]                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 4. SSO / External Authentication (Advanced)

Enterprise buyers may want users to authenticate through their existing identity provider.

#### Options to Support:

| Method | Use Case |
|--------|----------|
| **SAML 2.0** | Large organizations with Active Directory / Okta |
| **OAuth 2.0 / OIDC** | Google Workspace, Microsoft 365 |
| **Custom JWT** | Organizations with custom auth systems |

#### Database Table: `sso_configurations`

```sql
CREATE TABLE sso_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) UNIQUE,
  
  -- SSO Type
  sso_type TEXT NOT NULL, -- 'saml', 'oidc', 'custom_jwt'
  
  -- SAML Settings
  saml_entry_point TEXT,
  saml_issuer TEXT,
  saml_certificate TEXT,
  
  -- OIDC Settings
  oidc_client_id TEXT,
  oidc_client_secret TEXT,
  oidc_discovery_url TEXT,
  
  -- Behavior settings
  auto_provision_users BOOLEAN DEFAULT true,
  default_role TEXT DEFAULT 'teacher',
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

*Note: SSO is an advanced feature that significantly increases implementation complexity. Consider offering this as a premium add-on or Phase 2 feature.*

---

### 5. Data Export / Sync API

Buyers may want to sync BibleBibleLessonSpark data into their CRM.

#### Read-Only API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/users` | List all users in organization |
| `GET /api/v1/users/:id` | Get specific user details |
| `GET /api/v1/lessons` | List all lessons |
| `GET /api/v1/lessons/:id` | Get specific lesson |
| `GET /api/v1/activity` | Activity log for organization |

#### Example: User List Response

```json
{
  "data": [
    {
      "id": "user_abc123",
      "email": "teacher@example.com",
      "first_name": "Sarah",
      "last_name": "Johnson",
      "role": "teacher",
      "status": "active",
      "lessons_created": 12,
      "last_active_at": "2025-01-15T10:30:00Z",
      "created_at": "2024-06-01T08:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 50,
    "total": 127
  }
}
```

---

## Implementation Priority

| Priority | Feature | Effort | Value |
|----------|---------|--------|-------|
| 🔴 **High** | Webhook system | Medium | Enables all integrations |
| 🔴 **High** | Email provider toggle (enable/disable) | Low | Quick win for enterprise |
| 🟡 **Medium** | Admin UI for webhooks | Medium | Self-service configuration |
| 🟡 **Medium** | Additional email providers | Medium | Flexibility |
| 🟢 **Lower** | Read-only API | Medium | Data sync capability |
| 🟢 **Future** | SSO support | High | Enterprise requirement |

---

## Preparation Checklist

### Phase 1: Webhook Foundation
- [ ] Create `webhook_configurations` table
- [ ] Create `webhook_logs` table
- [ ] Build webhook service with retry logic
- [ ] Add webhook calls to key events (user registered, invitation sent, etc.)
- [ ] Implement signature verification

### Phase 2: Email Abstraction
- [ ] Create `email_provider_config` table
- [ ] Build email provider interface
- [ ] Implement "disabled" provider option
- [ ] Add per-email-type enable/disable flags
- [ ] Modify existing email functions to use abstraction

### Phase 3: Admin UI
- [ ] Webhook configuration screen
- [ ] Email settings screen
- [ ] Webhook delivery logs view
- [ ] Test webhook button

### Phase 4: Documentation
- [ ] Webhook payload documentation
- [ ] Integration guide for common CRMs
- [ ] API documentation (if implementing sync API)

---

## Example: Planning Center Integration

A buyer using Planning Center could:

1. **Disable all BibleBibleLessonSpark emails**
2. **Configure webhook** to their middleware/Zapier
3. **Middleware receives** `invitation.sent` event
4. **Middleware calls** Planning Center API to:
   - Look up person by email
   - Add to "Sunday School Teachers" list
   - Trigger Planning Center email workflow

This keeps their data centralized in Planning Center while using BibleBibleLessonSpark for lesson generation.

---

## Questions for White-Label Buyers

Include these in your sales/onboarding process:

1. What CRM/membership system do you currently use?
2. What email system do you use for member communication?
3. Do you need users to log in with existing credentials (SSO)?
4. Do you want BibleBibleLessonSpark to send emails, or will you handle all communication?
5. Do you have a technical team to set up webhook integrations?
6. Do you need to sync user/lesson data back to your systems?

Their answers will determine which integration features they need.
