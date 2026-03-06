import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { Product, Category, FilterState, ProductSearch } from '../../types'
import api from '../../services/api'
import { handleApiError } from '../../utils/apiErrorHandler'

interface ProductState {
  products: Product[]
  featuredProducts: Product[]
  categories: Category[]
  currentProduct: Product | null
  filters: FilterState
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  isLoading: boolean
  error: string | null
}

const initialState: ProductState = {
  products: [],
  featuredProducts: [],
  categories: [],
  currentProduct: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  },
  isLoading: false,
  error: null,
}

export const fetchProducts = createAsyncThunk<
  { products: Product[]; total: number; totalPages: number },
  ProductSearch
>('products/fetchProducts', async (params, { dispatch, rejectWithValue }) => {
  try {
    const response = await api.get<{ status: string; message: string; data: { products: Product[]; total: number; totalPages: number } }>('/products', {
      params,
    })
    return response.data.data
  } catch (error: any) {
    const message = handleApiError(error, dispatch, 'Failed to fetch products')
    return rejectWithValue(message)
  }
})

export const fetchFeaturedProducts = createAsyncThunk<Product[]>(
  'products/fetchFeaturedProducts',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.get<{ status: string; message: string; data: Product[] }>('/products/featured')
      return response.data.data
    } catch (error: any) {
      const message = handleApiError(error, dispatch, 'Failed to fetch featured products')
      return rejectWithValue(message)
    }
  }
)

export const fetchCategories = createAsyncThunk<Category[]>(
  'products/fetchCategories',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.get<{ status: string; message: string; data: Category[] }>('/categories')
      return response.data.data
    } catch (error: any) {
      const message = handleApiError(error, dispatch, 'Failed to fetch categories')
      return rejectWithValue(message)
    }
  }
)

export const fetchProductById = createAsyncThunk<Product, string>(
  'products/fetchProductById',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.get<{ status: string; message: string; data: Product }>(`/products/${id}`)
      return response.data.data
    } catch (error: any) {
      const message = handleApiError(error, dispatch, 'Failed to fetch product')
      return rejectWithValue(message)
    }
  }
)

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<FilterState>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = {}
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload
    },
    updateProductStock: (state, action: PayloadAction<{ id: string; stock: number }>) => {
      const product = state.products.find((p) => p.id === action.payload.id)
      if (product) {
        product.stock = action.payload.stock
      }
      if (state.currentProduct?.id === action.payload.id) {
        state.currentProduct.stock = action.payload.stock
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false
        state.products = action.payload.products
        state.pagination.total = action.payload.total
        state.pagination.totalPages = action.payload.totalPages
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
        state.featuredProducts = action.payload
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload
      })
      .addCase(fetchProductById.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentProduct = action.payload
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const { setFilters, clearFilters, setPage, updateProductStock } = productSlice.actions
export default productSlice.reducer
