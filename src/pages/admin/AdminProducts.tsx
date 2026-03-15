import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Search,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Upload,
  FileSpreadsheet,
  X,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog'
import { Label } from '../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { addToast } from '../../store/slices/uiSlice'
import { formatPrice } from '../../lib/utils'
import { useAppDispatch } from '../../store/hooks'
import api from '../../services/api'
import { handleApiError } from '../../utils/apiErrorHandler'
import { fileToBase64 } from '../../utils/fileToBase64'
import { ApiResponse } from '../../types'
import { downloadCsv } from '../../utils/csv'

type VariantAttributeType = 'size' | 'color' | 'material'

interface ProductVariantApi {
  id: number
  product_id: number
  sku: string
  attributes: Record<string, unknown>
  price: number
  sale_price?: number | null
  is_active?: boolean
}

interface ProductImageApi {
  id: number
  product_id: number
  variant_id?: number | null
  url: string
  alt_text?: string | null
  is_primary?: boolean
  sort_order?: number | null
}

interface ProductApi {
  id: number
  uid: string
  category_id: number
  slug: string
  name: string
  description?: string | null
  short_desc?: string | null
  sku?: string | null
  base_price: number
  sale_price?: number | null
  cost_price?: number | null
  brand?: string | null
  is_active?: boolean
  is_featured?: boolean
  created_at?: string
  updated_at?: string
  images?: ProductImageApi[]
  variants?: ProductVariantApi[]
}

interface ProductVarietyForm {
  id: string
  variant_id?: number
  sku: string
  type: VariantAttributeType
  value: string
  price: string
  stock: string
  is_active: boolean
}

interface ProductFormData {
  name: string
  description: string
  short_desc: string
  sku: string
  base_price: string
  sale_price: string
  cost_price: string
  stock: string
  category_id: string
  brand: string
  image_url: string
  is_active: boolean
  is_featured: boolean
  is_customizable: boolean
  varieties: ProductVarietyForm[]
}

