import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { Product } from '../../types'
import api from '../../services/api'
import { handleApiError, handleApiSuccess } from '../../utils/apiErrorHandler'

interface WishlistState {
  items: Product[]
  isLoading: boolean
  error: string | null
}

const initialState: WishlistState = {
  items: [],
  isLoading: false,
  error: null,
}

export const fetchWishlist = createAsyncThunk<Product[]>('wishlist/fetchWishlist', async (_, { dispatch, rejectWithValue }) => {
  try {
    const response = await api.get<{ status: string; message: string; data: { items: Product[] } }>('/wishlist')
    return response.data.data.items
  } catch (error: any) {
    const message = handleApiError(error, dispatch, 'Failed to fetch wishlist')
    return rejectWithValue(message)
  }
})

export const addToWishlistAsync = createAsyncThunk<Product, string>(
  'wishlist/addToWishlist',
  async (productId, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.post<{ status: string; message: string; data: { product_id: string } }>('/wishlist', { product_id: productId })
      handleApiSuccess(dispatch, 'Added to wishlist', 'Item added to your wishlist')
      return response.data.data as any
    } catch (error: any) {
      const message = handleApiError(error, dispatch, 'Failed to add to wishlist')
      return rejectWithValue(message)
    }
  }
)

export const removeFromWishlistAsync = createAsyncThunk<string, string>(
  'wishlist/removeFromWishlist',
  async (productId, { dispatch, rejectWithValue }) => {
    try {
      await api.delete(`/wishlist/${productId}`)
      handleApiSuccess(dispatch, 'Removed from wishlist', 'Item removed from your wishlist')
      return productId
    } catch (error: any) {
      const message = handleApiError(error, dispatch, 'Failed to remove from wishlist')
      return rejectWithValue(message)
    }
  }
)

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    addToWishlist: (state, action: PayloadAction<Product>) => {
      const exists = state.items.find(item => item.id === action.payload.id)
      if (!exists) {
        state.items.push(action.payload)
      }
    },
    removeFromWishlist: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload)
    },
    clearWishlist: (state) => {
      state.items = []
    },
    setWishlist: (state, action: PayloadAction<Product[]>) => {
      state.items = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.isLoading = false
        state.items = action.payload
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(addToWishlistAsync.fulfilled, (state, action) => {
        // Item already added locally, just show toast
      })
      .addCase(removeFromWishlistAsync.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload)
      })
  },
})

export const { addToWishlist, removeFromWishlist, clearWishlist, setWishlist } = wishlistSlice.actions
export default wishlistSlice.reducer
