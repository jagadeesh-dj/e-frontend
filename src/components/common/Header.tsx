import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, ShoppingCart, User, Package, LogOut, Heart, 
  LayoutDashboard, Menu, X, ChevronDown, Sparkles, Moon, Sun,
  Bell, Settings
} from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { addToast } from '../../store/slices/uiSlice'
import { logoutUser } from '../../store/slices/authSlice'
import { cn } from '../../lib/utils'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Shop' },
  { href: '/products?category=electronics', label: 'Electronics' },
  { href: '/about', label: 'About' },
]

export default function Header() {
  const dispatch = useAppDispatch()
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)
  const { cart } = useAppSelector((state) => state.cart)
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.is_admin === true

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true'
    setDarkMode(isDark)
    if (isDark) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem('darkMode', String(newDarkMode))
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
    }
  }

  const cartItemCount = cart?.total_items || 0
  const userDisplayName = user?.first_name && user?.last_name 
    ? `${user.first_name} ${user.last_name}` 
    : user?.name || 'User'
  const userInitial = user?.first_name?.charAt(0) || user?.name?.charAt(0) || 'U'

  return (
    <>
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled 
          ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg shadow-black/5 border-b border-gray-200/50 dark:border-gray-800/50" 
          : "bg-transparent"
      )}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-18">
            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors" 
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-accent flex items-center justify-center shadow-primary group-hover:shadow-primary-lg transition-all duration-300 group-hover:scale-105">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                ShopVista
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                    location.pathname === link.href
                      ? "text-primary bg-primary/10"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Search - Desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-6">
              <div className={cn(
                "relative w-full group transition-all duration-200",
                searchFocused && "scale-[1.02]"
              )}>
                <Input 
                  type="search" 
                  placeholder="Search products..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className={cn(
                    "w-full bg-gray-100/80 dark:bg-gray-800/80 border-0 rounded-xl pl-11 h-11 text-sm transition-all duration-200",
                    searchFocused && "bg-white dark:bg-gray-800 shadow-lg shadow-primary/10"
                  )} 
                />
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </form>

            {/* Right side actions */}
            <div className="flex items-center gap-1.5">
              {/* Dark mode toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>

              {/* Wishlist */}
              <Link to="/wishlist">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative text-gray-600 dark:text-gray-400 hover:text-secondary hover:bg-secondary/10 rounded-xl transition-colors"
                >
                  <Heart className="w-5 h-5" />
                </Button>
              </Link>

              {/* Cart */}
              <Link to="/cart">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative text-gray-600 dark:text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartItemCount > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-gradient-to-r from-secondary to-secondary/90 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 shadow-md"
                    >
                      {cartItemCount > 99 ? '99+' : cartItemCount}
                    </motion.span>
                  )}
                </Button>
              </Link>

              {/* User menu */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="hidden md:flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                        <AvatarImage src={user?.avatar_url || user?.avatar} alt={userDisplayName} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold text-sm">
                          {userInitial}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 rounded-2xl shadow-xl shadow-black/10 border-gray-100 dark:border-gray-800">
                    <DropdownMenuLabel className="p-4 border-b border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user?.avatar_url || user?.avatar} alt={userDisplayName} />
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold">
                            {userInitial}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">{userDisplayName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <div className="py-1.5">
                      <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer px-3 py-2.5">
                        <User className="w-4 h-4 mr-3 text-primary" />
                        <span className="text-sm">My Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/orders')} className="cursor-pointer px-3 py-2.5">
                        <Package className="w-4 h-4 mr-3 text-primary" />
                        <span className="text-sm">My Orders</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/wishlist')} className="cursor-pointer px-3 py-2.5">
                        <Heart className="w-4 h-4 mr-3 text-secondary" />
                        <span className="text-sm">Wishlist</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/profile?tab=settings')} className="cursor-pointer px-3 py-2.5">
                        <Settings className="w-4 h-4 mr-3 text-accent" />
                        <span className="text-sm">Settings</span>
                      </DropdownMenuItem>
                      {isAdmin && (
                        <>
                          <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800" />
                          <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer px-3 py-2.5">
                            <LayoutDashboard className="w-4 h-4 mr-3 text-primary" />
                            <span className="text-sm font-medium">Admin Panel</span>
                            <Badge variant="soft" className="ml-auto text-xs">New</Badge>
                          </DropdownMenuItem>
                        </>
                      )}
                    </div>
                    <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800" />
                    <DropdownMenuItem 
                      onClick={() => { 
                        dispatch(addToast({ type: 'info', title: 'Logged out successfully' }))
                        dispatch(logoutUser())
                      }} 
                      className="cursor-pointer px-3 py-2.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      <span className="text-sm font-medium">Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate('/login')} 
                    className="text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Login
                  </Button>
                  <Button 
                    onClick={() => navigate('/register')} 
                    className="bg-gradient-to-r from-primary to-primary/90 text-white font-semibold shadow-primary hover:shadow-primary-lg"
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" 
              onClick={() => setMobileMenuOpen(false)} 
            />
            <motion.div 
              initial={{ x: '-100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '-100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[320px] bg-white dark:bg-gray-900 z-50 md:hidden flex flex-col shadow-2xl"
            >
              {/* Mobile menu header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-accent flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-lg font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                    ShopVista
                  </span>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile menu content */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* Search */}
                <form onSubmit={handleSearch} className="mb-6">
                  <div className="relative">
                    <Input 
                      type="search" 
                      placeholder="Search products..." 
                      value={searchQuery} 
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-100 dark:bg-gray-800 border-0 rounded-xl pl-11 h-11" 
                    />
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </form>

                {/* User info */}
                {isAuthenticated ? (
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl mb-6 border border-primary/10">
                    <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                      <AvatarImage src={user?.avatar_url || user?.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold">
                        {userInitial}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{userDisplayName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 mb-6">
                    <Button 
                      className="w-full bg-gradient-to-r from-primary to-primary/90 text-white font-semibold shadow-primary" 
                      onClick={() => { navigate('/login'); setMobileMenuOpen(false) }}
                    >
                      Login
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full font-semibold" 
                      onClick={() => { navigate('/register'); setMobileMenuOpen(false) }}
                    >
                      Sign Up
                    </Button>
                  </div>
                )}

                {/* Navigation links */}
                <nav className="space-y-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors",
                        location.pathname === link.href
                          ? "text-primary bg-primary/10"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>

                {isAuthenticated && (
                  <>
                    <div className="border-t border-gray-100 dark:border-gray-800 my-4" />
                    <nav className="space-y-1">
                      <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                        <User className="w-5 h-5 text-primary" /> My Profile
                      </Link>
                      <Link to="/orders" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                        <Package className="w-5 h-5 text-primary" /> My Orders
                      </Link>
                      <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                        <Heart className="w-5 h-5 text-secondary" /> Wishlist
                      </Link>
                      <Link to="/cart" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                        <span className="flex items-center gap-3">
                          <ShoppingCart className="w-5 h-5 text-primary" /> Cart
                        </span>
                        {cartItemCount > 0 && (
                          <Badge variant="soft">{cartItemCount}</Badge>
                        )}
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-primary bg-primary/10">
                          <LayoutDashboard className="w-5 h-5" /> Admin Panel
                        </Link>
                      )}
                      <button 
                        onClick={() => { 
                          dispatch(addToast({ type: 'info', title: 'Logged out successfully' }))
                          dispatch(logoutUser())
                          setMobileMenuOpen(false)
                        }} 
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
                      >
                        <LogOut className="w-5 h-5" /> Log out
                      </button>
                    </nav>
                  </>
                )}
              </div>

              {/* Dark mode toggle in mobile menu */}
              <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                <Button
                  variant="outline"
                  onClick={toggleDarkMode}
                  className="w-full justify-start"
                >
                  {darkMode ? (
                    <>
                      <Sun className="w-4 h-4 mr-2" /> Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 mr-2" /> Dark Mode
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
