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
      <div className="bg-gray-900 text-white py-2.5 text-xs md:text-sm font-medium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              <span>+91 (555) 123-4567</span>
            </div>
            <span className="hidden md:inline text-white/30">|</span>
            <div className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5" />
              <span>SAME DAY DELIVERY</span>
            </div>
            <span className="hidden md:inline text-white/30">|</span>
            <span>Free Delivery on orders above ₹499</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header
        className={cn(
          'sticky top-0 left-0 right-0 z-50 transition-all duration-300 bg-white',
          isScrolled
            ? 'border-b border-gray-100 shadow-sm'
            : 'border-b border-gray-50'
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
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-gray-900 flex items-center justify-center transition-all duration-300 group-hover:bg-primary">
                <span className="text-white font-bold text-lg md:text-xl font-serif">S</span>
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-lg md:text-xl font-serif font-bold text-gray-900">
                  Shopeverse
                </span>
                <p className="text-xs text-gray-500">Premium Collections</p>
              </div>
            </Link>

            {/* Search Bar - Desktop */}
            <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-xl mx-6">
              <div className="relative w-full">
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 absolute left-4 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-11 pr-4 h-10 text-sm focus:bg-white focus:border-gray-300 focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>
            </form>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Wishlist */}
              <Link to="/wishlist">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg w-9 h-9 md:w-10 md:h-10 transition-all"
                >
                  <Heart className="w-5 h-5" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
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
                  className="relative text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg w-9 h-9 md:w-10 md:h-10 transition-all"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
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
                      className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all"
                    >
                      <Avatar className="h-8 w-8 ring-2 ring-gray-200">
                        <AvatarImage src={user?.avatar_url || user?.avatar} alt={userDisplayName} />
                        <AvatarFallback className="bg-gray-200 text-gray-900 font-semibold text-sm">
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
                  <DropdownMenuContent align="end" className="w-64 rounded-lg shadow-lg border-gray-200">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 ring-2 ring-gray-200">
                          <AvatarImage src={user?.avatar_url || user?.avatar} alt={userDisplayName} />
                          <AvatarFallback className="bg-gray-200 text-gray-900 font-semibold">
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
                      <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer py-2 px-4">
                        <User className="w-4 h-4 mr-3 text-gray-600" />
                        <span className="text-sm">My Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/orders')} className="cursor-pointer py-2 px-4">
                        <Package className="w-4 h-4 mr-3 text-gray-600" />
                        <span className="text-sm">My Orders</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/wishlist')} className="cursor-pointer py-2 px-4">
                        <Heart className="w-4 h-4 mr-3 text-gray-600" />
                        <span className="text-sm">Wishlist</span>
                      </DropdownMenuItem>
                      {isAdmin && (
                        <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer py-2 px-4">
                          <LayoutDashboard className="w-4 h-4 mr-3 text-gray-600" />
                          <span className="text-sm">Admin Panel</span>
                        </DropdownMenuItem>
                      )}
                    </div>
                    <DropdownMenuSeparator className="bg-gray-100" />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer py-2 px-4 text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      <span className="text-sm">Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/login')}
                    className="text-gray-700 font-medium hover:bg-gray-100 rounded-lg"
                  >
                    Login
                  </Button>
                  <Button
                    onClick={() => navigate('/register')}
                    className="bg-primary hover:bg-amber-700 text-white font-medium rounded-lg transition-all"
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
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-11 pr-4 h-10 text-sm"
              />
            </div>
          </form>
        </div>

        {/* Category Navigation - Desktop */}
        <div className="hidden lg:block border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-8 py-3 overflow-x-auto">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  to={`/products?category=${category.slug}`}
                  className="text-sm font-medium text-gray-700 hover:text-primary whitespace-nowrap transition-colors"
                >
                  {category.name}
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
              className="fixed inset-y-0 left-0 w-80 bg-white z-50 lg:hidden shadow-lg"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center">
                      <span className="text-white font-bold text-base font-serif">S</span>
                    </div>
                    <span className="text-lg font-serif font-bold text-gray-900">Shopeverse</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* User Info */}
                {isAuthenticated ? (
                  <div className="p-4 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 ring-2 ring-gray-200">
                        <AvatarImage src={user?.avatar_url || user?.avatar} />
                        <AvatarFallback className="bg-gray-200 text-gray-900 font-semibold">
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
                      className="w-full bg-primary hover:bg-amber-700 text-white rounded-lg"
                      onClick={() => { navigate('/login'); setMobileMenuOpen(false) }}
                    >
                      Login
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full rounded-lg border-gray-300 text-gray-900 hover:bg-gray-100"
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
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors"
                        >
                          <span className="font-medium text-sm">{category.name}</span>
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
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 w-full transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-medium text-sm">Logout</span>
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
