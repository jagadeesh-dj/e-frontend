import { useEffect, useState, useCallback } from 'react'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { removeToast } from '../store/slices/uiSlice'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  isVisible: boolean
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const styles = {
  success: {
    bg: 'bg-slate-900',
    border: 'border-slate-700',
    icon: 'text-emerald-400',
    accent: 'bg-emerald-500',
  },
  error: {
    bg: 'bg-slate-900',
    border: 'border-slate-700',
    icon: 'text-red-400',
    accent: 'bg-red-500',
  },
  warning: {
    bg: 'bg-slate-900',
    border: 'border-slate-700',
    icon: 'text-amber-400',
    accent: 'bg-amber-500',
  },
  info: {
    bg: 'bg-slate-900',
    border: 'border-slate-700',
    icon: 'text-blue-400',
    accent: 'bg-blue-500',
  },
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false)
  const duration = toast.duration || 4000
  
  const Icon = icons[toast.type]
  const style = styles[toast.type]

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(() => onDismiss(toast.id), 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, toast.id, onDismiss])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => onDismiss(toast.id), 300)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`
        relative overflow-hidden
        ${style.bg}
        border ${style.border}
        rounded-xl shadow-2xl
        text-white
        min-w-[340px] max-w-sm
      `}
    >
      <div className="flex items-start gap-3 p-4">
        <div className={`p-2 rounded-lg bg-white/5`}>
          <Icon className={`w-5 h-5 ${style.icon}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{toast.title}</p>
          {toast.message && (
            <p className="text-xs text-slate-400 mt-1">{toast.message}</p>
          )}
        </div>

        <button
          onClick={handleClose}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/10">
        <motion.div
          initial={{ scaleX: 1, originX: 0 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
          className={`h-full ${style.accent}`}
        />
      </div>
    </motion.div>
  )
}

export function ReduxToaster() {
  const dispatch = useAppDispatch()
  const toasts = useAppSelector((state) => state.ui.toasts) as Toast[]

  const handleDismiss = useCallback((id: string) => {
    dispatch(removeToast(id))
  }, [dispatch])

  const visibleToasts = toasts?.filter(t => t.isVisible) || []

  if (!visibleToasts.length) return null

  return (
    <div className="fixed bottom-6 right-6 z-[80] flex flex-col gap-3">
      <AnimatePresence mode="popLayout">
        {visibleToasts.map((toast) => (
          <ToastItem 
            key={toast.id} 
            toast={toast} 
            onDismiss={handleDismiss} 
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
