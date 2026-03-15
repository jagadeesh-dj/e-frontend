import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, Truck, Palette, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { formatPrice } from '../lib/utils'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { fetchCart, updateCartItem, removeCartItem, validateCoupon, removeCoupon } from '../store/slices/cartSlice'

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
  const shipping = subtotal > 50 ? 0 : (cart?.shipping || 9.99)
  const total = subtotal - discount + shipping

  const updateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 1) return
    await dispatch(updateCartItem({ itemId: id, quantity: newQuantity }))
    dispatch(fetchCart())
  }

  const removeItem = async (id: string) => {
    await dispatch(removeCartItem(id))
    dispatch(fetchCart())
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Looks like you haven't added anything to your cart yet.</p>
          <Link to="/products">
            <Button size="lg" className="gap-2 btn-premium">
              Start Shopping
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="app-container py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-gray-900">Shopping Cart</h1>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                >
                  <Card className="card-premium p-3 sm:p-4">
                    <div className="flex gap-3 sm:gap-4">
                      {/* Product Image */}
                      <Link to={`/products/${item.product_id}`} className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 relative items-center justify-center flex text-gray-300">
                        {item.customization_data?.preview_image_url ? (
                          <img src={item.customization_data.preview_image_url} alt="Custom Design Preview" className="w-full h-full object-cover" />
                        ) : item.product?.images?.[0]?.url ? (
                          <img src={item.product.images[0].url} alt={item.product.name} className="w-full h-full object-cover" />
                        ) : item.product?.images?.[0] ? (
                          <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-8 h-8" />
                        )}
                        {(item.customization_data || item.customization_id) && (
                          <div className="absolute top-1 right-1">
                            <Badge className="bg-blue-500 text-white text-xs">
                              <Palette className="w-3 h-3" />
                            </Badge>
                          </div>
                        )}
                      </Link>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <Link to={`/products/${item.product_id}`} className="font-semibold text-gray-900 hover:text-primary transition-colors line-clamp-1 text-sm sm:text-base">
                          {item.product?.name || 'Product'}
                        </Link>
                        <p className="text-xs sm:text-sm text-gray-500">{item.product?.brand || ''}</p>

                        {(item.customization_data || item.customization_id) && (
                          <div className="flex items-center gap-1 mt-1">
                            <Palette className="w-3 h-3 text-blue-500" />
                            <span className="text-xs text-blue-600 font-medium">Customized Design</span>
                          </div>
                        )}

                        {/* Stock Status */}
                        {item.product && (
                          <div className="mt-1">
                            {item.product.stock === 0 || item.product.is_in_stock === false ? (
                              <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                                <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                                Out of Stock
                              </p>
                            ) : item.product.stock !== undefined && item.product.stock > 0 && item.product.stock < 10 ? (
                              <p className="text-xs text-orange-600 font-medium flex items-center gap-1">
                                <span className="w-2 h-2 bg-orange-600 rounded-full"></span>
                                Only {item.product.stock} left
                              </p>
                            ) : (
                              <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                                In Stock
                              </p>
                            )}
                          </div>
                        )}

                        <p className="font-bold mt-1 sm:mt-2 text-gray-900 text-sm sm:text-base">{formatPrice(item.unit_price || item.price)}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col items-end justify-between gap-2">
                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={isUpdating}
                          className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1 sm:gap-2 border border-gray-200 rounded-lg">
                          <Button variant="ghost" size="icon" disabled={isUpdating} onClick={() => updateQuantity(item.id, item.quantity - 1)} className="h-7 w-7 sm:h-8 sm:w-8">
                            <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <span className="w-6 sm:w-8 text-center font-medium text-gray-900 text-sm">{item.quantity}</span>
                          <Button variant="ghost" size="icon" disabled={isUpdating} onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-7 w-7 sm:h-8 sm:w-8">
                            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                        <div className="font-bold text-gray-900 text-sm sm:text-base">
                          {formatPrice((item.unit_price || item.price) * item.quantity)}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Cart Summary Header */}
          <div className="lg:col-span-1">
            <Card className="card-premium p-4 sm:p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-4 sm:mb-6 text-gray-900">Order Summary</h2>

              {!appliedPromo && (
                <div className="flex gap-2 mb-6">
                  <Input
                    placeholder="Promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="bg-gray-50 border-gray-200"
                  />
                  <Button variant="outline" onClick={applyPromo} className="border-gray-200 hover:border-primary disabled:opacity-50" disabled={isUpdating}>
                    <Tag className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {appliedPromo && (
                <div className="flex items-center justify-between p-3 bg-amber-50 text-amber-700 rounded-lg mb-6 border border-amber-100">
                  <span className="font-medium">{appliedPromo} applied - 10% off!</span>
                  <button onClick={() => setAppliedPromo(null)} className="text-sm underline">
                    Remove
                  </button>
                </div>
              )}

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span className="text-gray-900">{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-500">
                  <span className="flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Shipping
                  </span>
                  <span className="text-gray-900">{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-gray-500">
                    Free shipping on orders over {formatPrice(50)}
                  </p>
                )}
                <div className="border-t pt-3 flex justify-between text-xl font-bold">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">{formatPrice(total)}</span>
                </div>
              </div>

              <Button className="w-full btn-premium" size="lg" onClick={handleCheckout}>
                Proceed to Checkout
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
