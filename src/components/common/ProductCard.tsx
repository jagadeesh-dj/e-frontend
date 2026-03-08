import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShoppingCart, Heart, Star, Eye, Plus } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'
import { formatPrice } from '../../lib/utils'
import { useAppDispatch } from '../../store/hooks'
import { addToast } from '../../store/slices/uiSlice'

interface ProductCardProps {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  images?: string[]
  rating: number
  reviewCount?: number
  category?: string
  stock?: number
  isNew?: boolean
  isSale?: boolean
  className?: string
}

export default function ProductCard({
  id,
  name,
  price,
  originalPrice,
  image,
  images = [],
  rating,
  reviewCount = 0,
  category,
  stock,
  isNew = false,
  isSale = false,
  className,
}: ProductCardProps) {
  const dispatch = useAppDispatch()
  const [currentImage, setCurrentImage] = useState(0)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsAdding(true)
    dispatch(addToast({ type: 'success', title: 'Added to cart', message: name }))
    setTimeout(() => setIsAdding(false), 1000)
  }

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsWishlisted(!isWishlisted)
    dispatch(addToast({
      type: isWishlisted ? 'info' : 'success',
      title: isWishlisted ? 'Removed from wishlist' : 'Added to wishlist',
    }))
  }

  const allImages = [image, ...images].filter(Boolean)

  return (
    <Link to={`/products/${id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        whileHover={{ y: -8 }}
        transition={{ duration: 0.3 }}
        className={cn(
          'group relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-primary/10 transition-all duration-300',
          className
        )}
      >
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {/* Main Image */}
          <img
            src={allImages[currentImage] || image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
            {isNew && (
              <Badge className="bg-gradient-to-r from-primary to-primary-600 text-white border-0 shadow-md">
                New
              </Badge>
            )}
            {isSale && discount > 0 && (
              <Badge variant="destructive" size="sm" className="shadow-md">
                -{discount}%
              </Badge>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={handleWishlist}
            className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:shadow-lg transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
          >
            <Heart
              className={cn(
                'w-4 h-4 transition-colors',
                isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'
              )}
            />
          </button>

          {/* Quick Actions Overlay */}
          <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-full group-hover:translate-y-0">
            <div className="flex gap-2">
              <Button
                onClick={handleAddToCart}
                loading={isAdding}
                size="sm"
                className="flex-1 bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl shadow-lg"
                leftIcon={<ShoppingCart className="w-4 h-4" />}
              >
                Add to Cart
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="bg-white/90 backdrop-blur-sm border-gray-200 hover:bg-primary hover:text-white rounded-xl"
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Image Indicators */}
          {allImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {allImages.slice(0, 4).map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.preventDefault()
                    setCurrentImage(idx)
                  }}
                  className={cn(
                    'w-1.5 h-1.5 rounded-full transition-all',
                    idx === currentImage
                      ? 'w-4 bg-primary'
                      : 'bg-white/70 hover:bg-white'
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Category */}
          {category && (
            <p className="text-xs text-gray-500 uppercase tracking-wide">{category}</p>
          )}

          {/* Product Name */}
          <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem]">
            {name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'w-3.5 h-3.5',
                    i < Math.floor(rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-gray-200 text-gray-200'
                  )}
                />
              ))}
            </div>
            {reviewCount > 0 && (
              <span className="text-xs text-gray-500">({reviewCount})</span>
            )}
          </div>

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(price)}
            </span>
            {originalPrice && (
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>

          {/* Stock Status */}
          {stock !== undefined && stock <= 0 && (
            <p className="text-xs text-red-600 font-medium">Out of Stock</p>
          )}
          {stock !== undefined && stock > 0 && stock < 10 && (
            <p className="text-xs text-orange-600 font-medium">Only {stock} left</p>
          )}
        </div>
      </motion.div>
    </Link>
  )
}
