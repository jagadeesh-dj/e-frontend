import { useState, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  ShoppingCart,
  Heart,
  Menu,
  X,
  User,
  Package,
  LogOut,
  Store,
  LayoutDashboard,
  Sparkles,
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
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

const quickCategories = [
  { label: 'Cakes', href: '/products?category=cakes' },
  { label: 'Flowers', href: '/products?category=flowers' },
  { label: 'Plants', href: '/products?category=plants' },
  { label: 'Personalized', href: '/products?category=personalized' },
  { label: 'Combos', href: '/products?category=combos' },
  { label: 'Chocolates', href: '/products?category=chocolates' },
]

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
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
    }
  }

  const handleLogout = () => {
    dispatch(addToast({ type: 'info', title: 'Logged out', message: 'See you soon.' }))
    dispatch(logoutUser())
    navigate('/')
  }

  const cartItemCount = cart?.total_items || 0
  const isCartRoute = location.pathname.startsWith('/cart')
  const isWishlistRoute = location.pathname.startsWith('/wishlist')
  const userDisplayName = user?.first_name && user?.last_name
    ? `${user.first_name} ${user.last_name}`
    : user?.name || 'User'
  const userInitial = user?.first_name?.charAt(0) || user?.name?.charAt(0) || 'U'
  const marqueeCategories = [...quickCategories, ...quickCategories, ...quickCategories]

  return (
    <div className="min-h-screen text-foreground">
      <div className="fixed inset-x-0 top-0 z-50">
        <header
          className={cn(
            'transition-all duration-300',
            isScrolled
              ? 'border-b border-amber-100 bg-white/90 shadow-surface-sm backdrop-blur-xl'
              : 'border-b border-amber-100/80 bg-white/85 backdrop-blur-md'
          )}
        >
          <div className="app-container">
            <div className="flex h-16 items-center justify-between gap-2 sm:h-[72px]">
              <div className="flex items-center gap-1">
                <button
                  className="rounded-xl p-2 text-gray-600 transition-colors hover:bg-amber-100/70 md:hidden"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Open navigation menu"
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>

                <Link to="/" className="flex items-center gap-2.5">
                  
                  <div className="leading-tight">
                    <p className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">Shopiverse</p>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-600">Premium Store</p>
                  </div>
                </Link>
              </div>

              <form onSubmit={handleSearch} className="mx-3 hidden flex-1 max-w-2xl lg:flex">
                <div className="relative w-full">
                  <Input
                    type="search"
                    placeholder="Search for cakes, gifts, flowers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-11 rounded-full border-amber-200/80 bg-white/90 pl-11 pr-28"
                  />
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Button
                    type="submit"
                    size="sm"
                    className="btn-premium absolute right-1.5 top-1/2 h-8 -translate-y-1/2 rounded-full px-4"
                  >
                    Search
                  </Button>
                </div>
              </form>

              <div className="flex items-center gap-1 sm:gap-2">
                <Link to="/wishlist">
                  <Button
                    variant={isWishlistRoute ? 'secondary' : 'ghost'}
                    size="icon"
                    className="relative h-9 w-9 rounded-xl sm:h-10 sm:w-10"
                    aria-label="Wishlist"
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </Link>

                <Link to="/cart">
                  <Button
                    variant={isCartRoute ? 'secondary' : 'ghost'}
                    size="icon"
                    className="relative h-9 w-9 rounded-xl sm:h-10 sm:w-10"
                    aria-label="Cart"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {cartItemCount > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-white shadow-sm">
                        {cartItemCount}
                      </span>
                    )}
                  </Button>
                </Link>

                {isAuthenticated ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="hidden h-10 items-center gap-2 rounded-xl px-2.5 sm:flex">
                        <Avatar className="h-8 w-8 ring-2 ring-amber-100">
                          <AvatarImage src={user?.avatar_url || user?.avatar} alt={userDisplayName} />
                          <AvatarFallback className="bg-amber-100 text-amber-700">{userInitial}</AvatarFallback>
                        </Avatar>
                        <span className="max-w-[108px] truncate text-sm font-semibold text-gray-700">{userDisplayName}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-60 rounded-2xl border-amber-100 bg-white/95 shadow-surface-md">
                      <div className="border-b border-amber-100 px-3 py-3">
                        <p className="font-medium text-gray-900">{userDisplayName}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                      <div className="py-1.5">
                        <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer py-2.5">
                          <User className="mr-2.5 h-4 w-4 text-primary" />
                          My Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/orders')} className="cursor-pointer py-2.5">
                          <Package className="mr-2.5 h-4 w-4 text-primary" />
                          My Orders
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/wishlist')} className="cursor-pointer py-2.5">
                          <Heart className="mr-2.5 h-4 w-4 text-primary" />
                          Wishlist
                        </DropdownMenuItem>
                        {isAdmin && (
                          <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer py-2.5">
                            <LayoutDashboard className="mr-2.5 h-4 w-4 text-primary" />
                            Admin Panel
                          </DropdownMenuItem>
                        )}
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                        <LogOut className="mr-2.5 h-4 w-4" />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className="hidden items-center gap-2 sm:flex">
                    <Button variant="ghost" onClick={() => navigate('/login')} className="font-semibold text-gray-700">
                      Login
                    </Button>
                    <Button onClick={() => navigate('/register')} className="btn-premium px-4">
                      Sign Up
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleSearch} className="pb-3 lg:hidden">
              <div className="relative">
                <Input
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 rounded-full border-amber-200/80 bg-white/90 pl-10 pr-20"
                />
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Button
                  type="submit"
                  size="sm"
                  className="btn-premium absolute right-1.5 top-1/2 h-8 -translate-y-1/2 rounded-full px-3"
                >
                  Search
                </Button>
              </div>
            </form>
          </div>
        </header>

        <div className="hidden border-b border-amber-100/70 bg-white/90 md:block">
          <div className="app-container">
            <div className="category-marquee py-3">
              <div className="category-marquee-track">
                {marqueeCategories.map((category, index) => (
                  <Link
                    key={`${category.label}-${index}`}
                    to={category.href}
                    className="mx-2 whitespace-nowrap rounded-full bg-amber-100/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-amber-800 transition-colors hover:bg-amber-200/70"
                  >
                    {category.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/35 backdrop-blur-sm md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[310px] flex-col border-r border-amber-100 bg-white md:hidden"
            >
              <div className="flex items-center justify-between border-b border-amber-100 p-4">
                <div className="flex items-center gap-2">
                  <div className="gradient-primary flex h-8 w-8 items-center justify-center rounded-lg">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <p className="font-semibold text-gray-900">Shopiverse</p>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="rounded-lg p-1.5 text-gray-600 hover:bg-amber-100/70">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {isAuthenticated ? (
                  <div className="mb-4 flex items-center gap-3 rounded-2xl bg-amber-50/85 p-3.5">
                    <Avatar className="h-10 w-10 ring-2 ring-amber-100">
                      <AvatarImage src={user?.avatar_url || user?.avatar} />
                      <AvatarFallback className="bg-amber-100 text-amber-700 font-semibold">{userInitial}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-gray-900">{userDisplayName}</p>
                      <p className="truncate text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-5 space-y-2">
                    <Button className="w-full" onClick={() => { navigate('/login'); setMobileMenuOpen(false) }}>
                      Login
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => { navigate('/register'); setMobileMenuOpen(false) }}>
                      Sign Up
                    </Button>
                  </div>
                )}

                <nav className="space-y-1">
                  {isAuthenticated ? (
                    <>
                      <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-gray-700 hover:bg-amber-100/70">
                        <User className="h-4 w-4 text-primary" />
                        My Profile
                      </Link>
                      <Link to="/orders" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-gray-700 hover:bg-amber-100/70">
                        <Package className="h-4 w-4 text-primary" />
                        My Orders
                      </Link>
                      <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-gray-700 hover:bg-amber-100/70">
                        <Heart className="h-4 w-4 text-primary" />
                        Wishlist
                      </Link>
                      <Link to="/cart" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-gray-700 hover:bg-amber-100/70">
                        <ShoppingCart className="h-4 w-4 text-primary" />
                        Cart
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 rounded-xl bg-amber-100/70 px-3 py-2.5 text-amber-800">
                          <LayoutDashboard className="h-4 w-4" />
                          Admin Panel
                        </Link>
                      )}
                      <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-gray-700 hover:bg-amber-100/70">
                        <Store className="h-4 w-4 text-primary" />
                        Back to Store
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout()
                          setMobileMenuOpen(false)
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Log out
                      </button>
                    </>
                  ) : null}
                </nav>

                <div className="mt-6 border-t border-amber-100 pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Popular Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {quickCategories.map((category) => (
                      <Link
                        key={category.label}
                        to={category.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="rounded-full bg-amber-100/70 px-3 py-1 text-xs font-semibold text-amber-800"
                      >
                        {category.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="min-h-screen pb-10 pt-[7.6rem] md:pt-[10.4rem] lg:pt-[7.2rem]">
        <Outlet />
      </main>

      <footer className="border-t border-amber-100/80 bg-white/88 backdrop-blur-sm">
        <div className="app-container py-10 sm:py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <div className="mb-3 flex items-center gap-2.5">
                <div className="gradient-primary flex h-9 w-9 items-center justify-center rounded-xl shadow-premium">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">Shopiverse</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-600">Premium Gifts</p>
                </div>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-gray-600">
                Discover thoughtful gifts, cakes, flowers, and curated products in a smooth and mobile-friendly shopping experience.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {['Secure Payment', 'Fast Delivery', 'Easy Returns'].map((tag) => (
                  <span key={tag} className="rounded-full bg-amber-100/70 px-3 py-1 text-xs font-semibold text-amber-800">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-gray-800">Shop</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/products" className="hover:text-primary">All Products</Link></li>
                <li><Link to="/products?category=cakes" className="hover:text-primary">Cakes</Link></li>
                <li><Link to="/products?category=flowers" className="hover:text-primary">Flowers</Link></li>
                <li><Link to="/products?category=plants" className="hover:text-primary">Plants</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-gray-800">Account</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/profile" className="hover:text-primary">Profile</Link></li>
                <li><Link to="/orders" className="hover:text-primary">Orders</Link></li>
                <li><Link to="/wishlist" className="hover:text-primary">Wishlist</Link></li>
                <li><Link to="/about" className="hover:text-primary">About</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-amber-100 pt-6 text-center text-xs font-medium text-gray-500">
            &copy; {new Date().getFullYear()} Shopiverse. Crafted for every screen.
          </div>
        </div>
      </footer>
    </div>
  )
}
