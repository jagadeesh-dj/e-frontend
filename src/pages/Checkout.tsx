import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CreditCard, Lock, Check, Truck, MapPin, Mail, Phone, User, Smartphone, Loader2, ShieldCheck, Plus, Tag, X, ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { formatPrice, cn } from '../lib/utils'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { addToast } from '../store/slices/uiSlice'
import { fetchAddresses } from '../store/slices/authSlice'
import { createOrder } from '../store/slices/orderSlice'
import { fetchCart, clearCart, validateCoupon, removeCoupon } from '../store/slices/cartSlice'
import { Address } from '../types'
import api from '../services/api'

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
      // Error handled in slice
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
      const order = await dispatch(createOrder({
        address_id: selectedAddressId,
        payment_method: paymentMethod,
      })).unwrap()

      if (!order || !order.id) {
        throw new Error('Failed to create order')
      }

      if (paymentMethod === 'razorpay') {
        navigate(`/payment/${order.id}`)
      } else {
        dispatch(clearCart())
        navigate(`/orders/${(order as any).order_number || order.id}`)
      }
    } catch (err: any) {
      const msg = err?.message || err?.error || 'Failed to place order'
      if (!msg.includes('cancelled')) {
        dispatch(addToast({ type: 'error', title: msg }))
      }
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] pb-24 border-t border-gray-200/50">
      
      {/* Header */}
      <div className="max-w-[1400px] mx-auto px-6 py-10 lg:py-16">
        <Link to="/cart" className="inline-flex items-center text-[10px] uppercase tracking-[0.2em] text-gray-500 hover:text-amber-700 transition-colors mb-6">
          <ArrowLeft className="w-3 h-3 mr-2" />Back to Cart
        </Link>
        <h1 className="font-serif text-4xl lg:text-5xl text-gray-900">Checkout</h1>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 grid lg:grid-cols-12 gap-12 lg:gap-24">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-7 space-y-16">
          
          {/* Section 1: Address */}
          <section>
            <div className="flex items-center justify-between mb-8 border-b border-gray-200/50 pb-4">
               <h2 className="font-serif text-2xl text-gray-900">1. Shipping Address</h2>
               {!showNewAddress && (
                 <button onClick={() => setShowNewAddress(true)} className="text-[10px] uppercase tracking-[0.2em] text-amber-700 font-semibold flex items-center gap-1 hover:text-amber-900 transition-colors">
                   <Plus className="w-3 h-3" /> New Address
                 </button>
               )}
            </div>

            <div className="space-y-4">
              {addresses.length === 0 && !showNewAddress && (
                <p className="text-sm font-light text-gray-500 italic">No saved addresses. Please add a shipping address.</p>
              )}

              {addresses.map((addr) => (
                <div
                  key={addr.id || addr.uid}
                  onClick={() => setSelectedAddressId(addr.id || null)}
                  className={cn(
                    "p-6 border cursor-pointer transition-all",
                    selectedAddressId === addr.id ? 'border-amber-700 bg-white shadow-md' : 'border-gray-200 hover:border-gray-300 bg-transparent'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm mb-1">{addr.first_name} {addr.last_name}</p>
                      <p className="text-sm font-light text-gray-600 leading-relaxed">
                        {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}<br />
                        {addr.city}, {addr.state} — {addr.postal_code}
                      </p>
                      <p className="text-sm font-light text-gray-500 mt-2">{addr.phone}</p>
                    </div>
                    {selectedAddressId === addr.id && (
                      <div className="text-gray-900">
                        <Check className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Add New Address Form */}
              <AnimatePresence>
                {showNewAddress && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border border-gray-200 bg-white p-8 space-y-6 overflow-hidden"
                  >
                    <h3 className="font-serif text-xl border-b border-gray-100 pb-3">New Address</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500">First Name</label>
                        <Input value={newAddress.first_name} onChange={(e) => setNewAddress(p => ({ ...p, first_name: e.target.value }))} className="border-0 border-b border-gray-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-amber-700 uppercase text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500">Last Name</label>
                        <Input value={newAddress.last_name} onChange={(e) => setNewAddress(p => ({ ...p, last_name: e.target.value }))} className="border-0 border-b border-gray-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-gray-900 uppercase text-sm" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-500">Phone</label>
                      <Input value={newAddress.phone} onChange={(e) => setNewAddress(p => ({ ...p, phone: e.target.value }))} className="border-0 border-b border-gray-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-gray-900 uppercase text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-500">Address Line 1</label>
                      <Input value={newAddress.address_line1} onChange={(e) => setNewAddress(p => ({ ...p, address_line1: e.target.value }))} className="border-0 border-b border-gray-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-gray-900 uppercase text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-500">Address Line 2 <span className="text-gray-400 lowercase italic tracking-normal">(Optional)</span></label>
                      <Input value={newAddress.address_line2} onChange={(e) => setNewAddress(p => ({ ...p, address_line2: e.target.value }))} className="border-0 border-b border-gray-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-gray-900 uppercase text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500">City</label>
                        <Input value={newAddress.city} onChange={(e) => setNewAddress(p => ({ ...p, city: e.target.value }))} className="border-0 border-b border-gray-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-gray-900 uppercase text-sm" />
                       </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500">State / Province</label>
                        <Input value={newAddress.state} onChange={(e) => setNewAddress(p => ({ ...p, state: e.target.value }))} className="border-0 border-b border-gray-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-gray-900 uppercase text-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500">Postal Code</label>
                        <Input value={newAddress.postal_code} onChange={(e) => setNewAddress(p => ({ ...p, postal_code: e.target.value }))} className="border-0 border-b border-gray-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-gray-900 uppercase text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500">Country</label>
                        <Input value={newAddress.country} onChange={(e) => setNewAddress(p => ({ ...p, country: e.target.value }))} className="border-0 border-b border-gray-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-gray-900 uppercase text-sm" />
                      </div>
                    </div>
                    <div className="flex gap-4 pt-4">
                      <Button className="flex-1 h-12 bg-amber-700 hover:bg-amber-800 text-white rounded-none uppercase text-xs tracking-[0.2em] transition-colors" onClick={handleSaveNewAddress}>Save Address</Button>
                      <Button variant="outline" className="h-12 border-gray-200 text-gray-500 hover:bg-gray-50 rounded-none uppercase text-xs tracking-widest" onClick={() => setShowNewAddress(false)}>Cancel</Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Section 2: Payment */}
          <section>
            <div className="mb-8 border-b border-gray-200/50 pb-4">
               <h2 className="font-serif text-2xl text-gray-900">2. Payment Method</h2>
            </div>

            <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'razorpay' | 'cod')}>
              <TabsList className="grid w-full grid-cols-2 bg-transparent border border-gray-200 p-0 h-14 rounded-none">
                <TabsTrigger value="razorpay" className="h-full rounded-none data-[state=active]:bg-amber-700 data-[state=active]:text-white uppercase text-[10px] tracking-[0.15em] transition-colors">
                  Pay Online
                </TabsTrigger>
                <TabsTrigger value="cod" className="h-full rounded-none data-[state=active]:bg-amber-700 data-[state=active]:text-white uppercase text-[10px] tracking-[0.15em] transition-colors border-l border-gray-200">
                  Cash on Delivery
                </TabsTrigger>
              </TabsList>

              <TabsContent value="razorpay" className="mt-6 border border-gray-200 bg-white p-8">
                <div className="flex items-start gap-4 mb-6">
                  <ShieldCheck className="w-5 h-5 text-amber-700 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-serif text-lg text-gray-900 mb-2">Secure Online Payment</h4>
                    <p className="font-light text-sm text-gray-500 leading-relaxed">
                      You will be redirected to Razorpay's secure payment gateway to complete your purchase using Credit Card, UPI, or Netbanking.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="cod" className="mt-6 border border-gray-200 bg-white p-8">
                <div className="flex items-start gap-4">
                  <Truck className="w-5 h-5 text-gray-900 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-serif text-lg text-gray-900 mb-2">Pay upon arrival</h4>
                    <p className="font-light text-sm text-gray-500 leading-relaxed">
                      Settle your balance with cash when our delivery partner arrives. Available for orders under ₹5,000.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </section>

        </div>


        {/* Right Column: Summary */}
        <div className="lg:col-span-5">
           <div className="bg-white border border-gray-200/50 p-8 sm:p-10 sticky top-24">
              <h2 className="font-serif text-2xl mb-8 border-b border-gray-200/50 pb-4">Order Summary</h2>

              <div className="space-y-6 mb-10 pb-8 border-b border-gray-200/50 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
                {items.map(item => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="w-20 aspect-[3/4] bg-[#f0f0f0] overflow-hidden flex-shrink-0">
                      <img src={item.product?.images?.[0] || '/placeholder.png'} alt={item.product?.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    </div>
                    <div className="flex-1 min-w-0 py-1 flex flex-col">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-serif text-gray-900 line-clamp-1">{item.product?.name}</p>
                        <p className="font-light text-gray-900">{formatPrice((item.unit_price || item.price) * item.quantity)}</p>
                      </div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 mb-8 text-sm font-light text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-gray-900">{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>Coupon Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-gray-900">{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes (Included)</span>
                  <span className="text-gray-900">{formatPrice(tax)}</span>
                </div>
              </div>

              <div className="flex justify-between items-end mb-10 pt-8 border-t border-gray-200/50">
                <span className="font-medium text-gray-900">Total</span>
                <span className="font-serif text-3xl text-gray-900">{formatPrice(total)}</span>
              </div>

              <Button
                  className="w-full h-14 bg-amber-700 text-white rounded-none uppercase text-xs tracking-[0.2em] hover:bg-amber-800 transition-colors group flex items-center justify-center gap-4 disabled:bg-gray-300 disabled:text-gray-500"
                  size="lg"
                  onClick={handlePlaceOrder}
                  disabled={isProcessing || isSubmitting || items.length === 0}
                >
                  {isProcessing || isSubmitting ? (
                    'Processing...'
                  ) : (
                     <>
                        Place Order <Lock className="w-3 h-3" />
                     </>
                  )}
              </Button>
           </div>
        </div>

      </div>
    </div>
  )
}
