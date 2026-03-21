import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Loader2, Check } from 'lucide-react'
import { Button } from '../components/ui/button'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { login, clearError } from '../store/slices/authSlice'
import { addToast } from '../store/slices/uiSlice'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { isAuthenticated } = useAppSelector((state) => state.auth)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  if (isAuthenticated) {
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isSubmitting) return

    if (!email || !password) {
      dispatch(addToast({
        type: 'warning',
        title: 'Missing fields',
        message: 'Please provide both email and password'
      }))
      return
    }

    dispatch(clearError())
    setIsSubmitting(true)

    dispatch(login({ email, password }))
      .then((result) => {
        if (login.fulfilled.match(result)) {
          setIsSuccess(true)
          setTimeout(() => navigate('/'), 1500)
        }
      })
      .finally(() => {
        setIsSubmitting(false)
      })
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
            <h1 className="font-serif text-3xl font-bold mb-3 text-gray-900">Sign In</h1>
            <p className="font-light text-gray-500">Access your curated collection</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-500 block">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-12 border-b border-gray-200 bg-transparent px-0 font-light text-sm focus:outline-none focus:border-amber-700 transition-colors placeholder:text-gray-300"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-500 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-12 border-b border-gray-200 bg-transparent px-0 font-light text-sm focus:outline-none focus:border-amber-700 transition-colors placeholder:text-gray-300"
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="accent-amber-700 w-4 h-4 border-gray-300" />
                <span className="text-xs font-light text-gray-500 group-hover:text-gray-900 transition-colors">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-[10px] uppercase tracking-[0.1em] font-semibold text-amber-700 hover:text-amber-900 transition-colors">
                Recover Password
              </Link>
            </div>

            <Button type="submit" className="w-full h-14 bg-amber-700 hover:bg-amber-800 text-white uppercase text-xs tracking-[0.2em] rounded-none transition-colors mt-6" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Authenticating...</>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-8 text-gray-300">
             <div className="flex-1 border-t border-gray-100"></div>
             <span className="px-4 text-[10px] uppercase tracking-widest text-gray-400 font-semibold bg-white">Or</span>
             <div className="flex-1 border-t border-gray-100"></div>
          </div>

          <p className="text-center text-xs font-light text-gray-500">
            A new client?{' '}
            <Link to="/register" className="font-semibold text-gray-900 uppercase tracking-widest text-[10px] hover:text-amber-700 transition-colors ml-1 border-b border-transparent hover:border-amber-700">
              Create an account
            </Link>
          </p>
        </motion.div>
      </div>

      <AnimatePresence>
        {(isSubmitting || isSuccess) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#faf9f6]/95 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="flex flex-col items-center justify-center"
            >
              {isSuccess ? (
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 border border-green-200 bg-green-50 rounded-full flex items-center justify-center mb-6">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="font-serif text-2xl text-gray-900">Authenticated Verification</p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-amber-900/50">
                   <div className="text-center font-serif text-2xl animate-pulse">Authenticating Identity...</div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
