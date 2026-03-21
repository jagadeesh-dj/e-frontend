import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, Star, Heart, Grid, List, Wifi, WifiOff, ChevronLeft, ChevronRight, X, Gem } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { formatPrice, cn } from '../lib/utils'
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

  useEffect(() => {
    dispatch(fetchCategories())
    if (isAuthenticated) dispatch(fetchWishlist())
  }, [dispatch, isAuthenticated])

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
    setShowFilters(false)
  }

  const handleWishlistToggle = (product: Product, e?: React.MouseEvent) => {
    e?.preventDefault()
    if (!isAuthenticated) {
      dispatch(addToast({ type: 'warning', title: 'Please login to save items to wishlist' }))
      return
    }
    const isInWishlist = wishlistItems.some((item) => item.id === (product.uid || product.id))
    if (isInWishlist) {
      dispatch(removeFromWishlist(product.uid || product.id))
    } else {
      dispatch(addToWishlist(product))
    }
  }

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      {/* Header */}
      <div className="border-b border-gray-200/50">
        <div className="max-w-[1400px] mx-auto px-6 py-12 lg:py-20 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-serif text-4xl lg:text-5xl text-gray-900 mb-3 tracking-tight">Grand Boutique</h1>
            <p className="font-light text-gray-500">Experience our collection of {pagination.total} curated artisanal treasures.</p>
          </div>
          <div className={cn("text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 px-4 py-2 border border-gray-200", isConnected ? 'text-green-600' : 'text-amber-800')}>
            <span className={cn("w-2 h-2 rounded-full animate-pulse", isConnected ? "bg-green-500" : "bg-amber-500")} />
            {isConnected ? 'Concierge Online' : 'Offline Mode'}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-6 border-b border-gray-100 sticky top-0 bg-[#faf9f6]/80 backdrop-blur-xl z-30">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Search Dropdown/Input */}
          <div className="relative w-full lg:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-amber-900 transition-colors" />
            <Input 
              placeholder="Search for a masterpiece..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); dispatch(setPage(1)) }}
              className="pl-12 h-12 bg-white/50 border-gray-200 rounded-none focus:border-amber-900 focus:ring-0 text-sm font-light placeholder:italic"
            />
          </div>

          <div className="flex items-center gap-4 w-full lg:w-auto">
            {/* Searchable Category Dropdown */}
            <div className="relative w-full lg:w-48 group">
              <Select value={selectedCategory || 'all'} onValueChange={(val) => { setSelectedCategory(val === 'all' ? '' : val); dispatch(setPage(1)) }}>
                <SelectTrigger className="h-12 w-full bg-white/50 border-gray-200 rounded-none focus:ring-0 text-[10px] uppercase tracking-[0.2em] font-bold">
                  <SelectValue placeholder="The Collections" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-gray-100 max-h-[300px]">
                  <div className="p-2 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                      <input 
                        placeholder="Search categories..." 
                        className="w-full pl-7 pr-2 py-1.5 text-[10px] uppercase tracking-widest border border-gray-100 outline-none focus:border-amber-900 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const val = e.target.value.toLowerCase();
                          const items = document.querySelectorAll('.category-item');
                          items.forEach((item: any) => {
                            const text = item.innerText.toLowerCase();
                            item.style.display = text.includes(val) ? 'flex' : 'none';
                          });
                        }}
                      />
                    </div>
                  </div>
                  <SelectItem value="all" className="text-[10px] uppercase tracking-widest category-item">All Collections</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={String(cat.id)} value={cat.slug || cat.name} className="text-[10px] uppercase tracking-widest category-item">
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price Filter Popover (using basic inputs for now, styled cleanly) */}
            <div className="hidden lg:flex items-center gap-2 px-4 h-12 bg-white/50 border border-gray-200">
              <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mr-2">Price:</span>
              <input 
                type="number" 
                placeholder="Min" 
                value={minPrice} 
                onChange={(e) => { setMinPrice(e.target.value); dispatch(setPage(1)) }} 
                className="w-16 bg-transparent text-sm font-light focus:outline-none placeholder:text-gray-300" 
              />
              <span className="text-gray-300 mx-1">-</span>
              <input 
                type="number" 
                placeholder="Max" 
                value={maxPrice} 
                onChange={(e) => { setMaxPrice(e.target.value); dispatch(setPage(1)) }} 
                className="w-16 bg-transparent text-sm font-light focus:outline-none placeholder:text-gray-300" 
              />
            </div>

            {/* Sort Dropdown */}
            <Select value={sortValue} onValueChange={handleSortChange}>
              <SelectTrigger className="h-12 w-full lg:w-48 bg-white/50 border-gray-200 rounded-none focus:ring-0 text-[10px] uppercase tracking-[0.2em] font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none border-gray-100">
                <SelectItem value="newest" className="text-[10px] uppercase tracking-widest">Latest Arrivals</SelectItem>
                <SelectItem value="price-asc" className="text-[10px] uppercase tracking-widest">Price: Low to High</SelectItem>
                <SelectItem value="price-desc" className="text-[10px] uppercase tracking-widest">Price: High to Low</SelectItem>
                <SelectItem value="rating" className="text-[10px] uppercase tracking-widest">Exceptional Rating</SelectItem>
              </SelectContent>
            </Select>

            <div className="hidden lg:flex items-center border-l border-gray-200 pl-4">
              <button onClick={() => setViewMode('grid')} className={cn("p-2 transition-colors", viewMode === 'grid' ? "text-amber-900" : "text-gray-300 hover:text-gray-500")}>
                <Grid className="w-5 h-5" />
              </button>
              <button onClick={() => setViewMode('list')} className={cn("p-2 transition-colors", viewMode === 'list' ? "text-amber-900" : "text-gray-300 hover:text-gray-500")}>
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="flex flex-col">
          {/* Active Filters Display */}
          {(selectedCategory || minPrice || maxPrice || searchQuery) && (
            <div className="flex flex-wrap items-center gap-4 mb-10">
              <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Refined by:</span>
              {selectedCategory && (
                <Badge variant="outline" className="rounded-none border-amber-900/20 text-amber-900 px-3 py-1 bg-amber-50 capitalize">
                  {selectedCategory} <X className="w-3 h-3 ml-2 cursor-pointer" onClick={() => setSelectedCategory('')} />
                </Badge>
              )}
              {searchQuery && (
                <Badge variant="outline" className="rounded-none border-amber-900/20 text-amber-900 px-3 py-1 bg-amber-50">
                  Search: "{searchQuery}" <X className="w-3 h-3 ml-2 cursor-pointer" onClick={() => setSearchQuery('')} />
                </Badge>
              )}
              <button onClick={clearFilters} className="text-[10px] uppercase tracking-widest font-bold text-amber-700 underline underline-offset-4 hover:text-amber-900 transition-colors">Clear All Pieces</button>
            </div>
          )}

          {/* Catalog */}
          <div className="flex-1">
            {isLoading ? (
              <div className={cn("grid gap-8 lg:gap-16", viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1')}>
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[4/5] bg-gray-100 mb-4" />
                    <div className="h-4 bg-gray-100 w-3/4 mb-2 mx-auto" />
                    <div className="h-4 bg-gray-100 w-1/4 mx-auto" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-40 border border-gray-100 bg-white">
                <Gem className="w-12 h-12 text-gray-200 mx-auto mb-8" strokeWidth={1} />
                <p className="font-serif text-3xl text-gray-900 mb-4">The Selection is Clear</p>
                <p className="font-light text-gray-500 mb-12 max-w-sm mx-auto">Try adjusting your refinements to discover our complete collection of treasures.</p>
                <Button className="rounded-none h-14 bg-amber-700 text-white hover:bg-amber-800 px-12 text-[10px] uppercase tracking-[0.3em] font-bold" onClick={clearFilters}>
                  View All Collections
                </Button>
              </div>
            ) : (
              <>
                <div className={cn("grid gap-x-8 gap-y-16 animate-stagger", viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1')}>
                  {products.map((product, index) => (
                    <motion.div key={product.uid || product.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                      <ProductCard
                        product={product}
                        viewMode={viewMode}
                        isInWishlist={wishlistItems.some(w => w.id === product.uid)}
                        onWishlistToggle={handleWishlistToggle}
                        wsStock={getStock(product.uid || product.id)}
                        wsConnected={isConnected}
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-6 mt-32 pt-12 border-t border-gray-100">
                    <button 
                      className="group flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed h-10 px-4 hover:text-gray-900 transition-colors" 
                      onClick={() => dispatch(setPage(pagination.page - 1))} 
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                      Prev
                    </button>
                    
                    <div className="flex gap-4">
                      {Array.from({ length: pagination.totalPages }, (_, i) => {
                        const p = i + 1
                        return (
                          <button 
                            key={p} 
                            onClick={() => dispatch(setPage(p))}
                            className={cn(
                              "w-10 h-10 flex items-center justify-center text-[10px] uppercase tracking-widest font-bold transition-all border",
                              p === pagination.page ? "border-amber-700 bg-amber-700 text-white shadow-xl shadow-amber-800/20" : "border-transparent text-gray-400 hover:border-gray-200"
                            )}
                          >
                            {p}
                          </button>
                        )
                      })}
                    </div>

                    <button 
                      className="group flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed h-10 px-4 hover:text-gray-900 transition-colors"
                      onClick={() => dispatch(setPage(pagination.page + 1))} 
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
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
  const stock = wsStock !== undefined ? wsStock : product.stock
  const imageUrl = product.images?.[0] || product.image_url || 'https://via.placeholder.com/400x500?text=No+Image'

  if (viewMode === 'list') {
    return (
      <div className="flex flex-col sm:flex-row gap-8 bg-white border border-gray-200 p-6 group">
        <Link to={`/products/${product.uid}`} className="w-full sm:w-48 aspect-[3/4] overflow-hidden bg-[#f0f0f0] flex-shrink-0">
          <img src={imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
        </Link>
        <div className="flex-1 flex flex-col pt-2">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-amber-700 font-semibold mb-2">{product.brand}</p>
              <Link to={`/products/${product.uid}`} className="font-serif text-2xl text-gray-900 hover:text-amber-700 transition-colors line-clamp-1">{product.name}</Link>
            </div>
            <button className="text-gray-400 hover:text-amber-700 transition-colors" onClick={(e) => onWishlistToggle(product, e)}>
              <Heart className={cn("w-5 h-5", isInWishlist ? "fill-amber-700 text-amber-700" : "")} />
            </button>
          </div>
          <p className="text-sm font-light text-gray-500 max-w-lg leading-relaxed line-clamp-3 mb-6">{product.description}</p>
          <div className="mt-auto flex items-center justify-between">
            <div className="flex items-end gap-3">
              <span className="font-light text-xl text-gray-900">{formatPrice(product.price)}</span>
              {product.originalPrice && <span className="text-sm text-gray-400 line-through mb-0.5">{formatPrice(product.originalPrice)}</span>}
            </div>
            <Link to={`/products/${product.uid}`} className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-700 border-b border-amber-700 pb-0.5 hover:text-amber-900 hover:border-amber-900 transition-colors">
              Discover
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="group flex flex-col">
      <div className="aspect-[4/5] bg-[#f0f0f0] overflow-hidden relative mb-4">
        <Link to={`/products/${product.uid}`}>
          <img src={imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
        </Link>
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          <button
            className="w-8 h-8 rounded-full bg-white/80 backdrop-blur opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all hover:bg-white text-gray-600 hover:text-red-500"
            onClick={(e) => onWishlistToggle(product, e)}
          >
            <Heart className={cn("w-4 h-4 transition-colors", isInWishlist ? "fill-amber-700 text-amber-700" : "")} />
          </button>
        </div>
        {product.originalPrice && (
          <div className="absolute top-4 left-4 bg-red-700 text-white text-[10px] uppercase tracking-widest px-3 py-1 font-bold">
            Sales
          </div>
        )}
      </div>

      <div className="text-center px-2">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-semibold mb-1">{product.brand}</p>
        <Link to={`/products/${product.uid}`}>
          <h3 className="font-serif text-lg text-gray-900 line-clamp-1 hover:text-amber-700 transition-colors mb-2">{product.name}</h3>
        </Link>
        <div className="flex justify-center items-center gap-3">
          <span className="font-light text-gray-900">{formatPrice(product.price)}</span>
          {product.originalPrice && <span className="text-sm font-light text-gray-400 line-cross">{formatPrice(product.originalPrice)}</span>}
        </div>
      </div>
    </div>
  )
}
