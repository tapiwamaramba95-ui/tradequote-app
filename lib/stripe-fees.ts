/**
 * Stripe fee calculations for Australian payments
 */

// Card payments: 1.75% + $0.30
export function calculateCardFee(amount: number): number {
  return Math.round((amount * 0.0175 + 0.30) * 100) / 100
}

// Direct debit (BECS): 1% capped at $5
export function calculateDirectDebitFee(amount: number): number {
  const fee = amount * 0.01
  return Math.min(fee, 5.00)
}

// Subscription fees (same as card)
export function calculateSubscriptionFee(amount: number): number {
  return calculateCardFee(amount)
}

// Calculate total with fee
export function calculateTotalWithFee(baseAmount: number, paymentMethod: 'card' | 'direct_debit'): {
  baseAmount: number
  fee: number
  total: number
} {
  const fee = paymentMethod === 'card' 
    ? calculateCardFee(baseAmount)
    : calculateDirectDebitFee(baseAmount)
  
  return {
    baseAmount: Math.round(baseAmount * 100) / 100,
    fee: Math.round(fee * 100) / 100,
    total: Math.round((baseAmount + fee) * 100) / 100
  }
}

// Convert to Stripe cents (Stripe uses smallest currency unit)
export function toStripeCents(amount: number): number {
  return Math.round(amount * 100)
}

// Convert from Stripe cents
export function fromStripeCents(cents: number): number {
  return cents / 100
}
