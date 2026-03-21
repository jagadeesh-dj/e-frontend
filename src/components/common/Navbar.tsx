import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, ShoppingBag, Heart, User, LogOut, Package,
  LayoutDashboard, Menu, X, ChevronDown, Phone, MapPin,
  Gift, Sparkles, Leaf, Boxes, Image as ImageIcon, Cake, Flower2,
  Truck
} from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
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
  { name: 'Collections', slug: 'collections', icon: Gift },
  { name: 'Bespoke', slug: 'personalized', icon: Sparkles },
  { name: 'Botanicals', slug: 'plants', icon: Leaf },
  { name: 'Curated Gifts', slug: 'combos', icon: Boxes },
  { name: 'Fine Art', slug: 'frames', icon: ImageIcon },
  { name: 'Patisserie', slug: 'cakes', icon: Cake },
  { name: 'Floral', slug: 'flowers', icon: Flower2 },
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
    dispatch(addToast({ type: 'info', title: 'Logout Successful', message: 'You have been securely logged out.' }))
    dispatch(logoutUser())
    navigate('/')
  }

  const cartItemCount = cart?.total_items || 0
  const wishlistCount = 0

  const userDisplayName = user?.first_name && user?.last_name
    ? `${user.first_name} ${user.last_name}`
    : user?.name || 'User'

  const userInitial = userDisplayName.charAt(0).toUpperCase() || 'U'

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="bg-amber-600 text-white py-1.5 text-[11px] font-medium hidden sm:block">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
               <Phone className="w-3 h-3 text-amber-100" />
               <span className="text-amber-50 hover:text-white transition-colors cursor-pointer">Support: +91 555 123 4567</span>
            </div>
            <div className="text-center flex-1 tracking-wide">
               FREE DELIVERY ON ORDERS ABOVE ₹499
            </div>
            <div className="flex items-center gap-3">
               <Link to="/track" className="text-amber-50 hover:text-white transition-colors cursor-pointer flex items-center gap-1">
                 <Truck className="w-3 h-3" /> Track Order
               </Link>
               <span className="text-amber-400">|</span>
               <Link to="/corporate" className="text-amber-50 hover:text-white transition-colors cursor-pointer">
                 Corporate Gifts
               </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header
        className={cn(
          'sticky top-0 left-0 right-0 z-50 transition-all duration-300 bg-white',
          isScrolled
            ? 'shadow-md'
            : 'border-b border-gray-100'
        )}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 lg:h-[84px]">
            
            {/* Mobile Menu Toggle */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 -ml-2 text-gray-700 hover:text-amber-600 transition-colors focus:outline-none"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>

            {/* Logo / Brand and Location */}
            <div className="flex items-center gap-6 xl:gap-10 flex-1 lg:flex-none">
              <Link to="/" className="flex flex-col items-center justify-center lg:items-start shrink-0">
                  <span className="text-2xl lg:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-amber-800 tracking-tight">
                    ShopVista
                  </span>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hidden sm:block mt-0.5">
                    E-commerce Store
                  </p>
              </Link>

              {/* Delivery Location Picker (Desktop) */}
              <button className="hidden lg:flex flex-col items-start hover:bg-gray-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-gray-200 transition-all text-left shrink-0">
                <span className="text-[10px] text-gray-500 uppercase font-semibold">Deliver to</span>
                <span className="text-sm font-bold text-gray-900 flex items-center">
                  Select Pincode <ChevronDown className="w-3.5 h-3.5 ml-1 text-gray-400" />
                </span>
              </button>
            </div>

            {/* Search Bar - Desktop */}
            <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-2xl px-6 xl:px-12">
              <div className="relative w-full flex items-center bg-white border border-gray-300 rounded-md shadow-sm focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition-all">
                <input
                  type="search"
                  placeholder="Search for gifts, cakes, flowers & more..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none pl-4 pr-12 h-10 text-sm focus:outline-none focus:ring-0 text-gray-800 placeholder:text-gray-400"
                />
                {/* <button type="submit" className="absolute right-1 w-8 h-8 flex items-center justify-center bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors">
                  <Search className="w-4 h-4" />
                </button> */}
              </div>
            </form>

            {/* Right Actions */}
            <div className="flex items-center gap-5 lg:gap-7 xl:gap-9">
              <div className="hidden lg:flex items-center gap-7 xl:gap-9">
                {/* Track Order */}
                <Link to="/orders" className="flex flex-col items-center justify-center text-gray-600 hover:text-amber-600 transition-colors group">
                  <div className="relative mb-1">
                     <Truck className="w-5 h-5 group-hover:-translate-y-1 transition-transform duration-200" />
                  </div>
                  <span className="text-[10px] uppercase tracking-wide font-bold">Orders</span>
                </Link>

                {/* Wishlist */}
                <Link to="/wishlist" className="flex flex-col items-center justify-center text-gray-600 hover:text-amber-600 transition-colors group">
                  <div className="relative mb-1">
                     <Heart className="w-5 h-5 group-hover:-translate-y-1 transition-transform duration-200" />
                     {wishlistCount > 0 && (
                       <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-bold h-4 min-w-[1rem] px-1 rounded-full flex items-center justify-center border border-white">
                         {wishlistCount}
                       </span>
                     )}
                  </div>
                  <span className="text-[10px] uppercase tracking-wide font-bold">Wishlist</span>
                </Link>

                {/* User Profile */}
                {isAuthenticated ? (
                  <DropdownMenu open={profileOpen} onOpenChange={setProfileOpen}>
                    <DropdownMenuTrigger asChild>
                      <button className="flex flex-col items-center justify-center text-gray-600 hover:text-amber-600 transition-colors focus:outline-none group">
                        <User className="w-5 h-5 group-hover:-translate-y-1 transition-transform duration-200 mb-1" />
                        <span className="text-[10px] uppercase tracking-wide font-bold flex items-center">
                           Account <ChevronDown className="w-3 h-3 ml-0.5 opacity-70 group-hover:opacity-100" />
                        </span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-72 rounded-2xl border border-gray-100 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] bg-white p-2 mt-2">
                      <div className="px-4 py-4 border-b border-gray-50 mb-2 bg-[#FDFCFB] rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center overflow-hidden shadow-md ring-2 ring-amber-100/50">
                            {user?.avatar || user?.avatar_url ? (
                              <img src={user.avatar || user.avatar_url} alt={userDisplayName} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white font-bold">{userInitial}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 truncate">{userDisplayName}</p>
                            <p className="text-xs text-gray-500 font-medium truncate">{user?.email}</p>
                          </div>
                        </div>
                        {isAdmin && (
                           <div className="mt-3 text-[10px] uppercase tracking-widest font-extrabold text-amber-700 bg-amber-50 inline-block px-2.5 py-1 rounded-md border border-amber-100/50">
                             {user?.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                           </div>
                        )}
                      </div>
                      
                      <div className="space-y-0.5">
                        <DropdownMenuItem onClick={() => navigate('/profile')} className="px-3 py-3 cursor-pointer rounded-xl hover:bg-amber-50 focus:bg-amber-50 text-gray-700 hover:text-amber-800 transition-all font-semibold flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-white">
                            <User className="h-4 w-4 text-amber-600" />
                          </div>
                          <span>My Account</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/orders')} className="px-3 py-3 cursor-pointer rounded-xl hover:bg-amber-50 focus:bg-amber-50 text-gray-700 hover:text-amber-800 transition-all font-semibold flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-white">
                            <Package className="h-4 w-4 text-amber-600" />
                          </div>
                          <span>Order History</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/wishlist')} className="px-3 py-3 cursor-pointer rounded-xl hover:bg-amber-50 focus:bg-amber-50 text-gray-700 hover:text-amber-800 transition-all font-semibold flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-white">
                            <Heart className="h-4 w-4 text-amber-600" />
                          </div>
                          <span>My Wishlist</span>
                        </DropdownMenuItem>
                      </div>
                      
                      {isAdmin && (
                        <div className="px-1 mt-1">
                          <DropdownMenuSeparator className="my-1 bg-gray-50" />
                          <DropdownMenuItem onClick={() => navigate('/admin')} className="px-3 py-3 cursor-pointer rounded-xl hover:bg-amber-100/40 text-gray-900 hover:text-amber-800 transition-all font-semibold flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-600/10 flex items-center justify-center">
                              <LayoutDashboard className="h-4 w-4 text-amber-600" />
                            </div>
                            <span>Admin Panel</span>
                          </DropdownMenuItem>
                        </div>
                      )}
                      
                      <DropdownMenuSeparator className="my-1 bg-gray-50" />
                      <DropdownMenuItem onClick={handleLogout} className="px-3 py-3 cursor-pointer rounded-xl hover:bg-red-50 focus:bg-red-50 text-red-600 transition-all font-semibold flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-100/50 flex items-center justify-center">
                          <LogOut className="h-4 w-4 text-red-600" />
                        </div>
                        <span>Sign Out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link to="/login" className="flex flex-col items-center justify-center text-gray-600 hover:text-amber-600 transition-colors group">
                     <User className="w-5 h-5 group-hover:-translate-y-1 transition-transform duration-200 mb-1" />
                     <span className="text-[10px] uppercase tracking-wide font-bold">Sign In</span>
                  </Link>
                )}
              </div>

              {/* Mobile Search Icon */}
              <div className="flex lg:hidden items-center">
                 <Link to="/search" className="text-gray-700 hover:text-amber-600 transition-colors p-2">
                   <Search className="w-5 h-5" />
                 </Link>
              </div>

              {/* Cart */}
              <Link to="/cart" className="flex flex-col items-center justify-center text-gray-600 hover:text-amber-600 transition-colors group relative">
                 <div className="relative mb-1">
                    <ShoppingBag className="w-6 h-6 lg:w-5 lg:h-5 group-hover:-translate-y-1 transition-transform duration-200" />
                    {cartItemCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 bg-amber-600 text-white text-[10px] font-bold h-4.5 min-w-[1.125rem] px-1 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                        {cartItemCount}
                      </span>
                    )}
                 </div>
                 <span className="text-[10px] uppercase tracking-wide font-bold hidden lg:block">Cart</span>
              </Link>
            </div>
          </div>
        </div>

      </header>

      {/* Category Navigation - Desktop (Non-Sticky, Home Only) */}
      {location.pathname === '/' && (
        <div className="hidden lg:block border-b border-gray-100 bg-white pb-1 relative z-40">
          <div className="max-w-[1400px] mx-auto px-6">
            <div className="flex items-center justify-between py-2 overflow-x-auto">
              {categories.map((category) => {
                const Icon = category.icon
                return (
                  <Link
                    key={category.slug}
                    to={`/products?category=${category.slug}`}
                    className="flex flex-col items-center gap-1.5 text-gray-600 hover:text-amber-600 transition-colors group px-2 min-w-[80px]"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors border border-amber-100/50">
                      <Icon className="w-5 h-5 text-amber-600 shrink-0" strokeWidth={1.5} />
                    </div>
                    <span className="text-xs font-semibold whitespace-nowrap">{category.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}


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
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 lg:hidden"
             />

             {/* Drawer */}
             <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 w-[85vw] max-w-sm bg-white z-50 lg:hidden shadow-2xl flex flex-col"
             >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                  <div className="flex items-center">
                    <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-amber-800">ShopVista</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 -mr-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile Search */}
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                   <form onSubmit={handleSearch}>
                     <div className="relative flex items-center bg-white border border-gray-200 rounded-lg focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400 transition-all">
                       {/* <Search className="w-4 h-4 text-gray-400 absolute left-3" /> */}
                       <input
                         type="search"
                         placeholder="Search gifts, cakes..."
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                         className="w-full bg-transparent border-none pl-9 pr-4 h-11 text-sm focus:outline-none focus:ring-0 text-gray-800 placeholder:text-gray-400"
                       />
                     </div>
                   </form>
                </div>

                {/* Delivery Location Mobile */}
                <div className="p-4 border-b border-gray-100">
                  <button className="w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 px-4 py-3 rounded-lg border border-gray-200 transition-all text-left">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-500 uppercase font-semibold mb-0.5">Deliver to</span>
                      <span className="text-sm font-bold text-gray-900 flex items-center">
                        Select Pincode
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                {/* Navigation Items */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                   <div className="p-4">
                      <div className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3 px-2">
                         Categories
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                         {categories.map((category) => {
                           const Icon = category.icon;
                           return (
                             <Link
                               key={category.slug}
                               to={`/products?category=${category.slug}`}
                               onClick={() => setMobileMenuOpen(false)}
                               className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border border-gray-100 hover:border-amber-200 hover:bg-amber-50 transition-colors text-center group"
                             >
                               <div className="w-10 h-10 rounded-full bg-amber-50 group-hover:bg-amber-100 flex items-center justify-center transition-colors">
                                  <Icon className="w-5 h-5 text-amber-600" />
                               </div>
                               <span className="text-xs font-semibold text-gray-700">{category.name}</span>
                             </Link>
                           )
                         })}
                      </div>
                   </div>

                   {/* User Actions Mobile */}
                   <div className="p-4 border-t border-gray-100 bg-gray-50/50 mt-auto">
                      {isAuthenticated ? (
                         <div className="space-y-1">
                            <div className="px-3 mb-4 pb-4 border-b border-gray-200">
                               <p className="font-semibold text-gray-900">{userDisplayName}</p>
                               <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                            </div>
                            <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 text-sm font-medium text-gray-700 hover:text-amber-700 hover:bg-amber-50 rounded-lg px-3 py-3 transition-colors">
                               <User className="w-5 h-5 text-gray-400" /> My Account
                            </Link>
                            <Link to="/orders" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 text-sm font-medium text-gray-700 hover:text-amber-700 hover:bg-amber-50 rounded-lg px-3 py-3 transition-colors">
                               <Package className="w-5 h-5 text-gray-400" /> Orders
                            </Link>
                            <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 text-sm font-medium text-gray-700 hover:text-amber-700 hover:bg-amber-50 rounded-lg px-3 py-3 transition-colors">
                               <Heart className="w-5 h-5 text-gray-400" /> Wishlist
                            </Link>
                            {isAdmin && (
                              <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 text-sm font-bold text-amber-700 hover:bg-amber-50 rounded-lg px-3 py-3 transition-colors mt-2">
                                 <LayoutDashboard className="w-5 h-5 text-amber-600" /> Admin Dashboard
                              </Link>
                            )}
                            <button onClick={handleLogout} className="flex items-center gap-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg px-3 py-3 transition-colors w-full mt-4">
                               <LogOut className="w-5 h-5 text-red-500" /> Sign Out
                            </button>
                         </div>
                      ) : (
                         <div className="space-y-3 px-2">
                            <Button asChild className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors shadow-sm">
                               <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Login</Link>
                            </Button>
                            <Button asChild variant="outline" className="w-full h-11 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                               <Link to="/register" onClick={() => setMobileMenuOpen(false)}>Create Account</Link>
                            </Button>
                         </div>
                      )}
                   </div>
                </div>
             </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
