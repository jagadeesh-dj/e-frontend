import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Filter, Star, ShoppingCart, Heart, Grid, List, Wifi, WifiOff, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
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
import { formatPrice } from '../lib/utils'
import { Product } from '../types'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { fetchProducts, fetchCategories, setPage } from '../store/slices/productSlice'
import { addToWishlist, removeFromWishlist, fetchWishlist } from '../store/slices/wishlistSlice'
import { addToast } from '../store/slices/uiSlice'
import { useInventoryWebSocket } from '../hooks/useWebSocket'

export default function Products() {
  const dispatch = useAppDispatch()
  const { products, categories, isLoading, pagination } = useAppSelector((state) => state.products)
  const { items: wishlistItems } = useAppSelector((state) => state.wishlist)
  const { isAuthenticated } = useAppSelector((state) => state.auth)
  const { isConnected, getStock } = useInventoryWebSocket()
  const [searchParams, setSearchParams] = useSearchParams()

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch categories on mount
  useEffect(() => {
    dispatch(fetchCategories())
    if (isAuthenticated) dispatch(fetchWishlist())
  }, [dispatch, isAuthenticated])

  // Fetch products when filters/page change
  useEffect(() => {
    const categoryId = selectedCategory
      ? categories.find(c => c.slug === selectedCategory || c.name === selectedCategory)?.id
      : undefined

    dispatch(fetchProducts({
      page: pagination.page,
      page_size: pagination.limit,
      search: debouncedSearch || undefined,
      category_id: categoryId ? Number(categoryId) : undefined,
      min_price: minPrice ? Number(minPrice) : undefined,
      max_price: maxPrice ? Number(maxPrice) : undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
    }))
  }, [dispatch, debouncedSearch, selectedCategory, minPrice, maxPrice, sortBy, sortOrder, pagination.page, categories])

  const handleSortChange = (value: string) => {
    const [field, order] = value.split('-')
    if (field === 'created_at') { setSortBy('created_at'); setSortOrder('desc') }
    else if (field === 'price' && order === 'asc') { setSortBy('base_price'); setSortOrder('asc') }
    else if (field === 'price' && order === 'desc') { setSortBy('base_price'); setSortOrder('desc') }
    else if (field === 'rating') { setSortBy('rating_avg'); setSortOrder('desc') }
    dispatch(setPage(1))
  }

  const sortValue = useMemo(() => {
    if (sortBy === 'rating_avg') return 'rating'
    if (sortBy === 'base_price') return `price-${sortOrder}`
    return 'newest'
  }, [sortBy, sortOrder])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('')
    setMinPrice('')
    setMaxPrice('')
    setSortBy('created_at')
    setSortOrder('desc')
    dispatch(setPage(1))
  }

  const handleWishlistToggle = (product: Product, e?: React.MouseEvent) => {
    e?.preventDefault()
    if (!isAuthenticated) {
      dispatch(addToast({ type: 'warning', title: 'Please login to save items to wishlist' }))
      return
    }
    const isInWishlist = wishlistItems.some(item => item.id === product.id)
    if (isInWishlist) {
      dispatch(removeFromWishlist(product.id))
    } else {
      dispatch(addToWishlist(product))
    }
  }

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-r from-amber-50 via-white to-amber-50/50 py-12">
        <div className="app-container">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">All Products</h1>
          <p className="text-gray-500">Browse our complete collection — {pagination.total} products</p>
        </div>
      </section>

      <div className="app-container py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className={`lg:w-72 flex-shrink-0 ${showFilters ? 'fixed inset-0 z-50 lg:relative lg:block' : 'hidden lg:block'}`}>
            <Card className="p-4 sm:p-6 sticky top-24 card-premium h-full lg:h-auto overflow-y-auto">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="font-semibold text-lg text-gray-900">Filters</h3>
                <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setShowFilters(false)}>Close</Button>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
                  <div className="relative">
                    <Input
                      type="search"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); dispatch(setPage(1)) }}
                      className="pl-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-primary"
                    />
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
                  <Select value={selectedCategory || '__all__'} onValueChange={(v) => { setSelectedCategory(v === '__all__' ? '' : v); dispatch(setPage(1)) }}>
                    <SelectTrigger className="bg-gray-50 border-gray-200 focus:border-primary">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={String(cat.id || cat.name)} value={cat.slug || cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Price Range (₹)</label>
                  <div className="flex items-center gap-2">
                    <Input type="number" placeholder="Min" value={minPrice} onChange={(e) => { setMinPrice(e.target.value); dispatch(setPage(1)) }} className="bg-gray-50 border-gray-200 focus:border-primary" />
                    <span className="text-gray-400">-</span>
                    <Input type="number" placeholder="Max" value={maxPrice} onChange={(e) => { setMaxPrice(e.target.value); dispatch(setPage(1)) }} className="bg-gray-50 border-gray-200 focus:border-primary" />
                  </div>
                </div>

                <Button variant="outline" className="w-full border-gray-200 hover:border-primary hover:bg-amber-50" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </Card>
            {showFilters && <div className="fixed inset-0 bg-black/50 lg:hidden -z-10" onClick={() => setShowFilters(false)} />}
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button variant="outline" className="lg:hidden border-gray-200" onClick={() => setShowFilters(true)}>
                  <Filter className="w-4 h-4 mr-2" />Filters
                </Button>
                <p className="text-sm text-gray-500">{pagination.total} product{pagination.total !== 1 ? 's' : ''}</p>
                <div className={`flex items-center gap-1.5 text-xs ${isConnected ? 'text-green-600' : 'text-gray-400'}`}>
                  {isConnected ? <><Wifi className="w-3.5 h-3.5" /><span className="hidden sm:inline">Live</span></> : <><WifiOff className="w-3.5 h-3.5" /><span className="hidden sm:inline">Offline</span></>}
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <Select value={sortValue} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-36 sm:w-48 bg-gray-50 border-gray-200 focus:border-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                  </SelectContent>
                </Select>

                <div className="hidden sm:flex items-center border border-gray-200 rounded-lg">
                  <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'bg-gray-100' : ''}>
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'bg-gray-100' : ''}>
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
            ) : products.length === 0 ? (
              <Card className="p-12 text-center card-premium">
                <p className="text-lg text-gray-500 mb-4">No products found</p>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </Card>
            ) : (
              <>
                <div className={`grid gap-6 animate-stagger ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                  {products.map((product, index) => (
                    <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
                      <ProductCard
                        product={product}
                        viewMode={viewMode}
                        isInWishlist={wishlistItems.some(w => w.id === product.id)}
                        onWishlistToggle={handleWishlistToggle}
                        wsStock={getStock(product.id)}
                        wsConnected={isConnected}
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <Button variant="outline" size="sm" onClick={() => dispatch(setPage(pagination.page - 1))} disabled={pagination.page === 1}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
                      const p = i + 1
                      return (
                        <Button key={p} variant={p === pagination.page ? 'default' : 'outline'} size="sm" onClick={() => dispatch(setPage(p))}>
                          {p}
                        </Button>
                      )
                    })}
                    <Button variant="outline" size="sm" onClick={() => dispatch(setPage(pagination.page + 1))} disabled={pagination.page === pagination.totalPages}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductCard({
  product,
  viewMode,
  isInWishlist,
  onWishlistToggle,
  wsStock,
  wsConnected,
}: {
  product: Product
  viewMode: 'grid' | 'list'
  isInWishlist: boolean
  onWishlistToggle: (product: Product, e?: React.MouseEvent) => void
  wsStock?: number
  wsConnected: boolean
}) {
  const [isHovered, setIsHovered] = useState(false)
  const stock = wsStock !== undefined ? wsStock : product.stock
  const imageUrl = product.images?.[0] || product.image_url || 'https://via.placeholder.com/400x400?text=No+Image'

  if (viewMode === 'list') {
    return (
      <Card hover className="card-premium overflow-hidden" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        <div className="flex flex-col sm:flex-row">
          <div className="w-full sm:w-40 h-40 flex-shrink-0 overflow-hidden bg-gray-100">
            <img src={imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-500" style={{ transform: isHovered ? 'scale(1.08)' : 'scale(1)' }} />
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
                  <span className="text-sm font-medium text-gray-700">{product.rating?.toFixed(1)}</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">{product.description}</p>
            </div>
            <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-gray-900">{formatPrice(product.price)}</span>
                {product.originalPrice && <span className="text-sm text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>}
              </div>
              <div className="flex gap-2">
                <Button size="icon" variant="outline" className="border-gray-200 hover:border-primary hover:bg-amber-50" onClick={(e) => onWishlistToggle(product, e)}>
                  <Heart className={`w-4 h-4 ${isInWishlist ? 'text-red-500 fill-red-500' : ''}`} />
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
          <img src={imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
          {product.originalPrice && (
            <Badge variant="destructive" className="absolute top-3 left-3">Sale</Badge>
          )}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="secondary" size="icon" className="shadow-lg bg-white hover:bg-gray-50" onClick={(e) => onWishlistToggle(product, e)}>
              <Heart className={`w-4 h-4 ${isInWishlist ? 'text-red-500 fill-red-500' : ''}`} />
            </Button>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <Button className="w-full btn-premium">
              <ShoppingCart className="w-4 h-4 mr-2" />View Details
            </Button>
          </div>
        </div>
      </Link>
      <div className="p-4 space-y-2">
        <Link to={`/products/${product.id}`}>
          <h3 className="font-semibold text-gray-900 line-clamp-1 hover:text-primary transition-colors">{product.name}</h3>
        </Link>
        <p className="text-sm text-gray-500">{product.brand}</p>
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span className="text-sm font-medium text-gray-700">{product.rating?.toFixed(1)}</span>
          <span className="text-sm text-gray-400">({product.reviewCount})</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-gray-900">{formatPrice(product.price)}</span>
            {product.originalPrice && <span className="text-sm text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>}
          </div>
          {wsConnected && (
            <div className={`text-xs ${stock > 10 ? 'text-green-600' : stock > 0 ? 'text-amber-600' : 'text-red-500'}`}>
              {stock > 0 ? `${stock} left` : 'Out'}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
