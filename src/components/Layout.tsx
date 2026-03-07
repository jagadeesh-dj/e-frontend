import { useState, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  ShoppingCart,
  Menu,
  X,
  User,
  Package,
  LogOut,
  Heart,
  LayoutDashboard,
  ChevronRight,
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { addToast } from '../store/slices/uiSlice'
import { logoutUser } from '../store/slices/authSlice'
import { cn } from '../lib/utils'

export default function Layout() {
  const dispatch = useAppDispatch()
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)
  const { cart } = useAppSelector((state) => state.cart)
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.is_admin === true

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

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
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-200',
          isScrolled ? 'bg-white shadow-md' : 'bg-white'
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-1">
              <span className="text-xl md:text-2xl font-bold text-gray-900">
                Shopiverse
              </span>
            </Link>

            {/* Search Bar - Desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <Input
                  type="search"
                  placeholder="Search for products, brands and more..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-100 border-0 focus:bg-white focus:ring-2 focus:ring-orange-500 rounded-lg pl-12 pr-4 h-11"
                />
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <Button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-orange-500 hover:bg-orange-600 text-white rounded-md px-4 h-8 text-sm font-medium"
                >
                  Search
                </Button>
              </div>
            </form>

            {/* Right side */}
            <div className="flex items-center gap-1 md:gap-2">
              {/* Cart */}
              <Link to="/cart">
                <Button variant="ghost" size="icon" className="relative text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-full">
                  <ShoppingCart className="w-5 h-5" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* User Menu - Desktop only */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="hidden md:flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-gray-100">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar_url || user?.avatar} alt={userDisplayName} />
                        <AvatarFallback className="bg-orange-100 text-orange-600 font-semibold text-sm">
                          {userInitial}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-gray-700">{userDisplayName}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2 border-b">
                      <p className="font-medium text-gray-900">{userDisplayName}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                        <User className="w-4 h-4 mr-2" />
                        My Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/orders')} className="cursor-pointer">
                        <Package className="w-4 h-4 mr-2" />
                        My Orders
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/wishlist')} className="cursor-pointer">
                        <Heart className="w-4 h-4 mr-2" />
                        Wishlist
                      </DropdownMenuItem>
                      {isAdmin && (
                        <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer">
                          <LayoutDashboard className="w-4 h-4 mr-2" />
                          Admin Panel
                        </DropdownMenuItem>
                      )}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        dispatch(addToast({ type: 'info', title: 'Logged out', message: 'See you soon!' }))
                        dispatch(logoutUser())
                      }}
                      className="cursor-pointer text-red-600"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Button variant="ghost" onClick={() => navigate('/login')} className="text-gray-700 font-medium">
                    Login
                  </Button>
                  <Button onClick={() => navigate('/register')} className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-4">
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Search - Below navbar */}
          <form onSubmit={handleSearch} className="md:hidden pb-3">
            <div className="relative">
              <Input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 border-0 rounded-lg pl-10 pr-20 h-11"
              />
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <Button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-orange-500 hover:bg-orange-600 text-white rounded-md px-3 h-8 text-sm"
              >
                Search
              </Button>
            </div>
          </form>
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
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-white z-50 md:hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <span className="font-bold text-lg text-gray-900">Shopiverse</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {isAuthenticated ? (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.avatar_url || user?.avatar} />
                      <AvatarFallback className="bg-orange-100 text-orange-600 font-semibold">
                        {userInitial}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{userDisplayName}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 mb-4">
                    <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={() => { navigate('/login'); setMobileMenuOpen(false) }}>
                      Login
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => { navigate('/register'); setMobileMenuOpen(false) }}>
                      Sign Up
                    </Button>
                  </div>
                )}

                <nav className="space-y-1">
                  {isAuthenticated && (
                    <>
                      <Link to="/profile" onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50">
                        <User className="w-5 h-5" />
                        My Profile
                      </Link>
                      <Link to="/orders" onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50">
                        <Package className="w-5 h-5" />
                        My Orders
                      </Link>
                      <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50">
                        <Heart className="w-5 h-5" />
                        Wishlist
                      </Link>
                      <Link to="/cart" onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50">
                        <ShoppingCart className="w-5 h-5" />
                        Cart
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-orange-600 hover:bg-orange-50">
                          <LayoutDashboard className="w-5 h-5" />
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          dispatch(addToast({ type: 'info', title: 'Logged out', message: 'See you soon!' }))
                          dispatch(logoutUser())
                          setMobileMenuOpen(false)
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 w-full"
                      >
                        <LogOut className="w-5 h-5" />
                        Log out
                      </button>
                    </>
                  )}
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="pt-28 md:pt-32 pb-8 min-h-screen">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <h3 className="text-white font-bold text-lg mb-4">Shopiverse</h3>
              <p className="text-sm text-gray-400 mb-4">
                Your one-stop destination for premium products. Shop with confidence.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Shop</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/products" className="hover:text-white">All Products</Link></li>
                <li><Link to="/products?category=electronics" className="hover:text-white">Electronics</Link></li>
                <li><Link to="/products?category=fashion" className="hover:text-white">Fashion</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Help</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="hover:text-white">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link to="/faq" className="hover:text-white">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
            &copy; 2026 Shopiverse. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
