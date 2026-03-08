import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ShoppingBag, Sparkles, Truck, Gift, ArrowRight } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'

interface HeroBannerProps {
  title?: string
  subtitle?: string
  ctaText?: string
  ctaLink?: string
}

export default function HeroBanner({
  title = 'Celebrate Every Moment',
  subtitle = 'Discover exquisite cakes, fresh flowers, and personalized gifts for life\'s special occasions',
  ctaText = 'Shop Now',
  ctaLink = '/products',
}: HeroBannerProps) {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 500], [0, 100])
  const opacity = useTransform(scrollY, [0, 300], [1, 0])

  const stats = [
    { icon: Gift, value: '500+', label: 'Unique Gifts' },
    { icon: Truck, value: 'Same Day', label: 'Delivery' },
    { icon: Sparkles, value: '4.9★', label: 'Rating' },
  ]

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden gradient-hero pt-18">
      {/* Animated Background Elements */}
      <motion.div style={{ y, opacity }} className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-100/50 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-200/40 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-50/60 rounded-full blur-3xl animate-pulse" />
        
        {/* Floating decorative elements */}
        <motion.div
          animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-32 right-32 w-16 h-16 bg-gradient-to-br from-primary/10 to-transparent rounded-2xl blur-xl"
        />
        <motion.div
          animate={{ y: [0, 20, 0], rotate: [0, -8, 8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          className="absolute bottom-40 left-20 w-24 h-24 bg-gradient-to-tr from-primary-100/20 to-transparent rounded-full blur-xl"
        />
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="space-y-6 md:space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Badge variant="soft" size="lg" className="badge-glow bg-primary-100 text-primary-700">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                New Collection 2026
              </Badge>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight text-gray-900"
            >
              {title.split(' ').map((word, i) => (
                <span key={i}>
                  {i === 1 || i === 2 ? (
                    <span className="bg-gradient-to-r from-primary via-primary-600 to-primary bg-clip-text text-transparent">
                      {' '}{word}
                    </span>
                  ) : (
                    <span>{i === 0 ? '' : ' '}{word}</span>
                  )}
                </span>
              ))}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg md:text-xl text-gray-600 max-w-lg leading-relaxed"
            >
              {subtitle}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-3 sm:gap-4"
            >
              <Link to={ctaLink}>
                <Button
                  size="xl"
                  glow
                  leftIcon={<ShoppingBag className="w-5 h-5" />}
                  className="bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-xl shadow-primary/25 hover:shadow-primary/40"
                >
                  {ctaText}
                </Button>
              </Link>
              <Link to="/products?category=combos">
                <Button
                  size="xl"
                  variant="outline"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                  className="border-primary/30 text-primary hover:bg-primary/10 rounded-2xl"
                >
                  Explore Combos
                </Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-3 gap-4 sm:gap-6 pt-4 md:pt-6"
            >
              {stats.map((stat, index) => (
                <div key={index} className="text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                    <stat.icon className="w-5 h-5 text-primary" />
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                      {stat.value}
                    </div>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative">
              {/* Main Image */}
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="relative z-10"
              >
                <div className="relative w-full aspect-square">
                  <img
                    src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800"
                    alt="Featured Products"
                    className="w-full h-full object-cover rounded-3xl shadow-2xl shadow-primary/20"
                  />
                  
                  {/* Floating Badge - Free Shipping */}
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                    className="absolute -right-4 top-1/4 z-20 glass-card p-4 shadow-xl rounded-2xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center shadow-lg">
                        <Truck className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Free Shipping</div>
                        <div className="text-xs text-gray-500">On orders $50+</div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Discount Badge */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1, type: 'spring', stiffness: 200 }}
                    className="absolute -left-4 bottom-1/4 z-20 bg-gradient-to-br from-primary via-primary-600 to-primary-700 text-white rounded-2xl p-4 shadow-xl"
                  >
                    <div className="text-2xl font-bold">50%</div>
                    <div className="text-xs opacity-90">OFF</div>
                  </motion.div>

                  {/* Gift Icon Badge */}
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                    className="absolute -top-4 -right-4 z-20 w-16 h-16 bg-gradient-to-br from-secondary to-secondary-600 rounded-2xl flex items-center justify-center shadow-xl"
                  >
                    <Gift className="w-8 h-8 text-white" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Background Decorative Circle */}
              <div className="absolute inset-0 -z-10">
                <div className="w-full h-full rounded-3xl bg-gradient-to-br from-primary-100 to-primary-200 blur-2xl opacity-50 scale-95" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
    </section>
  )
}
