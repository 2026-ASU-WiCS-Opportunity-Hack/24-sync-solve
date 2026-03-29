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

export interface MembershipDuesReminderProps {
  recipientName: string
  chapterName: string
  chapterSlug: string
  expiresAt: string // ISO date string
  daysUntilExpiry: number // positive = upcoming, 0 = today, negative = already expired
  siteUrl: string
}

export function MembershipDuesReminder({
  recipientName,
  chapterName,
  chapterSlug,
  expiresAt,
  daysUntilExpiry,
  siteUrl,
}: MembershipDuesReminderProps) {
  const isExpired = daysUntilExpiry < 0
  const isToday = daysUntilExpiry === 0
  const renewUrl = `${siteUrl}/${chapterSlug}/pay`

  const formattedExpiry = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(expiresAt))

  let subject = ''
  let urgencyText = ''
  if (isExpired) {
    subject = `Your WIAL membership has expired`
    urgencyText = `Your WIAL ${chapterName} membership expired on ${formattedExpiry}. Renew now to restore your active status.`
  } else if (isToday) {
    subject = `Your WIAL membership expires today`
    urgencyText = `Your WIAL ${chapterName} membership expires today. Renew now to avoid any interruption.`
  } else {
    subject = `Your WIAL membership expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`
    urgencyText = `Your WIAL ${chapterName} membership will expire on ${formattedExpiry} — in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}.`
  }

  return (
    <Html lang="en">
      <Head />
      <Preview>{subject}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={{ ...headerStyle, borderColor: isExpired ? '#CC0000' : '#003366' }}>
            <Heading style={{ ...headingStyle, color: isExpired ? '#CC0000' : '#003366' }}>
              {isExpired ? 'Membership Expired' : 'Membership Renewal Reminder'}
            </Heading>
            <Text style={subheadingStyle}>WIAL {chapterName}</Text>
          </Section>

          <Section style={sectionStyle}>
            <Text style={textStyle}>Hi {recipientName},</Text>
            <Text style={textStyle}>{urgencyText}</Text>
            <Text style={textStyle}>
              Renewing your membership ensures continued access to WIAL resources, your coach
              directory listing, and the global Action Learning community.
            </Text>

            <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
              <a href={renewUrl} style={buttonStyle}>
                Renew Membership Now
              </a>
            </Section>

            <Text style={textStyle}>
              If you have questions about your membership or renewal, please contact{' '}
              <a href="mailto:support@wial.org" style={linkStyle}>
                support@wial.org
              </a>
              .
            </Text>
          </Section>

          <Hr style={hrStyle} />
          <Text style={footerStyle}>
            World Institute for Action Learning · wial.org{'\n'}
            You are receiving this because you are a WIAL {chapterName} member.
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
const textStyle = { color: '#333', fontSize: '15px', lineHeight: '1.6', margin: '0 0 12px' }
const linkStyle = { color: '#003366' }
const buttonStyle = {
  backgroundColor: '#003366',
  color: '#ffffff',
  padding: '12px 28px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontWeight: '600' as const,
  fontSize: '15px',
  display: 'inline-block',
}
const hrStyle = { borderColor: '#e5e7eb', margin: '20px 0' }
const footerStyle = { color: '#9ca3af', fontSize: '12px', whiteSpace: 'pre-line' as const }
