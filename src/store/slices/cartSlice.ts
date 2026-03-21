import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { Cart, CartItem, Product, ProductVariant } from '../../types'
import api from '../../services/api'
import { handleApiError, handleApiSuccess } from '../../utils/apiErrorHandler'
import { mapProduct } from './productSlice'

interface CouponResult {
  code: string
  discount_amount: number
  discount_type: 'percentage' | 'fixed'
}

interface CartState {
  cart: Cart | null
  items: CartItem[]
  appliedCoupon: CouponResult | null
  isLoading: boolean
  isUpdating: boolean
  error: string | null
}

const initialState: CartState = {
  cart: null,
  items: [],
  appliedCoupon: null,
  isLoading: false,
  isUpdating: false,
  error: null,
}

// Utility to map cart items and their products
function mapCart(cart: any): Cart {
  if (!cart) return cart
  const items = (cart.items || []).map((item: any) => ({
    ...item,
    id: String(item.id),
    product_uid: item.product_uid || item.product?.uid,
    product: item.product ? mapProduct(item.product) : undefined,
  }))
  return {
    ...cart,
    id: String(cart.id),
    items,
  }
}

export const fetchCart = createAsyncThunk<Cart>('cart/fetchCart', async (_, { dispatch, rejectWithValue }) => {
  try {
    const response = await api.get<{ success: boolean; message: string; data: Cart }>('/cart')
    return mapCart(response.data.data)
  } catch (error: any) {
    const message = handleApiError(error, dispatch, 'Failed to fetch cart')
    return rejectWithValue(message)
  }
})

export const addToCart = createAsyncThunk<
  Cart,
  { productUid: string; quantity: number; variantUid?: string }
>('cart/addToCart', async ({ productUid, quantity, variantUid }, { dispatch, rejectWithValue }) => {
  try {
    const response = await api.post<{ success: boolean; message: string; data: Cart }>('/cart/items', {
      product_uid: productUid,
      quantity,
      ...(variantUid ? { variant_uid: variantUid } : {}),
    })
    handleApiSuccess(dispatch, 'Added to cart', 'Item added successfully')
    return mapCart(response.data.data)
  } catch (error: any) {
    const message = handleApiError(error, dispatch, 'Failed to add item to cart')
    return rejectWithValue(message)
  }
})

export const updateCartItem = createAsyncThunk<
  Cart,
  { itemUid: string; quantity: number }
>('cart/updateCartItem', async ({ itemUid, quantity }, { dispatch, rejectWithValue }) => {
  try {
    const response = await api.put<{ success: boolean; message: string; data: Cart }>(
      `/cart/items/uid/${itemUid}`,
      { quantity }
    )
    return mapCart(response.data.data)
  } catch (error: any) {
    const message = handleApiError(error, dispatch, 'Failed to update cart item')
    return rejectWithValue(message)
  }
})

export const removeCartItem = createAsyncThunk<Cart, string>(
  'cart/removeCartItem',
  async (itemUid, { dispatch, rejectWithValue }) => {
    try {
      await api.delete(`/cart/items/uid/${itemUid}`)
      handleApiSuccess(dispatch, 'Removed from cart', 'Item removed successfully')
      const response = await api.get<{ success: boolean; message: string; data: Cart }>('/cart')
      return mapCart(response.data.data)
    } catch (error: any) {
      const message = handleApiError(error, dispatch, 'Failed to remove cart item')
      return rejectWithValue(message)
    }
  }
)

export const validateCoupon = createAsyncThunk<
  CouponResult,
  { code: string; orderAmount: number }
>('cart/validateCoupon', async ({ code, orderAmount }, { dispatch, rejectWithValue }) => {
  try {
    const response = await api.post<{
      success: boolean
      data: { valid: boolean; discount_amount: number; coupon?: { type: string; value: number } }
    }>('/coupons/validate', { code, order_amount: orderAmount })

    const data = response.data.data
    if (!data.valid) {
      return rejectWithValue('Invalid or expired coupon code')
    }
    handleApiSuccess(dispatch, 'Coupon Applied!', `Saved ₹${data.discount_amount.toFixed(2)}`)
    return {
      code,
      discount_amount: data.discount_amount,
      discount_type: (data.coupon?.type as 'percentage' | 'fixed') || 'fixed',
    }
  } catch (error: any) {
    const message = handleApiError(error, dispatch, 'Invalid coupon code')
    return rejectWithValue(message)
  }
})

export const clearCartApi = createAsyncThunk<void>(
  'cart/clearCartApi',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      await api.delete('/cart/clear')
    } catch (error: any) {
      // Ignore clear errors silently
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
          product_uid: action.payload.product.uid,
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
      state.appliedCoupon = null
    },
    removeCoupon: (state) => {
      state.appliedCoupon = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.isLoading = false
        state.cart = action.payload
        state.items = action.payload?.items || []
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        // Reset cart gracefully on fetch error
        state.cart = null
        state.items = []
      })
      .addCase(addToCart.pending, (state) => {
        state.isUpdating = true
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isUpdating = false
        state.cart = action.payload
        state.items = action.payload?.items || []
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
        state.items = action.payload?.items || []
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
        state.items = action.payload?.items || []
      })
      .addCase(removeCartItem.rejected, (state, action) => {
        state.isUpdating = false
        state.error = action.payload as string
      })
      .addCase(validateCoupon.fulfilled, (state, action) => {
        state.appliedCoupon = action.payload
      })
      .addCase(validateCoupon.rejected, (state) => {
        state.appliedCoupon = null
      })
      .addCase(clearCartApi.fulfilled, (state) => {
        state.cart = null
        state.items = []
        state.appliedCoupon = null
      })
  },
})

export const {
  optimisticAddToCart,
  optimisticUpdateQuantity,
  optimisticRemoveItem,
  clearCart,
  removeCoupon,
} = cartSlice.actions
export default cartSlice.reducer
