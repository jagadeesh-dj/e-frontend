import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Sparkles, Users, Shield, Truck, CreditCard, Headphones,
  ArrowRight, Check, Mail, Phone, MapPin
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent } from '../components/ui/card'

const features = [
  {
    icon: Truck,
    title: 'Free Shipping',
    description: 'Free shipping on orders over $50. Fast and reliable delivery to your doorstep.'
  },
  {
    icon: Shield,
    title: 'Secure Payment',
    description: '100% secure payment with encrypted transactions. Your data is always protected.'
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Round-the-clock customer support to assist you with any queries.'
  },
  {
    icon: CreditCard,
    title: 'Easy Returns',
    description: 'Hassle-free returns within 30 days of purchase.'
  }
]

const stats = [
  { value: '50K+', label: 'Happy Customers' },
  { value: '10K+', label: 'Products' },
  { value: '99%', label: 'Satisfaction' },
  { value: '24/7', label: 'Support' }
]

const team = [
  { name: 'Jagadeesh D', role: 'Founder & CEO', image: 'https://i.pravatar.cc/300?img=1' },
  { name: 'Sarah Johnson', role: 'Head of Operations', image: 'https://i.pravatar.cc/300?img=5' },
  { name: 'Mike Chen', role: 'Tech Lead', image: 'https://i.pravatar.cc/300?img=3' },
  { name: 'Emily Davis', role: 'Customer Success', image: 'https://i.pravatar.cc/300?img=9' }
]

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-br from-amber-50 via-white to-amber-50/50">
        <div className="absolute inset-0 gradient-warm pointer-events-none" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900 tracking-tight">
                About <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-600">ShopVista</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                We're on a mission to provide the best online shopping experience with quality products,
                competitive prices, and exceptional customer service.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" asChild className="btn-premium">
                  <Link to="/products">
                    Shop Now <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild className="border-gray-300 hover:border-primary hover:bg-amber-50">
                  <Link to="/contact">Contact Us</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-gray-900">Our Story</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Founded in 2024, ShopVista started with a simple vision: to make online shopping
                  accessible, enjoyable, and trustworthy for everyone.
                </p>
                <p>
                  What began as a small venture has grown into a trusted marketplace featuring
                  thousands of products across multiple categories, from electronics to fashion,
                  home essentials to beauty products.
                </p>
                <p>
                  We believe in building lasting relationships with our customers through transparency,
                  quality, and unwavering commitment to customer satisfaction.
                </p>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-2xl overflow-hidden shadow-soft-xl group relative">
                <div className="absolute inset-0 bg-primary/10 mix-blend-overlay z-10 group-hover:bg-transparent transition-colors duration-500" />
                <img
                  src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=800"
                  alt="Our team"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-6 -right-6 bg-white rounded-2xl p-5 shadow-soft-xl hidden lg:block border border-gray-100"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center shadow-premium">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">Since 2024</p>
                    <p className="text-sm text-gray-500 font-medium">Serving customers</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Why Choose Us</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              We're committed to providing you with the best shopping experience possible
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="card-premium h-full">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2 text-gray-900">{feature.title}</h3>
                    <p className="text-sm text-gray-500">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Meet Our Team</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              The passionate people behind ShopVista who work tirelessly to bring you the best
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <Card className="card-premium overflow-hidden border-0 group shadow-soft hover:shadow-soft-xl">
                  <div className="aspect-square relative overflow-hidden mb-4">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-4 pt-0 transition-transform duration-300 group-hover:-translate-y-2">
                    <h3 className="font-bold text-gray-900 text-lg">{member.name}</h3>
                    <p className="text-sm font-medium text-primary">{member.role}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-r from-amber-500 to-amber-600">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4 text-white">Get In Touch</h2>
            <p className="text-white/80 mb-8">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="bg-white text-amber-600 hover:bg-gray-100">
                <Link to="/contact">
                  Contact Us <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="border-white text-white hover:bg-white/10">
                <Link to="/products">Browse Products</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
