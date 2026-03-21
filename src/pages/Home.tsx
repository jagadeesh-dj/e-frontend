import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useScroll, useTransform, useSpring } from 'framer-motion'
import {
  ArrowRight,
  Shield,
  Truck,
  RotateCcw,
  Star,
  Heart,
  Sparkles,
  Gift,
  Clock,
  ChevronRight,
  ShoppingBag,
  Gem,
  CheckCircle2,
  Calendar,
  Search,
  Palette,
  Camera,
  Layers,
} from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { formatPrice, cn } from '../lib/utils'
import api from '../services/api'
import { mapProduct } from '../store/slices/productSlice'
import { Product } from '../types'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { addToWishlist, removeFromWishlist } from '../store/slices/wishlistSlice'
import { addToast } from '../store/slices/uiSlice'

/* ── Static Data ── */


const occasions = [
  { name: 'Birthday', icon: Gift },
  { name: 'Anniversary', icon: Heart },
  { name: 'Wedding', icon: Gem },
  { name: 'Corporate', icon: Shield },
  { name: 'Festive', icon: Sparkles }
]

const heroSlides = [
  {
    title: 'The Art of',
    titleAccent: 'Gifting',
    subtitle: 'Meticulously curated premium gifts for life’s most celebrated moments.',
    image: 'https://images.unsplash.com/photo-1549464104-bb22ca201532?q=80&w=2070&auto=format&fit=crop',
    badge: 'Limited Edition'
  },
  {
    title: 'Signature',
    titleAccent: 'Treasures',
    subtitle: 'Exceptional quality meets unparalleled design in our latest artisanal collection.',
    image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?q=80&w=2070&auto=format&fit=crop',
    badge: 'New Collection'
  },
]

const partners = [
  "Vogue", "Harper's Bazaar", "Forbes Lux", "The New York Times", "Elle Decor", "Tatler", "GQ Style"
]

const priceGuides = [
  { label: 'Gifts Under $100', href: '/products?max_price=100' },
  { label: 'Gifts Under $250', href: '/products?max_price=250' },
  { label: 'Gifts Under $500', href: '/products?max_price=500' },
  { label: 'Bespoke Luxury', href: '/products?min_price=500' },
]

const SLIDE_DURATION = 6000

/* ═══════════════ HOME PAGE ═══════════════ */

