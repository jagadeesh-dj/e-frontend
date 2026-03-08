import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Gift, Sparkles, Clock } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'

interface PromoBannerProps {
  title?: string
  subtitle?: string
  discount?: string
  ctaText?: string
  ctaLink?: string
  image?: string
  bgColor?: string
  reverse?: boolean
}

export default function PromoBanner({
  title = 'Get 50% Off on Your First Order',
  subtitle = 'Sign up today and enjoy exclusive discounts on premium products. Don\'t miss out on this amazing opportunity!',
  discount = '50%',
  ctaText = 'Claim Offer',
  ctaLink = '/products',
  image = 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600',
  bgColor = 'from-primary via-primary-600 to-primary-700',
  reverse = false,
}: PromoBannerProps) {
  return (
    <section className="py-16 md:py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${bgColor} shadow-2xl`}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          {/* Floating Elements */}
          <motion.div
            animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute top-10 right-10 w-24 h-24 bg-white/10 rounded-2xl blur-xl"
          />
          <motion.div
            animate={{ y: [0, 30, 0], rotate: [0, -15, 15, 0] }}
            transition={{ duration: 6, repeat: Infinity, delay: 1 }}
            className="absolute bottom-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"
          />

          <div className="relative grid lg:grid-cols-2 gap-8 items-center p-8 md:p-12 lg:p-16">
            {/* Content */}
            <div className={reverse ? 'lg:order-2' : ''}>
              <Badge variant="secondary" size="lg" className="bg-white/20 text-white border-0 mb-6">
                <Sparkles className="w-4 h-4 mr-2" />
                Limited Offer
              </Badge>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
                {title}
              </h2>

              <p className="text-lg text-white/80 mb-8 max-w-lg">
                {subtitle}
              </p>

              {/* Discount Badge */}
              <div className="flex items-center gap-4 mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
                >
                  <span className="text-3xl font-bold text-white">{discount}</span>
                </motion.div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white/80">
                    <Gift className="w-5 h-5" />
                    <span>Free gift wrapping</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <Clock className="w-5 h-5" />
                    <span>Limited time offer</span>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <Link to={ctaLink}>
                  <Button
                    size="xl"
                    className="bg-white text-primary hover:bg-gray-100 shadow-xl rounded-2xl"
                    rightIcon={<ArrowRight className="w-5 h-5" />}
                  >
                    {ctaText}
                  </Button>
                </Link>
                <Link to="/products?category=combos">
                  <Button
                    size="xl"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 rounded-2xl"
                  >
                    Explore Combos
                  </Button>
                </Link>
              </div>
            </div>

            {/* Image */}
            <div className={`relative hidden lg:block ${reverse ? 'lg:order-1' : ''}`}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="absolute inset-0 bg-white/10 rounded-3xl blur-3xl" />
                <img
                  src={image}
                  alt="Promotion"
                  className="relative rounded-3xl shadow-2xl w-full"
                />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
