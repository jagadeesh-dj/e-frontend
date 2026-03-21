import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Minus, Plus, ShoppingBag, ArrowRight, Tag, Palette } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { formatPrice, cn } from '../lib/utils'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { fetchCart, updateCartItem, removeCartItem, validateCoupon } from '../store/slices/cartSlice'

export default function Cart() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { isAuthenticated } = useAppSelector((state) => state.auth)
  const { cart, items, isLoading, isUpdating } = useAppSelector((state) => state.cart)
  
  const [promoCode, setPromoCode] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null)

  useEffect(() => {
    dispatch(fetchCart())
  }, [dispatch])

  const subtotal = cart?.subtotal || items.reduce((sum, item) => sum + ((item.unit_price || item.price) * item.quantity), 0)
  const discount = appliedPromo ? subtotal * 0.1 : (cart?.discount || 0)
  const shipping = subtotal > 100 ? 0 : (cart?.shipping || 15.00)
  const total = subtotal - discount + shipping

  const updateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 1) return
    await dispatch(updateCartItem({ itemUid: id, quantity: newQuantity }))
  }

  const removeItem = async (id: string) => {
    await dispatch(removeCartItem(id))
  }

  const applyPromo = () => {
    if (promoCode.trim()) {
      dispatch(validateCoupon({ code: promoCode.trim(), orderAmount: subtotal }))
        .unwrap()
        .then(() => {
          setAppliedPromo(promoCode)
          setPromoCode('')
        })
        .catch(() => {})
    }
  }

  const handleCheckout = () => {
    if (isAuthenticated) {
      navigate('/checkout')
    } else {
      navigate('/login')
    }
  }

  if (isLoading && items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f6]">
        <div className="text-center font-serif text-xl sm:text-2xl text-amber-900/50 animate-pulse">
          Loading your cart...
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf9f6] px-4 space-y-8">
        <h2 className="font-serif text-4xl text-gray-900">Your Cart is Empty</h2>
        <p className="text-gray-500 font-light max-w-md text-center">
          Discover our collections and find the perfect addition to your life.
        </p>
        <Link to="/products">
          <Button className="h-14 px-10 bg-amber-700 text-white rounded-none uppercase text-xs tracking-[0.2em] hover:bg-amber-800 transition-colors">
            Continue Shopping
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] pb-24">
      <div className="max-w-[1400px] mx-auto px-6 pt-16 lg:pt-24">
        
        <div className="flex flex-col md:flex-row justify-between items-baseline mb-12 sm:border-b sm:border-gray-200/50 sm:pb-8">
          <h1 className="font-serif text-4xl lg:text-5xl text-gray-900">Shopping Cart</h1>
          <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-semibold mt-4 md:mt-0">
            {items.length} {items.length === 1 ? 'Item' : 'Items'}
          </span>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 lg:gap-24">
          
          {/* Cart Items List */}
          <div className="lg:col-span-8 flex flex-col gap-10">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.uid || item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="flex flex-col sm:flex-row gap-6 border-b border-gray-200/50 pb-10"
                >
                  {/* Product Image */}
                  <div className="w-full sm:w-40 aspect-[3/4] overflow-hidden bg-[#f0f0f0] flex-shrink-0 relative">
                    <Link to={`/products/${item.product_uid || item.product?.uid}`}>
                      <img
                        src={item.customization_data?.preview_image_url || item.product?.image_url || item.product?.images?.[0] || 'https://images.unsplash.com/photo-1549465220-1a8b9238f828?q=80&w=2076&auto=format&fit=crop'}
                        alt={item.product?.name || 'Selection'}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549465220-1a8b9238f828?q=80&w=2076&auto=format&fit=crop'
                        }}
                      />
                    </Link>
                     {(item.customization_data || item.customization_id) && (
                      <div className="absolute top-2 right-2 bg-amber-700/90 text-white p-1.5 backdrop-blur-sm group cursor-pointer" title="Customized Piece">
                        <Palette className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  {/* Product Info & Actions */}
                  <div className="flex-1 flex flex-col pt-2">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <Link to={`/products/${item.product_uid || item.product?.uid}`} className="font-serif text-2xl text-gray-900 hover:text-amber-700 transition-colors">
                          {item.product?.name}
                        </Link>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-semibold mt-2">{item.product?.brand}</p>
                      </div>
                      <p className="font-light text-lg text-gray-900">{formatPrice(item.unit_price || item.price)}</p>
                    </div>

                    <div className="flex items-center gap-1.5 mt-2">
                      <div className={cn("w-2 h-2 rounded-full", (item.product?.stock ?? 1) > 0 ? "bg-green-500" : "bg-red-500")} />
                      <span className="text-[10px] uppercase tracking-[0.1em] text-gray-500">
                        {item.product?.stock ?? 1 > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>

                    <div className="mt-auto pt-8 flex items-end justify-between">
                      <div className="flex items-center border border-gray-200 h-10 w-28">
                        <button disabled={isUpdating} onClick={() => updateQuantity(item.uid || item.id, item.quantity - 1)} className="flex-1 flex items-center justify-center text-gray-400 hover:text-gray-900 disabled:opacity-50"><Minus className="w-3 h-3" /></button>
                        <span className="flex-1 text-center font-light text-sm">{item.quantity}</span>
                        <button disabled={isUpdating} onClick={() => updateQuantity(item.uid || item.id, item.quantity + 1)} className="flex-1 flex items-center justify-center text-gray-400 hover:text-gray-900 disabled:opacity-50"><Plus className="w-3 h-3" /></button>
                      </div>

                      <button
                        onClick={() => removeItem(item.uid || item.id)}
                        disabled={isUpdating}
                        className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-400 hover:text-red-600 transition-colors py-2 flex items-center gap-2"
                      >
                        <X className="w-3 h-3" />
                        Remove
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Checkout Summary Block */}
          <div className="lg:col-span-4 lg:pl-10 lg:border-l lg:border-gray-200/50">
            <div className="bg-white border border-gray-200/50 p-8 sm:p-10 sticky top-24">
              <h2 className="font-serif text-2xl mb-8 border-b border-gray-200/50 pb-4">Order Summary</h2>

              <div className="space-y-4 mb-8 text-sm font-light text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-gray-900">{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>Discount Code Applied</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-gray-900">{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                </div>
              </div>

              {!appliedPromo && (
                <div className="flex gap-0 mb-8 pb-8 border-b border-gray-200/50">
                  <input
                    type="text"
                    placeholder="Enter Promocode"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1 border border-r-0 border-gray-200 h-12 px-4 text-sm font-light placeholder:text-gray-400 focus:outline-none focus:border-gray-400"
                  />
                  <button 
                    onClick={applyPromo} 
                    disabled={isUpdating}
                    className="h-12 border border-gray-200 px-6 text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              )}

              {appliedPromo && (
                <div className="mb-8 pb-8 border-b border-gray-200/50 flex justify-between items-center bg-gray-50 p-4">
                  <span className="text-xs uppercase tracking-widest text-amber-700 font-semibold">{appliedPromo} Applied</span>
                  <button onClick={() => setAppliedPromo(null)} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4"/></button>
                </div>
              )}

              <div className="flex justify-between items-end mb-10">
                <span className="font-medium text-gray-900">Total</span>
                <span className="font-serif text-3xl text-gray-900">{formatPrice(total)}</span>
              </div>

              <Button 
                onClick={handleCheckout}
                className="w-full h-14 bg-amber-700 text-white rounded-none uppercase text-xs tracking-[0.2em] hover:bg-amber-800 transition-colors group flex items-center justify-center gap-4"
              >
                Proceed to Secure Checkout
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
