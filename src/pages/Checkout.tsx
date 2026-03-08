import { useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CreditCard, Lock, Check, Truck, MapPin, Mail, Phone, User, ChevronRight, Smartphone, Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Label } from '../components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { mockProducts } from '../data/mockData'
import { formatPrice } from '../lib/utils'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { addToast } from '../store/slices/uiSlice'

declare global {
  interface Window {
    Razorpay: any
  }
}

// Step indicator component
function StepIndicator({ step }: { step: number }) {
  const steps = [
    { label: 'Shipping', icon: Truck },
    { label: 'Payment', icon: CreditCard },
    { label: 'Confirm', icon: Check },
  ]

  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${i + 1 <= step
                ? 'bg-primary text-white shadow-premium'
                : 'bg-gray-100 text-gray-400'
              }`}>
              {i + 1 < step ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
            </div>
            <span className={`text-xs font-medium ${i + 1 <= step ? 'text-primary' : 'text-gray-400'}`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-16 sm:w-24 h-0.5 mx-2 mb-6 rounded-full transition-all duration-300 ${i + 1 < step ? 'bg-primary' : 'bg-gray-200'
              }`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function Checkout() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)
  const [step, setStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'card'>('razorpay')
  const [phone, setPhone] = useState('')

  const [formData, setFormData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  })

  const items = mockProducts.slice(0, 2).map((p, i) => ({
    id: `cart-${i}`,
    product: p,
    quantity: i === 0 ? 2 : 1,
  }))

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const shipping = subtotal > 50 ? 0 : 9.99
  const tax = subtotal * 0.08
  const total = subtotal + shipping + tax

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const loadRazorpay = useCallback(() => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(window.Razorpay)
        return
      }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(window.Razorpay)
      document.body.appendChild(script)
    })
  }, [])

  const handleRazorpayPayment = async () => {
    if (!phone) {
      dispatch(addToast({ type: 'error', title: 'Please enter your phone number' }))
      return
    }

    setIsProcessing(true)

    try {
      const razorpayOrderId = 'order_' + Math.random().toString(36).substring(7)
      await loadRazorpay()

      setTimeout(() => {
        setIsProcessing(false)
        setOrderId('ORD-2024-' + Math.random().toString(36).substring(7).toUpperCase())
        setOrderPlaced(true)
        dispatch(addToast({ type: 'success', title: 'Payment successful!' }))
      }, 2000)

    } catch (error) {
      setIsProcessing(false)
      dispatch(addToast({ type: 'error', title: 'Payment failed. Please try again.' }))
    }
  }

  const handleCardPayment = async () => {
    setIsProcessing(true)

    setTimeout(() => {
      setIsProcessing(false)
      setOrderId('ORD-2024-' + Math.random().toString(36).substring(7).toUpperCase())
      setOrderPlaced(true)
      dispatch(addToast({ type: 'success', title: 'Payment successful!' }))
    }, 2000)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (paymentMethod === 'razorpay') {
      handleRazorpayPayment()
    } else {
      handleCardPayment()
    }
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg"
          >
            <Check className="w-12 h-12 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold mb-3 text-gray-900">Order Placed Successfully!</h2>
          <p className="text-gray-500 mb-6">Thank you for your purchase. We'll send you tracking details soon.</p>
          <div className="bg-gray-50 rounded-xl p-4 mb-8 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Order ID</p>
            <p className="font-mono font-semibold text-gray-900">{orderId}</p>
          </div>
          <div className="space-y-3">
            <Button className="w-full btn-premium" size="lg" onClick={() => navigate(`/orders/${orderId}`)}>
              View Order Details
            </Button>
            <Button variant="outline" className="w-full" size="lg" onClick={() => navigate('/')}>
              Continue Shopping
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-16 sm:pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 via-white to-amber-50/50 py-6 sm:py-10 border-b border-gray-100">
        <div className="app-container">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Checkout</h1>
          <p className="text-gray-500 text-sm sm:text-base">Complete your order securely</p>
        </div>
      </div>

      <div className="app-container py-6 sm:py-8">
        <StepIndicator step={step} />

        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Contact Information */}
              <Card className="card-premium">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2.5 text-gray-900 text-base sm:text-lg">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                    </div>
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="form-group">
                      <label>First Name</label>
                      <Input
                        name="firstName"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        icon={<User className="w-4 h-4" />}
                        className="bg-gray-50/50"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <Input
                        name="lastName"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="bg-gray-50/50"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <Input
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      icon={<Mail className="w-4 h-4" />}
                      className="bg-gray-50/50"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <Input
                      name="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={handleInputChange}
                      icon={<Phone className="w-4 h-4" />}
                      className="bg-gray-50/50"
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card className="card-premium">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2.5 text-gray-900 text-base sm:text-lg">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                      <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                    </div>
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="form-group">
                    <label>Street Address</label>
                    <Input
                      name="address"
                      placeholder="123 Main Street, Apt 4B"
                      value={formData.address}
                      onChange={handleInputChange}
                      icon={<MapPin className="w-4 h-4" />}
                      className="bg-gray-50/50"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="form-group">
                      <label>City</label>
                      <Input
                        name="city"
                        placeholder="Mumbai"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="bg-gray-50/50"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>State</label>
                      <Input
                        name="state"
                        placeholder="Maharashtra"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="bg-gray-50/50"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="form-group">
                      <label>Postal Code</label>
                      <Input
                        name="postalCode"
                        placeholder="400001"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        className="bg-gray-50/50"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Country</label>
                      <Input
                        name="country"
                        placeholder="India"
                        value={formData.country}
                        onChange={handleInputChange}
                        className="bg-gray-50/50"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card className="card-premium">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2.5 text-gray-900 text-base sm:text-lg">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                      <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                    </div>
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'razorpay' | 'card')}>
                    <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-xl">
                      <TabsTrigger value="razorpay" className="flex items-center gap-1.5 sm:gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm">
                        <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">UPI / Wallets</span>
                        <span className="xs:hidden">UPI</span>
                      </TabsTrigger>
                      <TabsTrigger value="card" className="flex items-center gap-1.5 sm:gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm">
                        <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Card
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="razorpay" className="mt-5">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2.5 p-3.5 bg-green-50 rounded-xl text-sm border border-green-100">
                          <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
                          <span className="text-green-700">Secure payment via Razorpay</span>
                        </div>

                        <div className="form-group">
                          <label>Phone Number</label>
                          <Input
                            type="tel"
                            placeholder="Enter 10-digit phone number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            icon={<Phone className="w-4 h-4" />}
                            className="bg-gray-50/50"
                          />
                          <p className="text-xs text-gray-400 mt-1.5">
                            Payment link will be sent to this number
                          </p>
                        </div>

                        <div className="flex items-center justify-center gap-6 py-5 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                          <div className="text-center">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/UPI_Logo.svg" alt="UPI" className="h-8 mx-auto mb-2" />
                            <span className="text-xs text-gray-500">UPI</span>
                          </div>
                          <div className="text-center">
                            <img src="https://razorpay.com/assets/razorpay-glyph.svg" alt="Razorpay" className="h-8 mx-auto mb-2" />
                            <span className="text-xs text-gray-500">Pay Later</span>
                          </div>
                          <div className="text-center">
                            <CreditCard className="h-8 mx-auto mb-2 text-gray-400" />
                            <span className="text-xs text-gray-500">Cards</span>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="card" className="mt-5">
                      <div className="space-y-4">
                        <div className="p-5 bg-gray-50/80 rounded-xl border border-gray-100">
                          <div className="flex items-center gap-3 mb-5">
                            <CreditCard className="w-5 h-5 text-gray-600" />
                            <span className="font-medium text-gray-900">Credit/Debit Card</span>
                            <div className="ml-auto flex gap-1.5">
                              <Badge variant="secondary" className="text-xs">Visa</Badge>
                              <Badge variant="secondary" className="text-xs">Mastercard</Badge>
                              <Badge variant="secondary" className="text-xs">RuPay</Badge>
                            </div>
                          </div>
                          <div className="space-y-3.5">
                            <div className="form-group">
                              <label>Card Number</label>
                              <Input placeholder="1234 5678 9012 3456" icon={<CreditCard className="w-4 h-4" />} className="bg-white" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="form-group">
                                <label>Expiry</label>
                                <Input placeholder="MM/YY" className="bg-white" />
                              </div>
                              <div className="form-group">
                                <label>CVC</label>
                                <Input placeholder="123" icon={<Lock className="w-4 h-4" />} className="bg-white" />
                              </div>
                            </div>
                            <div className="form-group">
                              <label>Name on Card</label>
                              <Input placeholder="John Doe" icon={<User className="w-4 h-4" />} className="bg-white" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="flex items-center gap-2 mt-5 text-sm text-gray-500">
                    <Lock className="w-4 h-4" />
                    Your payment information is encrypted and secure
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>

          {/* Order Summary Sidebar */}
          <div>
            <Card className="card-premium sticky top-24">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-gray-900 text-base sm:text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-2 sm:gap-3">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-1 text-gray-900">{item.product.name}</p>
                      <p className="text-xs sm:text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-gray-900 shrink-0 text-sm sm:text-base">{formatPrice(item.product.price * item.quantity)}</p>
                  </div>
                ))}

                <div className="border-t pt-4 space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-gray-900">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-gray-500">
                      <Truck className="w-4 h-4" />
                      Shipping
                    </span>
                    <span className={shipping === 0 ? 'text-green-600 font-medium' : 'text-gray-900'}>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tax</span>
                    <span className="text-gray-900">{formatPrice(tax)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-3 border-t">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">{formatPrice(total)}</span>
                  </div>
                </div>

                <Button
                  className="w-full btn-premium"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Pay {formatPrice(total)}
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-gray-400 leading-relaxed">
                  By placing this order, you agree to our{' '}
                  <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}


