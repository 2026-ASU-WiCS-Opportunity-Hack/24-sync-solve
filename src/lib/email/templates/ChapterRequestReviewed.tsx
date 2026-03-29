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

interface ChapterRequestReviewedProps {
  requesterName: string
  decision: 'approved' | 'rejected'
  chapterName: string
  chapterSlug: string
  reviewNotes?: string | null
  siteUrl: string
}

export function ChapterRequestReviewed({
  requesterName,
  decision,
  chapterName,
  chapterSlug,
  reviewNotes,
  siteUrl,
}: ChapterRequestReviewedProps) {
  const isApproved = decision === 'approved'

  return (
    <Html lang="en">
      <Head />
      <Preview>
        Your chapter request for {chapterName} has been {decision}
      </Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={{ ...headerStyle, borderColor: isApproved ? '#003366' : '#CC0000' }}>
            <Heading style={headingStyle}>
              Chapter Request {isApproved ? 'Approved' : 'Not Approved'}
            </Heading>
            <Text style={subheadingStyle}>World Institute for Action Learning</Text>
          </Section>

          <Section style={sectionStyle}>
            <Text style={textStyle}>Hi {requesterName},</Text>

            {isApproved ? (
              <>
                <Text style={textStyle}>
                  Great news! Your request to create the <strong>{chapterName}</strong> chapter has
                  been <strong>approved</strong>.
                </Text>
                <Text style={textStyle}>
                  Your chapter site is now live at:{' '}
                  <a href={`${siteUrl}/${chapterSlug}`} style={linkStyle}>
                    {siteUrl}/{chapterSlug}
                  </a>
                </Text>
                <Text style={textStyle}>
                  You have been assigned as the Chapter Admin. Log in to start setting up your
                  chapter:{' '}
                  <a href={`${siteUrl}/${chapterSlug}/manage`} style={linkStyle}>
                    Manage your chapter
                  </a>
                </Text>
              </>
            ) : (
              <>
                <Text style={textStyle}>
                  Thank you for your interest in establishing the <strong>{chapterName}</strong>{' '}
                  chapter. After review, we are unable to approve the request at this time.
                </Text>
                {reviewNotes && (
                  <Section style={notesStyle}>
                    <Text style={notesLabelStyle}>Feedback from the reviewer:</Text>
                    <Text style={notesTextStyle}>{reviewNotes}</Text>
                  </Section>
                )}
                <Text style={textStyle}>
                  If you have questions or would like to discuss this further, please contact us at{' '}
                  <a href="mailto:support@wial.org" style={linkStyle}>
                    support@wial.org
                  </a>
                  .
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
