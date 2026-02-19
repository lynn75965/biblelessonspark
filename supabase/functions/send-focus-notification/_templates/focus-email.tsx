import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";

interface FocusEmailProps {
  organizationName: string;
  passage?: string | null;
  theme?: string | null;
  startDate: string;
  endDate: string;
  notes?: string | null;
  loginUrl: string;
}

export const FocusNotificationEmail = ({
  organizationName,
  passage,
  theme,
  startDate,
  endDate,
  notes,
  loginUrl,
}: FocusEmailProps) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <Html>
      <Head />
      <Preview>New Focus Set for {organizationName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>New Focus Set for {organizationName}</Heading>
          
          <Text style={text}>
            Your organization leader has set a new focus for your upcoming lessons:
          </Text>

          <Section style={focusBox}>
            {passage && (
              <Text style={focusItem}>
                <strong>Passage:</strong> {passage}
              </Text>
            )}
            {theme && (
              <Text style={focusItem}>
                <strong>Theme:</strong> {theme}
              </Text>
            )}
            <Text style={focusItem}>
              <strong>Dates:</strong> {formatDate(startDate)} - {formatDate(endDate)}
            </Text>
            {notes && (
              <Text style={notesText}>
                <strong>Notes:</strong> {notes}
              </Text>
            )}
          </Section>

          <Section style={buttonContainer}>
            <Link href={loginUrl} style={button}>
              Create Your Lesson
            </Link>
          </Section>

          <Text style={footer}>
            Log in to BibleLessonSpark to create your lesson using this focus.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
  borderRadius: "8px",
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "1.3",
  margin: "0 0 20px",
};

const text = {
  color: "#4a4a4a",
  fontSize: "16px",
  lineHeight: "1.5",
  margin: "0 0 20px",
};

const focusBox = {
  backgroundColor: "#f0f9ff",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "24px",
  borderLeft: "4px solid #0ea5e9",
};

const focusItem = {
  color: "#1a1a1a",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 8px",
};

const notesText = {
  color: "#666666",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "12px 0 0",
  fontStyle: "italic",
};

const buttonContainer = {
  textAlign: "center" as const,
  marginBottom: "24px",
};

const button = {
  backgroundColor: "#0ea5e9",
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "600",
  padding: "12px 24px",
  textDecoration: "none",
};

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  lineHeight: "1.5",
  textAlign: "center" as const,
};

export default FocusNotificationEmail;
