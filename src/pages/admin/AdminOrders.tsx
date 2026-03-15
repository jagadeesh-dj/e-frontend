import { useState, useEffect } from 'react'
import {
  Search, Eye, Truck, CheckCircle, XCircle, Clock, Package as PackageIcon, ChevronLeft, ChevronRight, FileSpreadsheet
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../../components/ui/select'
import { formatPrice } from '../../lib/utils'
import { downloadCsv } from '../../utils/csv'
import { useAppDispatch } from '../../store/hooks'
import { addToast } from '../../store/slices/uiSlice'
import api from '../../services/api'
import { Order } from '../../types'

const statusColors: Record<string, "success" | "warning" | "outline" | "default" | "destructive" | "secondary"> = {
  pending: 'warning',
  processing: 'secondary',
  shipped: 'default',
  delivered: 'success',
  cancelled: 'destructive',
}

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-4 h-4" />,
  processing: <PackageIcon className="w-4 h-4" />,
  shipped: <Truck className="w-4 h-4" />,
  delivered: <CheckCircle className="w-4 h-4" />,
  cancelled: <XCircle className="w-4 h-4" />,
}

export default function AdminOrders() {
  const dispatch = useAppDispatch()
  const [orders, setOrders] = useState<Order[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get('/admin/orders', {
          params: { page: 1, page_size: 1000 }
        })
        setOrders(response.data.items || [])
      } catch (error) {
        console.error('Failed to load orders', error)
        dispatch(addToast({ type: 'error', title: 'Error', message: 'Failed to load orders' }))
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
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleExportOrders = () => {
    if (filteredOrders.length === 0) {
      dispatch(
        addToast({
          type: 'info',
          title: 'No data to export',
          message: 'There are no orders to export.',
        })
      )
      return
    }

    const exportRows = filteredOrders.map((order) => ({
      order_id: order.id,
      order_number: order.orderNumber || '',
      customer_id: order.user_id,
      items_count: order.items?.length || 0,
      total: order.total_amount || order.total || 0,
      payment_status: order.payment_status || '',
      order_status: order.status || '',
      created_at: order.created_at ? new Date(order.created_at).toLocaleDateString() : '',
    }))

    downloadCsv('orders_export.csv', exportRows, [
      'order_id',
      'order_number',
      'customer_id',
      'items_count',
      'total',
      'payment_status',
      'order_status',
      'created_at',
    ])

    dispatch(
      addToast({
        type: 'success',
        title: 'Export complete',
        message: 'Orders exported successfully.',
      })
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground">Manage customer orders</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleExportOrders}
          className="h-10 w-10 p-0 sm:w-auto sm:px-4"
          aria-label="Export orders"
        >
          <FileSpreadsheet className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Export Excel</span>
        </Button>
      </div>

      <Card className="card-premium">
        <CardHeader className="px-6 py-5">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0">
          <div className="table-shell">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Order ID</th>
                  <th className="text-left py-3 px-4 font-medium">Customer ID</th>
                  <th className="text-left py-3 px-4 font-medium">Items</th>
                  <th className="text-left py-3 px-4 font-medium">Total</th>
                  <th className="text-left py-3 px-4 font-medium">Payment</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Date</th>
                  <th className="text-right py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-muted-foreground">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm">#{order.orderNumber || String(order.id).substring(0, 8)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm">{order.user_id}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">{order.items?.length || 0} items</span>
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {formatPrice(order.total_amount || order.total || 0)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={(order.payment_status === 'paid' || order.payment_status === 'completed') ? 'success' : 'warning'}>
                          {order.payment_status || 'pending'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={statusColors[order.status] || 'secondary'}>
                          {statusIcons[order.status]}
                          <span className="ml-1 capitalize">{order.status}</span>
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="icon">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(p => p - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'ghost'}
                      size="icon"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

