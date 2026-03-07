import { useState, useEffect } from 'react'
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import {
  Package, LayoutDashboard, ShoppingCart, UserCog, ChevronLeft, ChevronRight,
  Search, User, LogOut, Menu, X, Tag, Store, Bell
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { useAppSelector, useAppDispatch } from '../../store/hooks'
import { logoutUser } from '../../store/slices/authSlice'
import { addToast } from '../../store/slices/uiSlice'
import { cn } from '../../lib/utils'

const sidebarItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
  { label: 'Products', icon: Package, href: '/admin/products' },
  { label: 'Categories', icon: Tag, href: '/admin/categories' },
  { label: 'Orders', icon: ShoppingCart, href: '/admin/orders' },
  { label: 'Customers', icon: UserCog, href: '/admin/customers' },
]

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { user, isAuthenticated } = useAppSelector((state) => state.auth)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      if (mobile) setSidebarCollapsed(true)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  const isActive = (href: string) => {
    if (href === '/admin') return location.pathname === '/admin'
    return location.pathname.startsWith(href)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) navigate(`/products?search=${encodeURIComponent(searchQuery)}`)
  }

  const userDisplayName = user?.first_name && user?.last_name
    ? `${user.first_name} ${user.last_name}`
    : user?.name || 'User'
  const userInitial = user?.first_name?.charAt(0) || user?.name?.charAt(0) || 'U'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm",
        isScrolled ? "shadow-md" : ""
      )}>
        <div className="container mx-auto px-4 flex items-center justify-between h-16">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden -ml-2"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>

          {/* Logo */}
          <Link to="/admin" className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">
              Shopiverse
            </span>
            <span className="text-xs font-medium px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">
              Admin
            </span>
          </Link>

          {/* Search - Desktop */}
          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 border-0 rounded-lg pl-10 h-9 text-sm"
              />
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </form>

          {/* Right Side */}
          <div className="flex items-center gap-1">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar_url || user?.avatar} alt={userDisplayName} />
                      <AvatarFallback className="bg-orange-100 text-orange-600 font-semibold text-sm">
                        {userInitial}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm font-medium text-gray-700">{userDisplayName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2 border-b">
                    <p className="font-medium text-gray-900">{userDisplayName}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <DropdownMenuItem onClick={() => navigate('/')} className="cursor-pointer">
                      <Store className="w-4 h-4 mr-2" />
                      Back to Store
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                      <User className="w-4 h-4 mr-2" />
                      My Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/orders')} className="cursor-pointer">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Orders
                    </DropdownMenuItem>
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
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Login</Button>
                <Button size="sm" onClick={() => navigate('/register')} className="bg-orange-500 hover:bg-orange-600">Sign up</Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search */}
        <div className="lg:hidden px-4 pb-3">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 border-0 rounded-lg pl-10 h-10 text-sm"
              />
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </form>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex pt-28 lg:pt-16">
        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 pt-16 lg:pt-16 h-screen bg-white border-r transform transition-transform duration-300 z-50 w-[280px]",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          sidebarCollapsed && "lg:w-16"
        )}>
          <div className="p-3 h-full flex flex-col">
            {/* Mobile Close */}
            <div className="flex items-center justify-between mb-3 lg:hidden">
              <span className="text-sm font-medium">Menu</span>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Collapse Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={cn("hidden lg:flex mb-3", sidebarCollapsed ? "w-full justify-center" : "justify-start")}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              {!sidebarCollapsed && <span className="ml-2">Collapse</span>}
            </Button>

            {/* Nav Items */}
            <nav className="space-y-1 flex-1">
              {sidebarItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium",
                    isActive(item.href) ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50',
                    sidebarCollapsed && "justify-center px-2"
                  )}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              ))}
            </nav>

            {/* Back to Store link at bottom */}
            {!sidebarCollapsed && (
              <Link
                to="/"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors border-t border-gray-100 mt-2 pt-3"
              >
                <Store className="w-5 h-5 flex-shrink-0" />
                <span>Back to Store</span>
              </Link>
            )}
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 p-3 lg:p-4 overflow-x-hidden min-h-[calc(100vh-4rem)]">
          <Outlet context={{ sidebarCollapsed }} />
        </main>
      </div>
    </div>
  )
}
