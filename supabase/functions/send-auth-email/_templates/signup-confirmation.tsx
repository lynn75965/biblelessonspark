import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface SignupConfirmationEmailProps {
  supabase_url: string
  token_hash: string
  email_action_type: string
  redirect_to: string
  user_email: string
}

export const SignupConfirmationEmail = ({
  supabase_url,
  token_hash,
  email_action_type,
  redirect_to,
  user_email,
}: SignupConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Confirm your email to get started with LessonSpark USA</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome to LessonSpark USA! 🎓</Heading>
        <Text style={text}>
          Thank you for signing up! We're excited to help you enhance your Bible study lessons with AI-powered tools.
        </Text>
        <Text style={text}>
          To get started, please confirm your email address by clicking the button below:
        </Text>
        <Section style={buttonContainer}>
          <Link
            href={`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`}
            style={button}
          >
            Confirm Email Address
          </Link>
        </Section>
        <Text style={text}>
          Or copy and paste this link into your browser:
        </Text>
        <Text style={link}>
          {`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`}
        </Text>
        <Text style={footnote}>
          If you didn't create an account with LessonSpark USA, you can safely ignore this email.
        </Text>
        <Text style={footer}>
          LessonSpark USA - AI-Powered Bible Study Enhancement
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupConfirmationEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 48px',
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 48px',
  margin: '16px 0',
}

const buttonContainer = {
  padding: '27px 48px',
}

const button = {
  backgroundColor: '#5469d4',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
}

const link = {
  color: '#5469d4',
  fontSize: '14px',
  padding: '0 48px',
  wordBreak: 'break-all' as const,
}

const footnote = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '24px',
  padding: '0 48px',
  marginTop: '32px',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '0 48px',
  marginTop: '16px',
}
