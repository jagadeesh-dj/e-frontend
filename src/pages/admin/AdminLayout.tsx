import { useState, useEffect } from 'react'
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import { 
  Package, LayoutDashboard, ShoppingCart, UserCog, ChevronLeft, ChevronRight,
  Search, User, LogOut, Moon, Sun, Menu, X, Tag
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
import { toggleTheme } from '../../store/slices/uiSlice'
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
  const { theme } = useAppSelector((state) => state.ui)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) setSidebarCollapsed(true)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [theme])

  const isActive = (href: string) => {
    if (href === '/admin') return location.pathname === '/admin'
    return location.pathname.startsWith(href)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) navigate(`/products?search=${encodeURIComponent(searchQuery)}`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar - Same style as main site but fixed */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 bg-background border-b transition-all duration-300",
        isScrolled ? "shadow-sm" : ""
      )}>
        <div className="flex items-center justify-between h-16 px-4 lg:px-8">
          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold hidden sm:block">ShopeVerse</span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/" className={cn(
              "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              location.pathname === '/' ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}>Home</Link>
            <Link to="/products" className={cn(
              "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              location.pathname.startsWith('/products') ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}>Products</Link>
            <Link to="/admin" className={cn(
              "px-3 py-2 rounded-lg text-sm font-medium transition-colors text-primary"
            )}>Admin</Link>
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            <form onSubmit={handleSearch} className="hidden lg:block">
              <div className="relative">
                <Input
                  type="search"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 h-9 bg-muted/50 border-0 text-sm"
                />
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </form>

            <Button variant="ghost" size="icon" onClick={() => dispatch(toggleTheme())}>
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback className="text-sm bg-primary/10 text-primary">
                        {user?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}><User className="mr-2 h-4 w-4" />Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/orders')}><ShoppingCart className="mr-2 h-4 w-4" />Orders</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/admin')}><LayoutDashboard className="mr-2 h-4 w-4" />Admin Panel</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => dispatch(logoutUser())}><LogOut className="mr-2 h-4 w-4" />Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Login</Button>
                <Button size="sm" onClick={() => navigate('/register')}>Sign up</Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex pt-16">
        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={cn(
          "sticky top-16 h-[calc(100vh-4rem)] bg-background border-r transform transition-all duration-200 flex-shrink-0 z-50",
          sidebarCollapsed ? "w-16" : "w-56",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
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
                    isActive(item.href) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    sidebarCollapsed && "justify-center px-2"
                  )}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 p-3 lg:p-4 overflow-auto min-h-[calc(100vh-4rem)]">
          <Outlet context={{ sidebarCollapsed }} />
        </main>
      </div>
    </div>
  )
}
