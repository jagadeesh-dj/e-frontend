import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ShoppingCart, Heart, Star, Truck, Shield, RotateCcw, Check, Minus, Plus, Send, Palette } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { formatPrice } from '../lib/utils'
import { Product } from '../types'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { addToWishlist, removeFromWishlist } from '../store/slices/wishlistSlice'
import { addToCart } from '../store/slices/cartSlice'
import api from '../services/api'
import { fetchProductById } from '../store/slices/productSlice'
import { addToast } from '../store/slices/uiSlice'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { items: wishlistItems } = useAppSelector((state) => state.wishlist)
  const { user } = useAppSelector((state) => state.auth)
  const { currentProduct: product, products, isLoading, error } = useAppSelector((state) => state.products)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const [activeTab, setActiveTab] = useState<'description' | 'reviews' | 'shipping'>('description')
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewComment, setReviewComment] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [reviews, setReviews] = useState<any[]>([])
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({})

  const isInWishlist = wishlistItems.some(item => item.id === product?.id)

  useEffect(() => {
    if (id) {
      dispatch(fetchProductById(id))
      api.get(`/reviews/product/${id}`).then(res => {
        const items = res.data?.data?.items || res.data?.items || []
        setReviews(Array.isArray(items) ? items : [])
      }).catch(e => console.error(e))
    }
  }, [id, dispatch])

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
    setIsWishlisted(wishlistItems.some(item => item.id === id))
  }, [id, wishlistItems])

  const handleAddToCart = async () => {
    if (!product) return
    setIsAdding(true)
    try {
      const activeVariant = product.variants?.find(v => 
        Object.entries(selectedAttributes).every(([key, value]) => v.attributes[key] === value)
      )
      
      await dispatch(addToCart({ 
        productId: product.id, 
        quantity: quantity,
        variantId: activeVariant?.id // Add variantId to cart if selected
      } as any)).unwrap()
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } catch (error) {
      console.error('Failed to add to cart:', error)
      dispatch(addToast({ type: 'error', title: 'Failed to add item to cart' }))
    } finally {
      setIsAdding(false)
    }
  }

  const handleWishlistToggle = () => {
    if (!product) return
    if (isInWishlist) {
      dispatch(removeFromWishlist(product.id))
    } else {
      dispatch(addToWishlist(product))
    }
  }

  const handleSubmitReview = async () => {
    if (!reviewTitle.trim() || !reviewComment.trim()) {
      dispatch(addToast({ type: 'error', title: 'Please fill in all fields' }))
      return
    }
    
    setIsSubmittingReview(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    dispatch(addToast({ 
      type: 'success', 
      title: 'Review submitted successfully!',
      message: 'Thank you for your feedback.'
    }))
    
    setReviewRating(5)
    setReviewTitle('')
    setReviewComment('')
    setIsSubmittingReview(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">Product not found</p>
          <Link to="/products">
            <Button>Back to Products</Button>
          </Link>
        </div>
      </div>
    )
  }

  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4)

  return (
    <div className="min-h-screen pb-20">
      <div className="app-container py-8">
        <Link
          to="/products"
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Link>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <div className="space-y-3 sm:space-y-4">
            <motion.div
              key={selectedImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="aspect-square rounded-2xl sm:rounded-3xl overflow-hidden bg-muted"
            >
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </motion.div>
            <div className="grid grid-cols-4 gap-2 sm:gap-4">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square rounded-lg sm:rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImage === index ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img src={image} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div>
              <Badge variant="secondary" className="mb-2 sm:mb-3 text-xs sm:text-sm">{product.brand}</Badge>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4">{product.name}</h1>
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-5 sm:w-5 ${i < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-muted'}`}
                    />
                  ))}
                </div>
                <span className="text-muted-foreground text-sm">
                  {product.rating} ({product.reviewCount} reviews)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <span className="text-3xl sm:text-4xl font-bold">
                {formatPrice(
                  product.variants?.find(v => 
                    Object.entries(selectedAttributes).every(([key, value]) => v.attributes[key] === value)
                  )?.price ?? product.price
                )}
              </span>
              {(product.variants?.find(v => 
                Object.entries(selectedAttributes).every(([key, value]) => v.attributes[key] === value)
              )?.originalPrice ?? product.originalPrice) && (
                <>
                  <span className="text-lg sm:text-xl text-muted-foreground line-through">
                    {formatPrice(
                      product.variants?.find(v => 
                        Object.entries(selectedAttributes).every(([key, value]) => v.attributes[key] === value)
                      )?.originalPrice ?? product.originalPrice ?? 0
                    )}
                  </span>
                  <Badge variant="destructive" className="text-xs sm:text-sm">
                    {Math.round((1 - (product.variants?.find(v => 
                      Object.entries(selectedAttributes).every(([key, value]) => v.attributes[key] === value)
                    )?.price ?? product.price) / (product.variants?.find(v => 
                      Object.entries(selectedAttributes).every(([key, value]) => v.attributes[key] === value)
                    )?.originalPrice ?? product.originalPrice ?? 1)) * 100)}% OFF
                  </Badge>
                </>
              )}
            </div>

            <p className="text-muted-foreground text-sm sm:text-base">{product.description}</p>

            {product.variants && product.variants.length > 0 && (
              <div className="space-y-4 py-2">
                {Array.from(new Set(product.variants.flatMap(v => Object.keys(v.attributes)))).map(key => (
                  <div key={key} className="space-y-2">
                    <label className="text-sm font-semibold capitalize">{key}:</label>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(product.variants!.map(v => v.attributes[key]))).map(value => (
                        <button
                          key={value}
                          onClick={() => setSelectedAttributes(prev => ({ ...prev, [key]: value }))}
                          className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                            selectedAttributes[key] === value
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-muted hover:border-primary/50'
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-muted/30 rounded-xl overflow-x-auto">
              <div className="flex items-center gap-2 min-w-fit">
                <Truck className="w-4 h-5 sm:w-5 text-primary" />
                <span className="text-xs sm:text-sm whitespace-nowrap">Free Shipping</span>
              </div>
              <div className="flex items-center gap-2 min-w-fit">
                <Shield className="w-4 h-5 sm:w-5 text-primary" />
                <span className="text-xs sm:text-sm whitespace-nowrap">Secure Payment</span>
              </div>
              <div className="flex items-center gap-2 min-w-fit">
                <RotateCcw className="w-4 h-5 sm:w-5 text-primary" />
                <span className="text-xs sm:text-sm whitespace-nowrap">30-Day Returns</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Availability:</span>
                <span className={product.stock > 10 ? 'text-green-500' : product.stock > 0 ? 'text-amber-500' : 'text-red-500'}>
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </span>
              </div>

              <div>
                <label className="font-medium mb-2 block">Quantity</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border rounded-xl">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                {(product as any).is_customizable ? (
                  <Button
                    size="xl"
                    className="flex-1 gap-2"
                    variant="secondary"
                    onClick={() => navigate(`/customize/${product.id}`)}
                  >
                    <Palette className="w-5 h-5" />
                    Customize Now
                  </Button>
                ) : (
                  <Button
                    size="xl"
                    className="flex-1"
                    onClick={handleAddToCart}
                    loading={isAdding}
                    disabled={product.stock === 0}
                  >
                    {added ? (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Added to Cart
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Add to Cart
                      </>
                    )}
                  </Button>
                )}
                <Button variant="outline" size="xl" onClick={handleWishlistToggle}>
                  {isInWishlist ? (
                    <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                  ) : (
                    <Heart className="w-5 h-5" />
                  )}
                </Button>
              </div>

              {(product as any).is_customizable && (
                <div className="pt-4">
                  <Button
                    size="xl"
                    className="w-full"
                    onClick={handleAddToCart}
                    loading={isAdding}
                    disabled={product.stock === 0}
                  >
                    {added ? (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Added to Cart
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Add to Cart
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {product.features && (
              <div className="pt-6 border-t">
                <h3 className="font-semibold mb-3">Key Features</h3>
                <ul className="space-y-2">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="mb-12 sm:mb-16">
          <div className="flex gap-2 sm:gap-4 border-b mb-6 sm:mb-8 overflow-x-auto">
            {(['description', 'reviews', 'shipping'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 sm:px-4 py-2 sm:py-3 font-medium capitalize transition-colors relative whitespace-nowrap ${
                  activeTab === tab ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  />
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'description' && (
              <motion.div
                key="description"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <p className="text-muted-foreground leading-relaxed">{product.description}</p>
              </motion.div>
            )}
            {activeTab === 'reviews' && (
              <motion.div
                key="reviews"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {user && (
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4">Write a Review</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Rating</label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setReviewRating(star)}
                              className="p-1 transition-transform hover:scale-110"
                            >
                              <Star
                                className={`w-6 h-6 ${
                                  star <= reviewRating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-muted hover:text-amber-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Title</label>
                        <Input
                          placeholder="Summarize your review"
                          value={reviewTitle}
                          onChange={(e) => setReviewTitle(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Your Review</label>
                        <Textarea
                          placeholder="Share your experience with this product..."
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          rows={4}
                        />
                      </div>
                      <Button
                        onClick={handleSubmitReview}
                        disabled={isSubmittingReview}
                        className="w-full"
                      >
                        {isSubmittingReview ? (
                          <>
                            <span className="animate-pulse">Submitting...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Submit Review
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                )}

                {reviews.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No reviews yet. Be the first to review!</div>
                ) : (
                  reviews.slice(0, 5).map((review) => (
                    <Card key={review.id} className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="font-medium">{review.user?.first_name || 'Anonymous User'}</div>
                          <div className="flex items-center gap-1 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted'}`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.created_at || review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-semibold mb-2">{review.title}</h4>
                      <p className="text-muted-foreground">{review.comment}</p>
                    </Card>
                  ))
                )}
              </motion.div>
            )}
            {activeTab === 'shipping' && (
              <motion.div
                key="shipping"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6"
              >
                <Card className="p-4 sm:p-6">
                  <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-primary mb-3 sm:mb-4" />
                  <h4 className="font-semibold mb-2">Free Shipping</h4>
                  <p className="text-sm text-muted-foreground">
                    Free standard shipping on orders over $50. Express options available at checkout.
                  </p>
                </Card>
                <Card className="p-4 sm:p-6">
                  <RotateCcw className="w-6 h-6 sm:w-8 sm:h-8 text-primary mb-3 sm:mb-4" />
                  <h4 className="font-semibold mb-2">Easy Returns</h4>
                  <p className="text-sm text-muted-foreground">
                    Not satisfied? Return any item within 30 days for a full refund.
                  </p>
                </Card>
                <Card className="p-4 sm:p-6">
                  <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-primary mb-3 sm:mb-4" />
                  <h4 className="font-semibold mb-2">Secure Payment</h4>
                  <p className="text-sm text-muted-foreground">
                    Your payment information is encrypted and secure with SSL technology.
                  </p>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {relatedProducts.length > 0 && (
          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8">Related Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {relatedProducts.map((product) => (
                <Link key={product.id} to={`/products/${product.id}`}>
                  <Card hover className="overflow-hidden group">
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold">{formatPrice(product.price)}</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span className="text-sm">{product.rating}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}


