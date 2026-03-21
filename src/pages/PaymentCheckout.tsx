import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Check, X, ShieldCheck, CreditCard, Smartphone, Building, AlertCircle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { formatPrice, cn } from '../lib/utils'
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
        
        await openRazorpay(data)
      } catch (error: any) {
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
      
      if (data.is_test_mode) {
        const useTestPayment = window.confirm(
          'TEST MODE: No real payment will be processed.\n\nClick OK to simulate a successful payment, or Cancel to simulate a failed payment.'
        )
        
        if (useTestPayment) {
          await handlePaymentSuccess({
            razorpay_payment_id: `pay_test_${Date.now()}`,
            razorpay_order_id: data.gateway_order_id,
            razorpay_signature: 'test_signature_for_demo_purposes_only'
          }, data)
        } else {
          setPaymentFailed(true)
          setErrorMessage('Payment failed: User cancelled test payment')
        }
        return
      }
      
      let rzp: any

      const options = {
        key: data.key_id,
        amount: Math.round(data.amount * 100),
        currency: data.currency,
        name: 'The Boutique',
        description: `Order #${data.order_number}`,
        order_id: data.gateway_order_id,
        handler: (response: any) => {
          if (rzp && typeof rzp.close === 'function') {
            try { rzp.close() } catch (e) { }
          }
          handlePaymentSuccess(response, data)
        },
        prefill: {
          name: data.customer_name || '',
          email: data.customer_email || '',
          contact: data.customer_phone || '',
        },
        theme: {
          color: '#0f172a', // Use dark slate to match our buttons
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

      dispatch(clearCart())
      
      setPaymentSuccess(true)
      dispatch(addToast({ type: 'success', title: 'Payment successful!' }))

      const targetPath = data.order_number ? `/orders/${data.order_number}` : '/orders'
      setTimeout(() => {
        navigate(targetPath)
      }, 1500)
    } catch (error: any) {
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
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f6]">
        <div className="text-center font-serif text-2xl text-amber-900/50 animate-pulse">
          Initializing Secure Terminal...
        </div>
      </div>
    )
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f6]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-lg w-full p-12 bg-white border border-gray-200/50"
        >
          <div className="w-20 h-20 border border-green-200 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
             <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="font-serif text-3xl text-gray-900 mb-4">Transaction Approved</h2>
          <p className="font-light text-gray-500 mb-10 leading-relaxed">
            Your payment has been successfully secured. We are now preparing your order for dispatch.
          </p>

          {paymentDetails && (
            <div className="border border-gray-100 p-6 mb-10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold">Order ID</span>
                <span className="font-medium text-gray-900">#{paymentDetails.order_number}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold">Amount Secured</span>
                <span className="font-serif text-xl text-gray-900">{formatPrice(paymentDetails.amount)}</span>
              </div>
            </div>
          )}
          
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-amber-700" />
        </motion.div>
      </div>
    )
  }

  if (paymentFailed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f6] px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-lg w-full bg-white border border-gray-200/50 p-10 lg:p-14"
        >
          <div className="w-20 h-20 border border-red-200 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="font-serif text-3xl text-gray-900 mb-4">Transaction Declined</h2>
          <p className="font-light text-gray-500 mb-8">{errorMessage}</p>

          <div className="flex items-start gap-4 p-6 bg-gray-50 border border-gray-100 mb-10 text-left">
            <AlertCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-serif text-lg text-gray-900 mb-2">Rest Assured</p>
              <p className="text-sm font-light text-gray-500 leading-relaxed">
                Your account has not been charged, and your curated selection remains in your bag. You may attempt the transaction again.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Button 
              className="w-full h-14 bg-gray-900 hover:bg-amber-900 text-white uppercase text-xs tracking-[0.2em] rounded-none transition-colors"
              onClick={handleRetryPayment}
            >
              Attempt Again
            </Button>
            <Button 
              className="w-full h-14 border border-gray-200 text-gray-500 hover:bg-gray-50 uppercase text-xs tracking-[0.2em] rounded-none transition-colors bg-transparent"
              onClick={() => navigate('/cart')}
            >
              Return to Bag
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl bg-white border border-gray-200/50 p-8 sm:p-12"
      >
        <div className="text-center mb-10">
          <ShieldCheck className="w-10 h-10 text-amber-900 mx-auto mb-6" />
          <h2 className="font-serif text-3xl text-gray-900 mb-2">Secure Terminal</h2>
          <p className="font-light text-gray-500">Awaiting your authorization</p>
        </div>

        {paymentDetails && (
          <div className="space-y-8">
            {/* Financial Details */}
            <div className="border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold">Order ID</span>
                <span className="font-medium text-gray-900">#{paymentDetails.order_number}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold">Payable</span>
                <span className="font-serif text-2xl text-gray-900">{formatPrice(paymentDetails.amount)}</span>
              </div>
            </div>

            {paymentDetails.is_test_mode && (
              <div className="bg-blue-50 text-blue-700 text-xs px-4 py-3 text-center border border-blue-100 font-medium tracking-widest uppercase">
                Testing Environment Active
              </div>
            )}

            {/* Methods Note */}
            <div className="grid grid-cols-3 gap-4 pb-8 border-b border-gray-100">
               <div className="flex flex-col items-center">
                 <Smartphone className="w-6 h-6 text-gray-300 mb-2" />
                 <span className="text-[10px] uppercase tracking-widest text-gray-500">UPI</span>
               </div>
               <div className="flex flex-col items-center">
                 <CreditCard className="w-6 h-6 text-gray-300 mb-2" />
                 <span className="text-[10px] uppercase tracking-widest text-gray-500">Cards</span>
               </div>
               <div className="flex flex-col items-center">
                 <Building className="w-6 h-6 text-gray-300 mb-2" />
                 <span className="text-[10px] uppercase tracking-widest text-gray-500">Banking</span>
               </div>
            </div>

            {processing && (
              <div className="text-center text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-4 text-amber-700" />
                <span className="text-sm font-light">Processing securely...</span>
              </div>
            )}

            {!processing && (
              <p className="text-[10px] uppercase tracking-widest text-center text-green-700 font-semibold flex items-center justify-center gap-2">
                 <ShieldCheck className="w-3 h-3" />
                 Protected by 256-Bit SSL Encryption
              </p>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}
