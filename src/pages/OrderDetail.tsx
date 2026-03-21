import { useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Package, MapPin, CreditCard, Truck, Check, Loader2, X, RefreshCw, FileText } from 'lucide-react'
import { Button } from '../components/ui/button'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { fetchOrderById, cancelOrder } from '../store/slices/orderSlice'
import { formatPrice, formatDate, cn } from '../lib/utils'

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']
const STATUS_ICONS = [FileText, RefreshCw, Package, Truck, Check] as const

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
    if (!order?.uid) return
    if (!window.confirm('Are you certain you wish to cancel this meticulous order?')) return
    await dispatch(cancelOrder({ orderUid: order.uid, reason: 'Cancelled by customer' }))
  }

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[#faf9f6]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300 mb-6" />
        <div className="text-center font-serif text-2xl text-gray-400">
          Retrieving order details...
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[#faf9f6]">
        <p className="font-serif text-3xl text-gray-900 mb-6">{error || 'Manifest Not Found'}</p>
        <Link to="/profile?tab=orders">
          <Button className="h-12 px-8 bg-amber-700 text-white hover:bg-amber-800 rounded-none uppercase tracking-[0.2em] text-[10px] transition-colors">
            Return to Ledger
          </Button>
        </Link>
      </div>
    )
  }

  const shippingAddr = typeof order.shipping_address === 'string'
    ? (() => { try { return JSON.parse(order.shipping_address) } catch { return { raw: order.shipping_address } } })()
    : order.shipping_address || {}

  const currentStep = STATUS_STEPS.indexOf(order.status)
  const isCancelled = order.status === 'cancelled'

  const subtotal = order.subtotal ?? (order.total_amount - (order.shipping_charge || 0) - (order.tax_amount || 0))
  const shippingCharge = order.shipping_charge ?? 0
  const taxAmount = order.tax_amount ?? 0
  const discount = order.discount_amount ?? order.discount ?? 0

  return (
    <div className="min-h-screen bg-[#faf9f6] pb-24 border-t border-gray-200/50">

      {/* Header */}
      <div className="max-w-[1400px] mx-auto px-6 py-10 lg:py-16">
        <Link to="/profile?tab=orders" className="inline-flex items-center text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 hover:text-amber-700 transition-colors mb-8">
          <ArrowLeft className="w-3 h-3 mr-2" />Return to History
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-gray-200 pb-8">
          <div>
            <h1 className="font-serif text-4xl lg:text-5xl text-gray-900 mb-2">
              Order #{order.order_number || (order as any).orderNumber || order.id}
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-400">Placed on {formatDate(order.created_at)}</p>
          </div>

          <div className="flex items-center gap-6">
            <span className={cn("text-[10px] uppercase tracking-widest px-3 py-1 font-bold border",
              order.status === 'delivered' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' :
                order.status === 'cancelled' ? 'border-red-200 text-red-700 bg-red-50' :
                  'border-amber-200 text-amber-700 bg-amber-50'
            )}>
              {order.status}
            </span>
            {(order.status === 'pending' || order.status === 'confirmed') && (
              <button
                className="text-[10px] uppercase tracking-[0.2em] font-bold text-red-600 border-b border-transparent hover:border-red-600 transition-colors pb-0.5"
                onClick={handleCancel}
              >
                Cancel Manifest
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 grid lg:grid-cols-12 gap-12 lg:gap-20">

        {/* Left Column: Progress & Items */}
        <div className="lg:col-span-7 space-y-16">

          {/* Order Tracking Progress */}
          {!isCancelled && (
            <section className="bg-white border border-gray-200 p-8">
              <h2 className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-900 border-b border-gray-100 pb-4 mb-8">Transit Trajectory</h2>
              <div className="flex items-center justify-between overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                {STATUS_STEPS.map((status, index) => {
                  const Icon = STATUS_ICONS[index]
                  const isCompleted = currentStep >= index
                  const isCurrent = currentStep === index
                  return (
                    <div key={status} className="flex items-center group flex-1">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "w-10 h-10 flex items-center justify-center transition-all bg-white border border-amber-700",
                          isCompleted ? "bg-amber-700 text-white" : "border-gray-200 text-gray-300",
                          isCurrent ? "outline outline-4 outline-amber-700/10 scale-110" : ""
                        )}>
                          {index < currentStep ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                        </div>
                        <span className={cn(
                          "text-[9px] uppercase tracking-[0.2em] mt-4 whitespace-nowrap font-bold",
                          isCompleted ? "text-amber-700" : "text-gray-400"
                        )}>
                          {status}
                        </span>
                      </div>
                      {index < STATUS_STEPS.length - 1 && (
                        <div className={cn(
                          "h-[1px] flex-1 mx-4 transition-all -translate-y-[14px]",
                          index < currentStep ? "bg-amber-700" : "bg-gray-200"
                        )} />
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Items List */}
          <section>
            <h2 className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-900 border-b border-gray-200 pb-4 mb-6">Manifest Items</h2>
            <div className="space-y-4">
              {(order.items || []).map((item: any) => (
                <div key={item.id} className="flex gap-6 border border-gray-200 p-6 bg-white shrink-0 hover:border-amber-700 transition-colors">
                  <div className="w-24 aspect-[4/5] bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 p-2">
                    <img
                      src={typeof item.product.images?.[0] === 'string' ? item.product.images[0] : item.product.images?.[0]?.url || '/placeholder.png'}
                      alt={item.product_name}
                      className="w-full h-full object-cover grayscale opacity-90 mix-blend-multiply"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col pt-2">
                    <h3 className="font-serif text-2xl text-gray-900 mb-1">{item.product_name}</h3>
                    {item.variant_attrs && (
                      <p className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-4">
                        {typeof item.variant_attrs === 'object' ? Object.values(item.variant_attrs).join(' | ') : item.variant_attrs}
                      </p>
                    )}
                    <div className="mt-auto flex justify-between items-end border-t border-gray-100 pt-4">
                      <p className="font-mono text-sm text-gray-500">Qty: {item.quantity} × {formatPrice(item.unit_price || item.unitPrice)}</p>
                      <p className="font-mono text-lg font-semibold text-gray-900">{formatPrice(item.total_price || item.totalPrice)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Tracking History */}
          {order.tracking && order.tracking.length > 0 && (
            <section className="bg-white border border-gray-200 p-8">
              <h2 className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-900 border-b border-gray-100 pb-4 mb-8">Logistics Timeline</h2>
              <div className="pl-4 border-l border-gray-200 ml-2 space-y-8">
                {order.tracking.map((t, idx) => (
                  <div key={t.id || idx} className="relative pl-6">
                    <div className="absolute w-[9px] h-[9px] bg-amber-700 -left-[29px] top-1 outline outline-[6px] outline-white" />
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-900 mb-1">{t.status}</p>
                    {t.description && <p className="text-sm font-light text-gray-500 leading-relaxed mb-2 max-w-lg">{t.description}</p>}
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{formatDate(t.created_at)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>

        {/* Right Column: Informative Readouts */}
        <div className="lg:col-span-5 space-y-8 pb-16">

          <div className="bg-white border border-gray-200 p-8 sticky top-24">
            <h2 className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-900 border-b border-gray-100 pb-4 mb-8">Financial Summary</h2>

            <div className="space-y-4 mb-8 font-mono text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-gray-900">{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span>Discount</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Logistics</span>
                <span className="text-gray-900">{shippingCharge === 0 ? 'Complimentary' : formatPrice(shippingCharge)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes</span>
                <span className="text-gray-900">{formatPrice(taxAmount)}</span>
              </div>
            </div>

            <div className="flex justify-between items-end mb-8 pt-8 border-t border-gray-200 bg-gray-50 -mx-8 px-8 pb-8 -mb-8">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-900 pb-2">Total Billed</span>
              <span className="font-serif text-3xl text-gray-900">{formatPrice(order.total_amount)}</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-8">
            <div className="space-y-4 mb-8">
              <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-900 border-b border-gray-100 pb-4 flex justify-between items-center">
                <span>Payment Clearances</span>
                <span className={cn(
                  (order.payment_status === 'paid' || order.payment_status === 'completed') ? 'text-emerald-700' : 'text-amber-700'
                )}>
                  {order.payment_status || 'pending'}
                </span>
              </div>
              {(order as any).payment_method && (
                <div className="flex justify-between items-center text-xs font-mono text-gray-500 pt-2">
                  <span className="uppercase tracking-widest font-bold">Gateway</span>
                  <span className="text-gray-900">{(order as any).payment_method}</span>
                </div>
              )}
            </div>

            {/* Delivery Info Block */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-900 pb-2">Destination Coordinate</h3>
              <div className="text-sm font-light text-gray-600 leading-relaxed max-w-sm">
                {shippingAddr.full_name && <p className="font-mono font-semibold text-gray-900 uppercase">{shippingAddr.full_name}</p>}
                {shippingAddr.address_line1 && <p>{shippingAddr.address_line1}</p>}
                {shippingAddr.address_line2 && <p>{shippingAddr.address_line2}</p>}
                {shippingAddr.city && <p>{shippingAddr.city}{shippingAddr.state ? `, ${shippingAddr.state}` : ''}{shippingAddr.postal_code ? ` - ${shippingAddr.postal_code}` : ''}</p>}
                {shippingAddr.phone && <p className="pt-2">{shippingAddr.phone}</p>}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
