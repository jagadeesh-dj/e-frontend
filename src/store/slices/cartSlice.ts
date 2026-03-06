import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { Cart, CartItem, Product, ProductVariant } from '../../types'
import api from '../../services/api'
import { handleApiError, handleApiSuccess } from '../../utils/apiErrorHandler'

interface CartState {
  cart: Cart | null
  items: CartItem[]
  isLoading: boolean
  isUpdating: boolean
  error: string | null
}

const initialState: CartState = {
  cart: null,
  items: [],
  isLoading: false,
  isUpdating: false,
  error: null,
}

export const fetchCart = createAsyncThunk<Cart>('cart/fetchCart', async (_, { dispatch, rejectWithValue }) => {
  try {
    const response = await api.get<{ status: string; message: string; data: Cart }>('/cart')
    return response.data.data
  } catch (error: any) {
    const message = handleApiError(error, dispatch, 'Failed to fetch cart')
    return rejectWithValue(message)
  }
})

export const addToCart = createAsyncThunk<
  Cart,
  { productId: string; quantity: number; variantId?: string }
>('cart/addToCart', async ({ productId, quantity, variantId }, { dispatch, rejectWithValue }) => {
  try {
    const response = await api.post<{ status: string; message: string; data: Cart }>('/cart/items', { productId, quantity, variantId })
    handleApiSuccess(dispatch, 'Added to cart', 'Item added successfully')
    return response.data.data
  } catch (error: any) {
    const message = handleApiError(error, dispatch, 'Failed to add item to cart')
    return rejectWithValue(message)
  }
})

export const updateCartItem = createAsyncThunk<
  Cart,
  { itemId: string; quantity: number }
>('cart/updateCartItem', async ({ itemId, quantity }, { dispatch, rejectWithValue }) => {
  try {
    const response = await api.put<{ status: string; message: string; data: Cart }>(`/cart/items/${itemId}`, { quantity })
    handleApiSuccess(dispatch, 'Cart Updated', 'Cart item updated successfully')
    return response.data.data
  } catch (error: any) {
    const message = handleApiError(error, dispatch, 'Failed to update cart item')
    return rejectWithValue(message)
  }
})

export const removeCartItem = createAsyncThunk<Cart, string>(
  'cart/removeCartItem',
  async (itemId, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.delete<{ status: string; message: string; data: Cart }>(`/cart/items/${itemId}`)
      handleApiSuccess(dispatch, 'Removed from cart', 'Item removed successfully')
      return response.data.data
    } catch (error: any) {
      const message = handleApiError(error, dispatch, 'Failed to remove cart item')
      return rejectWithValue(message)
    }
  }
)

export const applyPromoCode = createAsyncThunk<Cart, string>(
  'cart/applyPromoCode',
  async (code, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.post<{ status: string; message: string; data: Cart }>('/cart/apply-promo', { code })
      handleApiSuccess(dispatch, 'Promo code applied', 'Discount applied successfully')
      return response.data.data
    } catch (error: any) {
      const message = handleApiError(error, dispatch, 'Invalid promo code')
      return rejectWithValue(message)
    }
  }
)

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    optimisticAddToCart: (state, action: PayloadAction<{ product: Product; quantity: number; variant?: ProductVariant }>) => {
      if (state.cart) {
        const newItem: CartItem = {
          id: `temp-${Date.now()}`,
          product_id: action.payload.product.id,
          product: action.payload.product,
          quantity: action.payload.quantity,
          price: action.payload.product.price,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        state.cart.items.push(newItem)
        state.cart.total_items += action.payload.quantity
        state.cart.total_price += action.payload.product.price * action.payload.quantity
      }
    },
    optimisticUpdateQuantity: (state, action: PayloadAction<{ itemId: string; quantity: number }>) => {
      if (state.cart) {
        const item = state.cart.items.find((i) => i.id === action.payload.itemId)
        if (item) {
          const diff = action.payload.quantity - item.quantity
          item.quantity = action.payload.quantity
          state.cart.total_items += diff
          state.cart.total_price += diff * item.price
        }
      }
    },
    optimisticRemoveItem: (state, action: PayloadAction<string>) => {
      if (state.cart) {
        const itemIndex = state.cart.items.findIndex((i) => i.id === action.payload)
        if (itemIndex > -1) {
          const item = state.cart.items[itemIndex]
          state.cart.total_items -= item.quantity
          state.cart.total_price -= item.price * item.quantity
          state.cart.items.splice(itemIndex, 1)
        }
      }
    },
    clearCart: (state) => {
      state.cart = null
      state.items = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.isLoading = false
        state.cart = action.payload
        state.items = action.payload.items
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(addToCart.pending, (state) => {
        state.isUpdating = true
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isUpdating = false
        state.cart = action.payload
        state.items = action.payload.items
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.isUpdating = false
        state.error = action.payload as string
      })
      .addCase(updateCartItem.pending, (state) => {
        state.isUpdating = true
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.isUpdating = false
        state.cart = action.payload
        state.items = action.payload.items
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.isUpdating = false
        state.error = action.payload as string
      })
      .addCase(removeCartItem.pending, (state) => {
        state.isUpdating = true
      })
      .addCase(removeCartItem.fulfilled, (state, action) => {
        state.isUpdating = false
        state.cart = action.payload
        state.items = action.payload.items
      })
      .addCase(removeCartItem.rejected, (state, action) => {
        state.isUpdating = false
        state.error = action.payload as string
      })
      .addCase(applyPromoCode.fulfilled, (state, action) => {
        state.cart = action.payload
      })
  },
})

export const { optimisticAddToCart, optimisticUpdateQuantity, optimisticRemoveItem, clearCart } = cartSlice.actions
export default cartSlice.reducer
