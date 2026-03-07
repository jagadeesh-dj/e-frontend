import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Package, ChevronRight, ArrowRight, Search, Loader2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { fetchOrders } from '../store/slices/orderSlice'
import { formatPrice, formatDate } from '../lib/utils'

const statusFilters = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Processing', value: 'processing' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
]

export default function Orders() {
  const dispatch = useAppDispatch()
  const { orders, isLoading } = useAppSelector((state) => state.orders)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    dispatch(fetchOrders())
  }, [dispatch])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning'
      case 'processing': return 'secondary'
      case 'shipped': return 'default'
      case 'delivered': return 'success'
      case 'cancelled': return 'destructive'
      default: return 'secondary'
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    const matchesSearch = !searchQuery ||
      (order.orderNumber && String(order.orderNumber).toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.id && String(order.id).toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesStatus && matchesSearch
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
          <p className="text-gray-500 mt-4">Loading your orders...</p>
        </div>
      </div>
    )
  }

  if (orders.length === 0 && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900">No orders yet</h2>
          <p className="text-gray-500 mb-6">Start shopping to see your orders here.</p>
          <Link to="/products">
            <Button size="lg" className="btn-premium">
              Browse Products
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      <div className="bg-gradient-to-r from-amber-50 to-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-500 mt-2">Track and manage your orders</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Status filter tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
            {statusFilters.map((filter) => {
              const filterCount = filter.value === 'all'
                ? orders.length
                : orders.filter(o => o.status === filter.value).length
              return (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${statusFilter === filter.value
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                    }`}
                >
                  {filter.label}
                  {filterCount > 0 && (
                    <span className={`ml-1.5 text-xs ${statusFilter === filter.value ? 'text-white/80' : 'text-gray-400'
                      }`}>
                      ({filterCount})
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Input
              type="search"
              placeholder="Search order #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white pl-10"
            />
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-500 mb-4">
          {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} found
        </p>

        {/* Order list */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No orders match your filters</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => { setStatusFilter('all'); setSearchQuery('') }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            filteredOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={`/orders/${order.id}`}>
                  <Card hover className="card-premium p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-mono font-medium text-gray-900">#{order.orderNumber || order.id}</p>
                            <Badge variant={getStatusColor(order.status) as any}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            {order.items?.length || 0} item(s) • {formatPrice(order.total_amount)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Ordered on {formatDate(order.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <span className="text-sm hidden md:inline">View details</span>
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
