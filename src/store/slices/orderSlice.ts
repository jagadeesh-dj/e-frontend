import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { Order } from '../../types'
import api from '../../services/api'
import { handleApiError, handleApiSuccess } from '../../utils/apiErrorHandler'

interface OrderState {
  orders: Order[]
  currentOrder: Order | null
  total: number
  page: number
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
}

const initialState: OrderState = {
  orders: [],
  currentOrder: null,
  total: 0,
  page: 1,
  isLoading: false,
  isSubmitting: false,
  error: null,
}

// Backend returns paginated: { success, data: { items: Order[], total, page, page_size } }
export const fetchOrders = createAsyncThunk<
  { items: Order[]; total: number; page: number }
>('orders/fetchOrders', async (_, { dispatch, rejectWithValue }) => {
  try {
    const response = await api.get<{
      success: boolean
      data: Order[]
      pagination: { total: number; page: number; page_size: number }
    }>('/orders')
    
    // The backend paginated_response puts the items in 'data' and meta in 'pagination'
    const items = response.data.data
    const { total, page } = response.data.pagination
    
    return { items: items || [], total: total || 0, page: page || 1 }
  } catch (error: any) {
    const message = handleApiError(error, dispatch, 'Failed to fetch orders')
    return rejectWithValue(message)
  }
})

export const fetchOrderById = createAsyncThunk<Order, string>(
  'orders/fetchOrderById',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.get<{ success: boolean; data: Order }>(`/orders/${id}`)
      return response.data.data
    } catch (error: any) {
      const message = handleApiError(error, dispatch, 'Failed to fetch order')
      return rejectWithValue(message)
    }
  }
)

// POST /orders/ — place order from current cart
// Backend schema: { address_id: int, payment_method: str }
export const createOrder = createAsyncThunk<
  Order,
  { address_id: number; payment_method: string }
>('orders/createOrder', async (data, { dispatch, rejectWithValue }) => {
  try {
    const response = await api.post<{ success: boolean; data: Order }>('/orders/', data)
    return response.data.data
  } catch (error: any) {
    const message = handleApiError(error, dispatch, 'Failed to place order')
    return rejectWithValue(message)
  }
})

export const cancelOrder = createAsyncThunk<
  { id: number; reason: string },
  { orderId: number; reason: string }
>('orders/cancelOrder', async ({ orderId, reason }, { dispatch, rejectWithValue }) => {
  try {
    await api.post(`/orders/${orderId}/cancel`, { reason })
    handleApiSuccess(dispatch, 'Order Cancelled', 'Your order has been cancelled')
    return { id: orderId, reason }
  } catch (error: any) {
    const message = handleApiError(error, dispatch, 'Failed to cancel order')
    return rejectWithValue(message)
  }
})

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    updateOrderStatus: (state, action: PayloadAction<{ orderId: string; status: string }>) => {
      const order = state.orders.find((o) => o.id === action.payload.orderId)
      if (order) {
        order.status = action.payload.status
      }
      if (state.currentOrder?.id === action.payload.orderId) {
        state.currentOrder.status = action.payload.status as Order['status']
      }
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null
    },
    clearOrders: (state) => {
      state.orders = []
      state.currentOrder = null
      state.total = 0
      state.page = 1
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false
        state.orders = action.payload.items
        state.total = action.payload.total
        state.page = action.payload.page
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.orders = []
      })
      .addCase(fetchOrderById.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentOrder = action.payload
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.currentOrder = null
      })
      .addCase(createOrder.pending, (state) => {
        state.isSubmitting = true
        state.error = null
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isSubmitting = false
        state.currentOrder = action.payload
        state.orders.unshift(action.payload)
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isSubmitting = false
        state.error = action.payload as string
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const order = state.orders.find((o) => String(o.id) === String(action.payload.id))
        if (order) order.status = 'cancelled'
        if (state.currentOrder && String(state.currentOrder.id) === String(action.payload.id)) {
          state.currentOrder.status = 'cancelled'
        }
      })
  },
})

export const { updateOrderStatus, clearCurrentOrder, clearOrders } = orderSlice.actions
export default orderSlice.reducer