interface PaginationMeta {
  page: number
  page_size: number
  total: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

interface PaginatedApiResponse<T> {
  success: boolean
  message: string
  data: T
  pagination: PaginationMeta
}

interface CategoryApi {
  id: number
  name: string
  slug: string
  children?: CategoryApi[]
}

interface CategoryOption {
  id: number
  name: string
  label: string
}

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
const DEFAULT_PAGE_SIZE = 6

const initialPagination: PaginationMeta = {
  page: 1,
  page_size: DEFAULT_PAGE_SIZE,
  total: 0,
  total_pages: 0,
  has_next: false,
  has_prev: false,
}

const initialFormData: ProductFormData = {
  name: '',
  description: '',
  short_desc: '',
  sku: '',
  base_price: '',
  sale_price: '',
  cost_price: '',
  stock: '0',
  category_id: 'none',
  brand: '',
  image_url: '',
  is_active: true,
  is_featured: false,
  is_customizable: false,
  varieties: [],
}

const flattenCategoryOptions = (nodes: CategoryApi[], parentLabel = ''): CategoryOption[] =>
  nodes.flatMap((node) => {
    const label = parentLabel ? `${parentLabel} / ${node.name}` : node.name
    return [
      { id: node.id, name: node.name, label },
      ...flattenCategoryOptions(node.children || [], label),
    ]
  })

const createEmptyVariety = (): ProductVarietyForm => ({
  id: `var-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  sku: '',
  type: 'size',
  value: '',
  price: '',
  stock: '0',
  is_active: true,
})

const parseOptionalNumber = (value: string): number | null => {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isNaN(parsed) ? null : parsed
}

const resolveMediaUrl = (url: string): string => {
  if (!url) return url
  if (url.startsWith('data:image')) return url
  try {
    const base = api.defaults.baseURL || window.location.origin
    return new URL(url, base).toString()
  } catch {
    return url
  }
}

const attributeTypeFromVariant = (variant: ProductVariantApi): VariantAttributeType => {
  const keys = Object.keys(variant.attributes || {})
  const found = keys.find((key) => key === 'size' || key === 'color' || key === 'material')
  return (found || 'size') as VariantAttributeType
}

const attributeValueFromVariant = (variant: ProductVariantApi): string => {
  const type = attributeTypeFromVariant(variant)
  const raw = (variant.attributes || {})[type]
  if (raw == null) return ''
  return String(raw)
}

export default function AdminProducts() {
  const dispatch = useAppDispatch()
  const [products, setProducts] = useState<ProductApi[]>([])
  const [stockByProductId, setStockByProductId] = useState<Record<number, number>>({})
  const [pagination, setPagination] = useState<PaginationMeta>(initialPagination)
  const [apiCategories, setApiCategories] = useState<CategoryOption[]>([])

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  const [isCategoryLoading, setIsCategoryLoading] = useState(false)
  const [isProductsLoading, setIsProductsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isBulkUploading, setIsBulkUploading] = useState(false)

  const [formData, setFormData] = useState<ProductFormData>(initialFormData)
  const [editingProduct, setEditingProduct] = useState<ProductApi | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<ProductApi | null>(null)

  const originalStockRef = useRef<number | null>(null)
  const bulkUploadInputRef = useRef<HTMLInputElement>(null)
  const itemsPerPage = DEFAULT_PAGE_SIZE

  const categoryLabelById = useMemo(() => {
    const map = new Map<number, string>()
    apiCategories.forEach((category) => {
      map.set(category.id, category.label)
    })
    return map
  }, [apiCategories])

  const loadCategories = useCallback(async () => {
    setIsCategoryLoading(true)
    try {
      let page = 1
      let hasNext = true
      const collected: CategoryOption[] = []

      while (hasNext) {
        const response = await api.get<PaginatedApiResponse<CategoryApi[]>>('/categories/tree', {
          params: { page, page_size: DEFAULT_PAGE_SIZE },
        })
        collected.push(...flattenCategoryOptions(response.data.data || []))
        hasNext = response.data.pagination?.has_next || false
        page += 1
      }

      const uniqueById = new Map<number, CategoryOption>()
      collected.forEach((category) => {
        if (!uniqueById.has(category.id)) uniqueById.set(category.id, category)
      })
      setApiCategories(Array.from(uniqueById.values()))
    } catch (error) {
      handleApiError(error, dispatch, 'Failed to fetch category menu')
    } finally {
      setIsCategoryLoading(false)
    }
  }, [dispatch])

  const loadProducts = useCallback(
    async (page: number, search: string, categoryValue: string) => {
      setIsProductsLoading(true)
      try {
        const params: Record<string, unknown> = {
          page,
          page_size: itemsPerPage,
          include_inactive: true,
        }

        const trimmedSearch = search.trim()
        if (trimmedSearch) params.search = trimmedSearch

        if (categoryValue !== 'all') {
          const parsedCategoryId = Number(categoryValue)
          if (!Number.isNaN(parsedCategoryId)) params.category_id = parsedCategoryId
        }

        const response = await api.get<PaginatedApiResponse<ProductApi[]>>('/products/', { params })
        const items = response.data.data || []
        const meta = response.data.pagination || initialPagination

        if (meta.total_pages > 0 && page > meta.total_pages) {
          setCurrentPage(meta.total_pages)
          return
        }

        setProducts(items)
        setPagination(meta)

        const stockEntries = await Promise.all(
          items.map(async (product) => {
            try {
              const stockRes = await api.get<{ available: number }>(`/inventory/product/${product.id}`)
              return [product.id, stockRes.data.available] as const
            } catch {
              return [product.id, 0] as const
            }
          })
        )

        const nextStock: Record<number, number> = {}
        stockEntries.forEach(([productId, available]) => {
          nextStock[productId] = available
        })
        setStockByProductId((prev) => ({ ...prev, ...nextStock }))
      } catch (error) {
        handleApiError(error, dispatch, 'Failed to load products')
      } finally {
        setIsProductsLoading(false)
      }
    },
    [dispatch, itemsPerPage]
  )

  useEffect(() => {
    void loadCategories()
  }, [loadCategories])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProducts(currentPage, searchQuery, categoryFilter)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [currentPage, searchQuery, categoryFilter, loadProducts])

  const openCreateDialog = () => {
    originalStockRef.current = 0
    setEditingProduct(null)
    setFormData(initialFormData)
    setIsDialogOpen(true)
  }

  const openEditDialog = (product: ProductApi) => {
    originalStockRef.current = null
    setEditingProduct(product)

    const primaryImage =
      (product.images || []).find((img) => img.is_primary) || (product.images || [])[0]
    const imageUrl = primaryImage?.url ? resolveMediaUrl(primaryImage.url) : ''

    setFormData({
      name: product.name || '',
      description: product.description || '',
      short_desc: product.short_desc || '',
      sku: product.sku || '',
      base_price: product.base_price != null ? String(product.base_price) : '',
      sale_price: product.sale_price != null ? String(product.sale_price) : '',
      cost_price: product.cost_price != null ? String(product.cost_price) : '',
      stock: String(stockByProductId[product.id] ?? 0),
      category_id: String(product.category_id),
      brand: product.brand || '',
      image_url: imageUrl,
      is_active: product.is_active !== false,
      is_featured: product.is_featured === true,
      is_customizable: (product as any).is_customizable === true,
      varieties: (product.variants || []).map((variant) => ({
        id: `var-${variant.id}`,
        variant_id: variant.id,
        sku: variant.sku,
        type: attributeTypeFromVariant(variant),
        value: attributeValueFromVariant(variant),
        price: variant.price != null ? String(variant.price) : '',
        stock: '0',
        is_active: variant.is_active !== false,
      })),
    })

    setIsDialogOpen(true)

    void (async () => {
      try {
        const res = await api.get<{ available: number }>(`/inventory/product/${product.id}`)
        originalStockRef.current = res.data.available
        setFormData((prev) => ({ ...prev, stock: String(res.data.available) }))
      } catch {
        originalStockRef.current = stockByProductId[product.id] ?? 0
      }
    })()
  }

  const handleImageUpload = async (file: File | undefined) => {
    if (!file) return
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Image too large',
          message: 'Please upload an image smaller than 5MB.',
        })
      )
      return
    }
    try {
      const base64 = await fileToBase64(file)
      setFormData((prev) => ({ ...prev, image_url: base64 }))
    } catch (error) {
      handleApiError(error, dispatch, 'Failed to encode image as base64')
    }
  }

  const handleVarietyChange = <T extends keyof ProductVarietyForm>(
    index: number,
    field: T,
    value: ProductVarietyForm[T]
  ) => {
    setFormData((prev) => ({
      ...prev,
      varieties: prev.varieties.map((variety, varietyIndex) =>
        varietyIndex === index ? { ...variety, [field]: value } : variety
      ),
    }))
  }

  const handleAddVariety = () => {
    setFormData((prev) => ({ ...prev, varieties: [...prev.varieties, createEmptyVariety()] }))
  }

  const handleRemoveVariety = async (index: number) => {
    const target = formData.varieties[index]
    if (!target) return

    if (target.variant_id) {
      try {
        await api.delete(`/products/variants/${target.variant_id}`)
        dispatch(
          addToast({
            type: 'success',
            title: 'Variant removed',
            message: 'Product variant has been removed successfully.',
          })
        )
      } catch (error) {
        handleApiError(error, dispatch, 'Failed to delete variant')
        return
      }
    }

    setFormData((prev) => ({
      ...prev,
      varieties: prev.varieties.filter((_, varietyIndex) => varietyIndex !== index),
    }))
  }

  const buildVariantSku = (variant: ProductVarietyForm, index: number) => {
    const base = (formData.sku || formData.name || 'PRODUCT')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 45)
    const suffix = `${variant.type}-${variant.value || index + 1}`
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 45)
    return `${base}-${suffix}`.slice(0, 100)
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()

    const parsedCategoryId = Number(formData.category_id)
    if (formData.category_id === 'none' || Number.isNaN(parsedCategoryId)) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Missing category',
          message: 'Please select a category before submitting.',
        })
      )
      return
    }

    const basePrice = parseOptionalNumber(formData.base_price)
    if (basePrice == null) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Missing price',
          message: 'Base price is required.',
        })
      )
      return
    }

    const payload = {
      category_id: parsedCategoryId,
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      short_desc: formData.short_desc.trim() || null,
      sku: formData.sku.trim() || null,
      base_price: basePrice,
      sale_price: parseOptionalNumber(formData.sale_price),
      cost_price: parseOptionalNumber(formData.cost_price),
      currency: 'INR',
      tax_rate: 18.0,
      weight_grams: null as number | null,
      brand: formData.brand.trim() || null,
      tags: null as Record<string, unknown> | null,
      meta_title: null as string | null,
      meta_desc: null as string | null,
      is_active: formData.is_active,
      is_featured: formData.is_featured,
      is_customizable: formData.is_customizable,
    }

    setIsSubmitting(true)
    try {
      const productResponse = editingProduct
        ? await api.put<ApiResponse<ProductApi>>(`/products/${editingProduct.id}`, payload)
        : await api.post<ApiResponse<ProductApi>>('/products/', payload)

      const savedProduct = productResponse.data.data
      if (!savedProduct) throw new Error('Product API returned no data')

      const shouldUploadImage = formData.image_url.trim().startsWith('data:image')
      if (shouldUploadImage) {
        await api.post<ApiResponse<ProductImageApi>>(`/products/${savedProduct.id}/images`, {
          url: formData.image_url,
          alt_text: savedProduct.name,
          is_primary: true,
          sort_order: 0,
        })
      }

      const createdVariants: Array<{ id: number; stock: number }> = []
      const variantsToCreate = formData.varieties.filter((variant) => !variant.variant_id && variant.value.trim())

      for (let index = 0; index < variantsToCreate.length; index += 1) {
        const variant = variantsToCreate[index]
        const variantSku = variant.sku.trim() || buildVariantSku(variant, index)
        const price = parseOptionalNumber(variant.price) ?? basePrice
        const variantStock = parseOptionalNumber(variant.stock) ?? 0

        const variantRes = await api.post<ApiResponse<ProductVariantApi>>(`/products/${savedProduct.id}/variants`, {
          sku: variantSku,
          attributes: { [variant.type]: variant.value.trim() },
          price,
          sale_price: null,
          is_active: variant.is_active,
        })

        if (variantRes.data.data?.id) createdVariants.push({ id: variantRes.data.data.id, stock: variantStock })
      }

      const desiredStock = parseOptionalNumber(formData.stock) ?? 0
      if (editingProduct) {
        const originalStock = originalStockRef.current ?? (stockByProductId[editingProduct.id] ?? 0)
        const delta = Math.round(desiredStock - originalStock)
        if (delta !== 0) {
          await api.post('/inventory/adjust', {
            product_id: editingProduct.id,
            variant_id: null,
            adjustment: delta,
            reason: 'Admin stock adjustment',
          })
        }
      } else if (createdVariants.length > 0) {
        await Promise.all(
          createdVariants.map((variant) =>
            api.post('/inventory/adjust', {
              product_id: savedProduct.id,
              variant_id: variant.id,
              adjustment: Math.round(variant.stock),
              reason: 'Initial stock (variant)',
            })
          )
        )
      } else if (desiredStock !== 0) {
        await api.post('/inventory/adjust', {
          product_id: savedProduct.id,
          variant_id: null,
          adjustment: Math.round(desiredStock),
          reason: 'Initial stock (product)',
        })
      }

      dispatch(
        addToast({
          type: 'success',
          title: editingProduct ? 'Product updated' : 'Product created',
          message: editingProduct ? 'Product has been updated successfully.' : 'Product has been added successfully.',
        })
      )

      setIsDialogOpen(false)
      setFormData(initialFormData)
      setEditingProduct(null)
      originalStockRef.current = null

      await loadProducts(currentPage, searchQuery, categoryFilter)
    } catch (error) {
      handleApiError(error, dispatch, 'Failed to save product')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingProduct) return
    try {
      await api.delete(`/products/${deletingProduct.id}`)
      dispatch(addToast({ type: 'success', title: 'Product deleted', message: 'Product has been deleted successfully.' }))
      setIsDeleteDialogOpen(false)
      setDeletingProduct(null)
      await loadProducts(currentPage, searchQuery, categoryFilter)
    } catch (error) {
      handleApiError(error, dispatch, 'Failed to delete product')
    }
  }

  const handleBulkUpload = async (file: File | undefined) => {
    if (!file) return

    setIsBulkUploading(true)
    try {
      const payload = new FormData()
      payload.append('file', file)

      const response = await api.post<
        ApiResponse<{
          inserted?: number
          skipped?: number
          failed?: number
        }>
      >('/products/product-bulk-upload', payload)

      if (!response.data.success) {
        dispatch(
          addToast({
            type: 'error',
            title: 'Bulk upload failed',
            message: response.data.message || 'Failed to import products.',
          })
        )
        return
      }

      setCurrentPage(1)
      await loadProducts(1, searchQuery, categoryFilter)

      const inserted = response.data.data?.inserted ?? 0
      const skipped = response.data.data?.skipped ?? 0
      const failed = response.data.data?.failed ?? 0

      dispatch(
        addToast({
          type: failed > 0 ? 'warning' : 'success',
          title: 'Product bulk upload complete',
          message: `Inserted ${inserted}, skipped ${skipped}, failed ${failed}.`,
        })
      )
    } catch (error) {
      handleApiError(error, dispatch, 'Failed to upload products file')
    } finally {
      setIsBulkUploading(false)
      if (bulkUploadInputRef.current) {
        bulkUploadInputRef.current.value = ''
      }
    }
  }

  const handleExportProducts = () => {
    if (products.length === 0) {
      dispatch(addToast({ type: 'info', title: 'No data to export', message: 'There are no products to export on this page.' }))
      return
    }

    const exportRows = products.map((product) => ({
      id: product.id,
      name: product.name,
      category_id: product.category_id,
      category_label: categoryLabelById.get(product.category_id) || '',
      sku: product.sku || '',
      brand: product.brand || '',
      base_price: product.base_price,
      sale_price: product.sale_price ?? '',
      status: product.is_active !== false ? 'Active' : 'Inactive',
      created_at: product.created_at || '',
    }))

    downloadCsv('products_export.csv', exportRows, [
      'id',
      'name',
      'category_id',
      'category_label',
      'sku',
      'brand',
      'base_price',
      'sale_price',
      'status',
      'created_at',
    ])

    dispatch(addToast({ type: 'success', title: 'Export complete', message: 'Products exported successfully.' }))
  }

  const pageStart = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.page_size + 1
  const pageEnd = Math.min(pagination.page * pagination.page_size, pagination.total)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your product inventory</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <input
            ref={bulkUploadInputRef}
            type="file"
            accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(e) => void handleBulkUpload(e.target.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => bulkUploadInputRef.current?.click()}
            disabled={isBulkUploading}
            className="h-10 w-10 p-0 sm:w-auto sm:px-4"
            aria-label="Bulk upload products"
          >
            {isBulkUploading ? (
              <Package className="w-4 h-4 animate-pulse sm:mr-2" />
            ) : (
              <Upload className="w-4 h-4 sm:mr-2" />
            )}
            <span className="hidden sm:inline">Bulk Upload</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleExportProducts}
            className="h-10 w-10 p-0 sm:w-auto sm:px-4"
            aria-label="Export products"
          >
            <FileSpreadsheet className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          <Button
            onClick={openCreateDialog}
            className="h-10 w-10 p-0 sm:w-auto sm:px-4"
            aria-label="Add product"
          >
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Add Product</span>
          </Button>
        </div>
      </div>

      <Card className="card-premium">
        <CardHeader className="px-6 py-5">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={categoryFilter}
              onValueChange={(value) => {
                setCategoryFilter(value)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-60">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {apiCategories.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0">
          <div className="table-shell">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Product</th>
                  <th className="text-left py-3 px-4 font-medium">Variants</th>
                  <th className="text-left py-3 px-4 font-medium">Category</th>
                  <th className="text-left py-3 px-4 font-medium">Brand</th>
                  <th className="text-left py-3 px-4 font-medium">Price</th>
                  <th className="text-left py-3 px-4 font-medium">Stock</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-right py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isProductsLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading products...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      No products found
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const image =
                      (product.images || []).find((img) => img.is_primary) ||
                      (product.images || [])[0]
                    const imageUrl = image?.url ? resolveMediaUrl(image.url) : ''
                    const categoryLabel =
                      categoryLabelById.get(product.category_id) || `Category #${product.category_id}`
                    const stock = stockByProductId[product.id] ?? 0

                    return (
                      <tr key={product.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                              {imageUrl ? (
                                <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="w-5 h-5 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium line-clamp-1">{product.name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {(product.description || '').substring(0, 50)}
                                {(product.description || '').length > 50 ? '...' : ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {product.variants && product.variants.length > 0 ? (
                              Object.keys(product.variants[0].attributes || {}).map(attrKey => (
                                <div key={attrKey} className="text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border">
                                  <span className="font-bold uppercase mr-1">{attrKey}:</span>
                                  {Array.from(new Set(product.variants!.map(v => v.attributes[attrKey]))).join(', ')}
                                </div>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground italic">None</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{categoryLabel}</Badge>
                        </td>
                        <td className="py-3 px-4">{product.brand || '-'}</td>
                        <td className="py-3 px-4 font-medium">
                          {formatPrice(product.sale_price ?? product.base_price)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={stock > 0 ? 'text-green-600' : 'text-red-600'}>{stock}</span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={product.is_active !== false ? 'success' : 'secondary'}>
                            {product.is_active !== false ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setDeletingProduct(product)
                                setIsDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {pagination.total_pages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {pageStart} to {pageEnd} of {pagination.total} products
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => p - 1)}
                  disabled={!pagination.has_prev}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                  let pageNum: number
                  if (pagination.total_pages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= pagination.total_pages - 2) {
                    pageNum = pagination.total_pages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'ghost'}
                      size="icon"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={!pagination.has_next}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[calc(100%-1rem)] sm:w-full max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="border-b px-6 py-5">
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex max-h-[82vh] flex-col">
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sku: e.target.value }))}
                    placeholder="Optional product SKU"
                  />
                </div>

                <div className="grid gap-2 xl:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    className="min-h-24 rounded-md border border-input bg-background px-3 py-2"
                  />
                </div>

                <div className="grid gap-2 xl:col-span-2">
                  <Label htmlFor="short_desc">Short Description</Label>
                  <Input
                    id="short_desc"
                    value={formData.short_desc}
                    onChange={(e) => setFormData((prev) => ({ ...prev, short_desc: e.target.value }))}
                    placeholder="Optional one-line summary"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3 xl:col-span-2">
                  <div className="grid gap-2">
                    <Label htmlFor="base_price">Base Price *</Label>
                    <Input
                      id="base_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.base_price}
                      onChange={(e) => setFormData((prev) => ({ ...prev, base_price: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="sale_price">Sale Price</Label>
                    <Input
                      id="sale_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.sale_price}
                      onChange={(e) => setFormData((prev) => ({ ...prev, sale_price: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="stock">Stock</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData((prev) => ({ ...prev, stock: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      {editingProduct ? 'Updates stock by the difference.' : 'Sets initial stock.'}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:col-span-2">
                  <div className="grid gap-2">
                    <Label htmlFor="category_id">Category *</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, category_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" disabled>
                          {isCategoryLoading ? 'Loading categories...' : 'Select a category'}
                        </SelectItem>
                        {apiCategories.map((category) => (
                          <SelectItem key={category.id} value={String(category.id)}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData((prev) => ({ ...prev, brand: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 xl:col-span-2">
                  <div className="grid gap-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.is_active ? 'active' : 'inactive'}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, is_active: value === 'active' }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Featured</Label>
                    <Select
                      value={formData.is_featured ? 'yes' : 'no'}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, is_featured: value === 'yes' }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Featured" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Customizable</Label>
                    <Select
                      value={formData.is_customizable ? 'yes' : 'no'}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, is_customizable: value === 'yes' }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Customizable" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-3 xl:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label>Variants</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddVariety}>
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add Variant
                    </Button>
                  </div>

                  {formData.varieties.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No variants added. You can add size/color/material variants.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {formData.varieties.map((variety, index) => (
                        <div
                          key={variety.id}
                          className="grid grid-cols-1 md:grid-cols-[1fr_130px_1fr_120px_110px_auto] gap-2 items-end rounded-lg border p-3"
                        >
                          <div className="grid gap-1.5">
                            <Label className="text-xs text-muted-foreground">SKU</Label>
                            <Input
                              value={variety.sku}
                              onChange={(e) => handleVarietyChange(index, 'sku', e.target.value)}
                              placeholder="Leave blank to auto-generate"
                              disabled={Boolean(variety.variant_id)}
                            />
                          </div>
                          <div className="grid gap-1.5">
                            <Label className="text-xs text-muted-foreground">Type</Label>
                            <Select
                              value={variety.type}
                              onValueChange={(value) =>
                                handleVarietyChange(index, 'type', value as VariantAttributeType)
                              }
                              disabled={Boolean(variety.variant_id)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="size">Size</SelectItem>
                                <SelectItem value="color">Color</SelectItem>
                                <SelectItem value="material">Material</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-1.5">
                            <Label className="text-xs text-muted-foreground">Value</Label>
                            <Input
                              value={variety.value}
                              onChange={(e) => handleVarietyChange(index, 'value', e.target.value)}
                              placeholder="e.g. XL / Red / Cotton"
                              disabled={Boolean(variety.variant_id)}
                            />
                          </div>
                          <div className="grid gap-1.5">
                            <Label className="text-xs text-muted-foreground">Price</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={variety.price}
                              onChange={(e) => handleVarietyChange(index, 'price', e.target.value)}
                              placeholder="Defaults to base"
                              disabled={Boolean(variety.variant_id)}
                            />
                          </div>
                          <div className="grid gap-1.5">
                            <Label className="text-xs text-muted-foreground">Stock</Label>
                            <Input
                              type="number"
                              min="0"
                              value={variety.stock}
                              onChange={(e) => handleVarietyChange(index, 'stock', e.target.value)}
                              placeholder="Initial"
                              disabled={Boolean(variety.variant_id)}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => void handleRemoveVariety(index)}
                            aria-label="Remove variant"
                          >
                            <X className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Existing variants are read-only (backend currently supports create/delete only).
                  </p>
                </div>

                <div className="grid gap-2 xl:col-span-2">
                  <Label htmlFor="image_url">Product Image (Upload)</Label>
                  <Input
                    id="image_url"
                    type="file"
                    accept="image/*"
                    onChange={(e) => void handleImageUpload(e.target.files?.[0])}
                  />
                  {formData.image_url && (
                    <div className="space-y-2">
                      <img
                        src={formData.image_url}
                        alt="Product preview"
                        className="w-20 h-20 rounded-md border object-cover"
                      />
                      <p className="text-xs text-muted-foreground break-all">
                        {formData.image_url.slice(0, 80)}...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="border-t px-6 py-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete "{deletingProduct?.name}"? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleDelete()}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
