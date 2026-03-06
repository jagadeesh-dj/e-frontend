import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Package, MapPin, CreditCard, Truck, Check, Circle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { mockOrders } from '../data/mockData'
import { formatPrice, formatDate } from '../lib/utils'

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const order = mockOrders.find(o => o.id === id || o.orderNumber === id)

  const steps = [
    { status: 'Order Placed', icon: Package },
    { status: 'Processing', icon: Package },
    { status: 'Shipped', icon: Truck },
    { status: 'Delivered', icon: Check },
  ]

  const currentStep = order ? steps.findIndex(s => s.status.toLowerCase() === order.status) : 0

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">Order not found</p>
          <Link to="/orders">
            <Button>Back to Orders</Button>
          </Link>
        </div>
      </div>
    )
  }

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

  return (
    <div className="min-h-screen pb-20">
      <div className="container mx-auto px-4 py-8">
        <Link
          to="/orders"
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Order #{order.orderNumber}</h1>
            <p className="text-muted-foreground">Placed on {formatDate(order.created_at)}</p>
          </div>
          <Badge variant={getStatusColor(order.status) as any} className="text-sm px-4 py-1">
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
        </div>

        <div className="mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.status} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        index <= currentStep
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {index < currentStep ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <step.icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className={`text-xs mt-2 ${index <= currentStep ? 'font-medium' : 'text-muted-foreground'}`}>
                      {step.status}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-20 h-0.5 mx-2 ${
                        index < currentStep ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                      <Package className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{item.product_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity} × {formatPrice(item.unit_price)}
                      </p>
                    </div>
                    <p className="font-bold">{formatPrice(item.total_price)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">
                  {order.shipping_address}
                </p>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(order.total_amount - 9.99)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatPrice(9.99)}</span>
                </div>
                <div className="border-t pt-4 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(order.total_amount)}</span>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Payment Status</span>
                    <Badge variant={order.payment_status === 'paid' ? 'success' : 'warning'}>
                      {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                    </Badge>
                  </div>
                  {order.trackingNumber && (
                    <div className="mt-2 text-sm">
                      <span className="text-muted-foreground">Tracking: </span>
                      <span className="font-mono">{order.trackingNumber}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
