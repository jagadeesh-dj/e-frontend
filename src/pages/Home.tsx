import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Shield, Truck, CreditCard, RotateCcw, Star, ChevronLeft, ChevronRight, Heart, Plus } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { formatPrice } from '../lib/utils'
import api from '../services/api'
import { mapProduct } from '../store/slices/productSlice'
import { Product, Category } from '../types'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { addToWishlist, removeFromWishlist } from '../store/slices/wishlistSlice'
import { addToast } from '../store/slices/uiSlice'
import { cn } from '../lib/utils'

const features = [
  { icon: Shield, title: 'Secure Payments', desc: 'Your transactions are fully encrypted and secure' },
  { icon: Truck, title: 'Fast Shipping', desc: 'Free delivery on orders over $50' },
  { icon: CreditCard, title: 'Easy Checkout', desc: 'Multiple payment methods available' },
  { icon: RotateCcw, title: 'Easy Returns', desc: '30-day hassle-free return policy' },
]

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Verified Buyer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    rating: 5,
    text: 'Absolutely love shopping here! The product quality is outstanding and the delivery was super fast.',
  },
  {
    name: 'Michael Chen',
    role: 'Verified Buyer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    rating: 5,
    text: 'Best online shopping experience I have ever had. The customer service team is incredibly helpful.',
  },
  {
    name: 'Emily Davis',
    role: 'Verified Buyer',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    rating: 5,
    text: 'The products exceeded my expectations. Will definitely be ordering again soon!',
  },
]

