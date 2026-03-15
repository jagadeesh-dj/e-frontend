import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, Check, X, ShieldCheck, CreditCard, Smartphone, Building, AlertCircle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { formatPrice } from '../lib/utils'
import { useAppDispatch } from '../store/hooks'
import { addToast } from '../store/slices/uiSlice'
import { clearCart } from '../store/slices/cartSlice'
import api from '../services/api'

declare global {
  interface Window {
    Razorpay: any
  }
}

interface PaymentDetails {
  payment_id: number
  gateway_order_id: string
  amount: number
  currency: string
  key_id: string
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone: string
  is_test_mode: boolean
}

export default function PaymentCheckout() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { orderId } = useParams<{ orderId: string }>()
  const [searchParams] = useSearchParams()
  
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentFailed, setPaymentFailed] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const loadRazorpay = useCallback(() => {
    return new Promise<void>((resolve) => {
      if (window.Razorpay) { 
        resolve()
        return 
      }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve()
      script.onerror = () => {
        dispatch(addToast({ type: 'error', title: 'Failed to load payment gateway' }))
      }
      document.body.appendChild(script)
    })
  }, [dispatch])

  useEffect(() => {
    const initPayment = async () => {
      if (!orderId) {
        dispatch(addToast({ type: 'error', title: 'Invalid order ID' }))
        navigate('/')
        return
      }

      try {
        setLoading(true)
        const response = await api.post<{ success: boolean; data: PaymentDetails }>('/payments/initiate', {
          order_id: parseInt(orderId, 10),
          gateway: 'razorpay'
        })
        
        const data = response.data.data
        setPaymentDetails(data)
        
        // Auto-open Razorpay modal
        await openRazorpay(data)
      } catch (error: any) {
        console.error('Payment initiation error:', error)
        dispatch(addToast({ 
          type: 'error', 
          title: 'Failed to initiate payment',
          message: error?.response?.data?.message || 'Please try again'
        }))
        setPaymentFailed(true)
        setErrorMessage(error?.response?.data?.message || 'Failed to initiate payment')
      } finally {
        setLoading(false)
      }
    }

    initPayment()
  }, [orderId, dispatch, navigate])

  useEffect(() => {
    // Cleanup any Razorpay modal if it's still in the DOM when unmounting
    return () => {
      const rzpModal = document.querySelector('.razorpay-container')
      if (rzpModal) {
        rzpModal.remove()
      }
    }
  }, [])

  const openRazorpay = async (data: PaymentDetails) => {
    try {
      await loadRazorpay()
      
      // In test mode with mock credentials, show a test payment dialog
      if (data.is_test_mode) {
        const useTestPayment = window.confirm(
          'TEST MODE: No real payment will be processed.\n\nClick OK to simulate a successful payment, or Cancel to simulate a failed payment.'
        )
        
        if (useTestPayment) {
          // Simulate successful test payment
          await handlePaymentSuccess({
            razorpay_payment_id: `pay_test_${Date.now()}`,
            razorpay_order_id: data.gateway_order_id,
            razorpay_signature: 'test_signature_for_demo_purposes_only'
          }, data)
        } else {
          // Simulate failed payment
          setPaymentFailed(true)
          setErrorMessage('Payment failed: User cancelled test payment')
        }
        return
      }
      
      let rzp: any

      const options = {
        key: data.key_id,
        amount: Math.round(data.amount * 100), // Amount in paise
        currency: data.currency,
        name: 'E-Commerce Store',
        description: `Order #${data.order_number}`,
        order_id: data.gateway_order_id,
        handler: (response: any) => {
          // Explicitly close the modal before proceeding with verification
          if (rzp && typeof rzp.close === 'function') {
            try { rzp.close() } catch (e) { console.warn('Error closing rzp:', e) }
          }
          handlePaymentSuccess(response, data)
        },
        prefill: {
          name: data.customer_name || '',
          email: data.customer_email || '',
          contact: data.customer_phone || '',
        },
        theme: {
          color: '#d97706', // Amber-600
        },
        modal: {
          ondismiss: () => {
            dispatch(addToast({ type: 'info', title: 'Payment cancelled' }))
            setPaymentFailed(true)
            setErrorMessage('Payment was cancelled by the user. You can try again or return to cart.')
          }
        }
      }

      rzp = new window.Razorpay(options)
      rzp.open()
    } catch (error: any) {
      console.error('Razorpay error:', error)
      dispatch(addToast({ type: 'error', title: 'Payment gateway error' }))
      setPaymentFailed(true)
      setErrorMessage('Failed to open payment gateway')
    }
  }

  const handlePaymentSuccess = async (response: any, data: PaymentDetails) => {
    try {
      setProcessing(true)

      await api.post('/payments/verify', {
        order_id: parseInt(orderId!, 10),
        gateway: 'razorpay',
        gateway_payment_id: response.razorpay_payment_id,
        gateway_order_id: response.razorpay_order_id,
        signature: response.razorpay_signature,
      })

      // Clear cart only after successful payment
      dispatch(clearCart())
      
      setPaymentSuccess(true)
      dispatch(addToast({ type: 'success', title: 'Payment successful!' }))

      // Redirect to order success page after 1 second
      const targetPath = data.order_number ? `/orders/${data.order_number}` : '/orders'
      setTimeout(() => {
        navigate(targetPath)
      }, 1000)
    } catch (error: any) {
      console.error('Payment verification error:', error)
      dispatch(addToast({
        type: 'error',
        title: 'Payment verification failed',
        message: 'Your payment may have been processed. Please check your order status.'
      }))
      setPaymentFailed(true)
      setErrorMessage(error?.response?.data?.message || 'Payment verification failed')
    } finally {
      setProcessing(false)
    }
  }

  const handleRetryPayment = () => {
    setPaymentFailed(false)
    setPaymentSuccess(false)
    if (paymentDetails) {
      openRazorpay(paymentDetails)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-white">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto text-primary mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Loading Payment...</h2>
          <p className="text-gray-500 mt-2">Please wait while we prepare your payment</p>
        </div>
      </div>
    )
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md w-full"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
          >
            <Check className="w-12 h-12 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold mb-3 text-gray-900">Payment Successful!</h2>
          <p className="text-gray-500 mb-6">
            Your payment has been processed successfully. Redirecting to your order...
          </p>
          {paymentDetails && (
            <Card className="bg-white border-green-200">
              <CardContent className="pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Order Number</span>
                    <span className="font-mono font-medium">#{paymentDetails.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount Paid</span>
                    <span className="font-bold text-green-600">{formatPrice(paymentDetails.amount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          <div className="mt-6">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-green-600" />
          </div>
        </motion.div>
      </div>
    )
  }

  if (paymentFailed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md w-full"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-24 h-24 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
          >
            <X className="w-12 h-12 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold mb-3 text-gray-900">Payment Failed</h2>
          <p className="text-gray-500 mb-4">{errorMessage}</p>

          <Card className="bg-white border-red-200 mb-6">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3 text-left">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-gray-900 mb-1">Don't worry!</p>
                  <p>Your order has not been charged. Your cart items are saved. You can safely retry the payment.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button 
              className="w-full btn-premium" 
              size="lg"
              onClick={handleRetryPayment}
            >
              Retry Payment
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              size="lg"
              onClick={() => navigate('/cart')}
            >
              Return to Cart
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="card-premium">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Secure Payment</CardTitle>
              <p className="text-gray-500">Complete your payment securely</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {paymentDetails && (
                <>
                  {/* Order Summary */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Order Number</span>
                      <span className="font-mono font-medium">#{paymentDetails.order_number}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Amount</span>
                      <span className="text-2xl font-bold text-gray-900">{formatPrice(paymentDetails.amount)}</span>
                    </div>
                    {paymentDetails.is_test_mode && (
                      <Badge className="bg-blue-100 text-blue-700 w-fit">
                        Test Mode - No real payment will be processed
                      </Badge>
                    )}
                  </div>

                  {/* Payment Methods */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900">Payment Methods</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col items-center p-3 border rounded-lg bg-white">
                        <Smartphone className="w-6 h-6 text-gray-600 mb-1" />
                        <span className="text-xs text-gray-500">UPI</span>
                      </div>
                      <div className="flex flex-col items-center p-3 border rounded-lg bg-white">
                        <CreditCard className="w-6 h-6 text-gray-600 mb-1" />
                        <span className="text-xs text-gray-500">Cards</span>
                      </div>
                      <div className="flex flex-col items-center p-3 border rounded-lg bg-white">
                        <Building className="w-6 h-6 text-gray-600 mb-1" />
                        <span className="text-xs text-gray-500">Netbanking</span>
                      </div>
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-sm text-green-700">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Your payment is secured with 256-bit SSL encryption</span>
                  </div>

                  {/* Retry Button */}
                  {processing && (
                    <Button className="w-full btn-premium" size="lg" disabled>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </Button>
                  )}
                </>
              )}

              <p className="text-xs text-center text-gray-500">
                By proceeding, you agree to our Terms of Service and Privacy Policy
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
