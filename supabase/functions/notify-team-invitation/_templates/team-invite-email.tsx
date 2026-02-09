import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

/**
 * Teaching Team Invite Email Template
 * ====================================
 *
 * SSOT Compliance:
 * - appName prop comes from _shared/branding.ts via the edge function
 * - Colors reference BibleLessonSpark brand palette (Forest Green #3D5C3D)
 * - No hardcoded brand names - all passed as props
 * - This template is for EXISTING users (login link, not signup)
 *
 * Location: supabase/functions/notify-team-invitation/_templates/team-invite-email.tsx
 */

interface TeamInviteEmailProps {
  inviteeName: string;
  leadTeacherName: string;
  teamName: string;
  loginUrl: string;
  appName?: string; // SSOT: Passed from edge function via branding.ts
}

// SSOT: Default app name matches _shared/branding.ts FALLBACK_BRANDING.appName
const DEFAULT_APP_NAME = 'BibleLessonSpark';

export const TeamInviteEmail = ({
  inviteeName,
  leadTeacherName,
  teamName,
  loginUrl,
  appName = DEFAULT_APP_NAME,
}: TeamInviteEmailProps) => (
  <Html>
    <Head />
    <Preview>
      {`${leadTeacherName} has invited you to join "${teamName}" on ${appName}`}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Teaching Team Invitation</Heading>
        <Text style={text}>Hello {inviteeName},</Text>
        <Text style={text}>
          <strong>{leadTeacherName}</strong> has invited you to join the
          Teaching Team <strong>"{teamName}"</strong> on{' '}
          <strong>{appName}</strong>.
        </Text>
        <Text style={text}>
          As a Teaching Team member, you'll be able to see lessons that your
          team members have shared, and share your own lessons with them. It's
          a wonderful way to encourage and support one another in the ministry
          of teaching God's Word.
        </Text>
        <Text style={text}>
          Log in to your {appName} account to accept or decline this
          invitation. You'll see a banner at the top of your Dashboard with
          the details.
        </Text>
        <Section style={buttonContainer}>
          <Button href={loginUrl} style={button}>
            Log In to Respond
          </Button>
        </Section>
        <Text style={text}>Or copy and paste this link into your browser:</Text>
        <Text style={link}>{loginUrl}</Text>
        <Text style={footer}>
          If you did not expect this invitation, you can safely ignore this
          email or decline it after logging in.
        </Text>
      </Container>
    </Body>
  </Html>
);

// ============================================================================
// STYLES (SSOT: Colors match BibleLessonSpark brand palette)
// ============================================================================
// Primary: Forest Green #3D5C3D (from src/config/branding.ts)
// Pattern: Matches invite-email.tsx styles exactly
// ============================================================================

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  borderRadius: '8px',
  maxWidth: '560px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '40px',
  margin: '0 0 20px',
  textAlign: 'center' as const,
};

const text = {
  color: '#444',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 16px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

// SSOT: Forest Green (#3D5C3D) - BibleLessonSpark primary brand color
const button = {
  backgroundColor: '#3D5C3D',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 24px',
};

// SSOT: Forest Green (#3D5C3D) - BibleLessonSpark primary brand color
const link = {
  color: '#3D5C3D',
  fontSize: '14px',
  lineHeight: '24px',
  wordBreak: 'break-all' as const,
};

const footer = {
  color: '#898989',
  fontSize: '12px',
  lineHeight: '22px',
  marginTop: '32px',
};

export default TeamInviteEmail;
