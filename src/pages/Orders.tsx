import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, ArrowLeft, Search, Loader2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { fetchOrders } from '../store/slices/orderSlice'
import { formatPrice, formatDate, cn } from '../lib/utils'

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

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    const matchesSearch = !searchQuery ||
      (order.orderNumber && String(order.orderNumber).toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.id && String(order.id).toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesStatus && matchesSearch
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf9f6]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300 mb-6" />
        <div className="text-center font-serif text-2xl text-gray-400">
          Retrieving ledger records...
        </div>
      </div>
    )
  }

  if (orders.length === 0 && !isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[#faf9f6] px-4 space-y-8">
        <h2 className="font-serif text-4xl text-gray-900">No Transaction History</h2>
        <p className="text-gray-500 font-light max-w-md text-center">
          You haven't initiated any acquisitions. Discover our verified collections.
        </p>
        <Link to="/products">
          <Button className="h-14 px-10 bg-amber-700 text-white hover:bg-amber-800 rounded-none uppercase text-xs tracking-[0.2em] transition-colors">
            Explore Gallery
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] pb-24 border-t border-gray-200/50">

      {/* Header */}
      <div className="max-w-[1400px] mx-auto px-6 py-10 lg:py-16 border-b border-gray-200/50">
        <Link to="/profile" className="inline-flex items-center text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 hover:text-amber-700 transition-colors mb-6">
          <ArrowLeft className="w-3 h-3 mr-2" />Return to Control Panel
        </Link>
        <h1 className="font-serif text-4xl lg:text-5xl text-gray-900 border-b border-gray-200/50 pb-8">Acquisition Register</h1>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-12">

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 border border-gray-200 bg-white p-2">

          <div className="flex gap-2 overflow-x-auto w-full md:w-auto custom-scrollbar md:border-none p-2">
            {statusFilters.map((filter) => {
              const filterCount = filter.value === 'all'
                ? orders.length
                : orders.filter(o => o.status === filter.value).length
              return (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={cn(
                    "px-4 py-2 text-[10px] uppercase tracking-[0.2em] font-bold whitespace-nowrap transition-colors border",
                    statusFilter === filter.value
                      ? "bg-amber-700 text-white border-amber-700"
                      : "bg-transparent text-gray-500 border-transparent hover:border-gray-200"
                  )}
                >
                  {filter.label} <span className="font-light ml-1 opacity-60">[{filterCount}]</span>
                </button>
              )
            })}
          </div>

          <div className="relative w-full md:w-72 p-2">
            <Input
              type="search"
              placeholder="Query Reference ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border border-gray-200 rounded-none pl-10 h-10 focus-visible:ring-0 focus-visible:border-amber-700 text-[10px] uppercase tracking-widest placeholder:text-gray-400"
            />
            <Search className="w-4 h-4 absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Order List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-20 border border-gray-200 bg-white">
              <p className="text-gray-500 font-mono text-sm mb-4">Query string disjoint. No matching ledgers.</p>
              <button onClick={() => { setStatusFilter('all'); setSearchQuery('') }} className="text-[10px] uppercase tracking-[0.3em] font-bold text-amber-700 hover:text-amber-900">
                Reset Parameters
              </button>
            </div>
          ) : (
            filteredOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={`/orders/${order.order_number || order.id}`} className="block border border-gray-200 bg-white hover:border-amber-700 transition-colors p-6 sm:p-8 group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 md:gap-10">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-bold mb-2">Reference ID</p>
                        <p className="font-serif text-xl sm:text-2xl text-gray-900 tracking-tight">#{order.order_number || order.orderNumber || order.id}</p>
                      </div>

                      <div className="h-px w-full sm:h-12 sm:w-px bg-gray-200 hidden sm:block" />

                      <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-bold mb-2">Timestamp</p>
                        <p className="text-sm font-mono text-gray-900 uppercase tracking-widest">{formatDate(order.created_at)}</p>
                      </div>

                      <div className="h-px w-full sm:h-12 sm:w-px bg-gray-200 hidden sm:block" />

                      <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-bold mb-2">Ledger Total</p>
                        <p className="text-lg font-bold font-mono text-gray-900">{formatPrice(order.total_amount)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                      <div className="flex flex-col items-start sm:items-end gap-2">
                        <span className={cn("text-[9px] uppercase tracking-[0.2em] px-3 py-1 border font-bold",
                          order.status === 'delivered' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' :
                            order.status === 'cancelled' ? 'border-red-200 text-red-700 bg-red-50' :
                              'border-amber-200 text-amber-700 bg-amber-50'
                        )}>
                          {order.status}
                        </span>
                        <span className={cn("text-[9px] uppercase tracking-[0.2em] font-bold border px-2 py-0.5",
                          (order.payment_status === 'paid' || order.payment_status === 'completed') ? 'border-emerald-100 text-emerald-600' : 'border-amber-100 text-amber-600'
                        )}>
                          [ {(order.payment_status || 'Pending').toUpperCase()} ]
                        </span>
                      </div>
                      <div className="w-8 h-8 flex items-center justify-center border border-gray-200 text-gray-400 group-hover:bg-amber-700 group-hover:border-amber-700 group-hover:text-white transition-colors">
                        <ArrowRight className="w-4 h-4 text-inherit" />
                      </div>
                    </div>

                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}
