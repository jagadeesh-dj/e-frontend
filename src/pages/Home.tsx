import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Shield, Truck, CreditCard, RotateCcw, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { mockProducts, mockCategories } from '../data/mockData'
import { formatPrice } from '../lib/utils'

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
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [currentPromo, setCurrentPromo] = useState(0)

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

  const featuredProducts = mockProducts.slice(0, 6)
  const currentSlide = promoSlides[currentPromo]
  const goToPrevPromo = () => setCurrentPromo((prev) => (prev - 1 + promoSlides.length) % promoSlides.length)
  const goToNextPromo = () => setCurrentPromo((prev) => (prev + 1) % promoSlides.length)

  return (
    <div>
      <section className="app-section pt-5 sm:pt-6">
        <div className="app-container">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="relative isolate overflow-hidden rounded-[2rem] border border-white/70 shadow-surface-md"
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={currentSlide.image}
                initial={{ opacity: 0, scale: 1.06 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.03 }}
                transition={{ duration: 0.65, ease: 'easeOut' }}
                src={currentSlide.image}
                alt="Promo Banner"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-r from-[#1e1912]/85 via-[#2f2518]/55 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

            <AnimatePresence mode="wait">
              <motion.div
                key={currentPromo}
                initial={{ opacity: 0, x: 42 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -42 }}
                transition={{ duration: 0.42, ease: 'easeOut' }}
                className="relative flex min-h-[430px] flex-col justify-end px-6 py-8 text-white sm:min-h-[520px] sm:px-10 sm:py-10 lg:min-h-[620px] lg:px-14"
              >
                <Badge className="mb-5 w-fit bg-white/15 text-white backdrop-blur-md" size="lg">
                  {currentSlide.badge}
                </Badge>
                <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                  {currentSlide.title}
                </h1>
                <p className="mt-4 max-w-2xl text-sm text-white/85 sm:text-lg">
                  {currentSlide.subtitle}
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <Link to={currentSlide.primaryCta.href}>
                    <Button size="lg" className="btn-premium gap-2">
                      {currentSlide.primaryCta.label}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to={currentSlide.secondaryCta.href}>
                    <Button size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
                      {currentSlide.secondaryCta.label}
                    </Button>
                  </Link>
                </div>

                <div className="mt-8 grid w-full max-w-xl grid-cols-3 gap-3 text-center sm:gap-4">
                  <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-3 backdrop-blur-sm">
                    <p className="text-lg font-bold sm:text-2xl">50K+</p>
                    <p className="text-[11px] uppercase tracking-[0.08em] text-white/80 sm:text-xs">Happy Customers</p>
                  </div>
                  <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-3 backdrop-blur-sm">
                    <p className="text-lg font-bold sm:text-2xl">1000+</p>
                    <p className="text-[11px] uppercase tracking-[0.08em] text-white/80 sm:text-xs">Curated Products</p>
                  </div>
                  <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-3 backdrop-blur-sm">
                    <p className="text-lg font-bold sm:text-2xl">4.9</p>
                    <p className="text-[11px] uppercase tracking-[0.08em] text-white/80 sm:text-xs">Customer Rating</p>
                  </div>
                </div>
              </motion.div>
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

      <section className="py-16 bg-white">
        <div className="app-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center p-6 rounded-2xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="app-container">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Featured Products</h2>
              <p className="text-gray-500">Handpicked selections from our premium collection</p>
            </div>
            <Link to="/products">
              <Button variant="ghost" className="gap-2 text-primary hover:text-amber-700">
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {featuredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Link to={`/products/${product.id}`}>
                  <Card hover className="card-premium overflow-hidden group">
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
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                    </div>
                    <div className="p-4 space-y-2">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
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
            {mockCategories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
              >
                <Link to={`/products?category=${category.slug}`}>
                  <Card hover className="card-premium overflow-hidden text-center p-4">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-xl overflow-hidden bg-gray-100">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="font-medium text-gray-900">{category.name}</h3>
                    <p className="text-xs text-gray-500">{category.productCount} products</p>
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

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="bg-white rounded-3xl p-8 md:p-12 text-center shadow-soft-lg border border-gray-100"
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-full overflow-hidden">
                  <img
                    src={testimonials[currentTestimonial].avatar}
                    alt={testimonials[currentTestimonial].name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex justify-center gap-1 mb-4">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xl md:text-2xl text-gray-700 mb-6">"{testimonials[currentTestimonial].text}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonials[currentTestimonial].name}</div>
                  <div className="text-sm text-gray-500">{testimonials[currentTestimonial].role}</div>
                </div>
              </motion.div>

              <div className="flex justify-center gap-2 mt-6">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentTestimonial ? 'w-8 bg-primary' : 'bg-gray-300'
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

