import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface ContactFormReceiptProps {
  senderName: string
  chapterName: string
  chapterContactEmail: string
}

export function ContactFormReceipt({
  senderName,
  chapterName,
  chapterContactEmail,
}: ContactFormReceiptProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>We received your message — WIAL {chapterName}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Heading style={headingStyle}>Message Received</Heading>
            <Text style={subheadingStyle}>World Institute for Action Learning</Text>
          </Section>

          <Section style={sectionStyle}>
            <Text style={textStyle}>Hi {senderName},</Text>
            <Text style={textStyle}>
              Thank you for reaching out to WIAL {chapterName}. We have received your message and
              will get back to you as soon as possible.
            </Text>
            <Text style={textStyle}>
              In the meantime, you can also reach us directly at{' '}
              <a href={`mailto:${chapterContactEmail}`} style={linkStyle}>
                {chapterContactEmail}
              </a>
              .
            </Text>
          </Section>

          <Hr style={hrStyle} />
          <Text style={footerStyle}>World Institute for Action Learning · wial.org</Text>
        </Container>
      </Body>
    </Html>
  )
}

const bodyStyle = { backgroundColor: '#f4f4f5', fontFamily: 'system-ui, sans-serif' }
const containerStyle = {
  margin: '0 auto',
  padding: '24px',
  maxWidth: '600px',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
}
const headerStyle = { borderBottom: '2px solid #003366', paddingBottom: '16px' }
const headingStyle = { color: '#003366', fontSize: '20px', margin: '0 0 4px' }
const subheadingStyle = { color: '#666', fontSize: '14px', margin: '0' }
const sectionStyle = { padding: '20px 0' }
const textStyle = { color: '#333', fontSize: '15px', lineHeight: '1.6', margin: '0 0 12px' }
const linkStyle = { color: '#003366' }
const hrStyle = { borderColor: '#e5e7eb', margin: '20px 0' }
const footerStyle = { color: '#9ca3af', fontSize: '12px' }
