import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, X, ShoppingBag, ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/button'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { removeFromWishlist } from '../store/slices/wishlistSlice'
import { formatPrice, cn } from '../lib/utils'
import { Product } from '../types'

export default function Wishlist() {
  const dispatch = useAppDispatch()
  const { items } = useAppSelector((state) => state.wishlist)

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    dispatch(removeFromWishlist(id))
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf9f6] px-4 space-y-8">
        <h2 className="font-serif text-4xl text-gray-900">Your Wishlist is Empty</h2>
        <p className="text-gray-500 font-light max-w-md text-center">
          Curate a collection of your favorite pieces by clicking the heart icon while exploring our catalog.
        </p>
        <Link to="/products">
          <Button className="h-14 px-10 bg-amber-700 text-white rounded-none uppercase text-xs tracking-[0.2em] hover:bg-amber-800 transition-colors mt-6">
            Discover Selections
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] pb-24 border-t border-gray-200/50">
      <div className="max-w-[1400px] mx-auto px-6 py-10 lg:py-16 border-b border-gray-200/50">
        <Link to="/profile" className="inline-flex items-center text-[10px] uppercase tracking-[0.2em] text-gray-500 hover:text-amber-700 transition-colors mb-6">
          <ArrowLeft className="w-3 h-3 mr-2" />Return to Profile
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <h1 className="font-serif text-4xl lg:text-5xl text-gray-900">Curated Favorites</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-semibold">{items.length} {items.length === 1 ? 'Piece' : 'Pieces'}</p>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-12 lg:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 lg:gap-12">
          <AnimatePresence>
            {items.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="group flex flex-col"
              >
                <div className="aspect-[4/5] bg-[#f0f0f0] overflow-hidden relative mb-5">
                  <Link to={`/products/${product.uid}`}>
                    <img
                      src={product.images[0] || 'https://via.placeholder.com/400x500?text=No+Image'}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                  </Link>
                  <button
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 backdrop-blur opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all hover:bg-white text-gray-600 hover:text-red-500"
                    onClick={(e) => handleRemove(product.id, e)}
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {product.originalPrice && (
                    <div className="absolute top-4 left-4 bg-amber-700 text-white text-[10px] uppercase tracking-widest px-3 py-1">
                      Archive
                    </div>
                  )}
                </div>

                <div className="text-center px-4 flex flex-col flex-1">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-semibold mb-2">{product.brand}</p>
                  <Link to={`/products/${product.uid}`}>
                    <h3 className="font-serif text-lg text-gray-900 line-clamp-1 hover:text-amber-700 transition-colors mb-3">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="flex justify-center flex-wrap gap-3 mb-6">
                    <span className="font-light text-gray-900">{formatPrice(product.price)}</span>
                    {product.originalPrice && (
                      <span className="text-sm font-light text-gray-400 line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>
                  <div className="mt-auto pt-4 flex gap-4 border-t border-gray-200/50">
                    <Link to={`/products/${product.uid}`} className="flex-1">
                       <Button className="w-full rounded-none h-10 uppercase text-[10px] tracking-widest bg-transparent text-amber-700 border border-amber-700 hover:bg-amber-700 hover:text-white transition-colors">
                          View Details
                       </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
