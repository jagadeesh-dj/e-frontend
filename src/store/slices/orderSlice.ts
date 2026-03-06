import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { Order, OrderCreate, Address } from '../../types'
import api from '../../services/api'
import { handleApiError, handleApiSuccess } from '../../utils/apiErrorHandler'

interface OrderState {
  orders: Order[]
  currentOrder: Order | null
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
}

const initialState: OrderState = {
  orders: [],
  currentOrder: null,
  isLoading: false,
  isSubmitting: false,
  error: null,
}

export const fetchOrders = createAsyncThunk<Order[]>('orders/fetchOrders', async (_, { dispatch, rejectWithValue }) => {
  try {
    const response = await api.get<{ status: string; message: string; data: Order[] }>('/orders')
    return response.data.data
  } catch (error: any) {
    const message = handleApiError(error, dispatch, 'Failed to fetch orders')
    return rejectWithValue(message)
  }
})

export const fetchOrderById = createAsyncThunk<Order, string>(
  'orders/fetchOrderById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get<{ status: string; message: string; data: Order }>(`/orders/${id}`)
      return response.data.data
    } catch (error: any) {
      let message = 'Failed to fetch order'
      if (error.response?.data?.errors?.length > 0) {
        message = error.response.data.errors.map((e: { field: string; message: string }) => e.message).join('. ')
      } else if (error.response?.data?.message) {
        message = error.response.data.message
      }
      return rejectWithValue(message)
    }
  }
)

export const createOrder = createAsyncThunk<
  Order,
  { shippingAddress: Address; billingAddress?: Address; notes?: string; paymentIntentId?: string }
>('orders/createOrder', async (data, { rejectWithValue }) => {
  try {
    const response = await api.post<{ status: string; message: string; data: Order }>('/orders', data)
    return response.data.data
  } catch (error: any) {
    let message = 'Failed to create order'
    if (error.response?.data?.errors?.length > 0) {
      message = error.response.data.errors.map((e: { field: string; message: string }) => e.message).join('. ')
    } else if (error.response?.data?.message) {
      message = error.response.data.message
    }
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false
        state.orders = action.payload
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
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
  },
})

export const { updateOrderStatus, clearCurrentOrder } = orderSlice.actions
export default orderSlice.reducer
