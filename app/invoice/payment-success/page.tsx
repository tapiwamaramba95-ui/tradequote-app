'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const invoiceId = searchParams.get('invoice_id')
    
    if (!invoiceId) {
      router.push('/')
      return
    }

    fetchInvoice(invoiceId)
  }, [searchParams])

  const fetchInvoice = async (invoiceId: string) => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, clients(*), users(*)')
      .eq('id', invoiceId)
      .single()

    if (error) {
      console.error('Error fetching invoice:', error)
      setLoading(false)
      return
    }

    setInvoice(data)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Invoice Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            We couldn't find the invoice you're looking for.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold"
          >
            Go Home
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          
          <p className="text-gray-600">
            Your payment has been processed successfully.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="flex justify-between mb-3">
            <span className="text-gray-700">Invoice Number</span>
            <span className="font-semibold">#{invoice.invoice_number}</span>
          </div>
          
          <div className="flex justify-between mb-3">
            <span className="text-gray-700">Amount Paid</span>
            <span className="font-semibold text-green-600">
              ${parseFloat(invoice.total_amount).toFixed(2)}
            </span>
          </div>
          
          <div className="flex justify-between mb-3">
            <span className="text-gray-700">Payment Date</span>
            <span className="font-semibold">
              {new Date(invoice.paid_at).toLocaleDateString('en-AU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-700">Status</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Paid
            </span>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Receipt:</strong> A confirmation email with your receipt has been sent to your email address.
          </p>
        </div>

        <div className="text-center text-sm text-gray-600 mb-6">
          <p>Thank you for your payment!</p>
          <p className="mt-1">
            For any questions, please contact {invoice.users?.company_name || 'us'}.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 mb-3"
        >
          Print Receipt
        </button>

        <a
          href="/"
          className="flex items-center justify-center gap-2 w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700"
        >
          Back to Home
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}
