import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Notification } from '../../types'

type Theme = 'light' | 'dark'

interface Toast extends Notification {
  isVisible: boolean
}

interface UIState {
  theme: Theme
  toasts: Toast[]
  isSidebarOpen: boolean
  isMobileMenuOpen: boolean
  isCartOpen: boolean
  isSearchOpen: boolean
}

const getInitialTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme
    }
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
  }
  return 'light'
}

const initialState: UIState = {
  theme: getInitialTheme(),
  toasts: [],
  isSidebarOpen: false,
  isMobileMenuOpen: false,
  isCartOpen: false,
  isSearchOpen: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload
      localStorage.setItem('theme', action.payload)
      if (action.payload === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    },
    toggleTheme: (state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light'
      state.theme = newTheme
      localStorage.setItem('theme', newTheme)
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    },
    addToast: (state, action: PayloadAction<Omit<Toast, 'isVisible' | 'id'>>) => {
      const toast: Toast = {
        ...action.payload,
        isVisible: true,
        id: `toast-${Date.now()}`,
      }
      state.toasts.push(toast)
    },
    removeToast: (state, action: PayloadAction<string>) => {
      const index = state.toasts.findIndex((t) => t.id === action.payload)
      if (index > -1) {
        state.toasts[index].isVisible = false
      }
    },
    clearToasts: (state) => {
      state.toasts = []
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.isSidebarOpen = action.payload
    },
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen
    },
    setMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.isMobileMenuOpen = action.payload
    },
    toggleMobileMenu: (state) => {
      state.isMobileMenuOpen = !state.isMobileMenuOpen
    },
    setCartOpen: (state, action: PayloadAction<boolean>) => {
      state.isCartOpen = action.payload
    },
    toggleCart: (state) => {
      state.isCartOpen = !state.isCartOpen
    },
    setSearchOpen: (state, action: PayloadAction<boolean>) => {
      state.isSearchOpen = action.payload
    },
    toggleSearch: (state) => {
      state.isSearchOpen = !state.isSearchOpen
    },
  },
})

export const {
  setTheme,
  toggleTheme,
  addToast,
  removeToast,
  clearToasts,
  setSidebarOpen,
  toggleSidebar,
  setMobileMenuOpen,
  toggleMobileMenu,
  setCartOpen,
  toggleCart,
  setSearchOpen,
  toggleSearch,
} = uiSlice.actions

export default uiSlice.reducer
