import { useState, useMemo, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Filter, Star, ShoppingCart, Heart, Grid, List, Wifi, WifiOff } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { mockProducts, mockCategories } from '../data/mockData'
import { formatPrice } from '../lib/utils'
import { Product } from '../types'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { addToWishlist, removeFromWishlist } from '../store/slices/wishlistSlice'
import { addToast } from '../store/slices/uiSlice'
import { useInventoryWebSocket } from '../hooks/useWebSocket'

export default function Products() {
  const dispatch = useAppDispatch()
  const { items: wishlistItems } = useAppSelector((state) => state.wishlist)
  const { isConnected, inventory, alerts, subscribeToProduct, getStock, updateLocalInventory } = useInventoryWebSocket()
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>(mockProducts)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000])
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    mockProducts.forEach(product => {
      subscribeToProduct(product.id)
    })
  }, [subscribeToProduct])

  useEffect(() => {
    alerts.forEach(alert => {
      dispatch(addToast({
        type: 'warning',
        title: 'Low Stock Alert',
        message: `${alert.product_name || 'Product'} is running low (${alert.stock} left)`,
      }))
    })
  }, [alerts, dispatch])

  const getProductStock = (productId: string, defaultStock: number) => {
    const wsStock = getStock(productId)
    return wsStock !== undefined ? wsStock : defaultStock
  }

  const filteredProducts = useMemo(() => {
    let result = [...mockProducts]

    if (searchQuery) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedCategory && selectedCategory !== 'all') {
      result = result.filter(p => 
        p.category.toLowerCase().includes(selectedCategory.toLowerCase())
      )
    }

    result = result.filter(p => 
      p.price >= priceRange[0] && p.price <= priceRange[1]
    )

    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        result.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        result.sort((a, b) => b.rating - a.rating)
        break
      case 'popular':
        result.sort((a, b) => b.reviewCount - a.reviewCount)
        break
      default:
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    return result
  }, [searchQuery, selectedCategory, priceRange, sortBy])

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-r from-amber-50 via-white to-amber-50/50 py-12">
        <div className="app-container">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">All Products</h1>
          <p className="text-gray-500">Browse our complete collection</p>
        </div>
      </section>

      <div className="app-container py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className={`
            lg:w-72 flex-shrink-0
            ${showFilters ? 'fixed inset-0 z-50 lg:relative lg:block' : 'hidden lg:block'}
          `}>
            <Card className="p-4 sm:p-6 sticky top-24 card-premium h-full lg:h-auto overflow-y-auto">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="font-semibold text-lg text-gray-900">Filters</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="lg:hidden"
                  onClick={() => setShowFilters(false)}
                >
                  Close
                </Button>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
                  <div className="relative">
                    <Input
                      type="search"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-primary"
                    />
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="bg-gray-50 border-gray-200 focus:border-primary">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {mockCategories.map((cat) => (
                        <SelectItem value={cat.slug || cat.name}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Price Range</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                      className="bg-gray-50 border-gray-200 focus:border-primary"
                    />
                    <span className="text-gray-400">-</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="bg-gray-50 border-gray-200 focus:border-primary"
                    />
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full border-gray-200 hover:border-primary hover:bg-amber-50"
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory('')
                    setPriceRange([0, 1000])
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </Card>
            {showFilters && (
              <div 
                className="fixed inset-0 bg-black/50 lg:hidden -z-10"
                onClick={() => setShowFilters(false)}
              />
            )}
          </aside>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  className="lg:hidden border-gray-200"
                  onClick={() => setShowFilters(true)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
                <p className="text-sm text-gray-500">
                  {filteredProducts.length} products
                </p>
                <div className={`flex items-center gap-1.5 text-xs ${isConnected ? 'text-green-600' : 'text-gray-400'}`}>
                  {isConnected ? (
                    <>
                      <Wifi className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Live</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Offline</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-36 sm:w-48 bg-gray-50 border-gray-200 focus:border-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                  </SelectContent>
                </Select>

                <div className="hidden sm:flex items-center border border-gray-200 rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                    className={viewMode === 'grid' ? 'bg-gray-100' : ''}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                    className={viewMode === 'list' ? 'bg-gray-100' : ''}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="aspect-square bg-gray-100 animate-pulse" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <Card className="p-12 text-center card-premium">
                <p className="text-lg text-gray-500 mb-4">No products found</p>
                <Button onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('')
                  setPriceRange([0, 1000])
                }}>
                  Clear Filters
                </Button>
              </Card>
            ) : (
              <div className={`grid gap-6 animate-stagger ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ProductCard product={product} viewMode={viewMode} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductCard({ product, viewMode }: { product: Product; viewMode: 'grid' | 'list' }) {
  const dispatch = useAppDispatch()
  const { items: wishlistItems } = useAppSelector((state) => state.wishlist)
  const { getStock, isConnected } = useInventoryWebSocket()
  const [isHovered, setIsHovered] = useState(false)

  const stock = getStock(product.id) ?? product.stock

  if (viewMode === 'list') {
    return (
      <Card hover className="card-premium overflow-hidden" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        <div className="flex flex-col sm:flex-row">
          <div className="w-full sm:w-32 md:w-40 lg:w-48 h-48 sm:h-32 md:h-40 lg:h-48 flex-shrink-0 relative overflow-hidden bg-gray-100">
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500"
              style={{ transform: isHovered ? 'scale(1.1)' : 'scale(1)' }}
            />
          </div>
          <div className="flex-1 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-base sm:text-lg text-gray-900 line-clamp-1">{product.name}</h3>
                  <p className="text-sm text-gray-500">{product.brand}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-medium text-gray-700">{product.rating}</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">{product.description}</p>
            </div>
            <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg sm:text-xl text-gray-900">{formatPrice(product.price)}</span>
                {product.originalPrice && (
                  <span className="text-sm text-gray-400 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
              {isConnected && (
                <div className={`flex items-center gap-1 text-xs ${stock > 10 ? 'text-green-600' : stock > 0 ? 'text-amber-600' : 'text-red-500'}`}>
                  {stock > 0 ? `${stock} left` : 'Out of stock'}
                </div>
              )}
              <div className="flex gap-2">
                <Button 
                  size="icon"
                  variant="outline"
                  className="border-gray-200 hover:border-primary hover:bg-amber-50"
                  onClick={() => {
                    const isInWishlist = wishlistItems.some(item => item.id === product.id)
                    if (isInWishlist) {
                      dispatch(removeFromWishlist(product.id))
                    } else {
                      dispatch(addToWishlist(product))
                    }
                  }}
                >
                  {wishlistItems.some((item: any) => item.id === product.id) ? (
                    <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                  ) : (
                    <Heart className="w-4 h-4" />
                  )}
                </Button>
                <Link to={`/products/${product.id}`}>
                  <Button className="btn-premium text-sm">
                    <ShoppingCart className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">View</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card hover className="card-premium overflow-hidden group" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
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
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              variant="secondary" 
              size="icon" 
              className="shadow-lg bg-white hover:bg-gray-50"
              onClick={(e) => {
                e.preventDefault()
                const isInWishlist = wishlistItems.some(item => item.id === product.id)
                if (isInWishlist) {
                  dispatch(removeFromWishlist(product.id))
                } else {
                  dispatch(addToWishlist(product))
                }
              }}
            >
              {wishlistItems.some((item: any) => item.id === product.id) ? (
                <Heart className="w-4 h-4 text-red-500 fill-red-500" />
              ) : (
                <Heart className="w-4 h-4" />
              )}
            </Button>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <Link to={`/products/${product.id}`}>
              <Button className="w-full btn-premium">
                <ShoppingCart className="w-4 h-4 mr-2" />
                View Details
              </Button>
            </Link>
          </div>
        </div>
      </Link>
      <div className="p-4 space-y-2">
        <Link to={`/products/${product.id}`}>
          <h3 className="font-semibold text-gray-900 line-clamp-1 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        <p className="text-sm text-gray-500">{product.brand}</p>
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span className="text-sm font-medium text-gray-700">{product.rating}</span>
          <span className="text-sm text-gray-400">({product.reviewCount})</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-gray-900">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          {isConnected && (
            <div className={`flex items-center gap-1 text-xs ${stock > 10 ? 'text-green-600' : stock > 0 ? 'text-amber-600' : 'text-red-500'}`}>
              {stock > 0 ? `${stock} left` : 'Out'}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}


