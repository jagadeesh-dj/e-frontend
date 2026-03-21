import { useState, useEffect } from 'react'
import {
  Search, Eye, FileSpreadsheet, ChevronLeft, ChevronRight, Activity, Clock
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { formatPrice } from '../../lib/utils'
import { downloadCsv } from '../../utils/csv'
import { useAppDispatch } from '../../store/hooks'
import { addToast } from '../../store/slices/uiSlice'
import api from '../../services/api'
import { Order } from '../../types'

export default function AdminOrders() {
  const dispatch = useAppDispatch()
  const [orders, setOrders] = useState<Order[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get('/admin/orders', {
          params: { page: 1, page_size: 1000 }
        })
        setOrders(response.data.items || [])
      } catch (error) {
         dispatch(addToast({ type: 'error', title: 'System Error', message: 'Registry unreadable or inaccessible.' }))
      }
    }
    fetchOrders()
  }, [dispatch])

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      String(order.id)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(order.user_id)?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleExportOrders = () => {
    if (filteredOrders.length === 0) return

    const exportRows = filteredOrders.map((order) => ({
      order_id: order.id,
      order_number: order.orderNumber || '',
      customer_id: order.uid,
      items_count: order.items?.length || 0,
      total: order.total_amount || order.total || 0,
      payment_status: order.payment_status || '',
      order_status: order.status || '',
      created_at: order.created_at ? new Date(order.created_at).toLocaleDateString() : '',
    }))

    downloadCsv('atelier_ledger_export.csv', exportRows, [
      'order_id', 'order_number', 'customer_id', 'items_count', 'total', 'payment_status', 'order_status', 'created_at'
    ])
    dispatch(addToast({ type: 'success', title: 'Manifest Downloaded', message: 'Current registry exported to physical file.' }))
  }

  return (
    <div className="space-y-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between border-b border-gray-200/80 pb-6 gap-4">
        <div>
          <h1 className="text-4xl font-serif text-gray-900 mb-2">Orders</h1>
          <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-gray-400 flex items-center gap-2">
             <Activity className="w-3 h-3" /> Order History & Fulfillment
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={handleExportOrders} className="h-10 px-8 bg-amber-700 text-white rounded-none uppercase text-[10px] tracking-[0.2em] hover:bg-amber-800 transition-colors font-bold shadow-lg shadow-amber-900/10">
            <FileSpreadsheet className="w-3 h-3 mr-2" /> Export Orders
          </Button>
        </div>
      </div>

      <div className="bg-white border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
           <div className="relative w-full sm:max-w-md flex items-center border-b border-gray-300 focus-within:border-amber-700 transition-colors pb-1">
             <Search className="w-4 h-4 text-gray-400 absolute left-0" />
             <input
               type="search"
               placeholder="Search by reference or client ID..."
               value={searchQuery}
               onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
               className="w-full bg-transparent border-none pl-8 pr-4 h-8 text-sm font-light focus:outline-none focus:ring-0 placeholder:text-gray-400"
             />
           </div>

           <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto scrollbar-hide">
              {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
                 <button
                   key={status}
                   onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
                   className={`px-4 py-2 text-[9px] uppercase tracking-[0.2em] font-semibold whitespace-nowrap transition-colors border ${statusFilter === status ? 'bg-amber-700 text-white border-amber-700' : 'bg-transparent text-gray-400 border-transparent hover:border-gray-200'}`}
                 >
                   {status}
                 </button>
              ))}
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#faf9f6]">
                <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200">Order ID</th>
                <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200">Customer ID</th>
                <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200 text-center">Items</th>
                <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200 text-right">Total Amount</th>
                <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200 text-center">Payment Status</th>
                <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200 text-center">Order Status</th>
                <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200 text-right">View</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.length === 0 ? (
                <tr>
                   <td colSpan={7} className="py-16 text-center text-gray-400 font-serif text-lg">Empty Registry</td>
                </tr>
              ) : (
                 paginatedOrders.map((order) => (
                   <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                     <td className="py-4 px-6">
                       <span className="font-mono text-xs text-gray-900">{order.orderNumber || String(order.order_number)}</span>
                       <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">{order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}</div>
                     </td>
                     <td className="py-4 px-6">
                       <span className="font-mono text-xs text-gray-500 truncate block max-w-[120px]">{order.uid}</span>
                     </td>
                     <td className="py-4 px-6 text-sm font-light text-gray-900 text-center">
                       {order.items?.length || 0}
                     </td>
                     <td className="py-4 px-6 font-serif text-gray-900 text-right">
                       {formatPrice(order.total_amount || order.total || 0)}
                     </td>
                     <td className="py-4 px-6 text-center">
                        <span className={`text-[9px] uppercase tracking-widest px-2 py-1 font-bold border ${order.payment_status === 'paid' || order.payment_status === 'completed' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-amber-200 text-amber-700 bg-amber-50'}`}>
                          {order.payment_status || 'pending'}
                        </span>
                     </td>
                     <td className="py-4 px-6 text-center">
                        <span className={`text-[9px] uppercase tracking-widest px-2 py-1 font-bold border ${
                          order.status === 'delivered' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 
                          order.status === 'processing' ? 'border-blue-200 text-blue-700 bg-blue-50' : 
                          order.status === 'shipped' ? 'border-indigo-200 text-indigo-700 bg-indigo-50' : 
                          order.status === 'cancelled' ? 'border-red-200 text-red-700 bg-red-50' : 
                          'border-gray-200 text-gray-700 bg-gray-50'
                        }`}>
                          {order.status}
                        </span>
                     </td>
                     <td className="py-4 px-6 text-right">
                        <button className="text-gray-400 hover:text-amber-800 transition-colors p-2">
                           <Eye className="w-4 h-4" />
                        </button>
                     </td>
                   </tr>
                 ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between text-xs font-light text-gray-500 bg-[#faf9f6]">
            <div className="uppercase tracking-widest">
              Entries {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length}
            </div>
            <div className="flex items-center gap-1 font-sans">
              <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center text-gray-500 disabled:opacity-30 hover:bg-white border border-transparent hover:border-gray-200 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => Math.abs(currentPage - p) <= 2).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 flex items-center justify-center font-bold text-xs border transition-colors ${currentPage === page ? 'bg-amber-700 text-white border-amber-700' : 'bg-transparent text-gray-400 border-transparent hover:border-gray-200 hover:bg-white'}`}
                >
                  {page}
                </button>
              ))}
              <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="w-8 h-8 flex items-center justify-center text-gray-500 disabled:opacity-30 hover:bg-white border border-transparent hover:border-gray-200 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
