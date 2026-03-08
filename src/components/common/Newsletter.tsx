import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Send, CheckCircle, Sparkles } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { useAppDispatch } from '../../store/hooks'
import { addToast } from '../../store/slices/uiSlice'

interface NewsletterProps {
  title?: string
  subtitle?: string
  placeholder?: string
  buttonText?: string
}

export default function Newsletter({
  title = 'Subscribe to Our Newsletter',
  subtitle = 'Get exclusive offers, new arrivals updates, and special discounts delivered to your inbox',
  placeholder = 'Enter your email address',
  buttonText = 'Subscribe Now',
}: NewsletterProps) {
  const dispatch = useAppDispatch()
  const [email, setEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim() || !email.includes('@')) {
      dispatch(addToast({ type: 'error', title: 'Invalid email', message: 'Please enter a valid email address' }))
      return
    }

    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsLoading(false)
    setIsSubscribed(true)
    setEmail('')
    
    dispatch(addToast({
      type: 'success',
      title: 'Subscribed!',
      message: 'Welcome to our newsletter family!',
    }))

    // Reset success state after 5 seconds
    setTimeout(() => setIsSubscribed(false), 5000)
  }

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-600 to-primary-700 shadow-2xl shadow-primary/25"
        >
          {/* Background Decorations */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
              }}
              transition={{ duration: 20, repeat: Infinity }}
              className="absolute -top-1/2 -right-1/4 w-full h-full bg-white/5 rounded-full blur-3xl"
            />
            <motion.div
              animate={{ 
                scale: [1, 1.3, 1],
                rotate: [0, -180, -360],
              }}
              transition={{ duration: 25, repeat: Infinity }}
              className="absolute -bottom-1/2 -left-1/4 w-full h-full bg-white/5 rounded-full blur-3xl"
            />
          </div>

          {/* Content */}
          <div className="relative z-10 px-6 py-12 md:px-12 md:py-16 lg:px-16 lg:py-20">
            <div className="max-w-3xl mx-auto text-center">
              {/* Badge */}
              <Badge variant="secondary" size="lg" className="bg-white/20 text-white border-0 mb-6">
                <Sparkles className="w-4 h-4 mr-2" />
                Newsletter
              </Badge>

              {/* Title */}
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                {title}
              </h2>

              {/* Subtitle */}
              <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
                {subtitle}
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
                <div className="relative flex-1">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={placeholder}
                    disabled={isSubscribed || isLoading}
                    className="w-full bg-white border-0 rounded-2xl pl-12 pr-4 h-14 text-gray-900 placeholder:text-gray-400 focus:ring-4 focus:ring-white/30"
                  />
                </div>
                <Button
                  type="submit"
                  size="xl"
                  loading={isLoading}
                  disabled={isSubscribed}
                  className="bg-white text-primary hover:bg-gray-100 rounded-2xl h-14 px-8 shadow-xl whitespace-nowrap"
                  leftIcon={isSubscribed ? <CheckCircle className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                >
                  {isSubscribed ? 'Subscribed!' : buttonText}
                </Button>
              </form>

              {/* Trust Badges */}
              <div className="flex flex-wrap justify-center gap-4 mt-8 text-white/70 text-sm">
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  No spam
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Unsubscribe anytime
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Secure & private
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
