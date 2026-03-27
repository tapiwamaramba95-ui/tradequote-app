'use server'

import Stripe from 'stripe'
import { createSupabaseServer } from '@/lib/supabase-server'
import { calculateCardFee, calculateDirectDebitFee, toStripeCents } from './stripe-fees'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

export async function createInvoicePaymentLink(invoiceId: string, paymentMethod: 'card' | 'direct_debit') {
  const supabase = await createSupabaseServer()
  
  // Get invoice details
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*, clients(*), users(*)')
    .eq('id', invoiceId)
    .single()
  
  if (error || !invoice) {
    throw new Error('Invoice not found')
  }
  
  if (invoice.payment_status === 'paid') {
    throw new Error('Invoice already paid')
  }
  
  // Calculate amounts
  const baseAmount = parseFloat(invoice.total_amount || '0')
  const fee = paymentMethod === 'card' 
    ? calculateCardFee(baseAmount)
    : calculateDirectDebitFee(baseAmount)
  const totalAmount = baseAmount + fee
  
  // Create Stripe Payment Link
  const paymentLink = await stripe.paymentLinks.create({
    line_items: [
      {
        price_data: {
          currency: 'aud',
          product_data: {
            name: `Invoice #${invoice.invoice_number}`,
            description: `Payment for ${invoice.users?.company_name || 'services'}`,
          },
          unit_amount: toStripeCents(totalAmount),
        },
        quantity: 1,
      },
    ],
    metadata: {
      invoice_id: invoiceId,
      base_amount: baseAmount.toString(),
      stripe_fee: fee.toString(),
      total_amount: totalAmount.toString(),
      payment_method: paymentMethod,
    },
    after_completion: {
      type: 'redirect',
      redirect: {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/invoice/payment-success?invoice_id=${invoiceId}`,
      },
    },
    payment_method_types: paymentMethod === 'card' ? ['card'] : ['au_becs_debit'],
  })
  
  // Update invoice with payment link
  await supabase
    .from('invoices')
    .update({
      stripe_payment_link: paymentLink.url,
      base_amount: baseAmount,
      stripe_fee: fee,
      total_amount: totalAmount,
      payment_method: paymentMethod,
    })
    .eq('id', invoiceId)
  
  return {
    paymentLink: paymentLink.url,
    baseAmount,
    fee,
    totalAmount,
  }
}
