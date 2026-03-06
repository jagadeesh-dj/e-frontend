import { addToast, removeToast } from '../store/slices/uiSlice'
import { AppDispatch } from '../store'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastOptions {
  type: ToastType
  title: string
  message?: string
  duration?: number
}

export const toast = {
  success: (title: string, message?: string) => ({ type: 'success' as ToastType, title, message }),
  error: (title: string, message?: string) => ({ type: 'error' as ToastType, title, message }),
  warning: (title: string, message?: string) => ({ type: 'warning' as ToastType, title, message }),
  info: (title: string, message?: string) => ({ type: 'info' as ToastType, title, message }),
}

export const showToast = (dispatch: AppDispatch, options: ToastOptions) => {
  dispatch(addToast(options))
}

export const showSuccess = (dispatch: AppDispatch, title: string, message?: string) => {
  showToast(dispatch, { type: 'success', title, message })
}

export const showError = (dispatch: AppDispatch, title: string, message?: string) => {
  showToast(dispatch, { type: 'error', title, message })
}

export const showWarning = (dispatch: AppDispatch, title: string, message?: string) => {
  showToast(dispatch, { type: 'warning', title, message })
}

export const showInfo = (dispatch: AppDispatch, title: string, message?: string) => {
  showToast(dispatch, { type: 'info', title, message })
}
