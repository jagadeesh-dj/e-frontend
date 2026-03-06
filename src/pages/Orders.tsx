import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Package, ChevronRight, ArrowRight } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { mockOrders } from '../data/mockData'
import { formatPrice, formatDate } from '../lib/utils'

export default function Orders() {
  const orders = mockOrders

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

  if (orders.length === 0) {
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
        <div className="space-y-4">
          {orders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={`/orders/${order.id}`}>
                <Card hover className="card-premium p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-mono font-medium text-gray-900">#{order.orderNumber}</p>
                          <Badge variant={getStatusColor(order.status) as any}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          {order.items.length} item(s) • {formatPrice(order.total_amount)}
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
          ))}
        </div>
      </div>
    </div>
  )
}
