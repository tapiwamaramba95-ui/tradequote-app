import { calculateTotalWithFee } from '@/lib/stripe-fees'

interface FeeBreakdownProps {
  baseAmount: number
  paymentMethod: 'card' | 'direct_debit'
}

export function FeeBreakdown({ baseAmount, paymentMethod }: FeeBreakdownProps) {
  const { fee, total } = calculateTotalWithFee(baseAmount, paymentMethod)
  
  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-4">
      <div className="flex justify-between mb-2">
        <span className="text-gray-700">Invoice Amount</span>
        <span className="font-medium">${baseAmount.toFixed(2)}</span>
      </div>
      
      <div className="flex justify-between mb-2">
        <span className="text-gray-700">
          Payment Processing Fee
          <span className="text-xs text-gray-600 ml-1">
            ({paymentMethod === 'card' ? '1.75% + $0.30' : '1% (max $5)'})
          </span>
        </span>
        <span className="font-medium">${fee.toFixed(2)}</span>
      </div>
      
      <div className="border-t pt-2 mt-2 flex justify-between">
        <span className="font-semibold">Total to Pay</span>
        <span className="font-semibold text-lg">${total.toFixed(2)}</span>
      </div>
      
      <p className="text-xs text-gray-600 mt-3">
        Payment processing is handled by Stripe. We pass these fees through at cost.
      </p>
    </div>
  )
}
