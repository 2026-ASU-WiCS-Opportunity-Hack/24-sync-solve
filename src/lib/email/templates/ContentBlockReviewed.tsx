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

interface ContentBlockReviewedProps {
  editorName: string
  decision: 'approved' | 'rejected'
  blockType: string
  pageTitle: string
  chapterName: string
  rejectionReason?: string | null
  siteUrl: string
  pageUrl?: string | null
}

export function ContentBlockReviewed({
  editorName,
  decision,
  blockType,
  pageTitle,
  chapterName,
  rejectionReason,
  siteUrl,
  pageUrl,
}: ContentBlockReviewedProps) {
  const isApproved = decision === 'approved'
  const blockLabel = blockType.replace(/_/g, ' ')

  return (
    <Html lang="en">
      <Head />
      <Preview>
        Your content update has been {decision} — WIAL {chapterName}
      </Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={{ ...headerStyle, borderColor: isApproved ? '#003366' : '#CC0000' }}>
            <Heading style={headingStyle}>
              Content {isApproved ? 'Approved' : 'Not Approved'}
            </Heading>
            <Text style={subheadingStyle}>WIAL {chapterName}</Text>
          </Section>

          <Section style={sectionStyle}>
            <Text style={textStyle}>Hi {editorName},</Text>

            {isApproved ? (
              <>
                <Text style={textStyle}>
                  Your update to the <strong>{blockLabel}</strong> block on the{' '}
                  <strong>{pageTitle}</strong> page has been <strong>approved and published</strong>
                  .
                </Text>
                {pageUrl && (
                  <Text style={textStyle}>
                    You can view the published page here:{' '}
                    <a href={`${siteUrl}${pageUrl}`} style={linkStyle}>
                      View page
                    </a>
                  </Text>
                )}
              </>
            ) : (
              <>
                <Text style={textStyle}>
                  Your update to the <strong>{blockLabel}</strong> block on the{' '}
                  <strong>{pageTitle}</strong> page was not approved.
                </Text>
                {rejectionReason && (
                  <Section style={notesStyle}>
                    <Text style={notesLabelStyle}>Reason from the reviewer:</Text>
                    <Text style={notesTextStyle}>{rejectionReason}</Text>
                  </Section>
                )}
                <Text style={textStyle}>
                  You can make another edit attempt from the chapter management panel:{' '}
                  <a href={`${siteUrl}/dashboard`} style={linkStyle}>
                    Go to dashboard
                  </a>
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
