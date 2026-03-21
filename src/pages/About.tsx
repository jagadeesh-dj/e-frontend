import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Sparkles, Shield, Truck, CreditCard, Headphones,
  ArrowRight
} from 'lucide-react'
import { Button } from '../components/ui/button'

const features = [
  {
    icon: Truck,
    title: 'Free Shipping',
    description: 'Fast and secure shipping delivered directly to your door.'
  },
  {
    icon: Shield,
    title: 'Secure Payments',
    description: 'Safe and encrypted transactions for your peace of mind.'
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Our dedicated support team is available around the clock.'
  },
  {
    icon: CreditCard,
    title: 'Easy Returns',
    description: 'No-hassle returns and exchanges within 30 days.'
  }
]

const stats = [
  { value: 'Est.', label: '2024' },
  { value: '10K+', label: 'Products' },
  { value: 'Quality', label: 'Craftsmanship' },
  { value: 'Global', label: 'Shipping' }
]

const team = [
  { name: 'Jagadeesh D', role: 'Founder & CEO', image: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=600&auto=format&fit=crop&q=80' },
  { name: 'Sarah Johnson', role: 'Head of Products', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80' },
  { name: 'Mike Chen', role: 'Head of Technology', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80' },
  { name: 'Emily Davis', role: 'Customer Success', image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&auto=format&fit=crop&q=80' }
]

export default function About() {
  return (
    <div className="min-h-screen bg-[#faf9f6]">
      {/* Hero Section */}
      <section className="relative py-24 lg:py-40 border-b border-gray-200/50">
        <div className="max-w-[1400px] mx-auto px-6 relative">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl lg:text-7xl font-serif mb-8 text-gray-900 leading-tight">
                Designed for <br />
                <span className="italic font-light text-amber-800">Quality</span>
              </h1>
              <p className="text-lg lg:text-xl text-gray-500 mb-12 font-light leading-relaxed max-w-2xl mx-auto">
                Discover our meticulously assembled collection of products. We offer a shopping experience that combines elegance with ease.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Button size="lg" asChild className="h-14 px-10 bg-amber-700 text-white rounded-none uppercase text-xs tracking-[0.2em] hover:bg-amber-800 transition-colors">
                  <Link to="/products">
                    Shop Now
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white border-b border-gray-200/50">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 divide-x divide-gray-100">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center px-4"
              >
                <div className="text-4xl lg:text-5xl font-serif text-gray-900 mb-3">{stat.value}</div>
                <div className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24 lg:py-32 bg-[#faf9f6]">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-amber-700 mb-6">Our Heritage</div>
              <h2 className="text-4xl lg:text-5xl font-serif mb-8 text-gray-900">Crafting a Legacy</h2>
              <div className="space-y-6 text-gray-500 font-light leading-relaxed text-lg">
                <p>
                  Established with a vision to provide quality products and exceptional service, we have become a trusted destination for modern shoppers.
                </p>
                <p>
                  Every piece in our collection is selected not just for its aesthetic appeal, but for the story it tells and the craftsmanship it embodies. We partner exclusively with artisans who share our unwavering commitment to excellence.
                </p>
                <p>
                   Our philosophy rests on the belief that shopping should be an enjoyable experience from discovery to delivery.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="relative aspect-[4/5] bg-gray-100"
            >
              <img
                src="https://images.unsplash.com/photo-1600607688037-4d1cc3275726?w=1200&auto=format&fit=crop&q=80"
                alt="Atelier"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 lg:py-32 bg-white border-y border-gray-200/50">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-16 lg:mb-24">
            <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-amber-700 mb-4">The Standard</div>
            <h2 className="text-4xl font-serif text-gray-900">Uncompromising Quality</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 border border-gray-200 flex items-center justify-center mx-auto mb-6 bg-[#faf9f6]">
                  <feature.icon className="w-6 h-6 text-gray-900" />
                </div>
                <h3 className="font-serif text-lg mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-sm font-light text-gray-500 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 lg:py-32 bg-[#faf9f6]">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 border-b border-gray-200/50 pb-8 gap-6">
            <div>
               <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-amber-700 mb-4">Our Team</div>
               <h2 className="text-4xl font-serif text-gray-900">The Experts</h2>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="aspect-[3/4] overflow-hidden mb-6 bg-gray-100 relative">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105"
                  />
                </div>
                <div>
                  <h3 className="font-serif text-xl text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">{member.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 lg:py-32 bg-amber-900 text-white">
        <div className="max-w-[800px] mx-auto px-6 text-center">
          <Sparkles className="w-8 h-8 text-amber-600 mx-auto mb-8 opacity-50" />
          <h2 className="text-4xl lg:text-5xl font-serif mb-6">Need Assistance?</h2>
          <p className="font-light text-gray-400 mb-12 text-lg">
            Connect with our team to learn more about our products or get help with your order.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
             <Button size="lg" asChild className="h-14 px-10 bg-white text-gray-900 rounded-none uppercase text-xs tracking-[0.2em] hover:bg-amber-50 transition-colors">
               <Link to="/contact">Get in Touch</Link>
             </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
