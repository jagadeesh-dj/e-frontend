import { useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CreditCard, Lock, Check, Truck, MapPin, Mail, Phone, User, ChevronRight, Smartphone, Loader2 } from 'lucide-react'
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
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Check className="w-12 h-12 text-green-600" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900">Order Placed Successfully!</h2>
          <p className="text-gray-500 mb-4">Thank you for your purchase.</p>
          <p className="font-mono bg-gray-100 p-3 rounded-xl mb-6 text-gray-900">{orderId}</p>
          <div className="space-y-3">
            <Button className="w-full btn-premium" onClick={() => navigate(`/orders/${orderId}`)}>
              View Order Details
            </Button>
            <Button variant="outline" className="w-full border-gray-300" onClick={() => navigate('/')}>
              Continue Shopping
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      <div className="bg-gradient-to-r from-amber-50 to-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8 text-sm">
          <span className={step >= 1 ? 'text-primary font-medium' : 'text-gray-400'}>Shipping</span>
          <ChevronRight className="w-4 h-4 text-gray-300" />
          <span className={step >= 2 ? 'text-primary font-medium' : 'text-gray-400'}>Payment</span>
          <ChevronRight className="w-4 h-4 text-gray-300" />
          <span className={step >= 3 ? 'text-primary font-medium' : 'text-gray-400'}>Confirmation</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              <Card className="card-premium mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <User className="w-5 h-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      name="firstName"
                      placeholder="First name"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="bg-gray-50 border-gray-200"
                      required
                    />
                    <Input
                      name="lastName"
                      placeholder="Last name"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="bg-gray-50 border-gray-200"
                      required
                    />
                  </div>
                  <Input
                    name="email"
                    type="email"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="bg-gray-50 border-gray-200"
                    required
                  />
                  <Input
                    name="phone"
                    type="tel"
                    placeholder="Phone number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="bg-gray-50 border-gray-200"
                    required
                  />
                </CardContent>
              </Card>

              <Card className="card-premium mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <MapPin className="w-5 h-5" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    name="address"
                    placeholder="Street address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="bg-gray-50 border-gray-200"
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      name="city"
                      placeholder="City"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="bg-gray-50 border-gray-200"
                      required
                    />
                    <Input
                      name="state"
                      placeholder="State"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="bg-gray-50 border-gray-200"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      name="postalCode"
                      placeholder="Postal code"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className="bg-gray-50 border-gray-200"
                      required
                    />
                    <Input
                      name="country"
                      placeholder="Country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="bg-gray-50 border-gray-200"
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="card-premium mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <CreditCard className="w-5 h-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'razorpay' | 'card')}>
                    <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                      <TabsTrigger value="razorpay" className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        UPI / Wallets
                      </TabsTrigger>
                      <TabsTrigger value="card" className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Card
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="razorpay" className="mt-4">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-sm border border-green-100">
                          <Lock className="w-4 h-4 text-green-600" />
                          <span className="text-green-700">Secure payment via Razorpay</span>
                        </div>
                        
                        <div>
                          <Label htmlFor="phone" className="text-gray-700">Phone Number</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="Enter 10-digit phone number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="bg-gray-50 border-gray-200 mt-1"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Payment link will be sent to this number
                          </p>
                        </div>

                        <div className="flex items-center justify-center gap-4 py-4 border-2 border-dashed border-gray-200 rounded-xl">
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

                    <TabsContent value="card" className="mt-4">
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                          <div className="flex items-center gap-3 mb-4">
                            <CreditCard className="w-5 h-5 text-gray-600" />
                            <span className="font-medium text-gray-900">Credit/Debit Card</span>
                            <div className="ml-auto flex gap-1">
                              <Badge variant="secondary">Visa</Badge>
                              <Badge variant="secondary">Mastercard</Badge>
                              <Badge variant="secondary">RuPay</Badge>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <Input placeholder="Card number" className="bg-white border-gray-200" />
                            <div className="grid grid-cols-2 gap-4">
                              <Input placeholder="MM/YY" className="bg-white border-gray-200" />
                              <Input placeholder="CVC" className="bg-white border-gray-200" />
                            </div>
                            <Input placeholder="Name on card" className="bg-white border-gray-200" />
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
                    <Lock className="w-4 h-4" />
                    Your payment information is secure
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>

          <div>
            <Card className="card-premium sticky top-24">
              <CardHeader>
                <CardTitle className="text-gray-900">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                      <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm line-clamp-1 text-gray-900">{item.product.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-gray-900">{formatPrice(item.product.price * item.quantity)}</p>
                  </div>
                ))}

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-gray-900">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1 text-gray-500">
                      <Truck className="w-4 h-4" />
                      Shipping
                    </span>
                    <span className="text-gray-900">{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tax</span>
                    <span className="text-gray-900">{formatPrice(tax)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
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
                    <>Pay {formatPrice(total)}</>
                  )}
                </Button>

                <p className="text-xs text-center text-gray-500">
                  By placing this order, you agree to our Terms of Service
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
