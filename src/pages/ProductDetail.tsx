import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ShoppingBag, Heart, Star, Truck, Shield, RotateCcw, Check, Minus, Plus, Gem, Palette } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { formatPrice, cn } from '../lib/utils'
import { Product } from '../types'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { addToWishlist, removeFromWishlist } from '../store/slices/wishlistSlice'
import { addToCart } from '../store/slices/cartSlice'
import api from '../services/api'
import { fetchProductById } from '../store/slices/productSlice'
import { addToast } from '../store/slices/uiSlice'

export default function ProductDetail() {
  const { uid } = useParams<{ uid: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { items: wishlistItems } = useAppSelector((state) => state.wishlist)
  const { user } = useAppSelector((state) => state.auth)
  const { currentProduct: product, products, isLoading } = useAppSelector((state) => state.products)

  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const [activeTab, setActiveTab] = useState<'description' | 'details' | 'shipping'>('description')
  const [isWishlisted, setIsWishlisted] = useState(false)

  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({})

  const isInWishlist = wishlistItems.some(item => item.id === (product?.uid || product?.id))

  useEffect(() => {
    if (uid) {
      dispatch(fetchProductById(uid))
    }
  }, [uid, dispatch])

  useEffect(() => {
    if (product?.variants?.length) {
      const defaultAttributes: Record<string, string> = {}
      const keys = Array.from(new Set(product.variants.flatMap(v => Object.keys(v.attributes))))
      keys.forEach(key => {
        defaultAttributes[key] = product.variants![0].attributes[key]
      })
      setSelectedAttributes(defaultAttributes)
    }
  }, [product])

  useEffect(() => {
    setIsWishlisted(wishlistItems.some(item => item.id === uid))
  }, [uid, wishlistItems])

  const handleAddToCart = async () => {
    if (!product) return
    setIsAdding(true)
    try {
      const activeVariant = product.variants?.find(v =>
        Object.entries(selectedAttributes).every(([key, value]) => v.attributes[key] === value)
      )

      await dispatch(addToCart({
        productUid: product.uid || product.id,
        quantity: quantity,
        variantUid: activeVariant?.uid
      } as any)).unwrap()
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } catch (error) {
      dispatch(addToast({ type: 'error', title: 'Failed to add item to cart' }))
    } finally {
      setIsAdding(false)
    }
  }

  const handleWishlistToggle = () => {
    if (!product) return
    if (isInWishlist) {
      dispatch(removeFromWishlist(product.uid || product.id))
    } else {
      dispatch(addToWishlist(product))
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f6]">
        <div className="text-center font-serif text-2xl text-amber-900/50 animate-pulse">
          Loading the collection...
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f6]">
        <div className="text-center">
          <p className="font-serif text-3xl text-gray-900 mb-6">Product not found</p>
          <Link to="/products">
            <Button className="bg-amber-700 text-white hover:bg-amber-800 rounded-none h-12 px-8 uppercase tracking-[0.2em] text-xs">
              Return to Gallery
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const activePrice = product.variants?.find(v => 
    Object.entries(selectedAttributes).every(([key, value]) => v.attributes[key] === value)
  )?.price ?? product.price

  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4)

  return (
    <div className="min-h-screen pb-20 bg-[#faf9f6]">
      {/* Breadcrumb / Back Navigation */}
      <div className="border-b border-gray-200/50">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center gap-2">
          <Link to="/products" className="text-[10px] uppercase tracking-[0.2em] text-gray-500 hover:text-amber-700 transition-colors flex items-center gap-2">
            <ArrowLeft className="w-3 h-3" />
            Back to Collection
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-gray-900 font-semibold">{product.category}</span>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          
          {/* Left Column: Imagery */}
          <div className="flex flex-col gap-4">
            <motion.div
              layoutId={`product-image-${product.id}`}
              className="aspect-[4/5] overflow-hidden bg-[#f0f0f0] relative"
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>
            </motion.div>
            
            <div className="grid grid-cols-5 gap-4">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={cn(
                    "aspect-square overflow-hidden bg-[#f0f0f0] border",
                    selectedImage === index ? "border-amber-700" : "border-transparent hover:border-gray-300"
                  )}
                >
                  <img src={image} alt="" className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Details */}
          <div className="flex flex-col pt-4 lg:pt-10">
            <p className="text-[10px] uppercase tracking-[0.2em] text-amber-700 font-bold mb-4">{product.brand}</p>
            <h1 className="font-serif text-4xl lg:text-5xl text-gray-900 leading-[1.1] mb-6">{product.name}</h1>
            
            <div className="flex items-end gap-4 mb-8">
              <span className="text-3xl font-light text-gray-900">{formatPrice(activePrice)}</span>
              {product.originalPrice && (
                <span className="text-lg text-gray-400 line-through mb-1">{formatPrice(product.originalPrice)}</span>
              )}
            </div>

            <p className="text-sm font-light leading-relaxed text-gray-600 mb-10 max-w-lg">
              {product.description}
            </p>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-6 mb-10 pb-10 border-b border-gray-200/50">
                {Array.from(new Set(product.variants.flatMap(v => Object.keys(v.attributes)))).map(key => (
                  <div key={key} className="space-y-3">
                    <label className="text-[10px] uppercase tracking-[0.15em] font-semibold text-gray-900">{key}</label>
                    <div className="flex flex-wrap gap-3">
                      {Array.from(new Set(product.variants!.map(v => v.attributes[key]))).map(value => (
                        <button
                          key={value}
                          onClick={() => setSelectedAttributes(prev => ({ ...prev, [key]: value }))}
                           className={cn(
                             "px-6 py-3 text-xs tracking-wider transition-all border",
                             selectedAttributes[key] === value
                               ? 'border-amber-700 bg-amber-700 text-white'
                               : 'border-gray-200 text-gray-600 hover:border-amber-700'
                           )}
                         >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-6 pb-12">
              <div className="flex items-end gap-6">
                <div className="flex-shrink-0">
                  <label className="text-[10px] uppercase tracking-[0.15em] font-semibold text-gray-900 block mb-3">Quantity</label>
                  <div className="flex items-center border border-gray-200 h-14 w-32">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex-1 flex items-center justify-center text-gray-500 hover:text-gray-900"><Minus className="w-4 h-4" /></button>
                    <span className="flex-1 text-center font-light text-sm">{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="flex-1 flex items-center justify-center text-gray-500 hover:text-gray-900"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>

                 <div className="flex-1 flex gap-4">
                   {(product as any).is_customizable ? (
                     <Button
                       className="flex-1 h-14 bg-amber-700 hover:bg-amber-800 text-white text-xs uppercase tracking-[0.2em] rounded-none transition-colors"
                       onClick={() => navigate(`/customize/${product.uid}`)}
                     >
                       <Palette className="w-4 h-4 mr-3" />
                       Personalize
                     </Button>
                   ) : (
                     <Button
                       className="flex-1 h-14 bg-amber-700 hover:bg-amber-800 text-white text-xs uppercase tracking-[0.2em] rounded-none transition-colors"
                       onClick={handleAddToCart}
                       disabled={product.stock === 0 || isAdding}
                     >
                       {added ? 'Added to Bag' : 'Add to Bag'}
                     </Button>
                   )}
                   
                   <button 
                     onClick={handleWishlistToggle}
                     className="w-14 h-14 flex items-center justify-center border border-gray-200 hover:border-amber-700 transition-colors"
                   >
                     <Heart className={cn("w-5 h-5 transition-colors", isInWishlist ? "fill-amber-700 text-amber-700" : "text-gray-900")} />
                   </button>
                 </div>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-amber-700 font-medium">
                <div className={cn("w-2 h-2 rounded-full", product.stock > 10 ? "bg-green-500" : product.stock > 0 ? "bg-amber-500" : "bg-red-500")} />
                {product.stock > 0 ? 'Item in Stock and Ready to Ship' : 'Currently Unavailable'}
              </div>
            </div>

            {/* Accordion / Info */}
            <div className="border-t border-gray-200/50 pt-8 mt-auto">
              <div className="flex items-center gap-12 border-b border-gray-200/50 mb-8 pb-4">
                 {(['description', 'details', 'shipping'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "text-[10px] uppercase tracking-[0.2em] pb-4 -mb-[17px] transition-colors relative",
                      activeTab === tab ? "text-gray-900 font-bold border-b-2 border-amber-700" : "text-gray-400 hover:text-gray-900"
                    )}
                  >
                    {tab}
                  </button>
                 ))}
              </div>

              <div className="min-h-[150px] text-sm font-light leading-relaxed text-gray-600">
                {activeTab === 'description' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {product.description}
                  </motion.div>
                )}
                {activeTab === 'details' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-y-4 max-w-md">
                      <div className="text-gray-900 font-medium">Brand</div>
                      <div>{product.brand || 'Premium Collection'}</div>
                      <div className="text-gray-900 font-medium">SKU</div>
                      <div>{product.id.substring(0,8).toUpperCase()}</div>
                    </div>
                  </motion.div>
                )}
                {activeTab === 'shipping' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <div className="flex items-start gap-4">
                      <Truck className="w-5 h-5 text-amber-700 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-gray-900 font-medium mb-1">Complimentary Delivery</h4>
                        <p>Receive free standard shipping on all orders above $100.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <RotateCcw className="w-5 h-5 text-amber-700 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-gray-900 font-medium mb-1">Effortless Returns</h4>
                        <p>Enjoy a complimentary 30-day return policy for all pristine items.</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ═══════════ RELATED PRODUCTS ═══════════ */}
        {relatedProducts.length > 0 && (
          <div className="mt-32 pt-20 border-t border-gray-200/50">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl text-gray-900 mb-4">You May Also Desire</h2>
              <div className="w-10 h-[1px] bg-amber-700 mx-auto" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map((p) => (
                <Link key={p.id} to={`/products/${p.uid}`} className="group block">
                  <div className="aspect-[3/4] overflow-hidden bg-[#f0f0f0] mb-5">
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="font-serif text-lg text-gray-900 mb-2 group-hover:text-amber-700 transition-colors">{p.name}</h3>
                  <p className="text-sm font-light">{formatPrice(p.price)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
