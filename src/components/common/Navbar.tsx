import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, ShoppingCart, Heart, User, LogOut, Package,
  LayoutDashboard, Menu, X, ChevronDown, Phone, Truck
} from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { addToast } from '../../store/slices/uiSlice'
import { logoutUser } from '../../store/slices/authSlice'
import { cn } from '../../lib/utils'

const categories = [
  { name: 'Cakes', slug: 'cakes' },
  { name: 'Flowers', slug: 'flowers' },
  { name: 'Plants', slug: 'plants' },
  { name: 'Personalized', slug: 'personalized' },
  { name: 'Combos', slug: 'combos' },
  { name: 'Chocolates', slug: 'chocolates' },
  { name: 'Mugs', slug: 'mugs' },
  { name: 'Frames', slug: 'frames' },
]

export default function Navbar() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)
  const { cart } = useAppSelector((state) => state.cart)
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.is_admin === true

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
    setProfileOpen(false)
  }, [location.pathname])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
    }
  }

  const handleLogout = () => {
    dispatch(addToast({ type: 'info', title: 'Logged out successfully' }))
    dispatch(logoutUser())
    navigate('/')
  }

  const cartItemCount = cart?.total_items || 0
  const wishlistCount = 0

  const userDisplayName = user?.first_name && user?.last_name
    ? `${user.first_name} ${user.last_name}`
    : user?.name || 'User'
  const userInitial = user?.first_name?.charAt(0) || user?.name?.charAt(0) || 'U'

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-primary via-primary-600 to-primary-700 text-white py-2 text-xs md:text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              <span>+91 (555) 123-4567</span>
            </div>
            <span className="hidden md:inline text-white/40">|</span>
            <div className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5" />
              <span className="font-semibold">SAME DAY DELIVERY</span>
            </div>
            <span className="hidden md:inline text-white/40">|</span>
            <span>Free Delivery on orders above ₹499</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header
        className={cn(
          'sticky top-0 left-0 right-0 z-50 transition-all duration-300 bg-white',
          isScrolled
            ? 'border-b border-gray-200 shadow-lg shadow-gray-200/50'
            : 'border-b border-gray-100'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-primary transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo / Brand */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-primary via-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
                <span className="text-white font-bold text-lg md:text-xl">S</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary via-primary-600 to-primary-700 bg-clip-text text-transparent">
                  Shopeverse
                </span>
                <p className="text-xs text-gray-500 -mt-0.5">Premium Gifts</p>
              </div>
            </Link>

            {/* Search Bar - Desktop */}
            <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-2xl mx-8">
              <div className="relative w-full group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5 rounded-full blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <div className="relative flex items-center">
                  <Search className="w-5 h-5 absolute left-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <Input
                    type="search"
                    placeholder="Search for cakes, flowers, gifts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-full pl-12 pr-14 h-12 text-sm focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 p-2.5 bg-primary hover:bg-primary-600 text-white rounded-full transition-colors"
                    aria-label="Search"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>

            {/* Right Actions */}
            <div className="flex items-center gap-1.5">
              {/* Wishlist */}
              <Link to="/wishlist">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-gray-600 hover:text-primary hover:bg-primary/10 rounded-xl w-10 h-10 md:w-11 md:h-11 transition-all"
                >
                  <Heart className="w-5 h-5" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 bg-secondary text-white text-xs font-bold rounded-full px-1 flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Cart */}
              <Link to="/cart">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-gray-600 hover:text-primary hover:bg-primary/10 rounded-xl w-10 h-10 md:w-11 md:h-11 transition-all"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 bg-gradient-to-r from-primary to-primary-600 text-white text-xs font-bold rounded-full px-1 flex items-center justify-center shadow-md">
                      {cartItemCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* User Profile */}
              {isAuthenticated ? (
                <DropdownMenu open={profileOpen} onOpenChange={setProfileOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="hidden md:flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-primary/10 transition-all"
                    >
                      <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                        <AvatarImage src={user?.avatar_url || user?.avatar} alt={userDisplayName} />
                        <AvatarFallback className="bg-gradient-to-br from-primary-100 to-primary-200 text-primary font-semibold text-sm">
                          {userInitial}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left hidden xl:block">
                        <p className="text-sm font-semibold text-gray-900">{userDisplayName.split(' ')[0]}</p>
                        <p className="text-xs text-gray-500 truncate max-w-24">{user?.email}</p>
                      </div>
                      <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", profileOpen && "rotate-180")} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 rounded-2xl shadow-xl shadow-primary/10 border-primary/10">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-br from-primary/5 to-transparent">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                          <AvatarImage src={user?.avatar_url || user?.avatar} alt={userDisplayName} />
                          <AvatarFallback className="bg-gradient-to-br from-primary-100 to-primary-200 text-primary font-semibold">
                            {userInitial}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{userDisplayName}</p>
                          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="py-2">
                      <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer py-2.5">
                        <User className="w-4 h-4 mr-3 text-primary" />
                        <span className="text-sm">My Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/orders')} className="cursor-pointer py-2.5">
                        <Package className="w-4 h-4 mr-3 text-primary" />
                        <span className="text-sm">My Orders</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/wishlist')} className="cursor-pointer py-2.5">
                        <Heart className="w-4 h-4 mr-3 text-primary" />
                        <span className="text-sm">Wishlist</span>
                      </DropdownMenuItem>
                      {isAdmin && (
                        <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer py-2.5">
                          <LayoutDashboard className="w-4 h-4 mr-3 text-primary" />
                          <span className="text-sm">Admin Panel</span>
                        </DropdownMenuItem>
                      )}
                    </div>
                    <DropdownMenuSeparator className="bg-gray-100" />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer py-2.5 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      <span className="text-sm font-medium">Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/login')}
                    className="text-gray-700 font-medium hover:bg-primary/10 hover:text-primary rounded-xl"
                  >
                    Login
                  </Button>
                  <Button
                    onClick={() => navigate('/register')}
                    className="bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-medium rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Search - Below navbar */}
          <form onSubmit={handleSearch} className="lg:hidden pb-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-full pl-12 pr-4 h-11 text-sm"
              />
            </div>
          </form>
        </div>

        {/* Category Navigation - Desktop */}
        <div className="hidden lg:block border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-6 py-3 overflow-x-auto">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  to={`/products?category=${category.slug}`}
                  className="text-sm font-medium text-gray-700 hover:text-primary whitespace-nowrap transition-colors"
                >
                  {category.name.toUpperCase()}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-80 bg-white z-50 lg:hidden shadow-2xl"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-primary/10 to-primary-50/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-primary-500 to-primary-700 flex items-center justify-center">
                      <span className="text-white font-bold text-base">S</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">Shopeverse</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* User Info */}
                {isAuthenticated ? (
                  <div className="p-4 bg-gradient-to-br from-primary-50 to-white border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                        <AvatarImage src={user?.avatar_url || user?.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-primary-100 to-primary-200 text-primary font-semibold">
                          {userInitial}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{userDisplayName}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 space-y-2 border-b border-gray-100">
                    <Button
                      className="w-full bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl"
                      onClick={() => { navigate('/login'); setMobileMenuOpen(false) }}
                    >
                      Login
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full rounded-xl border-primary/20 text-primary hover:bg-primary/10"
                      onClick={() => { navigate('/register'); setMobileMenuOpen(false) }}
                    >
                      Sign Up
                    </Button>
                  </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-4">
                  {/* Categories Section */}
                  <div className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
                      Categories
                    </h3>
                    <div className="space-y-1">
                      {categories.map((category) => (
                        <Link
                          key={category.slug}
                          to={`/products?category=${category.slug}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <span className="font-medium">{category.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </nav>

                {/* Logout */}
                {isAuthenticated && (
                  <div className="p-4 border-t border-gray-100">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-red-600 hover:bg-red-50 w-full transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-medium">Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
