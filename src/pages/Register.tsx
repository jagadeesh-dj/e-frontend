import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Loader2, Check, User } from 'lucide-react'
import { Button } from '../components/ui/button'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { register, clearError } from '../store/slices/authSlice'
import { addToast } from '../store/slices/uiSlice'

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
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
    if (isSubmitting) return

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
      dispatch(addToast({
        type: 'warning',
        title: 'Missing fields',
        message: 'Please complete all required fields'
      }))
      return
    }

    if (formData.password !== formData.confirmPassword) {
      dispatch(addToast({
        type: 'error',
        title: 'Error',
        message: 'Passwords do not match'
      }))
      return
    }

    if (formData.password.length < 8) {
      dispatch(addToast({
        type: 'error',
        title: 'Error',
        message: 'Password must be at least 8 characters'
      }))
      return
    }

    dispatch(clearError())
    setIsSubmitting(true)

    dispatch(register({ 
      first_name: formData.firstName, 
      last_name: formData.lastName, 
      email: formData.email, 
      password: formData.password 
    }))
      .then((result) => {
        if (register.fulfilled.match(result)) {
          setIsSuccess(true)
          setTimeout(() => navigate('/'), 1500)
        }
      })
      .finally(() => {
        setIsSubmitting(false)
      })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#faf9f6]">
      <div className="w-full max-w-[500px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-white border border-gray-200 p-8 sm:p-12 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)]"
        >
          {/* Header */}
          <div className="text-center mb-10 pb-6 border-b border-gray-100">
             <h1 className="font-serif text-3xl font-bold mb-3 text-gray-900">Become a Member</h1>
             <p className="font-light text-gray-500">Access exclusive curated collections</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-500 block">First Name</label>
                <div className="relative">
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Enter name"
                    className="w-full h-12 border-b border-gray-200 bg-transparent px-0 font-light text-sm focus:outline-none focus:border-amber-700 transition-colors placeholder:text-gray-300"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-500 block">Last Name</label>
                <div className="relative">
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Enter name"
                    className="w-full h-12 border-b border-gray-200 bg-transparent px-0 font-light text-sm focus:outline-none focus:border-amber-700 transition-colors placeholder:text-gray-300"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-500 block">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="w-full h-12 border-b border-gray-200 bg-transparent px-0 font-light text-sm focus:outline-none focus:border-amber-700 transition-colors placeholder:text-gray-300"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-500 block">Create Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 8 characters"
                  className="w-full h-12 border-b border-gray-200 bg-transparent px-0 font-light text-sm focus:outline-none focus:border-amber-700 transition-colors placeholder:text-gray-300 pr-10"
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

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-500 block">Confirm Password</label>
              <div className="relative">
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  className="w-full h-12 border-b border-gray-200 bg-transparent px-0 font-light text-sm focus:outline-none focus:border-amber-700 transition-colors placeholder:text-gray-300"
                  required
                  disabled={isSubmitting}
                />
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                 <p className="text-xs text-red-500 mt-2 font-light">Passwords do not match</p>
              )}
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-4 cursor-pointer text-sm font-light text-gray-500">
                <input type="checkbox" required className="mt-1 w-4 h-4 text-amber-700 bg-gray-100 border-gray-300" />
                <span>
                 I accept the <a href="#" className="font-medium text-gray-900 hover:text-amber-700 transition-colors">Terms of Service</a> and have read the <a href="#" className="font-medium text-gray-900 hover:text-amber-700 transition-colors">Privacy Policy</a>
                </span>
              </label>
            </div>

            <Button type="submit" className="w-full h-14 bg-amber-700 hover:bg-amber-800 text-white uppercase text-xs tracking-[0.2em] rounded-none transition-colors mt-6" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enrolling...</>
              ) : (
                'Create Account'
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
            Already a member?{' '}
            <Link to="/login" className="font-semibold text-gray-900 uppercase tracking-widest text-[10px] hover:text-amber-700 transition-colors ml-1 border-b border-transparent hover:border-amber-700">
              Sign In
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Loading Overlay */}
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
                  <p className="font-serif text-2xl text-gray-900">Welcome to Our Boutique</p>
                </div>
              ) : (
                 <div className="flex flex-col items-center text-amber-900/50">
                   <div className="text-center font-serif text-2xl animate-pulse">Establishing Membership...</div>
                 </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
