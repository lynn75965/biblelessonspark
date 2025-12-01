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

interface InviteEmailProps {
  inviterName: string;
  inviteUrl: string;
  recipientEmail?: string;
  organizationName?: string;
}

export const InviteEmail = ({
  inviterName,
  inviteUrl,
  recipientEmail,
  organizationName,
}: InviteEmailProps) => (
  <Html>
    <Head />
    <Preview>
      {organizationName 
        ? `You've been invited to join ${organizationName} on LessonSpark USA`
        : "You've been invited to join LessonSpark USA"
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
            <strong>{organizationName}</strong> on <strong>LessonSpark USA</strong>,
            a Baptist Bible Study Enhancement Platform designed to help volunteer Sunday School teachers.
          </Text>
        ) : (
          <Text style={text}>
            <strong>{inviterName}</strong> has invited you to join <strong>LessonSpark USA</strong>,
            a Baptist Bible Study Enhancement Platform designed to help volunteer Sunday School teachers.
          </Text>
        )}
        <Text style={text}>
          LessonSpark USA helps Baptist churches and teachers create theologically-sound,
          age-appropriate Bible study lessons, making lesson preparation easier and more effective.
        </Text>
        {organizationName && (
          <Text style={text}>
            Once you sign up, you'll automatically be added to <strong>{organizationName}</strong> 
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

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 24px',
};

const link = {
  color: '#2563eb',
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
