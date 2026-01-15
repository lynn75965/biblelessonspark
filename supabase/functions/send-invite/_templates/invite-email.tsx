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
 * Invite Email Template
 * =====================
 * 
 * SSOT Compliance:
 * - appName prop comes from _shared/branding.ts via the edge function
 * - Colors reference BibleLessonSpark brand palette (Forest Green #3D5C3D)
 * - No hardcoded brand names - all passed as props
 * 
 * Location: supabase/functions/send-invite/_templates/invite-email.tsx
 */

interface InviteEmailProps {
  inviterName: string;
  inviteUrl: string;
  recipientEmail?: string;
  organizationName?: string | null;
  appName?: string; // SSOT: Passed from edge function via branding.ts
}

// SSOT: Default app name matches _shared/branding.ts FALLBACK_BRANDING.appName
const DEFAULT_APP_NAME = "BibleLessonSpark";

export const InviteEmail = ({
  inviterName,
  inviteUrl,
  recipientEmail,
  organizationName,
  appName = DEFAULT_APP_NAME,
}: InviteEmailProps) => (
  <Html>
    <Head />
    <Preview>
      {organizationName 
        ? `You've been invited to join ${organizationName} on ${appName}`
        : `You've been invited to join ${appName}`
      }
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>You're Invited! 📖</Heading>
        <Text style={text}>
          Hello,
        </Text>
        {organizationName ? (
          <Text style={text}>
            <strong>{inviterName}</strong> has invited you to join{' '}
            <strong>{organizationName}</strong> on <strong>{appName}</strong>,
            a Baptist Bible Study Enhancement Platform designed to help volunteer Sunday School teachers.
          </Text>
        ) : (
          <Text style={text}>
            <strong>{inviterName}</strong> has invited you to join <strong>{appName}</strong>,
            a Baptist Bible Study Enhancement Platform designed to help volunteer Sunday School teachers.
          </Text>
        )}
        <Text style={text}>
          {appName} helps Baptist churches and teachers create theologically-sound,
          age-appropriate Bible study lessons, making lesson preparation easier and more effective.
        </Text>
        {organizationName && (
          <Text style={text}>
            Once you sign up, you'll automatically be added to <strong>{organizationName}</strong>{' '}
            and can start collaborating with your fellow teachers right away.
          </Text>
        )}
        <Section style={buttonContainer}>
          <Button href={inviteUrl} style={button}>
            Accept Invitation & Sign Up
          </Button>
        </Section>
        <Text style={text}>
          Or copy and paste this link into your browser:
        </Text>
        <Text style={link}>
          {inviteUrl}
        </Text>
        <Text style={footer}>
          If you did not expect this invitation, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
);

// ============================================================================
// STYLES (SSOT: Colors match BibleLessonSpark brand palette)
// ============================================================================
// Primary: Forest Green #3D5C3D (from src/config/branding.ts)
// These could be passed as props for full white-label support in future
// ============================================================================

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
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

export default InviteEmail;
