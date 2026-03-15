import { useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Package, MapPin, CreditCard, Truck, Check, Loader2, X, RefreshCw } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { fetchOrderById, cancelOrder } from '../store/slices/orderSlice'
import { formatPrice, formatDate } from '../lib/utils'

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']

const STATUS_ICONS = [Package, RefreshCw, RefreshCw, Truck, Check] as const

function getStatusColor(status: string) {
  switch (status) {
    case 'pending': return 'warning'
    case 'confirmed': return 'secondary'
    case 'processing': return 'secondary'
    case 'shipped': return 'default'
    case 'delivered': return 'success'
    case 'cancelled': return 'destructive'
    default: return 'secondary'
  }
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { currentOrder: order, isLoading, error } = useAppSelector((state) => state.orders)

  useEffect(() => {
    if (id) {
      dispatch(fetchOrderById(id))
    }
  }, [dispatch, id])

  const handleCancel = async () => {
    if (!order?.id) return
    if (!window.confirm('Are you sure you want to cancel this order?')) return
    await dispatch(cancelOrder({ orderId: Number(order.id), reason: 'Cancelled by customer' }))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-500">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">{error || 'Order not found'}</p>
          <Link to="/orders">
            <Button>Back to Orders</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Parse shipping address — backend stores as JSON object
  const shippingAddr = typeof order.shipping_address === 'string'
    ? (() => { try { return JSON.parse(order.shipping_address) } catch { return { raw: order.shipping_address } } })()
    : order.shipping_address || {}

  // Current step index
  const currentStep = STATUS_STEPS.indexOf(order.status)
  const isCancelled = order.status === 'cancelled'

  // Financial breakdown from backend fields
  const subtotal = order.subtotal ?? (order.total_amount - (order.shipping_charge || 0) - (order.tax_amount || 0))
  const shippingCharge = order.shipping_charge ?? 0
  const taxAmount = order.tax_amount ?? 0
  const discount = order.discount_amount ?? order.discount ?? 0

  return (
    <div className="min-h-screen pb-20">
      <div className="app-container py-8">
        <Link to="/orders" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />Back to Orders
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Order #{order.order_number || (order as any).orderNumber || order.id}
            </h1>
            <p className="text-muted-foreground mt-1">Placed on {formatDate(order.created_at)}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={getStatusColor(order.status) as any} className="text-sm px-4 py-1">
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
            {(order.status === 'pending' || order.status === 'confirmed') && (
              <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50" onClick={handleCancel}>
                <X className="w-4 h-4 mr-1" />Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Order Tracking Progress */}
        {!isCancelled && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between overflow-x-auto">
                {STATUS_STEPS.map((status, index) => {
                  const Icon = STATUS_ICONS[index]
                  const isCompleted = currentStep >= index
                  const isCurrent = currentStep === index
                  return (
                    <div key={status} className="flex items-center">
                      <div className="flex flex-col items-center min-w-[60px]">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isCompleted ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground'} ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}>
                          {index < currentStep ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                        </div>
                        <span className={`text-xs mt-2 capitalize text-center ${isCompleted ? 'font-medium text-primary' : 'text-muted-foreground'}`}>
                          {status}
                        </span>
                      </div>
                      {index < STATUS_STEPS.length - 1 && (
                        <div className={`w-10 sm:w-16 h-0.5 mx-1 rounded-full transition-all duration-300 ${index < currentStep ? 'bg-primary' : 'bg-muted'}`} />
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items ({order.items?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(order.items || []).map((item: any) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.product?.images?.[0] ? (
                        <img 
                          src={typeof item.product.images[0] === 'string' ? item.product.images[0] : item.product.images[0].url} 
                          alt={item.product_name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <Package className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium line-clamp-1">{item.product_name}</h3>
                      {item.variant_attrs && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {JSON.stringify(item.variant_attrs.variant || item.variant_attrs)}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity} × {formatPrice(item.unit_price || (item as any).unitPrice)}
                      </p>
                    </div>
                    <p className="font-bold shrink-0">{formatPrice(item.total_price || (item as any).totalPrice)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground space-y-0.5">
                  {shippingAddr.full_name && <p className="font-medium text-foreground">{shippingAddr.full_name}</p>}
                  {shippingAddr.address_line1 && <p>{shippingAddr.address_line1}</p>}
                  {shippingAddr.address_line2 && <p>{shippingAddr.address_line2}</p>}
                  {shippingAddr.city && <p>{shippingAddr.city}{shippingAddr.state ? `, ${shippingAddr.state}` : ''}{shippingAddr.postal_code ? ` - ${shippingAddr.postal_code}` : ''}</p>}
                  {shippingAddr.phone && <p>{shippingAddr.phone}</p>}
                  {shippingAddr.raw && <p className="whitespace-pre-line">{shippingAddr.raw}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Tracking History */}
            {order.tracking && order.tracking.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />Tracking History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.tracking.map((t, idx) => (
                      <div key={t.id || idx} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-primary mt-1 shrink-0" />
                          {idx < ((order as any).tracking.length - 1) && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                        </div>
                        <div className="pb-4">
                          <p className="font-medium text-sm">{t.status}</p>
                          {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
                          <p className="text-xs text-muted-foreground mt-1">{formatDate(t.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Payment Summary */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{shippingCharge === 0 ? 'Free' : formatPrice(shippingCharge)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (GST)</span>
                    <span>{formatPrice(taxAmount)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{formatPrice(order.total_amount)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Payment Status</span>
                    <Badge variant={(order.payment_status === 'paid' || order.payment_status === 'completed') ? 'success' : 'warning'}>
                      {(order.payment_status || 'pending').charAt(0).toUpperCase() + (order.payment_status || 'pending').slice(1)}
                    </Badge>
                  </div>
                  {(order as any).payment_method && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Method</span>
                      <span className="capitalize">{(order as any).payment_method}</span>
                    </div>
                  )}
                  {(order as any).tracking_number && (
                    <div className="mt-2 text-sm">
                      <span className="text-muted-foreground">Tracking: </span>
                      <span className="font-mono">{(order as any).tracking_number}</span>
                    </div>
                  )}
                </div>

                <Link to="/products">
                  <Button variant="outline" className="w-full mt-2">Continue Shopping</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
