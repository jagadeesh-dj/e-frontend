import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, ArrowLeft, Check } from 'lucide-react'
import { Button } from '../components/ui/button'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      setIsSuccess(true)
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#faf9f6]">
      <div className="w-full max-w-[440px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-white border border-gray-200 p-8 sm:p-12 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)]"
        >
          {/* Header */}
          <div className="text-center mb-10 pb-6 border-b border-gray-100">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold mb-3 text-gray-900">Account Recovery</h1>
            <p className="font-light text-gray-500">Regain access to your profile</p>
          </div>

          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-500 block">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full h-12 border-b border-gray-200 bg-transparent px-0 font-light text-sm focus:outline-none focus:border-gray-900 transition-colors placeholder:text-gray-300"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-14 bg-gray-900 hover:bg-amber-900 text-white uppercase text-xs tracking-[0.2em] rounded-none transition-colors mt-6" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-2"
            >
              <div className="w-20 h-20 border border-green-200 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-serif text-2xl text-gray-900 mb-4">Instructions Sent</h3>
              <p className="font-light text-gray-500 mb-8 max-w-sm mx-auto leading-relaxed">
                We have transmitted recovery instructions to <span className="font-medium text-gray-900">{email}</span>
              </p>
              <Button
                onClick={() => setIsSuccess(false)}
                className="w-full h-14 border border-gray-200 text-gray-500 hover:bg-gray-50 uppercase text-xs tracking-[0.2em] rounded-none transition-colors bg-transparent"
              >
                Resend Link
              </Button>
            </motion.div>
          )}

          {/* Footer Back Link */}
          <div className="mt-10 pt-6 border-t border-gray-100 text-center">
            <Link to="/login" className="inline-flex items-center text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900 font-semibold transition-colors">
              <ArrowLeft className="w-3 h-3 mr-2" /> Return to Login
            </Link>
          </div>

        </motion.div>
      </div>
    </div>
  )
}
