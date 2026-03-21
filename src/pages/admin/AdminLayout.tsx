import { useState, useEffect } from 'react'
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import {
  Package, LayoutDashboard, ShoppingBag, Users, Mail,
  ChevronLeft, ChevronRight, User, LogOut, Menu, X,
  Tag, Compass
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  { label: 'Orders', icon: ShoppingBag, href: '/admin/orders' },
  { label: 'Customers', icon: Users, href: '/admin/customers' },
  { label: 'Marketing', icon: Mail, href: '/admin/crm' },
]

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { user, isAuthenticated } = useAppSelector((state) => state.auth)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth < 1024) setSidebarCollapsed(false)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => setIsMobileMenuOpen(false), [location.pathname])

  const isActive = (href: string) => {
    if (href === '/admin') return location.pathname === '/admin'
    return location.pathname.startsWith(href)
  }

  const handleLogout = () => {
    dispatch(addToast({ type: 'info', title: 'Logout Successful', message: 'You have been securely logged out from the admin panel.' }))
    dispatch(logoutUser())
    navigate('/')
  }

  const userDisplayName = user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Admin'

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      {/* Top Header */}
      <header className={cn(
        "fixed top-0 right-0 z-50 border-b border-gray-200 bg-white transition-all duration-300",
        sidebarCollapsed ? 'lg:left-20' : 'lg:left-72',
        'left-0'
      )}>
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-gray-900 focus:outline-none"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link to="/admin" className="flex items-center gap-3">
              <div className="link leading-tight">
                <p className="text-xl font-serif text-amber-950">ShopVista</p>
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-amber-800">Management Console</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex h-10 items-center gap-4 focus:outline-none group">
                    <div className="w-10 h-10 border border-gray-200 bg-white flex items-center justify-center text-gray-900 text-xs font-serif uppercase group-hover:border-amber-800 transition-colors">
                      {userDisplayName.charAt(0)}
                    </div>
                    <div className="hidden sm:block text-left">
                      <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-900">{userDisplayName}</span>
                      <span className="block text-[9px] uppercase tracking-widest text-amber-700 font-semibold">Super Admin</span>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-none border border-gray-200 bg-white shadow-2xl p-0">
                  <div className="py-2 flex flex-col">
                    <DropdownMenuItem onClick={() => navigate('/profile')} className="px-6 py-4 cursor-pointer rounded-none hover:bg-[#faf9f6] focus:bg-[#faf9f6] text-gray-900 transition-colors text-[10px] uppercase tracking-[0.2em] font-bold border-b border-gray-100 last:border-b-0">
                      <User className="mr-3 h-4 w-4 text-amber-800" /> My Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/')} className="px-6 py-4 cursor-pointer rounded-none hover:bg-[#faf9f6] focus:bg-[#faf9f6] text-gray-900 transition-colors text-[10px] uppercase tracking-[0.2em] font-bold">
                      <Compass className="mr-3 h-4 w-4 text-amber-800" /> View Store
                    </DropdownMenuItem>
                  </div>
                  <div className="border-t border-gray-200 py-0">
                    <DropdownMenuItem onClick={handleLogout} className="px-6 py-4 cursor-pointer rounded-none bg-red-50 hover:bg-red-100 focus:bg-red-100 text-red-900 transition-colors text-[10px] uppercase tracking-[0.2em] font-bold">
                      <LogOut className="mr-3 h-4 w-4" /> Logout
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-amber-950/20 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 border-r border-gray-100 bg-[#faf9f6] pt-16 transition-all duration-300',
          sidebarCollapsed ? 'w-20 lg:w-20' : 'w-72',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col py-8">
          {!sidebarCollapsed && (
            <div className="px-8 mb-8">
               <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Admin Dashboard</div>
            </div>
          )}

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex items-center gap-4 px-8 py-2 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 hover:text-amber-800 transition-colors mb-6"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4 mx-auto" /> : <><ChevronLeft className="h-4 w-4" /> Collapse Panel</>}
          </button>

          <nav className="flex-1">
            {sidebarItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                title={sidebarCollapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-5 px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] transition-all border-l-4 border-b border-gray-200/50 first:border-t',
                  isActive(item.href)
                    ? 'border-l-amber-700 bg-white text-amber-950 shadow-[0_0_20px_rgba(180,83,9,0.05)]'
                    : 'border-l-transparent text-gray-500 hover:text-amber-800 hover:bg-white/40',
                  sidebarCollapsed && 'justify-center border-l-0 px-0'
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive(item.href) ? "text-amber-800" : "opacity-60")} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </nav>

          <div className="mt-auto border-t border-gray-200/50 pt-2">
            <Link
              to="/"
              title={sidebarCollapsed ? "Visit Store" : undefined}
              className={cn(
                'flex items-center gap-5 px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] transition-all border-l-4 border-l-transparent text-gray-500 hover:text-amber-800 hover:bg-white/40',
                sidebarCollapsed && 'justify-center border-l-0 px-0'
              )}
            >
              <Compass className="h-4 w-4 opacity-60" />
              {!sidebarCollapsed && <span>Visit Store</span>}
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={cn('min-h-screen pt-16 transition-all duration-300', sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72')}>
        <main className="p-6 lg:p-10 max-w-[1600px] mx-auto">
          <Outlet context={{ sidebarCollapsed }} />
        </main>
      </div>
    </div>
  )
}