export default function Home() {
  const dispatch = useAppDispatch()
  const { items: wishlistItems } = useAppSelector((state) => state.wishlist)
  const { isAuthenticated } = useAppSelector((state) => state.auth)
  
  const [currentSlide, setCurrentSlide] = useState(0)
  const [bestsellers, setBestsellers] = useState<Product[]>([])
  const [feedProducts, setFeedProducts] = useState<Product[]>([])
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [emailValue, setEmailValue] = useState('')

  const containerRef = useRef<HTMLDivElement>(null)
  const observerTarget = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })
  const heroY = useTransform(smoothProgress, [0, 0.2], [0, 80])
  const heroOpacity = useTransform(smoothProgress, [0, 0.15], [1, 0])

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const res = await api.get('/products', { params: { page: 1, page_size: 4 } })
        const productsList = (res.data.data || []).map(mapProduct)
        setBestsellers(productsList)
      } catch (err) {
        console.error('Failed to load home data', err)
      }
    }
    fetchInitialData()
  }, [])

  // Infinite Scroll Logic
  const fetchMoreProducts = useCallback(async () => {
    if (isPageLoading || !hasMore) return
    setIsPageLoading(true)
    try {
      const res = await api.get('/products', { params: { page: page, page_size: 8 } })
      const productsList = (res.data.data || []).map(mapProduct)
      
      if (productsList.length === 0) {
        setHasMore(false)
      } else {
        setFeedProducts(prev => [...prev, ...productsList])
        setPage(prev => prev + 1)
      }
    } catch (err) {
      console.error('Failed to fetch more products', err)
    } finally {
      setIsPageLoading(false)
    }
  }, [page, isPageLoading, hasMore])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore) {
          fetchMoreProducts()
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [fetchMoreProducts, hasMore])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, SLIDE_DURATION)
    return () => clearInterval(timer)
  }, [])

  const handleWishlistToggle = (product: Product, e: React.MouseEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      dispatch(addToast({ type: 'warning', title: 'Please login to save pieces' }))
      return
    }
    const isInWishlist = wishlistItems.some((item) => item.id === (product.uid || product.id))
    if (isInWishlist) {
      dispatch(removeFromWishlist(product.uid || product.id))
    } else {
      dispatch(addToWishlist(product))
    }
  }

  const slide = heroSlides[currentSlide]

  return (
    <div ref={containerRef} className="bg-[#faf9f6]">
      {/* ═══════════ 1. CLASSICAL HERO ═══════════ */}
      <section className="relative h-[85vh] w-full overflow-hidden bg-black">
        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="absolute inset-0 w-full h-full"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="absolute inset-0"
            >
              <img 
                src={slide.image} 
                className="w-full h-full object-cover opacity-60" 
                alt="Classical Gifting" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?q=80&w=2070&auto=format&fit=crop'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <div className="absolute inset-0 flex flex-col justify-center items-center px-6 text-center z-10">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <Badge className="mb-6 bg-white/10 backdrop-blur-md border border-white/20 text-white uppercase tracking-[0.4em] px-8 py-2 font-light text-[10px] rounded-none">
              {slide.badge}
            </Badge>
            <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl text-white leading-[1.1] mb-8 tracking-tight">
              {slide.title} <br/>
              <span className="italic font-light text-gray-300">{slide.titleAccent}</span>
            </h1>
            <p className="text-white/70 max-w-xl text-lg md:text-xl font-light leading-relaxed mb-12">
              {slide.subtitle}
            </p>
            <Link to="/products">
              <Button size="lg" className="bg-white text-gray-900 hover:bg-amber-800 hover:text-white rounded-none h-14 px-12 text-[10px] tracking-[0.3em] font-bold uppercase transition-all duration-500">
                Explore Collections
              </Button>
            </Link>
          </motion.div>
        </div>

        <div className="absolute bottom-12 flex gap-4 z-20">
           {heroSlides.map((_, i) => (
             <button 
               key={i} 
               onClick={() => setCurrentSlide(i)}
               className={cn("h-0.5 transition-all duration-700", currentSlide === i ? "w-12 bg-white" : "w-6 bg-white/30")}
             />
           ))}
        </div>
      </section>

      {/* ═══════════ 2. INFINITE MARQUEE (Partners) ═══════════ */}
      <div className="bg-white border-b border-gray-100 overflow-hidden py-8">
         <motion.div 
           animate={{ x: [0, -1000] }}
           transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
           className="flex gap-20 whitespace-nowrap px-10 items-center"
         >
            {[...partners, ...partners, ...partners].map((partner, i) => (
              <span key={i} className="text-gray-300 font-serif text-xl md:text-2xl tracking-widest">{partner}</span>
            ))}
         </motion.div>
      </div>

      {/* ═══════════ 3. OCCASION NAVIGATION ═══════════ */}
      <section className="py-20 border-b border-gray-200/50 bg-white">
        <div className="max-w-[1400px] mx-auto px-6">
           <div className="flex flex-wrap justify-between gap-8 items-center">
              {occasions.map((occ, i) => (
                <Link key={i} to={`/products?category=${occ.name.toLowerCase()}`} className="flex flex-col items-center gap-4 group min-w-[100px]">
                   <div className="w-16 h-16 rounded-full border border-gray-100 flex items-center justify-center transition-all duration-500 group-hover:border-amber-900 group-hover:bg-amber-50 text-gray-400 group-hover:text-amber-900">
                      <occ.icon className="w-6 h-6" strokeWidth={1} />
                   </div>
                   <span className="text-[10px] uppercase font-semibold tracking-widest text-gray-400 group-hover:text-gray-900">{occ.name}</span>
                </Link>
              ))}
           </div>
        </div>
      </section>

      {/* ═══════════ 4. THE COLLECTIONS (Editorial Showcase) ═══════════ */}
      <section className="py-32 relative overflow-hidden bg-white">
        {/* Subtle Decorative Background Element */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[#faf9f6] -z-10" />
        
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-20 gap-8">
            <div className="max-w-2xl">
              <span className="text-amber-800 text-[10px] uppercase tracking-[0.4em] font-bold mb-4 block">Seasonal Edit</span>
              <h2 className="font-serif text-5xl md:text-6xl text-gray-900 leading-tight">Curated <span className="italic font-light text-gray-400">Atmospheres</span></h2>
              <p className="mt-6 text-gray-500 font-light text-lg leading-relaxed">
                Discover our meticulously assembled collections, each designed to evoke a unique sensory experience and celebrate life's most profound milestones.
              </p>
            </div>
            <Link 
              to="/products" 
              className="group flex items-center gap-4 text-[10px] uppercase tracking-[0.3em] font-bold text-gray-900"
            >
              Explore All <div className="w-12 h-[1px] bg-gray-200 group-hover:w-20 group-hover:bg-amber-800 transition-all duration-500" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-auto md:h-[900px]">
            {/* Main Featured Category */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-7 md:row-span-2 relative group overflow-hidden"
            >
              <Link to="/products?category=wedding" className="block w-full h-full relative">
                <img 
                  src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2069&auto=format&fit=crop" 
                  className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-[2500ms] ease-out group-hover:scale-105" 
                  alt="Wedding Atelier" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-12 flex flex-col justify-end">
                  <span className="text-white/60 text-[9px] uppercase tracking-[0.4em] mb-4">The Ceremony</span>
                  <h3 className="font-serif text-4xl md:text-5xl text-white mb-4">The Wedding Atelier</h3>
                  <p className="text-white/40 text-sm font-light max-w-sm mb-8 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700">
                    Timeless treasures crafted for the most sacred of vows. Discover high-jewelry and artisanal keepsakes.
                  </p>
                  <div className="w-10 h-10 border border-white/20 flex items-center justify-center group-hover:w-full group-hover:bg-white group-hover:text-amber-900 transition-all duration-700">
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Top Right Category */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="md:col-span-5 md:row-span-1 relative group overflow-hidden"
            >
              <Link to="/products?category=jewelry" className="block w-full h-full relative">
                <img 
                  src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=2000&auto=format&fit=crop" 
                  className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110" 
                  alt="Jewelry" 
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-700 p-10 flex flex-col justify-center items-center text-center">
                  <h3 className="font-serif text-3xl text-white mb-4 tracking-tight">The Jewelry Vault</h3>
                  <div className="h-[1px] w-0 group-hover:w-20 bg-amber-400 transition-all duration-700 mx-auto mb-4" />
                  <span className="text-white/80 text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Bespoke Ornaments</span>
                </div>
              </Link>
            </motion.div>

            {/* Bottom Middle Category */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="md:col-span-5 md:row-span-1 relative group overflow-hidden"
            >
              <Link to="/products?category=hampers" className="block w-full h-full relative">
                <div className="absolute inset-0 bg-[#0a0a0a]/10 group-hover:bg-transparent transition-all z-10" />
                <img 
                  src="https://images.unsplash.com/photo-1522673607200-164483ee3540?q=80&w=2000&auto=format&fit=crop" 
                  className="w-full h-full object-cover transition-transform duration-[3000ms] scale-110 group-hover:scale-100" 
                  alt="Gourmet" 
                />
                <div className="absolute bottom-10 left-10 z-20">
                   <h3 className="font-serif text-3xl text-white mb-2 drop-shadow-lg">Gourmet Haven</h3>
                   <span className="text-amber-400 text-[10px] uppercase tracking-[0.2em] font-bold">Artisanal Tastes</span>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ 5. GIFT GUIDE BY PRICE (New Layout) ═══════════ */}
      <section className="py-24 bg-white border-y border-gray-100">
         <div className="max-w-[1400px] mx-auto px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-12">
               {priceGuides.map((guide, i) => (
                 <Link key={i} to={guide.href} className="flex items-center justify-between p-8 border border-gray-100 hover:border-amber-900 transition-all group">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 group-hover:text-amber-900">{guide.label}</span>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-amber-900 group-hover:translate-x-1 transition-all" />
                 </Link>
               ))}
            </div>
         </div>
      </section>

      {/* ═══════════ 6. THE BESTSELLERS ═══════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 text-center">
          <div className="mb-20">
            <span className="text-amber-800 text-[10px] uppercase tracking-[0.4em] font-bold mb-4 block">Our most appreciated gifts</span>
            <h2 className="font-serif text-5xl text-gray-900 tracking-tight">Most Loved Pieces</h2>
          </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
              {bestsellers.map((product, i) => (
                <ProductCard key={product.uid || product.id} product={product} wishlistItems={wishlistItems} onWishlistToggle={handleWishlistToggle} />
              ))}
           </div>
        </div>
      </section>

      {/* ═══════════ 7. PERSONALIZATION BANNER (Editorial) ═══════════ */}
      <section className="py-24 bg-amber-900 text-white">
         <div className="max-w-[1400px] mx-auto px-6">
            <div className="flex flex-col lg:flex-row gap-20 items-center">
               <div className="lg:w-1/2">
                  <span className="text-amber-600 text-[10px] uppercase tracking-[0.4em] font-bold mb-8 block">The Atelier Experience</span>
                  <h2 className="font-serif text-5xl md:text-7xl leading-tight mb-8">Personalized <br/><span className="italic font-light">to Perfection</span></h2>
                  <p className="text-white/40 text-lg font-light leading-relaxed mb-12 max-w-lg">Add a unique touch to your gifts with our hand-engraving and bespoke monogramming services. Every piece tells a personal story.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
                     <div className="flex gap-4 items-start">
                        <Palette className="w-5 h-5 text-amber-600 shrink-0" strokeWidth={1.5} />
                        <div>
                           <h4 className="font-bold text-xs uppercase tracking-widest mb-2">Engraving</h4>
                           <p className="text-white/30 text-xs">Laser precision for jewelry & glass.</p>
                        </div>
                     </div>
                     <div className="flex gap-4 items-start">
                        <Camera className="w-5 h-5 text-amber-600 shrink-0" strokeWidth={1.5} />
                        <div>
                           <h4 className="font-bold text-xs uppercase tracking-widest mb-2">Photo Gifts</h4>
                           <p className="text-white/30 text-xs">Print high-fidelity memories.</p>
                        </div>
                     </div>
                  </div>
                  <Link to="/products?customizable=true">
                     <Button className="bg-white text-amber-900 hover:bg-amber-800 hover:text-white rounded-none h-14 px-12 text-[10px] uppercase tracking-[0.3em] font-bold">Personalize Now</Button>
                  </Link>
               </div>
               <div className="lg:w-1/2 relative">
                  <div className="aspect-square grayscale hover:grayscale-0 transition-all duration-1000 overflow-hidden">
                     <img src="https://images.unsplash.com/photo-1549461051-7b7072551ec4?q=80&w=2000&auto=format&fit=crop" className="w-full h-full object-cover" alt="Personalization" />
                  </div>
                  <div className="absolute top-10 right-10 p-10 bg-white/5 backdrop-blur-xl border border-white/10 hidden md:block">
                     <Layers className="w-8 h-8 text-amber-600 mb-4" />
                     <p className="text-[10px] uppercase tracking-[0.2em] font-bold">100+ Motifs Available</p>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* ═══════════ 8. INFINITE PRODUCT FEED (Infinity Scroll) ═══════════ */}
      <section className="py-24 bg-white">
         <div className="max-w-[1400px] mx-auto px-6">
            <div className="mb-20 text-center">
               <h2 className="font-serif text-4xl text-gray-900 mb-4">Discover More</h2>
               <div className="w-10 h-[1px] bg-amber-900 mx-auto" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
               {feedProducts.map((product, i) => (
                 <motion.div 
                   key={product.id + '-' + i}
                   initial={{ opacity: 0, y: 10 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                 >
                    <ProductCard product={product} wishlistItems={wishlistItems} onWishlistToggle={handleWishlistToggle} />
                 </motion.div>
               ))}
               
               {/* Skeletons while loading more */}
               {isPageLoading && [...Array(4)].map((_, i) => (
                 <div key={i} className="animate-pulse">
                    <div className="aspect-[4/5] bg-gray-100 mb-6" />
                    <div className="h-4 bg-gray-100 w-3/4 mx-auto mb-2" />
                    <div className="h-4 bg-gray-100 w-1/4 mx-auto" />
                 </div>
               ))}
            </div>

            {/* Intersection Observer Target */}
            <div ref={observerTarget} className="h-20 w-full flex items-center justify-center mt-10">
               {!hasMore && <p className="text-gray-400 font-light italic">You have curated our entire collection.</p>}
            </div>
         </div>
      </section>

      {/* ═══════════ 9. THE BOUTIQUE STANDARDS ═══════════ */}
      <section className="py-24 bg-[#faf9f6] border-y border-gray-100">
        <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-16">
          <div className="flex flex-col items-center text-center group">
            <div className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center mb-6 group-hover:bg-white transition-colors text-gray-400 group-hover:text-amber-900">
              <Truck className="w-5 h-5" strokeWidth={1} />
            </div>
            <h4 className="font-bold text-[10px] uppercase tracking-widest mb-3">The Boutique Standards</h4>
            <p className="text-gray-500 text-sm font-light leading-relaxed max-w-xs">Complimentary shipping on all curated orders exceeding $200.</p>
          </div>
          <div className="flex flex-col items-center text-center group">
            <div className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center mb-6 group-hover:bg-white transition-colors text-gray-400 group-hover:text-amber-900">
              <Shield className="w-5 h-5" strokeWidth={1} />
            </div>
            <h4 className="font-bold text-[10px] uppercase tracking-widest mb-3">Certified Quality</h4>
            <p className="text-gray-500 text-sm font-light leading-relaxed max-w-xs">Every treasure is verified for authenticity and artisanal excellence.</p>
          </div>
          <div className="flex flex-col items-center text-center group">
            <div className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center mb-6 group-hover:bg-white transition-colors text-gray-400 group-hover:text-amber-900">
              <RotateCcw className="w-5 h-5" strokeWidth={1} />
            </div>
            <h4 className="font-bold text-[10px] uppercase tracking-widest mb-3">Seamless Assistance</h4>
            <p className="text-gray-500 text-sm font-light leading-relaxed max-w-xs">Our concierge is available 24/7 for effortless exchanges and returns.</p>
          </div>
        </div>
      </section>

      {/* ═══════════ 10. CLEAN NEWSLETTER ═══════════ */}
      <section className="py-40 bg-amber-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <Gem className="w-12 h-12 text-amber-600 mx-auto mb-10 opacity-40" strokeWidth={1} />
          <h2 className="font-serif text-6xl mb-8 tracking-tight">The Elite Gifting Circle</h2>
          <p className="text-gray-400 text-xl font-light mb-16 max-w-2xl mx-auto">Exclusive access to private reveals, artisanal premieres, and festive curators.</p>
           <form 
              className="flex flex-col sm:flex-row gap-4 border-b border-white/20 pb-4"
              onSubmit={(e) => {
                e.preventDefault()
                if (emailValue.trim()) {
                  dispatch(addToast({ type: 'success', title: 'Welcome', message: 'You have joined the Elite Gifting Circle.' }))
                  setEmailValue('')
                }
              }}
           >
              <input 
                type="email" 
                placeholder="Indicate your email address" 
                value={emailValue}
                onChange={(e) => setEmailValue(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder:text-gray-500 outline-none px-6 py-4 tracking-widest text-lg font-light"
                required
              />
              <button type="submit" className="text-[12px] uppercase tracking-[0.4em] font-extrabold text-amber-600 hover:text-white transition-all px-10 py-4">
                 Join
              </button>
           </form>
        </div>
      </section>
    </div>
  )
}

/* ═══════════ PRODUCT CARD COMPONENT (Classical) ═══════════ */

function ProductCard({
  product,
  wishlistItems,
  onWishlistToggle,
}: {
  product?: Product
  wishlistItems: Product[]
  onWishlistToggle: (product: Product, e: React.MouseEvent) => void
}) {
  if (!product) {
    return (
      <div className="flex flex-col h-full animate-pulse">
        <div className="aspect-[4/5] bg-gray-100 mb-6" />
        <div className="h-4 bg-gray-100 rounded w-3/4 mb-4 mx-auto" />
      </div>
    )
  }

  const isWished = wishlistItems.some((w) => w.id === (product.uid || product.id))
  const imageUrl = product.image_url || product.images?.[0] || 'https://images.unsplash.com/photo-1549464104-bb22ca201532?q=80&w=2000&auto=format&fit=crop'

  return (
    <div className="group flex flex-col">
      <div className="aspect-[4/5] bg-[#f0f0f0] overflow-hidden relative mb-6">
        <Link to={`/products/${product.uid || product.id}`}>
          <img 
            src={imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549464104-bb22ca201532?q=80&w=2000&auto=format&fit=crop'
            }}
          />
        </Link>
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          <button 
            className="w-10 h-10 rounded-full bg-white/80 backdrop-blur opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all hover:bg-white text-gray-600 shadow-xl" 
            onClick={(e) => onWishlistToggle(product, e)}
          >
            <Heart className={cn("w-4 h-4 transition-colors", isWished ? "fill-amber-900 text-amber-900 border-none" : "border-none")} />
          </button>
        </div>
        {product.originalPrice && (
          <div className="absolute top-4 left-4 bg-red-700 text-white text-[10px] uppercase tracking-widest px-4 py-1.5 font-bold">
            Sales
          </div>
        )}
      </div>
      
      <div className="text-center px-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-semibold mb-2">{product.brand || 'Atelier'}</p>
        <Link to={`/products/${product.uid || product.id}`}>
          <h3 className="font-serif text-xl text-gray-900 line-clamp-1 hover:text-amber-900 transition-colors mb-3 leading-tight">{product.name}</h3>
        </Link>
        <div className="flex justify-center items-center gap-4">
          <span className="font-light text-gray-900 text-lg">{formatPrice(product.price)}</span>
          {product.originalPrice && <span className="text-sm font-light text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>}
        </div>
      </div>
    </div>
  )
}
