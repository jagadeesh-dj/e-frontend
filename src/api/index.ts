import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any
        const url = originalRequest?.url || ''
        
        const isAuthEndpoint = url.includes('/login') || 
                               url.includes('/register') || 
                               url.includes('/refresh')
        
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
          originalRequest._retry = true
          
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            try {
              const response = await this.client.post('/users/refresh', {
                refresh_token: refreshToken,
              });
              const { access_token, refresh_token: newRefreshToken } = response.data.data;
              localStorage.setItem('access_token', access_token);
              localStorage.setItem('refresh_token', newRefreshToken);
              
              if (error.config) {
                error.config.headers.Authorization = `Bearer ${access_token}`;
                return this.client(error.config);
              }
            } catch {
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              window.location.href = '/login';
            }
          } else {
            localStorage.removeItem('access_token');
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  get clientInstance() {
    return this.client;
  }
}

export const api = new ApiClient().clientInstance;

// Auth API - Public routes (no token required for login/register)
export const authApi = {
  register: (data: {
    email: string;
    username: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }) => api.post('/auth/register', data),

  login: (data: { email?: string; username?: string; password: string }) =>
    api.post('/auth/login', data),

  logout: () => api.post('/users/logout'),

  getMe: () => api.get('/users/me'),

  refresh: (refresh_token: string) =>
    api.post('/users/refresh', { refresh_token }),
};

// Profile API - Protected routes
export const profileApi = {
  get: () => api.get('/profile'),
  
  create: (data: {
    phone?: string;
    avatar_url?: string;
    dob?: string;
    gender?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
    bio?: string;
    website?: string;
  }) => api.post('/profile', data),

  update: (data: {
    phone?: string;
    avatar_url?: string;
    dob?: string;
    gender?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
    bio?: string;
    website?: string;
  }) => api.put('/profile', data),

  delete: () => api.delete('/profile'),
};

// Wishlist API - Protected routes
export const wishlistApi = {
  list: (params?: { skip?: number; limit?: number }) =>
    api.get('/wishlist', { params }),

  add: (productId: string) => 
    api.post('/wishlist', { product_id: productId }),

  remove: (productId: string) => 
    api.delete(`/wishlist/${productId}`),

  check: (productId: string) => 
    api.get(`/wishlist/check/${productId}`),

  clear: () => api.delete('/wishlist'),
};

// Products API - Public routes
export const productsApi = {
  list: (params?: { skip?: number; limit?: number; category?: string; brand?: string }) =>
    api.get('/products', { params }),

  get: (id: string) => api.get(`/products/${id}`),

  search: (data: {
    query?: string;
    category?: string;
    brand?: string;
    min_price?: number;
    max_price?: number;
    in_stock?: boolean;
    skip?: number;
    limit?: number;
  }) => api.post('/products/search', data),

  getCategories: () => api.get('/products/categories'),

  getBrands: () => api.get('/products/brands'),

  getReviews: (productId: string) => 
    api.get(`/reviews?product_id=${productId}`),

  addReview: (data: {
    product_id: string;
    rating: number;
    title: string;
    comment: string;
  }) => api.post('/reviews', data),
};

// Cart API - Protected routes
export const cartApi = {
  get: () => api.get('/cart'),

  addItem: (data: { product_id: string; quantity: number }) =>
    api.post('/cart/items', data),

  updateItem: (itemId: string, data: { quantity: number }) =>
    api.put(`/cart/items/${itemId}`, data),

  removeItem: (itemId: string) => api.delete(`/cart/items/${itemId}`),

  clear: () => api.delete('/cart'),

  merge: (sessionId: string, userId: string) =>
    api.post('/cart/merge', { session_id: sessionId, user_id: userId }),
};

// Orders API - Protected routes
export const ordersApi = {
  create: (data: {
    items: {
      product_id: string;
      product_name: string;
      quantity: number;
      unit_price: number;
    }[];
    shipping_address: string;
    notes?: string;
  }) => api.post('/orders', data),

  get: (id: string) => api.get(`/orders/${id}`),

  list: (params?: { skip?: number; limit?: number; status?: string }) =>
    api.get('/orders', { params }),

  cancel: (id: string) => api.post(`/orders/${id}/cancel`),
};

// Payments API - Protected routes
export const paymentsApi = {
  create: (data: {
    order_id: string;
    amount: number;
    currency?: string;
    payment_method: string;
  }) => api.post('/payments', data),

  get: (id: string) => api.get(`/payments/${id}`),

  getByOrder: (orderId: string) => api.get(`/payments/order/${orderId}`),

  initiate: (data: {
    order_id: string;
    gateway: string;
  }) => api.post('/payments/initiate', data),

  verify: (data: {
    payment_id: string;
    order_id: string;
    gateway: string;
    payment_data: Record<string, any>;
  }) => api.post('/payments/verify', data),

  refund: (paymentId: string, data: {
    amount: number;
    reason: string;
  }) => api.post(`/payments/refund/${paymentId}`, data),

  razorpay: {
    createOrder: (data: { amount: number; currency?: string; order_id?: string }) =>
      api.post('/payments/razorpay/order', data),

    verify: (data: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      order_id: string;
    }) => api.post('/payments/razorpay/verify', data),
  },
};

// Reviews API - Protected routes
export const reviewsApi = {
  listByProduct: (productId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/reviews/product/${productId}`, { params }),

  create: (productId: string, data: {
    rating: number;
    title: string;
    body: string;
  }) => api.post(`/reviews/product/${productId}`, data),

  update: (reviewId: string, data: {
    rating: number;
    title: string;
    body: string;
  }) => api.put(`/reviews/${reviewId}`, data),

  delete: (reviewId: string) => api.delete(`/reviews/${reviewId}`),
};

// Coupons API - Protected routes
export const couponsApi = {
  validate: (data: {
    code: string;
    order_amount: number;
  }) => api.post('/coupons/validate', data),

  list: () => api.get('/coupons'),

  get: (id: string) => api.get(`/coupons/${id}`),

  create: (data: {
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    min_order_amount?: number;
    max_discount?: number;
    usage_limit?: number;
    valid_from?: string;
    valid_until?: string;
    is_active: boolean;
  }) => api.post('/coupons', data),
};

// Inventory API - Admin routes
export const inventoryApi = {
  getProductInventory: (productId: string, variantId?: string) =>
    api.get(`/inventory/product/${productId}`, { params: { variant_id: variantId } }),

  adjustStock: (data: {
    product_id: string;
    variant_id?: string;
    adjustment: number;
    reason: string;
  }) => api.post('/inventory/adjust', data),

  getLowStock: () => api.get('/inventory/low-stock'),
};
