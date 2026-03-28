import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getPaymentsAdmin } from '@/features/payments/queries/getPayments'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { Receipt } from 'lucide-react'

export const metadata: Metadata = { title: 'Payments' }

export const revalidate = 60

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  processing: 'bg-blue-100 text-blue-700',
  succeeded: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-amber-100 text-amber-700',
}

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  enrollment_fee: 'Enrollment Fee',
  certification_fee: 'Certification Fee',
  membership_dues: 'Membership Dues',
  event_registration: 'Event Registration',
}

export default async function AdminPaymentsPage() {
  const supabase = await createClient()
  const { items: payments, total } = await getPaymentsAdmin(supabase, { limit: 100 })

  // Total revenue from succeeded payments
  const totalRevenue = payments
    .filter((p) => p.status === 'succeeded')
    .reduce((sum, p) => sum + (p.amount ?? 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} payment record{total !== 1 ? 's' : ''}.
          </p>
        </div>
        {totalRevenue > 0 && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-right">
            <p className="text-xs font-medium text-green-600">Total Collected</p>
            <p className="text-xl font-extrabold text-green-700">
              {formatCurrency(totalRevenue, 'USD')}
            </p>
          </div>
        )}
      </div>

      {/* Table */}
      {payments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <Receipt size={36} className="mx-auto mb-3 text-gray-300" aria-hidden="true" />
          <p className="text-sm text-gray-500">No payment records yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-sm" aria-label="Payments list">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                  User
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                  Chapter
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                  Type
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold text-gray-700">
                  Amount
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                  Date
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                  Receipt
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{payment.user_name ?? 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{payment.user_email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {payment.chapter_name ?? <span className="text-gray-400">Global</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {PAYMENT_TYPE_LABELS[payment.payment_type] ?? payment.payment_type}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {formatCurrency(payment.amount ?? 0, payment.currency ?? 'USD')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[payment.status] ?? 'bg-gray-100 text-gray-600'}`}
                    >
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(payment.created_at)}</td>
                  <td className="px-4 py-3">
                    {payment.receipt_url ? (
                      <a
                        href={payment.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                        aria-label="View receipt (opens in new tab)"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
