import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CreditCard, Lock, Check, Truck, MapPin, Mail, Phone, User, Smartphone, Loader2, ShieldCheck, Plus, Tag, X } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { formatPrice } from '../lib/utils'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { addToast } from '../store/slices/uiSlice'
import { fetchAddresses } from '../store/slices/authSlice'
import { createOrder } from '../store/slices/orderSlice'
import { fetchCart, clearCart, validateCoupon, removeCoupon } from '../store/slices/cartSlice'
import { Address } from '../types'
import api from '../services/api'

declare global {
  interface Window {
    Razorpay: any
  }
}

function StepIndicator({ step }: { step: number }) {
  const steps = [
    { label: 'Address', icon: MapPin },
    { label: 'Payment', icon: CreditCard },
    { label: 'Done', icon: Check },
  ]
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${i + 1 <= step ? 'bg-primary text-white shadow-premium' : 'bg-gray-100 text-gray-400'}`}>
              {i + 1 < step ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
            </div>
            <span className={`text-xs font-medium ${i + 1 <= step ? 'text-primary' : 'text-gray-400'}`}>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-16 sm:w-24 h-0.5 mx-2 mb-6 rounded-full transition-all duration-300 ${i + 1 < step ? 'bg-primary' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function Checkout() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { user, addresses } = useAppSelector((state) => state.auth)
  const { cart, items, appliedCoupon } = useAppSelector((state) => state.cart)
  const { isSubmitting } = useAppSelector((state) => state.orders)

  const [step, setStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [placedOrderNumber, setPlacedOrderNumber] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay')
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [promoCode, setPromoCode] = useState('')
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)

  // New address form state
  const [showNewAddress, setShowNewAddress] = useState(false)
  const [newAddress, setNewAddress] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'IN',
    address_type: 'shipping',
    is_default: false,
  })

  // Auto-select address when addresses are loaded
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find(a => a.is_default) || addresses[0]
      if (defaultAddr?.id) {
        setSelectedAddressId(defaultAddr.id)
      }
    }
  }, [addresses])

  useEffect(() => {
    dispatch(fetchAddresses())
    dispatch(fetchCart())
  }, [dispatch])

  // Calculate totals from real cart data
  const subtotal = cart?.subtotal || items.reduce((sum, item) => sum + ((item.unit_price || item.price) * item.quantity), 0)
  const discount = appliedCoupon ? appliedCoupon.discount_amount : 0
  const shipping = subtotal - discount >= 499 ? 0 : 49
  const tax = Math.round((subtotal - discount) * 0.18 * 100) / 100
  const total = Math.max(subtotal - discount + shipping + tax, 0)

  const handleSaveNewAddress = async () => {
    try {
      const response = await api.post<{ success: boolean; data: Address }>('/users/me/addresses', newAddress)
      const saved = response.data.data
      if (saved?.id) {
        setSelectedAddressId(saved.id)
        dispatch(fetchAddresses())
        setShowNewAddress(false)
        dispatch(addToast({ type: 'success', title: 'Address saved!' }))
      }
    } catch {
      dispatch(addToast({ type: 'error', title: 'Failed to save address' }))
    }
  }

  const handleApplyCoupon = async () => {
    if (!promoCode.trim()) return
    setIsValidatingCoupon(true)
    try {
      await dispatch(validateCoupon({ code: promoCode.trim(), orderAmount: subtotal })).unwrap()
      setPromoCode('')
    } catch {
      // Error already handled in slice
    } finally {
      setIsValidatingCoupon(false)
    }
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      dispatch(addToast({ type: 'error', title: 'Please select a shipping address' }))
      return
    }
    if (!items.length) {
      dispatch(addToast({ type: 'error', title: 'Your cart is empty' }))
      return
    }

    setIsProcessing(true)
    try {
      if (!selectedAddressId) {
        dispatch(addToast({ type: 'error', title: 'Please select a shipping address' }))
        setIsProcessing(false)
        return
      }

      console.log('Creating order with address_id:', selectedAddressId, 'payment_method:', paymentMethod)
      
      const order = await dispatch(createOrder({
        address_id: selectedAddressId,
        payment_method: paymentMethod,
      })).unwrap()
      
      console.log('Order created:', order)

      if (!order || !order.id) {
        dispatch(addToast({ type: 'error', title: 'Failed to create order' }))
        setIsProcessing(false)
        return
      }

      if (paymentMethod === 'razorpay') {
        // 2. Redirect to payment checkout page
        console.log('Redirecting to payment page for order:', order.id)
        // Don't clear cart yet - will clear after successful payment
        navigate(`/payment/${order.id}`)
        return
      } else {
        // COD - order placed directly, clear cart now
        dispatch(clearCart())
        dispatch(addToast({ type: 'success', title: 'Order placed successfully!' }))
        navigate(`/orders/${(order as any).order_number || order.id}`)
        return
      }

    } catch (err: any) {
      console.error('Order creation error:', err)
      const msg = err?.message || err?.error || 'Failed to place order'
      if (!msg.includes('cancelled')) {
        dispatch(addToast({ type: 'error', title: msg }))
      }
      setIsProcessing(false)
    }
  }

  // ─── Order Success Screen ───
  if (orderPlaced) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
            className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
            <Check className="w-12 h-12 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold mb-3 text-gray-900">Order Placed!</h2>
          <p className="text-gray-500 mb-6">Thank you for your purchase. We'll send you tracking info soon.</p>
          <div className="bg-gray-50 rounded-xl p-4 mb-8 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Order Number</p>
            <p className="font-mono font-semibold text-gray-900">#{placedOrderNumber}</p>
          </div>
          <div className="space-y-3">
            <Button className="w-full btn-premium" size="lg" onClick={() => navigate(`/orders/${placedOrderNumber}`)}>
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
      <div className="bg-gradient-to-r from-amber-50 via-white to-amber-50/50 py-6 sm:py-10 border-b border-gray-100">
        <div className="app-container">
          <Link to="/cart" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <X className="w-4 h-4 mr-2" />Cancel Checkout
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Checkout</h1>
          <p className="text-gray-500 text-sm">Complete your order securely</p>
        </div>
      </div>

      <div className="app-container py-6 sm:py-8">
        <StepIndicator step={step} />

        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left: Address + Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <Card className="card-premium">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2.5 text-gray-900 text-base sm:text-lg">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {addresses.length === 0 && !showNewAddress && (
                  <p className="text-sm text-gray-500">No saved addresses. Add one below.</p>
                )}
                {addresses.map((addr) => (
                  <div
                    key={addr.id || addr.uid}
                    onClick={() => setSelectedAddressId(addr.id || null)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAddressId === addr.id ? 'border-primary bg-amber-50/40' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{addr.first_name} {addr.last_name}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}</p>
                        <p className="text-sm text-gray-500">{addr.city}, {addr.state} - {addr.postal_code}</p>
                        <p className="text-sm text-gray-500">{addr.phone}</p>
                      </div>
                      {selectedAddressId === addr.id && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {showNewAddress ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="form-group">
                        <label>First Name</label>
                        <Input value={newAddress.first_name} onChange={(e) => setNewAddress(p => ({ ...p, first_name: e.target.value }))} placeholder="First name" />
                      </div>
                      <div className="form-group">
                        <label>Last Name</label>
                        <Input value={newAddress.last_name} onChange={(e) => setNewAddress(p => ({ ...p, last_name: e.target.value }))} placeholder="Last name" />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Phone</label>
                      <Input value={newAddress.phone} onChange={(e) => setNewAddress(p => ({ ...p, phone: e.target.value }))} placeholder="+91 98765 43210" icon={<Phone className="w-4 h-4" />} />
                    </div>
                    <div className="form-group">
                      <label>Address Line 1</label>
                      <Input value={newAddress.address_line1} onChange={(e) => setNewAddress(p => ({ ...p, address_line1: e.target.value }))} placeholder="House/Flat number, Street" icon={<MapPin className="w-4 h-4" />} />
                    </div>
                    <div className="form-group">
                      <label>Address Line 2 (Optional)</label>
                      <Input value={newAddress.address_line2} onChange={(e) => setNewAddress(p => ({ ...p, address_line2: e.target.value }))} placeholder="Landmark, Area" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="form-group">
                        <label>City</label>
                        <Input value={newAddress.city} onChange={(e) => setNewAddress(p => ({ ...p, city: e.target.value }))} placeholder="Mumbai" />
                      </div>
                      <div className="form-group">
                        <label>State</label>
                        <Input value={newAddress.state} onChange={(e) => setNewAddress(p => ({ ...p, state: e.target.value }))} placeholder="Maharashtra" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="form-group">
                        <label>Postal Code</label>
                        <Input value={newAddress.postal_code} onChange={(e) => setNewAddress(p => ({ ...p, postal_code: e.target.value }))} placeholder="400001" />
                      </div>
                      <div className="form-group">
                        <label>Country</label>
                        <Input value={newAddress.country} onChange={(e) => setNewAddress(p => ({ ...p, country: e.target.value }))} placeholder="IN" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button className="btn-premium" onClick={handleSaveNewAddress}>Save Address</Button>
                      <Button variant="outline" onClick={() => setShowNewAddress(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" className="w-full border-dashed border-gray-300 hover:border-primary" onClick={() => setShowNewAddress(true)}>
                    <Plus className="w-4 h-4 mr-2" />Add New Address
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="card-premium">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2.5 text-gray-900 text-base sm:text-lg">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-primary" />
                  </div>
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'razorpay' | 'cod')}>
                  <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-xl">
                    <TabsTrigger value="razorpay" className="flex items-center gap-1.5 sm:gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm">
                      <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />UPI / Cards
                    </TabsTrigger>
                    <TabsTrigger value="cod" className="flex items-center gap-1.5 sm:gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm">
                      <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />Cash on Delivery
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="razorpay" className="mt-5">
                    <div className="flex items-center gap-2.5 p-3.5 bg-green-50 rounded-xl text-sm border border-green-100">
                      <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
                      <span className="text-green-700">Secure payment via Razorpay — UPI, Cards, Netbanking, Wallets</span>
                    </div>
                    <div className="flex items-center justify-center gap-6 mt-4 py-5 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                      <div className="text-center"><img src="https://upload.wikimedia.org/wikipedia/commons/2/24/UPI_Logo.svg" alt="UPI" className="h-8 mx-auto mb-2" /><span className="text-xs text-gray-500">UPI</span></div>
                      <div className="text-center"><CreditCard className="h-8 w-8 mx-auto mb-2 text-gray-400" /><span className="text-xs text-gray-500">Cards</span></div>
                      <div className="text-center"><Smartphone className="h-8 w-8 mx-auto mb-2 text-gray-400" /><span className="text-xs text-gray-500">Wallets</span></div>
                    </div>
                  </TabsContent>

                  <TabsContent value="cod" className="mt-5">
                    <div className="flex items-center gap-2.5 p-3.5 bg-amber-50 rounded-xl text-sm border border-amber-100">
                      <Truck className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <p className="text-amber-800 font-medium">Cash on Delivery</p>
                        <p className="text-amber-700 text-xs mt-0.5">Pay when your order arrives. Available for orders under ₹5,000.</p>
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
          </div>

          {/* Right: Order Summary */}
          <div>
            <Card className="card-premium sticky top-24">
              <CardHeader className="pb-3">
                <CardTitle className="text-gray-900 text-base sm:text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-3 max-h-56 overflow-y-auto">
                  {items.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">Cart is empty</p>
                  ) : items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                        {item.product?.images?.[0] ? (
                          <img 
                            src={typeof item.product.images[0] === 'string' ? item.product.images[0] : (item.product.images[0] as any).url} 
                            alt={item.product?.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No img</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-1 text-gray-900">{item.product?.name || 'Product'}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-gray-900 shrink-0 text-sm">{formatPrice((item.unit_price || item.price) * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                {/* Coupon */}
                <div className="border-t pt-3">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 text-green-700 rounded-lg border border-green-100">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        <span className="font-medium text-sm">{appliedCoupon.code}</span>
                        <span className="text-xs">(-₹{appliedCoupon.discount_amount.toFixed(2)})</span>
                      </div>
                      <button onClick={() => dispatch(removeCoupon())} className="text-green-600 hover:text-green-800">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input placeholder="Coupon code" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} className="bg-gray-50 border-gray-200 text-sm h-9" />
                      <Button variant="outline" size="sm" onClick={handleApplyCoupon} disabled={isValidatingCoupon} className="shrink-0">
                        {isValidatingCoupon ? <Loader2 className="w-3 h-3 animate-spin" /> : <Tag className="w-3 h-3" />}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Totals */}
                <div className="border-t pt-3 space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-gray-900">{formatPrice(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-gray-500"><Truck className="w-4 h-4" />Shipping</span>
                    <span className={shipping === 0 ? 'text-green-600 font-medium' : 'text-gray-900'}>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                  </div>
                  {shipping > 0 && <p className="text-xs text-gray-400">Free shipping on orders above ₹499</p>}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tax (18% GST)</span>
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
                  onClick={handlePlaceOrder}
                  disabled={isProcessing || isSubmitting || items.length === 0}
                >
                  {isProcessing || isSubmitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                  ) : (
                    <><Lock className="w-4 h-4 mr-2" />Place Order — {formatPrice(total)}</>
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
