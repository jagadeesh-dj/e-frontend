import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Trash2, ShoppingCart, ArrowRight } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { addToWishlist, removeFromWishlist } from '../store/slices/wishlistSlice'
import { formatPrice } from '../lib/utils'
import { Product } from '../types'

export default function Wishlist() {
  const dispatch = useAppDispatch()
  const { items } = useAppSelector((state) => state.wishlist)

  const handleRemove = (id: string) => {
    dispatch(removeFromWishlist(id))
  }

  const handleMoveToCart = (product: Product) => {
    dispatch(removeFromWishlist(product.id))
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Heart className="w-12 h-12 text-gray-400" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900">Your wishlist is empty</h2>
          <p className="text-gray-500 mb-6">
            Save items you love by clicking the heart icon on any product.
          </p>
          <Link to="/products">
            <Button size="lg" className="btn-premium">
              Browse Products
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="bg-gradient-to-r from-amber-50 to-white py-12">
        <div className="app-container">
          <Link to="/products" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowRight className="w-4 h-4 mr-2 rotate-180" />Back to Products
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
          <p className="text-gray-500 mt-2">{items.length} saved items</p>
        </div>
      </div>

      <div className="app-container py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {items.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="card-premium overflow-hidden group">
                  <Link to={`/products/${product.id}`}>
                    <div className="aspect-square relative overflow-hidden bg-gray-100">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {product.originalPrice && (
                        <Badge variant="destructive" className="absolute top-3 left-3">
                          Sale
                        </Badge>
                      )}
                    </div>
                  </Link>
                  <div className="p-4">
                    <Link to={`/products/${product.id}`}>
                      <h3 className="font-semibold text-gray-900 line-clamp-1 hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-500">{product.brand}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{formatPrice(product.price)}</span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-400 line-through">
                            {formatPrice(product.originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-gray-200 hover:border-red-300 hover:bg-red-50"
                        onClick={() => handleRemove(product.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 btn-premium"
                        onClick={() => handleMoveToCart(product)}
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}


