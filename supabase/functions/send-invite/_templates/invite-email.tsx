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
  recipientEmail: string;
}

export const InviteEmail = ({
  inviterName,
  inviteUrl,
  recipientEmail,
}: InviteEmailProps) => (
  <Html>
    <Head />
    <Preview>You've been invited to join LessonSpark USA</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>You're Invited! 📖</Heading>
        <Text style={text}>
          Hello,
        </Text>
        <Text style={text}>
          <strong>{inviterName}</strong> has invited you to join <strong>LessonSpark USA</strong>, 
          the Baptist Bible Study Enhancement Platform powered by AI.
        </Text>
        <Text style={text}>
          LessonSpark USA helps Baptist churches and teachers enhance their Bible study lessons 
          with AI-powered tools, making lesson preparation faster and more effective.
        </Text>
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
          This invitation was sent to <strong>{recipientEmail}</strong>. 
          If you weren't expecting this invitation, you can safely ignore this email.
        </Text>
        <Text style={footer}>
          © {new Date().getFullYear()} LessonSpark USA. All rights reserved.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default InviteEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const h1 = {
  color: '#333',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '0 40px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#5469d4',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};

const link = {
  color: '#5469d4',
  fontSize: '14px',
  textDecoration: 'underline',
  margin: '16px 0',
  padding: '0 40px',
  wordBreak: 'break-all' as const,
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '16px 0',
  padding: '0 40px',
};
