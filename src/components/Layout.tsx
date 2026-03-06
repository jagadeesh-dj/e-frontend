import { useState, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  Heart,
  Package,
  LogOut,
  Settings,
  Sparkles,
  Bell,
  Trash2,
  LayoutDashboard,
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { addToast } from '../store/slices/uiSlice'
import { logoutUser } from '../store/slices/authSlice'
import { markAsRead, markAllAsRead, removeNotification } from '../store/slices/notificationSlice'
import { cn } from '../lib/utils'

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Products', href: '/products' },
  { label: 'About', href: '/about' },
]

export default function Layout() {
  const dispatch = useAppDispatch()
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)
  const { cart } = useAppSelector((state) => state.cart)
  const { items: wishlistItems } = useAppSelector((state) => state.wishlist)
  const { items: notifications, unreadCount } = useAppSelector((state) => state.notifications)
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notificationOpen, setNotificationOpen] = useState(false)
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.is_admin === true
  
  const desktopNavLinks = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: 'About', href: '/about' },
  ]

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
    }
  }

  const cartItemCount = cart?.total_items || 0

  return (
    <div className="min-h-screen bg-background">
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isScrolled ? 'bg-white/95 backdrop-blur-md shadow-soft-lg py-3' : 'bg-transparent py-5'
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-premium group-hover:shadow-premium-lg transition-shadow">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900">
                ShopVista<span className="text-primary">.</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {desktopNavLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors relative',
                    location.pathname === link.href
                      ? 'text-primary'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  {link.label}
                  {location.pathname === link.href && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full"
                    />
                  )}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <form onSubmit={handleSearch} className="hidden lg:block">
                <div className="relative">
                  <Input
                    type="search"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 bg-gray-50 border-gray-200 focus:bg-white focus:border-primary pl-10"
                  />
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </form>

              <Link to="/wishlist">
                <Button variant="ghost" size="icon" className="relative hidden sm:flex text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                  <Heart className="w-5 h-5" />
                  {wishlistItems.length > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center"
                    >
                      {wishlistItems.length}
                    </motion.div>
                  )}
                </Button>
              </Link>

              <DropdownMenu open={notificationOpen} onOpenChange={setNotificationOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center"
                      >
                        {unreadCount}
                      </motion.div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-auto p-0 text-xs text-primary"
                        onClick={() => dispatch(markAllAsRead())}
                      >
                        Mark all read
                      </Button>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      No notifications
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((notification) => (
                      <DropdownMenuItem 
                        key={notification.id}
                        className="flex items-start gap-3 p-3 cursor-pointer"
                        onClick={() => dispatch(markAsRead(notification.id))}
                      >
                        <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                          notification.type === 'success' ? 'bg-green-500' :
                          notification.type === 'error' ? 'bg-red-500' :
                          notification.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!notification.read ? 'font-medium' : ''}`}>
                            {notification.title}
                          </p>
                          {notification.message && (
                            <p className="text-xs text-muted-foreground truncate">
                              {notification.message}
                            </p>
                          )}
                        </div>
                        <button
                          className="text-muted-foreground hover:text-foreground"
                          onClick={(e) => {
                            e.stopPropagation()
                            dispatch(removeNotification(notification.id))
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </DropdownMenuItem>
                    ))
                  )}
                  {notifications.length > 5 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-center justify-center text-primary"
                        onClick={() => navigate('/notifications')}
                      >
                        View all notifications
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Link to="/cart">
                <Button variant="ghost" size="icon" className="relative text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                  <ShoppingCart className="w-5 h-5" />
                  {cartItemCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center"
                    >
                      {cartItemCount}
                    </motion.div>
                  )}
                </Button>
              </Link>

              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:scale-105 transition-transform">
                      <Avatar className="h-10 w-10 border-2 border-primary/20">
                        <AvatarImage src={user?.avatar_url || user?.avatar} alt={user?.first_name || user?.name} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {user?.first_name?.charAt(0) || user?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-72 p-2 rounded-2xl shadow-soft-lg border border-gray-100 bg-white" align="end" forceMount>
                    <div className="px-3 py-4 bg-gradient-to-r from-amber-50 to-amber-50/50 rounded-xl mb-2 border border-amber-100">
                      <p className="text-sm font-bold text-gray-900 leading-none">{user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.name || 'User'}</p>
                      <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <DropdownMenuItem 
                        onClick={() => navigate('/profile')} 
                        className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer hover:bg-gray-50 transition-all"
                      >
                        <div className="p-2 bg-gray-100 rounded-xl">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">My Profile</p>
                          <p className="text-xs text-gray-500">Account settings</p>
                        </div>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        onClick={() => navigate('/orders')} 
                        className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer hover:bg-gray-50 transition-all"
                      >
                        <div className="p-2 bg-gray-100 rounded-xl">
                          <Package className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">My Orders</p>
                          <p className="text-xs text-gray-500">Track orders</p>
                        </div>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        onClick={() => navigate('/wishlist')} 
                        className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer hover:bg-gray-50 transition-all"
                      >
                        <div className="p-2 bg-gray-100 rounded-xl">
                          <Heart className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Wishlist</p>
                          <p className="text-xs text-gray-500">Saved items</p>
                        </div>
                      </DropdownMenuItem>
                      
                      {isAdmin && (
                        <DropdownMenuItem 
                          onClick={() => navigate('/admin')} 
                          className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer hover:bg-gray-50 transition-all"
                        >
                          <div className="p-2 bg-gray-100 rounded-xl">
                            <LayoutDashboard className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Admin Panel</p>
                            <p className="text-xs text-gray-500">Manage store</p>
                          </div>
                        </DropdownMenuItem>
                      )}
                    </div>
                    
                    <DropdownMenuSeparator className="my-2 bg-gray-100" />
                    
                    <DropdownMenuItem 
                      onClick={() => {
                        dispatch(addToast({ type: 'info', title: 'Logged out', message: 'See you soon!' }))
                        dispatch(logoutUser())
                      }} 
                      className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <div className="p-2 bg-red-50 rounded-lg">
                        <LogOut className="w-4 h-4 text-red-500" />
                      </div>
                      <p className="text-sm font-medium text-gray-900">Log out</p>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Button variant="ghost" onClick={() => navigate('/login')} className="text-gray-600 hover:text-gray-900">
                    Log in
                  </Button>
                  <Button onClick={() => navigate('/register')} className="btn-premium">
                    Sign up
                  </Button>
                </div>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white pt-20 px-4 md:hidden"
          >
            <nav className="flex flex-col gap-2">
              {desktopNavLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'px-4 py-3 rounded-xl text-lg font-medium transition-colors',
                    location.pathname === link.href
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-gray-50 text-gray-700'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {!isAuthenticated && (
                <>
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      navigate('/login')
                    }}
                  >
                    Log in
                  </Button>
                  <Button
                    className="justify-start"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      navigate('/register')
                    }}
                  >
                    Sign up
                  </Button>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pt-20">
        <Outlet />
      </main>

      <footer className="bg-gray-50 border-t mt-20">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-premium">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">ShopVista.</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                Your premier destination for quality products. We curate the finest selection to elevate your lifestyle.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Shop</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link to="/products?category=electronics" className="hover:text-primary transition-colors">Electronics</Link></li>
                <li><Link to="/products?category=fashion" className="hover:text-primary transition-colors">Fashion</Link></li>
                <li><Link to="/products?category=home-living" className="hover:text-primary transition-colors">Home & Living</Link></li>
                <li><Link to="/products?category=sports" className="hover:text-primary transition-colors">Sports</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                <li><Link to="/careers" className="hover:text-primary transition-colors">Careers</Link></li>
                <li><Link to="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
                <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link to="/help" className="hover:text-primary transition-colors">Help Center</Link></li>
                <li><Link to="/shipping" className="hover:text-primary transition-colors">Shipping Info</Link></li>
                <li><Link to="/returns" className="hover:text-primary transition-colors">Returns</Link></li>
                <li><Link to="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              &copy; 2024 ShopVista. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="text-sm text-gray-500 hover:text-gray-900">Privacy</Link>
              <Link to="/terms" className="text-sm text-gray-500 hover:text-gray-900">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
