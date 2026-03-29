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

interface ContactFormNotificationProps {
  senderName: string
  senderEmail: string
  message: string
  chapterName: string
  subject?: string
}

export function ContactFormNotification({
  senderName,
  senderEmail,
  message,
  chapterName,
  subject,
}: ContactFormNotificationProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>
        New contact form message from {senderName} — {chapterName}
      </Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Heading style={headingStyle}>New Contact Form Message</Heading>
            <Text style={subheadingStyle}>WIAL {chapterName}</Text>
          </Section>

          <Section style={sectionStyle}>
            <Text style={labelStyle}>From</Text>
            <Text style={valueStyle}>
              {senderName} &lt;{senderEmail}&gt;
            </Text>

            {subject && (
              <>
                <Text style={labelStyle}>Subject</Text>
                <Text style={valueStyle}>{subject}</Text>
              </>
            )}

            <Text style={labelStyle}>Message</Text>
            <Text style={messageStyle}>{message}</Text>
          </Section>

          <Hr style={hrStyle} />
          <Text style={footerStyle}>
            Reply directly to {senderEmail} to respond to this message. This notification was sent
            from the WIAL platform contact form.
          </Text>
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
const labelStyle = {
  color: '#666',
  fontSize: '12px',
  fontWeight: '600' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '16px 0 4px',
}
const valueStyle = { color: '#111', fontSize: '15px', margin: '0' }
const messageStyle = {
  color: '#333',
  fontSize: '15px',
  lineHeight: '1.6',
  backgroundColor: '#f9f9f9',
  padding: '12px 16px',
  borderRadius: '4px',
  borderLeft: '3px solid #003366',
  margin: '0',
  whiteSpace: 'pre-wrap' as const,
}
const hrStyle = { borderColor: '#e5e7eb', margin: '20px 0' }
const footerStyle = { color: '#9ca3af', fontSize: '12px', lineHeight: '1.5' }
