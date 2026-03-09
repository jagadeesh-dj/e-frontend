import { useState, useEffect } from 'react'
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import {
  Package,
  LayoutDashboard,
  ShoppingCart,
  UserCog,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  Search,
  User,
  LogOut,
  Menu,
  X,
  Tag,
  Store,
  Sparkles,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
  { label: 'CRM', icon: Megaphone, href: '/admin/crm' },
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
      if (mobile) {
        setSidebarCollapsed(false)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  const isActive = (href: string) => {
    if (href === '/admin') return location.pathname === '/admin'
    return location.pathname.startsWith(href)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleLogout = () => {
    dispatch(addToast({ type: 'info', title: 'Logged out', message: 'See you soon.' }))
    dispatch(logoutUser())
    navigate('/')
  }

  const userDisplayName = user?.first_name && user?.last_name
    ? `${user.first_name} ${user.last_name}`
    : user?.name || 'User'
  const userInitial = user?.first_name?.charAt(0) || user?.name?.charAt(0) || 'U'

  return (
    <div className="min-h-screen">
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 border-b border-amber-100 bg-white/92 backdrop-blur-xl transition-shadow',
          isScrolled && 'shadow-surface-sm'
        )}
      >
        <div className="app-container">
          <div className="flex h-[74px] items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open admin menu"
              >
                <Menu className="h-5 w-5" />
              </Button>

              <Link to="/admin" className="flex items-center gap-2.5">

                <div className="leading-tight">
                  <p className="text-lg font-bold text-gray-900">Shopiverse</p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-600">Admin Console</p>
                </div>
              </Link>
            </div>
{/* 
            <form onSubmit={handleSearch} className="hidden flex-1 max-w-md lg:flex">
              <div className="relative w-full">
                <Input
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 rounded-full pl-10"
                />
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </form> */}

            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex h-10 items-center gap-2 rounded-xl px-2.5">
                      <Avatar className="h-8 w-8 ring-2 ring-amber-100">
                        <AvatarImage src={user?.avatar_url || user?.avatar} alt={userDisplayName} />
                        <AvatarFallback className="bg-amber-100 text-amber-700">{userInitial}</AvatarFallback>
                      </Avatar>
                      <span className="hidden max-w-[130px] truncate text-sm font-semibold text-gray-700 sm:block">{userDisplayName}</span>
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
                      <DropdownMenuItem onClick={() => navigate('/')} className="cursor-pointer py-2.5">
                        <Store className="mr-2.5 h-4 w-4 text-primary" />
                        Back to Store
                      </DropdownMenuItem>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                      <LogOut className="mr-2.5 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Login</Button>
                  <Button size="sm" onClick={() => navigate('/register')}>Sign up</Button>
                </div>
              )}
            </div>
          </div>

          {/* <form onSubmit={handleSearch} className="pb-3 lg:hidden">
            <div className="relative">
              <Input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 rounded-full pl-10"
              />
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </form> */}
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/35 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 border-r border-amber-100 bg-white pt-[74px] transition-transform duration-300 lg:translate-x-0',
          sidebarCollapsed ? 'lg:w-24' : 'lg:w-72',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          'w-[300px]'
        )}
      >
        <div className="flex h-full flex-col p-3">
          <div className="mb-2 flex items-center justify-between px-1 lg:hidden">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Navigation</p>
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            className={cn('mb-3 hidden justify-start lg:flex', sidebarCollapsed && 'justify-center')}
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!sidebarCollapsed && <span className="ml-2">Collapse</span>}
          </Button>

          <nav className="space-y-1.5">
            {sidebarItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                title={sidebarCollapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                  isActive(item.href)
                    ? 'bg-amber-100/80 text-amber-800'
                    : 'text-gray-600 hover:bg-amber-100/70 hover:text-gray-900',
                  sidebarCollapsed && 'justify-center px-2'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </nav>

          <div className="mt-auto border-t border-amber-100 pt-3">
            <Link
              to="/"
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-amber-100/70 hover:text-gray-900',
                sidebarCollapsed && 'justify-center px-2'
              )}
            >
              <Store className="h-5 w-5 shrink-0" />
              {!sidebarCollapsed && <span>Back to Store</span>}
            </Link>
          </div>
        </div>
      </aside>

      <div className={cn('min-h-screen pt-[122px] lg:pt-[82px]', sidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72')}>
        <main className="px-3 pb-6 pt-3 sm:px-4 lg:px-6 lg:pt-5">
          <Outlet context={{ sidebarCollapsed }} />
        </main>
      </div>
    </div>
  )
}
