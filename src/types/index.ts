export interface User {
  uid?: string
  id?: number | string
  email: string
  username?: string
  first_name?: string
  last_name?: string
  name?: string
  phone?: string
  avatar?: string
  avatar_url?: string
  role?: 'customers' | 'admin' | 'superadmin' | 'vendor' | 'user'
  is_active?: boolean
  is_admin?: boolean
  is_verified?: boolean
  created_at?: string
  updated_at?: string
  dob?: string
  gender?: string
  bio?: string
  profile?: UserProfile
}

export interface UserProfile {
  id: number
  uid: string
  user_id: number
  phone?: string
  avatar_url?: string
  dob?: string
  gender?: string
  address?: string
  city?: string
  state?: string
  country?: string
  pincode?: string
  bio?: string
  website?: string
  created_at: string
  updated_at?: string
}

export interface Address {
  uid: string
  id?: number
  address_type?: string
  first_name?: string
  last_name?: string
  name?: string
  company_name?: string
  phone?: string
  alternate_phone?: string
  address_line1?: string
  address_line2?: string
  landmark?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  is_default?: boolean
  is_active?: boolean
  created_at?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  first_name: string
  last_name: string
  phone?: string
}

export interface TokenResponse {
  access_token: string
  refresh_token?: string
  token_type?: string
  expires_in?: number
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data?: T
  error_code?: string
  timestamp?: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  images: string[]
  image_url?: string
  category: string
  subcategory?: string
  brand?: string
  rating: number
  reviewCount: number
  stock: number
  is_active?: boolean
  variants?: ProductVariant[]
  features?: string[]
  tags?: string[]
  sku?: string
  created_at: string
  updatedAt?: string
}

export interface ProductVariant {
  id: string
  name: string
  type: 'size' | 'color' | 'material'
  value: string
  stock: number
}

export interface ProductSearch {
  query?: string
  category?: string
  brand?: string
  min_price?: number
  max_price?: number
  in_stock?: boolean
  skip?: number
  limit?: number
}

export interface Category {
  id?: string
  name: string
  slug?: string
  image?: string
  product_count?: number
  productCount?: number
  subcategories?: Category[]
}

export interface Brand {
  name: string
  product_count?: number
}

export interface CartItem {
  id: string
  product_id: string
  product?: Product
  quantity: number
  price: number
  created_at: string
  updated_at: string
}

export interface Cart {
  id: string
  user_id: string | null
  session_id: string | null
  items: CartItem[]
  total_items: number
  total_price: number
  subtotal?: number
  discount?: number
  tax?: number
  shipping?: number
  total?: number
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  product_id: string
  product_name: string
  product?: Product
  quantity: number
  unit_price: number
  total_price: number
}

export interface Order {
  id: string
  orderNumber?: string
  user_id: string
  status: string
  total_amount: number
  shipping_address: string
  billing_address?: string
  notes?: string | null
  payment_status: string
  items: OrderItem[]
  subtotal?: number
  discount?: number
  tax?: number
  shipping?: number
  total?: number
  paymentMethod?: string
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded'
  created_at: string
  updated_at: string
  estimatedDelivery?: string
  trackingNumber?: string
  timeline?: OrderTimeline[]
}

export interface OrderTimeline {
  id: string
  status: string
  description: string
  timestamp: string
}

export interface OrderCreate {
  user_id: string
  items: {
    product_id: string
    product_name: string
    quantity: number
    unit_price: number
  }[]
  shipping_address: string
  notes?: string
}

export interface ShippingAddress {
  id?: string
  firstName?: string
  lastName?: string
  name?: string
  address1: string
  address2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone: string
  isDefault?: boolean
}

export interface Payment {
  id: string
  order_id: string
  user_id: string
  amount: number
  currency: string
  payment_method: string
  payment_status: string
  transaction_id: string | null
  refunded_amount: number | null
  created_at: string
}

export interface PaymentCreate {
  order_id: string
  user_id: string
  amount: number
  currency?: string
  payment_method: string
}

export interface FilterState {
  category?: string
  priceRange?: [number, number]
  rating?: number
  brands?: string[]
  colors?: string[]
  sizes?: string[]
  sortBy?: 'price-asc' | 'price-desc' | 'rating' | 'newest' | 'popular'
  search?: string
}

export interface WebSocketMessage {
  type: 'inventory_update' | 'order_update' | 'notification' | 'price_update'
  payload: any
}

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

export interface PromoCode {
  code: string
  discount: number
  discountType: 'percentage' | 'fixed'
  minOrder?: number
  expiresAt?: string
  usedCount?: number
  maxUses?: number
}

export interface Review {
  id: string
  productId: string
  userId: string
  user?: User
  rating: number
  title: string
  comment: string
  helpful: number
  verified: boolean
  createdAt: string
}

export interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  totalProducts: number
  revenueChange: number
  ordersChange: number
  customersChange: number
  productsChange: number
}

export interface SalesData {
  date: string
  revenue: number
  orders: number
}

export interface RecentOrder {
  id: string
  customer: string
  email: string
  product: string
  amount: number
  status: string
  date: string
}

// Payment Interfaces
export interface InitiatePaymentRequest {
  order_id: string
  gateway: string
}

export interface VerifyPaymentRequest {
  payment_id: string
  order_id: string
  gateway: string
  payment_data: Record<string, any>
}

export interface RefundCreate {
  amount: number
  reason: string
}

export interface Refund {
  id: string
  payment_id: string
  amount: number
  reason: string
  status: string
  created_at: string
}

// Review Interfaces
export interface ReviewCreate {
  rating: number
  title: string
  body: string
}

// Coupon Interfaces
export interface Coupon {
  id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  min_order_amount?: number
  max_discount?: number
  usage_limit?: number
  used_count: number
  valid_from?: string
  valid_until?: string
  is_active: boolean
  created_at: string
}

export interface ApplyCouponRequest {
  code: string
  order_amount: number
}

export interface CouponValidationResult {
  valid: boolean
  coupon?: Coupon
  discount_amount: number
}

// Inventory Interfaces
export interface InventoryItem {
  id: string
  product_id: string
  variant_id?: string
  quantity: number
  reserved_quantity: number
  available_quantity: number
  last_updated: string
}

export interface AdjustStockRequest {
  product_id: string
  variant_id?: string
  adjustment: number
  reason: string
}
