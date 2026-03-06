import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { Product, Category, Order, User } from '../../types'
import api from '../../services/api'

interface AdminState {
  products: Product[]
  categories: Category[]
  orders: Order[]
  customers: User[]
  stats: {
    totalRevenue: number
    totalOrders: number
    totalCustomers: number
    totalProducts: number
  }
  isLoading: boolean
  error: string | null
}

const initialState: AdminState = {
  products: [],
  categories: [],
  orders: [],
  customers: [],
  stats: {
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
  },
  isLoading: false,
  error: null,
}

export const fetchAdminStats = createAsyncThunk('admin/fetchStats', async (_, { rejectWithValue }) => {
  try {
    const [productsRes, ordersRes, usersRes] = await Promise.all([
      api.get<{ status: string; message: string; data: Product[] }>('/products?skip=0&limit=1000'),
      api.get<{ status: string; message: string; data: Order[] }>('/orders'),
      api.get<{ status: string; message: string; data: User[] }>('/users'),
    ])

    const products = productsRes.data.data || []
    const orders = ordersRes.data.data || []
    const customers = usersRes.data.data || []

    const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || order.total || 0), 0)

    return {
      totalRevenue,
      totalOrders: orders.length,
      totalCustomers: customers.length,
      totalProducts: products.length,
    }
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch stats')
  }
})

export const fetchAdminProducts = createAsyncThunk<Product[]>('admin/fetchProducts', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get<{ status: string; message: string; data: Product[] }>('/products?skip=0&limit=1000')
    return response.data.data || []
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch products')
  }
})

export const fetchAdminCategories = createAsyncThunk<Category[]>('admin/fetchCategories', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get<{ status: string; message: string; data: Category[] }>('/products/categories')
    return response.data.data || []
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories')
  }
})

export const fetchAdminOrders = createAsyncThunk<Order[]>('admin/fetchOrders', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get<{ status: string; message: string; data: Order[] }>('/orders')
    return response.data.data || []
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders')
  }
})

export const fetchAdminCustomers = createAsyncThunk<User[]>('admin/fetchCustomers', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get<{ status: string; message: string; data: User[] }>('/users')
    return response.data.data || []
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch customers')
  }
})

export const createProduct = createAsyncThunk<Product, Partial<Product>>('admin/createProduct', async (product, { rejectWithValue }) => {
  try {
    const response = await api.post<{ status: string; message: string; data: Product }>('/products', product)
    return response.data.data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create product')
  }
})

export const updateProduct = createAsyncThunk<Product, { id: string; data: Partial<Product> }>('admin/updateProduct', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await api.put<{ status: string; message: string; data: Product }>(`/products/${id}`, data)
    return response.data.data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update product')
  }
})

export const deleteProduct = createAsyncThunk<string, string>('admin/deleteProduct', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/products/${id}`)
    return id
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete product')
  }
})

export const updateOrderStatus = createAsyncThunk<Order, { id: string; status: string }>('admin/updateOrderStatus', async ({ id, status }, { rejectWithValue }) => {
  try {
    const response = await api.post<{ status: string; message: string; data: Order }>(`/orders/${id}/status`, { status })
    return response.data.data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update order status')
  }
})

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearAdminError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminStats.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchAdminStats.fulfilled, (state, action) => {
        state.isLoading = false
        state.stats = action.payload
      })
      .addCase(fetchAdminStats.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(fetchAdminProducts.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchAdminProducts.fulfilled, (state, action) => {
        state.isLoading = false
        state.products = action.payload
      })
      .addCase(fetchAdminProducts.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(fetchAdminCategories.fulfilled, (state, action) => {
        state.categories = action.payload
      })
      .addCase(fetchAdminOrders.fulfilled, (state, action) => {
        state.orders = action.payload
      })
      .addCase(fetchAdminCustomers.fulfilled, (state, action) => {
        state.customers = action.payload
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.products.unshift(action.payload)
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        const index = state.products.findIndex(p => p.id === action.payload.id)
        if (index !== -1) {
          state.products[index] = action.payload
        }
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.products = state.products.filter(p => p.id !== action.payload)
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const index = state.orders.findIndex(o => o.id === action.payload.id)
        if (index !== -1) {
          state.orders[index] = action.payload
        }
      })
  },
})

export const { clearAdminError } = adminSlice.actions
export default adminSlice.reducer
