import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Users, Package, DollarSign, ShoppingBag, ArrowUpRight, ArrowDownRight,
  Eye, ChevronLeft, ChevronRight, Activity, Clock
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { formatPrice } from '../lib/utils'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import api from '../services/api'
import { Order } from '../types'

interface DashboardStatsData {
  total_revenue: number
  total_orders: number
  total_users: number
  low_stock_products: number
}

export default function AdminDashboard() {
  const navigate = useNavigate()

  const [stats, setStats] = useState<DashboardStatsData>({
    total_revenue: 0,
    total_orders: 0,
    total_users: 0,
    low_stock_products: 0,
  })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [salesData, setSalesData] = useState<any[]>([])

  const [recentOrdersPage, setRecentOrdersPage] = useState(1)
  const ordersPerPage = 6

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await api.get('/admin/dashboard')
        if (statsRes.data) {
          setStats(statsRes.data)
        }

        const ordersRes = await api.get('/admin/orders', { params: { page: 1, page_size: 50 }})
        setRecentOrders(ordersRes.data.items || [])

        setSalesData([
          { date: 'Mon', revenue: 12000, orders: 4 },
          { date: 'Tue', revenue: 15000, orders: 7 },
          { date: 'Wed', revenue: 9000, orders: 3 },
          { date: 'Thu', revenue: 25000, orders: 12 },
          { date: 'Fri', revenue: 18000, orders: 8 },
          { date: 'Sat', revenue: 32000, orders: 15 },
          { date: 'Sun', revenue: 28000, orders: 10 }
        ])
      } catch (e) {
        console.error(e)
      }
    }
    fetchData()
  }, [])

  const statsData = [
    { title: 'Total Revenue', value: formatPrice(stats.total_revenue || 0), change: 12.5, icon: DollarSign },
    { title: 'Total Orders', value: (stats.total_orders || 0).toLocaleString(), change: 8.2, icon: ShoppingBag },
    { title: 'Total Customers', value: (stats.total_users || 0).toLocaleString(), change: -2.4, icon: Users },
    { title: 'Out of Stock', value: (stats.low_stock_products || 0).toLocaleString(), change: 0, icon: Package },
  ]

  const totalOrderPages = Math.ceil(recentOrders.length / ordersPerPage)
  const paginatedRecentOrders = recentOrders.slice((recentOrdersPage - 1) * ordersPerPage, recentOrdersPage * ordersPerPage)

  return (
    <div className="space-y-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between border-b border-gray-200/80 pb-6 gap-4">
        <div>
          <h1 className="text-4xl font-serif text-gray-900 mb-2">Atelier Overview</h1>
          <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-gray-400 flex items-center gap-2">
             <Activity className="w-3 h-3" /> Live Metrics & Trajectory
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-gray-500 bg-white border border-gray-200 px-3 py-1.5">
           <Clock className="w-3 h-3 text-amber-600" /> System Active
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white border border-gray-200 p-6 flex flex-col justify-between group hover:border-amber-700 transition-colors shadow-sm"
          >
            <div className="flex items-start justify-between mb-8">
              <stat.icon className="w-5 h-5 text-gray-300 group-hover:text-amber-700 transition-colors" />
              <div className={`flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold ${stat.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {stat.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(stat.change)}%
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 mb-1">{stat.title}</p>
              <p className="text-3xl font-serif text-amber-950">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white border border-gray-200 p-8">
          <div className="mb-8 border-b border-gray-100 pb-4">
            <h3 className="font-serif text-2xl text-gray-900 mb-1">Revenue Trends</h3>
            <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-400">7-Day Performance Metrics</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#111827" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#111827" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold' }} tickFormatter={(value) => `₹${value / 1000}k`} />
                <Tooltip cursor={{ stroke: '#f59e0b', strokeWidth: 1, strokeDasharray: '4 4' }} contentStyle={{ backgroundColor: '#fff', border: '1px solid #f3f4f6', borderRadius: '0', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 800 }} />
                <Area type="monotone" dataKey="revenue" stroke="#b45309" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-8">
          <div className="mb-8 border-b border-gray-100 pb-4">
            <h3 className="font-serif text-2xl text-gray-900 mb-1">Volume Disposition</h3>
            <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-400">7-Day Order Velocity</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold' }} />
                <Tooltip cursor={{ fill: '#fff7ed' }} contentStyle={{ backgroundColor: '#fff', border: '1px solid #f3f4f6', borderRadius: '0', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 800 }} />
                <Bar dataKey="orders" fill="#d97706" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-gray-200">
        <div className="p-6 border-b border-gray-200/80 flex items-center justify-between">
          <div>
             <h3 className="font-serif text-2xl text-gray-900 mb-1">Recent Orders</h3>
             <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-400">Latest Completed Transactions</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/orders')} className="h-9 px-6 bg-white border-amber-900/20 text-amber-900 rounded-none uppercase text-[10px] tracking-widest hover:bg-amber-100/50 transition-colors font-bold">
            View All Orders
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#faf9f6]">
                <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200">Reference</th>
                <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200">Client ID</th>
                <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200">Articles</th>
                <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200">Valuation</th>
                <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200">Settlement</th>
                <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200">Logistics</th>
                <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecentOrders.length === 0 ? (
                <tr>
                   <td colSpan={7} className="py-12 text-center text-gray-400 font-serif">No activity recorded</td>
                </tr>
              ) : (
                 paginatedRecentOrders.map((order) => (
                   <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                     <td className="py-4 px-6">
                       <span className="font-mono text-xs text-gray-900">#{order.orderNumber || order.id}</span>
                       <div className="text-[10px] text-gray-400 mt-1">{order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}</div>
                     </td>
                     <td className="py-4 px-6 text-sm font-light text-gray-600 truncate max-w-[150px]">{order.user_id}</td>
                     <td className="py-4 px-6 text-sm font-light text-gray-600">{order.items?.length || 0}</td>
                     <td className="py-4 px-6 font-serif text-gray-900">{formatPrice(order.total_amount || order.total || 0)}</td>
                     <td className="py-4 px-6">
                       <span className={`text-[9px] uppercase tracking-widest px-2 py-1 font-bold border ${order.payment_status === 'paid' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-amber-200 text-amber-700 bg-amber-50'}`}>
                         {order.payment_status || 'pending'}
                       </span>
                     </td>
                     <td className="py-4 px-6">
                       <span className={`text-[9px] uppercase tracking-widest px-2 py-1 font-bold border ${order.status === 'delivered' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : order.status === 'processing' ? 'border-blue-200 text-blue-700 bg-blue-50' : 'border-gray-200 text-gray-700 bg-gray-50'}`}>
                         {order.status}
                       </span>
                     </td>
                     <td className="py-4 px-6 text-right">
                       <button className="p-2 text-gray-400 hover:text-amber-800 transition-colors">
                         <Eye className="w-4 h-4" />
                       </button>
                     </td>
                   </tr>
                 ))
              )}
            </tbody>
          </table>
        </div>

        {totalOrderPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 bg-[#faf9f6]">
            <div>
              Registry {(recentOrdersPage - 1) * ordersPerPage + 1} - {Math.min(recentOrdersPage * ordersPerPage, recentOrders.length)} of {recentOrders.length}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setRecentOrdersPage(p => p - 1)} disabled={recentOrdersPage === 1} className="w-8 h-8 flex items-center justify-center border border-transparent disabled:opacity-50 hover:border-gray-200 hover:bg-white text-gray-900 transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalOrderPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setRecentOrdersPage(page)}
                  className={`w-8 h-8 flex items-center justify-center border font-semibold transition-all ${recentOrdersPage === page ? 'border-amber-700 bg-amber-700 text-white' : 'border-transparent text-gray-400 hover:border-gray-200 hover:bg-white'}`}
                >
                  {page}
                </button>
              ))}
              <button onClick={() => setRecentOrdersPage(p => p + 1)} disabled={recentOrdersPage === totalOrderPages} className="w-8 h-8 flex items-center justify-center border border-transparent disabled:opacity-50 hover:border-gray-200 hover:bg-white text-gray-900 transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
