import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { Product, Category, FilterState } from '../../types'
import api from '../../services/api'
import { handleApiError } from '../../utils/apiErrorHandler'

interface BackendProduct {
  id: number
  name: string
  slug: string
  description?: string
  short_desc?: string
  base_price: number
  sale_price?: number
  currency?: string
  brand?: string
  rating_avg?: number
  review_count?: number
  is_active?: boolean
  is_featured?: boolean
  is_customizable?: boolean
  images?: { url: string; is_primary: boolean; alt_text?: string }[]
  stock?: number
  tags?: Record<string, any>
  sku?: string
  category?: { id: number; name: string; slug: string }
  variants?: {
    id: number
    product_id: number
    sku: string
    attributes: Record<string, any>
    price: number
    sale_price?: number
    is_active?: boolean
  }[]
  created_at: string
}

// Map backend product shape → frontend Product shape
export function mapProduct(p: BackendProduct): Product {
  return {
    id: String(p.id),
    name: p.name,
    description: p.description || p.short_desc || '',
    price: p.sale_price ?? p.base_price,
    originalPrice: p.sale_price ? p.base_price : undefined,
    images: p.images?.map((img) => img.url) || [],
    image_url: p.images?.find((img) => img.is_primary)?.url || p.images?.[0]?.url,
    category: p.category?.name || '',
    category_id: p.category?.id,
    category_slug: p.category?.slug,
    brand: p.brand,
    rating: p.rating_avg ?? 0,
    reviewCount: p.review_count ?? 0,
    stock: p.stock ?? 0,
    is_active: p.is_active,
    is_customizable: p.is_customizable,
    variants: p.variants?.map((v) => ({
      id: String(v.id),
      product_id: String(v.product_id),
      sku: v.sku,
      attributes: v.attributes,
      price: v.sale_price ?? v.price,
      originalPrice: v.sale_price ? v.price : undefined,
      is_active: v.is_active,
    })),
    sku: p.sku,
    created_at: p.created_at,
    updatedAt: p.created_at,
  }
}

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

interface FetchProductsParams {
  page?: number
  page_size?: number
  category_id?: number
  search?: string
  min_price?: number
  max_price?: number
  sort_by?: string
  sort_order?: string
}

export const fetchProducts = createAsyncThunk<
  { products: Product[]; total: number; totalPages: number; page: number },
  FetchProductsParams | undefined
>('products/fetchProducts', async (params = {}, { dispatch, rejectWithValue }) => {
  try {
    const { page = 1, page_size = 12, ...rest } = params
    const response = await api.get<{
      success: boolean
      data: BackendProduct[]
      pagination: {
        page: number
        page_size: number
        total: number
        total_pages: number
      }
    }>('/products/', {
      params: { page, page_size, ...rest },
    })
    const { data: items, pagination } = response.data
    return {
      products: (items || []).map(mapProduct),
      total: pagination?.total || 0,
      page: pagination?.page || 1,
      totalPages: pagination?.total_pages || 1,
    }
  } catch (error: any) {
    const message = handleApiError(error, dispatch, 'Failed to fetch products')
    return rejectWithValue(message)
  }
})

export const fetchFeaturedProducts = createAsyncThunk<Product[]>(
  'products/fetchFeaturedProducts',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.get<{
        success: boolean
        data: BackendProduct[]
        pagination: any
      }>('/products/', { params: { page_size: 8, sort_by: 'created_at', sort_order: 'desc' } })
      return (response.data.data || []).map(mapProduct)
    } catch (error: any) {
      return rejectWithValue(handleApiError(error, dispatch, 'Failed to fetch featured products'))
    }
  }
)

export const fetchCategories = createAsyncThunk<Category[]>(
  'products/fetchCategories',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.get<{
        success: boolean
        data: { items: Category[]; total: number } | Category[]
      }>('/categories/')
      // Could be paginated or array
      const raw = response.data?.data
      const items = Array.isArray(raw) ? raw : (raw as any)?.items || []
      return items
    } catch (error: any) {
      return rejectWithValue(handleApiError(error, dispatch, 'Failed to fetch categories'))
    }
  }
)

export const fetchProductById = createAsyncThunk<Product, string>(
  'products/fetchProductById',
  async (slugOrId, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.get<{ success: boolean; data: BackendProduct }>(
        `/products/${slugOrId}`
      )
      return mapProduct(response.data.data)
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
      if (product) product.stock = action.payload.stock
      if (state.currentProduct?.id === action.payload.id)
        state.currentProduct.stock = action.payload.stock
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
        state.pagination.page = action.payload.page
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
        state.currentProduct = null
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
