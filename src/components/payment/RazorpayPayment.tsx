import { useState, useCallback } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { useAppSelector, useAppDispatch } from '../../store/hooks'
import type { RootState } from '../../store'
import { addToast } from '../../store/slices/uiSlice'
import { paymentsApi } from '../../api'
import { CreditCard, Lock, Smartphone, Check, Loader2 } from 'lucide-react'

interface RazorpayPaymentProps {
  amount: number
  orderId: string
  onSuccess: () => void
  onError: (error: string) => void
}

declare global {
  interface Window {
    Razorpay: any
  }
}

export function loadRazorpay(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(window.Razorpay)
      return
    }
    
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(window.Razorpay)
    script.onerror = () => reject(new Error('Failed to load Razorpay'))
    document.body.appendChild(script)
  })
}

export default function RazorpayPayment({ amount, orderId, onSuccess, onError }: RazorpayPaymentProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [phone, setPhone] = useState('')
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state: RootState) => state.auth)

  const handlePayment = useCallback(async () => {
    if (!phone) {
      dispatch(addToast({ type: 'error', title: 'Please enter your phone number' }))
      return
    }

    setIsProcessing(true)

    try {
      // Create order on backend via gateway
      const response = await paymentsApi.razorpay.createOrder({
        amount: amount * 100,
        currency: 'INR',
        order_id: orderId,
      })

      const order = response.data.data

      // Load Razorpay
      const Razorpay = await loadRazorpay()

      // Create payment options
      const options = {
        key: order.razorpay_key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'Lumina E-commerce',
        description: `Order #${orderId}`,
        order_id: order.id,
        handler: async (response: any) => {
          try {
            // Verify payment on backend via gateway
            await paymentsApi.razorpay.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_id: orderId,
            })

            dispatch(addToast({ type: 'success', title: 'Payment successful!' }))
            onSuccess()
          } catch {
            throw new Error('Payment verification failed')
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: phone,
        },
        theme: {
          color: '#6366f1',
        },
      }

      const rzp = new Razorpay(options)
      rzp.open()

    } catch (error: any) {
      dispatch(addToast({ type: 'error', title: error.message || 'Payment failed' }))
      onError(error.message)
    } finally {
      setIsProcessing(false)
    }
  }, [amount, orderId, phone, user, dispatch, onSuccess, onError])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          UPI / Card Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg text-sm">
          <Lock className="w-4 h-4 text-green-500" />
          <span className="text-muted-foreground">Secure payment via Razorpay</span>
        </div>

        <div>
          <Label htmlFor="phone">Phone Number (for payment links)</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="Enter 10-digit phone number"
            value={phone}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Payment link will be sent to this number
          </p>
        </div>

        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <span className="font-medium">Amount to Pay</span>
          <span className="text-xl font-bold">₹{amount.toFixed(2)}</span>
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={handlePayment}
          disabled={isProcessing || !phone}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Pay with Razorpay
            </>
          )}
        </Button>

        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Lock className="w-3 h-3" />
            <span>Secure</span>
          </div>
          <div className="flex items-center gap-1">
            <Check className="w-3 h-3" />
            <span>Encrypted</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
