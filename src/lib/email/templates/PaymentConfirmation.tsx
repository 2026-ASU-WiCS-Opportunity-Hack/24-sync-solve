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

export interface PaymentConfirmationProps {
  recipientName: string
  paymentType: 'enrollment_fee' | 'certification_fee' | 'membership_dues' | 'event_registration'
  amountFormatted: string // e.g. "$50.00 USD"
  chapterName?: string | null
  receiptUrl?: string | null
  siteUrl: string
}

const PAYMENT_TYPE_LABELS: Record<PaymentConfirmationProps['paymentType'], string> = {
  enrollment_fee: 'Enrollment Fee',
  certification_fee: 'Certification Fee',
  membership_dues: 'Membership Dues',
  event_registration: 'Event Registration',
}

export function PaymentConfirmation({
  recipientName,
  paymentType,
  amountFormatted,
  chapterName,
  receiptUrl,
  siteUrl,
}: PaymentConfirmationProps) {
  const label = PAYMENT_TYPE_LABELS[paymentType]
  const organization = chapterName ? `WIAL ${chapterName}` : 'WIAL Global'

  return (
    <Html lang="en">
      <Head />
      <Preview>
        Payment confirmed: {label} — {amountFormatted}
      </Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Heading style={headingStyle}>Payment Confirmed</Heading>
            <Text style={subheadingStyle}>{organization}</Text>
          </Section>

          <Section style={sectionStyle}>
            <Text style={textStyle}>Hi {recipientName},</Text>
            <Text style={textStyle}>
              Your payment has been successfully processed. Thank you for your continued commitment
              to Action Learning.
            </Text>

            <Section style={summaryStyle}>
              <Text style={summaryLabelStyle}>Payment Summary</Text>
              <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                <tbody>
                  <tr>
                    <td style={summaryKeyStyle}>Type</td>
                    <td style={summaryValueStyle}>{label}</td>
                  </tr>
                  <tr>
                    <td style={summaryKeyStyle}>Amount</td>
                    <td style={summaryValueStyle}>{amountFormatted}</td>
                  </tr>
                  <tr>
                    <td style={summaryKeyStyle}>Organization</td>
                    <td style={summaryValueStyle}>{organization}</td>
                  </tr>
                </tbody>
              </table>
            </Section>

            {paymentType === 'membership_dues' && (
              <Text style={textStyle}>
                Your membership is now <strong>active</strong> for one year. You can view your
                membership status in your dashboard:{' '}
                <a href={`${siteUrl}/dashboard`} style={linkStyle}>
                  {siteUrl}/dashboard
                </a>
              </Text>
            )}

            {receiptUrl && (
              <Text style={textStyle}>
                View your Stripe receipt:{' '}
                <a href={receiptUrl} style={linkStyle}>
                  View Receipt
                </a>
              </Text>
            )}
          </Section>

          <Hr style={hrStyle} />
          <Text style={footerStyle}>
            World Institute for Action Learning · wial.org
            {'\n'}If you have questions about this payment, contact{' '}
            <a href="mailto:support@wial.org" style={linkStyle}>
              support@wial.org
            </a>
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
const summaryStyle = {
  backgroundColor: '#f0f4f8',
  borderRadius: '6px',
  padding: '16px',
  margin: '16px 0',
}
const summaryLabelStyle = {
  color: '#003366',
  fontSize: '13px',
  fontWeight: '700' as const,
  margin: '0 0 10px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
}
const summaryKeyStyle = {
  color: '#666',
  fontSize: '14px',
  padding: '4px 0',
  width: '40%',
}
const summaryValueStyle = {
  color: '#111',
  fontSize: '14px',
  fontWeight: '600' as const,
  padding: '4px 0',
}
const hrStyle = { borderColor: '#e5e7eb', margin: '20px 0' }
const footerStyle = { color: '#9ca3af', fontSize: '12px', whiteSpace: 'pre-line' as const }
