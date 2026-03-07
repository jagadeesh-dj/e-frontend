import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
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

export default function Home() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const featuredProducts = mockProducts.slice(0, 6)

  return (
    <div>
      <section className="relative min-h-[85vh] md:min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-amber-50 via-white to-amber-50/50">
        <div className="absolute inset-0 gradient-warm pointer-events-none" />
        
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <Badge variant="secondary" className="text-xs sm:text-sm px-3 sm:px-4 py-1 bg-amber-100 text-amber-700 hover:bg-amber-200">
                New Collection 2024
              </Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold leading-tight text-gray-900">
                Discover
                <span className="text-primary"> Premium </span>
                Products
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-lg leading-relaxed">
                Curated selection of premium products for the modern lifestyle. 
                Quality craftsmanship meets contemporary design.
              </p>
              <div className="flex flex-wrap gap-3 sm:gap-4">
                <Link to="/products">
                  <Button size="lg" className="gap-2 btn-premium shadow-premium hover:shadow-premium-lg text-sm sm:text-base">
                    Shop Now
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/products?category=electronics">
                  <Button size="lg" variant="outline" className="border-gray-300 hover:border-primary hover:bg-amber-50 text-sm sm:text-base">
                    Explore Electronics
                  </Button>
                </Link>
              </div>
              
              <div className="flex items-center gap-4 sm:gap-8 pt-2 sm:pt-4 overflow-x-auto">
                <div className="text-center min-w-fit">
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900">50K+</div>
                  <div className="text-xs sm:text-sm text-gray-500">Happy Customers</div>
                </div>
                <div className="text-center min-w-fit">
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900">1000+</div>
                  <div className="text-xs sm:text-sm text-gray-500">Products</div>
                </div>
                <div className="text-center min-w-fit">
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900">4.9</div>
                  <div className="text-xs sm:text-sm text-gray-500">Rating</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative w-full aspect-square">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-100 via-transparent to-amber-50 rounded-full blur-3xl" />
                <img
                  src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"
                  alt="Featured Product"
                  className="relative z-10 w-full h-full object-cover rounded-3xl shadow-soft-xl"
                />
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -right-8 top-1/4 z-20 bg-white rounded-2xl p-4 shadow-soft-lg border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-premium">
                      <Truck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Free Shipping</div>
                      <div className="text-xs text-gray-500">On orders $50+</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
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
        <div className="container mx-auto px-4">
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
        <div className="container mx-auto px-4">
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
        <div className="container mx-auto px-4">
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
        <div className="container mx-auto px-4 text-center">
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
