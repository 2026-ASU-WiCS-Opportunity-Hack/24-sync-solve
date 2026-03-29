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

interface CoachApplicationReviewedProps {
  applicantName: string
  decision: 'approved' | 'rejected'
  chapterName: string
  reviewNotes?: string | null
  siteUrl: string
}

export function CoachApplicationReviewed({
  applicantName,
  decision,
  chapterName,
  reviewNotes,
  siteUrl,
}: CoachApplicationReviewedProps) {
  const isApproved = decision === 'approved'

  return (
    <Html lang="en">
      <Head />
      <Preview>
        Your coach application has been {decision} — WIAL {chapterName}
      </Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={{ ...headerStyle, borderColor: isApproved ? '#003366' : '#CC0000' }}>
            <Heading style={headingStyle}>
              Application {isApproved ? 'Approved' : 'Not Approved'}
            </Heading>
            <Text style={subheadingStyle}>WIAL {chapterName}</Text>
          </Section>

          <Section style={sectionStyle}>
            <Text style={textStyle}>Hi {applicantName},</Text>

            {isApproved ? (
              <>
                <Text style={textStyle}>
                  Congratulations! Your application to become a certified Action Learning Coach with
                  WIAL {chapterName} has been <strong>approved</strong>.
                </Text>
                <Text style={textStyle}>
                  Your coach profile has been created. Once an administrator reviews and publishes
                  it, you will appear in the WIAL coach directory.
                </Text>
                <Text style={textStyle}>
                  Log in to your dashboard to manage your coach profile:{' '}
                  <a href={`${siteUrl}/dashboard`} style={linkStyle}>
                    {siteUrl}/dashboard
                  </a>
                </Text>
              </>
            ) : (
              <>
                <Text style={textStyle}>
                  Thank you for your interest in joining WIAL {chapterName} as a certified Action
                  Learning Coach. After reviewing your application, we are unable to approve it at
                  this time.
                </Text>
                {reviewNotes && (
                  <Section style={notesStyle}>
                    <Text style={notesLabelStyle}>Feedback from the reviewer:</Text>
                    <Text style={notesTextStyle}>{reviewNotes}</Text>
                  </Section>
                )}
                <Text style={textStyle}>
                  If you have questions or would like to discuss your application further, please
                  contact your chapter administrator.
                </Text>
              </>
            )}
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
const notesStyle = {
  backgroundColor: '#fff8e6',
  border: '1px solid #f59e0b',
  borderRadius: '4px',
  padding: '12px 16px',
  margin: '12px 0',
}
const notesLabelStyle = {
  color: '#92400e',
  fontSize: '12px',
  fontWeight: '600' as const,
  margin: '0 0 4px',
}
const notesTextStyle = {
  color: '#78350f',
  fontSize: '14px',
  margin: '0',
  whiteSpace: 'pre-wrap' as const,
}
const hrStyle = { borderColor: '#e5e7eb', margin: '20px 0' }
const footerStyle = { color: '#9ca3af', fontSize: '12px' }