const promoSlides = [
  {
    title: 'Premium Gift Drops With Up To 50% Off',
    subtitle: 'Explore curated cakes, flowers, and personalized gift boxes designed for every occasion.',
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1800&auto=format&fit=crop&q=80',
    primaryCta: { label: 'Shop Deals', href: '/products' },
    secondaryCta: { label: 'View Combos', href: '/products?category=combos' },
    badge: 'Mega Promo Collection',
  },
  {
    title: 'Same-Day Celebration Essentials',
    subtitle: 'Order fresh flowers, gourmet cakes, and gift bundles before noon for same-day delivery.',
    image: 'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?w=1800&auto=format&fit=crop&q=80',
    primaryCta: { label: 'Order Now', href: '/products?category=flowers' },
    secondaryCta: { label: 'Browse Cakes', href: '/products?category=cakes' },
    badge: 'Express Delivery',
  },
  {
    title: 'Personalized Gifts For Every Moment',
    subtitle: 'Create custom mugs, frames, and handcrafted keepsakes with premium finishes.',
    image: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?w=1800&auto=format&fit=crop&q=80',
    primaryCta: { label: 'Customize Gifts', href: '/products?category=personalized' },
    secondaryCta: { label: 'Explore Catalog', href: '/products' },
    badge: 'Limited Edition',
  },
]
export default function Home() {
  const dispatch = useAppDispatch()
  const { items: wishlistItems } = useAppSelector((state) => state.wishlist)
  const { isAuthenticated } = useAppSelector((state) => state.auth)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [currentPromo, setCurrentPromo] = useState(0)
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          api.get('/products'),
          api.get('/categories')
        ])
        const productsList = productsRes.data.data || []
        setFeaturedProducts(productsList.map(mapProduct).slice(0, 6) || [])
        setCategories(categoriesRes.data.data || [])
      } catch (err) {
        console.error("Failed to load home data", err)
      }
    }
    fetchHomeData()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPromo((prev) => (prev + 1) % promoSlides.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [])

  const currentSlide = promoSlides[currentPromo]
  const goToPrevPromo = () => setCurrentPromo((prev) => (prev - 1 + promoSlides.length) % promoSlides.length)
  const goToNextPromo = () => setCurrentPromo((prev) => (prev + 1) % promoSlides.length)

  const handleWishlistToggle = (product: Product, e: React.MouseEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      dispatch(addToast({ type: 'warning', title: 'Please login to save items' }))
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
    <div className="relative overflow-hidden bg-white">
      <section className="app-section pt-8 sm:pt-10">
        <div className="app-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative isolate overflow-hidden rounded-2xl border border-gray-200 shadow-lg"
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={currentSlide.image}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                src={currentSlide.image}
                alt="Promo Banner"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            <AnimatePresence mode="wait">
                <div className="relative flex min-h-[420px] flex-col justify-end px-6 py-10 text-white sm:min-h-[500px] sm:px-10 lg:min-h-[580px] lg:px-16">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                  >
                    <Badge className="mb-4 w-fit bg-white/20 text-white backdrop-blur-md border-white/30 font-semibold" size="lg">
                      {currentSlide.badge}
                    </Badge>
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="max-w-3xl text-5xl font-serif font-bold leading-[1.15] sm:text-6xl lg:text-7xl"
                  >
                    {currentSlide.title}
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="mt-5 max-w-2xl text-base text-white/85 sm:text-lg font-light leading-relaxed"
                  >
                    {currentSlide.subtitle}
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="mt-10 flex flex-wrap gap-3"
                  >
                    <Link to={currentSlide.primaryCta.href}>
                      <Button size="lg" className="btn-premium h-12 px-8 text-base font-semibold gap-2 bg-primary hover:bg-amber-700">
                        {currentSlide.primaryCta.label}
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </Link>
                    <Link to={currentSlide.secondaryCta.href}>
                      <Button size="lg" variant="outline" className="h-12 px-8 text-base font-semibold border-white/40 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm">
                        {currentSlide.secondaryCta.label}
                      </Button>
                    </Link>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="mt-12 grid w-full max-w-2xl grid-cols-3 gap-3 text-center sm:gap-4"
                  >
                    {[
                      { value: '50K+', label: 'Happy Customers' },
                      { value: '1000+', label: 'Curated Products' },
                      { value: '4.9★', label: 'Customer Rating' }
                    ].map((stat, i) => (
                      <div key={i} className="rounded-xl border border-white/15 bg-white/8 px-3 py-4 backdrop-blur-md">
                        <p className="text-2xl font-bold sm:text-3xl text-primary">{stat.value}</p>
                        <p className="text-[10px] uppercase tracking-wider text-white/60 sm:text-xs mt-1 font-medium">{stat.label}</p>
                      </div>
                    ))}
                  </motion.div>
                </div>
            </AnimatePresence>

            <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4 sm:p-5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
                onClick={goToPrevPromo}
                aria-label="Previous promo slide"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
                onClick={goToNextPromo}
                aria-label="Next promo slide"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2 rounded-full bg-black/25 px-3 py-1.5 backdrop-blur-sm">
              {promoSlides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrentPromo(index)}
                  aria-label={`Go to promo slide ${index + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    index === currentPromo ? 'w-8 bg-white' : 'w-2 bg-white/45 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-white relative">
        <div className="app-container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                viewport={{ once: true }}
                className="group flex flex-col items-center text-center p-6 sm:p-8 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-500"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gray-50 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-gray-100 transition-all duration-500">
                  <feature.icon className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2.5">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="app-container">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-3">Featured Products</h2>
              <p className="text-gray-600 font-light">Handpicked selections from our premium collection</p>
            </div>
            <Link to="/products">
              <Button variant="ghost" className="gap-2 text-primary hover:text-amber-700 font-semibold">
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {featuredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Link to={`/products/${product.id}`}>
                  <Card className="group relative h-full flex flex-col overflow-hidden border border-gray-200 bg-white p-3 transition-all duration-500 hover:shadow-lg rounded-xl">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-gray-100">
                      <img
                        src={(product.images && product.images[0]) || '/placeholder.png'}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      />
                      
                      {/* Premium Badge System */}
                      {product.originalPrice && (
                        <div className="absolute top-3 left-3 flex flex-col gap-1">
                          <Badge className="bg-rose-500 border-none shadow-sm text-[10px] font-bold uppercase tracking-wider h-5 px-2">
                            Sale
                          </Badge>
                          <Badge className="bg-white border-none text-gray-900 shadow-sm text-[10px] font-bold h-5 px-2">
                            -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                          </Badge>
                        </div>
                      )}

                      {/* Floating Wishlist Button */}
                      <div className="absolute top-3 right-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-8 w-8 rounded-lg bg-white border border-gray-300 shadow-md transition-all",
                            wishlistItems.some(w => w.id === product.id) 
                              ? "text-rose-500 bg-white" 
                              : "text-gray-600 hover:text-rose-500"
                          )}
                          onClick={(e) => handleWishlistToggle(product, e)}
                        >
                          <Heart className={cn("h-4 w-4", wishlistItems.some(w => w.id === product.id) && "fill-current")} />
                        </Button>
                      </div>

                      {/* View Button Overlay (Subtle) */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
                    </div>

                    <div className="flex flex-col flex-1 mt-4 px-1 pb-1">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
                          {product.category || 'Collection'}
                        </span>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span className="text-[11px] font-bold text-gray-700">{product.rating}</span>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-gray-900 leading-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[2.75rem]">
                        {product.name}
                      </h3>

                      <div className="mt-auto flex items-end justify-between pt-3">
                        <div className="flex flex-col">
                          {product.originalPrice && (
                            <span className="text-xs text-gray-400 line-through mb-0.5">
                              {formatPrice(product.originalPrice)}
                            </span>
                          )}
                          <span className="text-lg font-bold text-gray-900 tracking-tight">
                            {formatPrice(product.price)}
                          </span>
                        </div>
                        
                        <Button size="icon" className="h-9 w-9 rounded-lg btn-premium bg-primary shadow-md hover:bg-amber-700 active:scale-95 transition-all">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="app-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Shop by Category</h2>
            <p className="text-gray-500">Explore our curated collections</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
              >
                <Link to={`/products?category=${category.slug}`}>
                  <Card hover className="card-premium overflow-hidden text-center p-6 border-white/40 bg-white/50 backdrop-blur-md group">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-gray-100 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300 transform group-hover:scale-110">
                      <img
                        src={category.image || '/placeholder.png'}
                        alt={category.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors">{category.name}</h3>
                    <p className="text-xs font-semibold text-primary/70 uppercase tracking-tighter mt-1">{category.productCount || 0} Items</p>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="app-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
            <p className="text-gray-500">Join thousands of satisfied customers</p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonial}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="bg-white/60 backdrop-blur-md rounded-[3rem] p-10 md:p-16 text-center shadow-surface-md border border-white/80 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none">
                    <Star className="w-40 h-40 fill-primary" />
                  </div>
                  
                  <div className="w-24 h-24 mx-auto mb-8 rounded-full overflow-hidden ring-4 ring-primary/10 shadow-xl">
                    <img
                      src={testimonials[currentTestimonial].avatar}
                      alt={testimonials[currentTestimonial].name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex justify-center gap-1.5 mb-8">
                    {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                      <Star key={i} className="w-6 h-6 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-2xl md:text-3xl font-display text-gray-800 mb-10 leading-relaxed italic">
                    "{testimonials[currentTestimonial].text}"
                  </p>
                  <div className="space-y-1">
                    <div className="text-xl font-bold text-gray-900">{testimonials[currentTestimonial].name}</div>
                    <div className="text-sm font-semibold text-primary uppercase tracking-[0.2em]">{testimonials[currentTestimonial].role}</div>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-center gap-3 mt-10">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      index === currentTestimonial ? 'w-10 bg-primary' : 'w-2.5 bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-amber-500 to-amber-600">
        <div className="app-container text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Subscribe to Our Newsletter
          </h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            Get the latest updates on new products and upcoming sales. No spam, just the good stuff.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 h-12 px-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 text-base"
            />
            <Button size="lg" variant="secondary" className="whitespace-nowrap">
              Subscribe
            </Button>
          </form>
        </div>
      </section>
    </div>
  )
}

