import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Package, Plus, Pencil, Trash2, Search, Image as ImageIcon, ChevronLeft,
  ChevronRight, Upload, FileSpreadsheet, X, Loader2, Settings, Palette,
  Type, Image, CheckCircle2, AlertCircle, AlertTriangle
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../components/ui/dialog'
import { addToast } from '../../store/slices/uiSlice'
import { formatPrice } from '../../lib/utils'
import { useAppDispatch } from '../../store/hooks'
import api from '../../services/api'
import { handleApiError } from '../../utils/apiErrorHandler'
import { fileToBase64 } from '../../utils/fileToBase64'
import { ApiResponse } from '../../types'
import { downloadCsv } from '../../utils/csv'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Switch } from '../../components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent } from '../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'

// ═════════════════════════════════════════════════════════════════════════════
//  TYPE DEFINITIONS (Matching Backend Models)
// ═════════════════════════════════════════════════════════════════════════════

interface ProductImageApi {
  id: number
  uid: string
  product_id: number
  variant_id?: number | null
  url: string
  alt_text?: string | null
  is_primary?: boolean
  sort_order?: number
  created_at?: string
}

interface ProductVariantApi {
  id: number
  uid: string
  product_id: number
  sku: string
  name?: string
  attributes: Record<string, any>
  price: number
  sale_price?: number | null
  weight_grams?: number | null
  is_active: boolean
  is_default: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

interface ProductApi {
  id: number
  uid: string
  category_id: number
  brand_id?: number | null
  product_type: 'simple' | 'variable' | 'customizable' | 'bundle' | 'digital' | 'service'
  name: string
  slug: string
  description?: string | null
  short_desc?: string | null
  sku?: string | null
  base_price: number
  sale_price?: number | null
  cost_price?: number | null
  currency: string
  tax_rate: number
  weight_grams?: number | null
  length_mm?: number | null
  width_mm?: number | null
  height_mm?: number | null
  is_perishable: boolean
  shelf_life_days?: number | null
  occasions?: string[] | null
  recipient_types?: string[] | null
  age_groups?: string[] | null
  is_active: boolean
  is_featured: boolean
  is_customizable: boolean
  meta_title?: string | null
  meta_desc?: string | null
  rating_avg: number
  rating_count: number
  images?: ProductImageApi[]
  variants?: ProductVariantApi[]
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

interface CustomizationOptionForm {
  label: string
  value: string
  sort_order: number
  is_active: boolean
  preview_url?: string
  extra_price: string
}

interface CustomizationFieldForm {
  id: string
  uid?: string
  field_type: 'text' | 'textarea' | 'image_upload' | 'color_picker' | 'font_select' | 'dropdown' | 'number' | 'date' | 'checkbox'
  label: string
  placeholder?: string
  helper_text?: string
  is_required: boolean
  sort_order: number
  is_active: boolean
  max_length?: number | null
  min_length?: number | null
  max_file_size_mb?: number | null
  allowed_formats?: string[]
  min_resolution_px?: number | null
  options?: CustomizationOptionForm[]
  min_value?: number | null
  max_value?: number | null
  extra_charge: string
}

interface CustomizationPrintAreaForm {
  id: string
  uid?: string
  area: 'front' | 'back' | 'left_sleeve' | 'right_sleeve' | 'top' | 'full_wrap' | 'center' | 'custom'
  label: string
  width_mm?: number | null
  height_mm?: number | null
  canvas_x?: number | null
  canvas_y?: number | null
  canvas_width?: number | null
  canvas_height?: number | null
}

interface CustomizationTemplateForm {
  id?: number
  uid?: string
  name: string
  description?: string
  preview_enabled: boolean
  preview_base_image_url?: string
  is_active: boolean
  fields: CustomizationFieldForm[]
  print_areas: CustomizationPrintAreaForm[]
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
  brand_id: string
  product_type: 'simple' | 'variable' | 'customizable' | 'bundle' | 'digital' | 'service'
  images: string[]
  is_active: boolean
  is_featured: boolean
  is_customizable: boolean
  is_perishable: boolean
  weight_grams: string
  tax_rate: string
  occasions: string[]
  recipient_types: string[]
  age_groups: string[]
  meta_title: string
  meta_desc: string
  customization_template: CustomizationTemplateForm
  variants: ProductVariantForm[]
}

interface ProductVariantForm {
  id: string
  variant_id?: number
  variant_uid?: string
  sku: string
  name?: string
  attributes: Record<string, any>
  price: string
  sale_price: string
  weight_grams: string
  is_active: boolean
  is_default: boolean
  sort_order: number
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
  uid: string
  name: string
  slug: string
  children?: CategoryApi[]
}

interface CategoryOption {
  id: number
  name: string
  label: string
}

interface BrandApi {
  id: number
  uid: string
  name: string
  slug: string
  is_active: boolean
}

// ═════════════════════════════════════════════════════════════════════════════
//  CONSTANTS & HELPERS
// ═════════════════════════════════════════════════════════════════════════════

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
const DEFAULT_PAGE_SIZE = 10

const initialPagination: PaginationMeta = {
  page: 1,
  page_size: DEFAULT_PAGE_SIZE,
  total: 0,
  total_pages: 0,
  has_next: false,
  has_prev: false,
}

const initialCustomizationTemplate: CustomizationTemplateForm = {
  name: '',
  description: '',
  preview_enabled: false,
  is_active: true,
  fields: [],
  print_areas: [],
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
  brand_id: 'none',
  product_type: 'simple',
  images: [],
  is_active: true,
  is_featured: false,
  is_customizable: false,
  is_perishable: false,
  weight_grams: '',
  tax_rate: '18',
  occasions: [],
  recipient_types: [],
  age_groups: [],
  meta_title: '',
  meta_desc: '',
  customization_template: initialCustomizationTemplate,
  variants: [],
}

const PRODUCT_TYPE_OPTIONS = [
  { value: 'simple', label: 'Simple Product' },
  { value: 'variable', label: 'Variable (Variants)' },
  { value: 'customizable', label: 'Customizable' },
  { value: 'bundle', label: 'Bundle/Hamper' },
  { value: 'digital', label: 'Digital Product' },
  { value: 'service', label: 'Service' },
]

const FIELD_TYPE_OPTIONS = [
  { value: 'text', label: 'Text Input' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'image_upload', label: 'Image Upload' },
  { value: 'color_picker', label: 'Color Picker' },
  { value: 'font_select', label: 'Font Select' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'checkbox', label: 'Checkbox' },
]

const PRINT_AREA_OPTIONS = [
  { value: 'front', label: 'Front' },
  { value: 'back', label: 'Back' },
  { value: 'left_sleeve', label: 'Left Sleeve' },
  { value: 'right_sleeve', label: 'Right Sleeve' },
  { value: 'top', label: 'Top' },
  { value: 'full_wrap', label: 'Full Wrap' },
  { value: 'center', label: 'Center' },
  { value: 'custom', label: 'Custom' },
]

const flattenCategoryOptions = (nodes: CategoryApi[], parentLabel = ''): CategoryOption[] =>
  nodes.flatMap((node) => {
    const label = parentLabel ? `${parentLabel} / ${node.name}` : node.name
    return [
      { id: node.id, name: node.name, label },
      ...flattenCategoryOptions(node.children || [], label),
    ]
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

const dialogContentClass = "w-[calc(100%-2rem)] max-w-5xl p-0 bg-white border border-amber-900/10 rounded-none shadow-2xl"
const dialogHeaderClass = "p-8 border-b border-gray-100 bg-[#faf9f6]"
const dialogTitleClass = "font-serif text-3xl text-gray-900 tracking-tight"
const dialogInputClass = "w-full rounded-none border-b border-gray-200 px-0 py-3 text-sm font-light bg-transparent focus:outline-none focus:border-amber-700 transition-colors shadow-none"
const dialogLabelClass = "text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 mb-1 block"
const sectionHeaderClass = "text-xs font-bold uppercase tracking-[0.2em] text-amber-900 mb-4 border-b border-amber-50 pb-2"

export default function AdminProducts() {
  const dispatch = useAppDispatch()
  const [products, setProducts] = useState<ProductApi[]>([])
  const [stockByProductId, setStockByProductId] = useState<Record<number, number>>({})
  const [pagination, setPagination] = useState<PaginationMeta>(initialPagination)
  const [apiCategories, setApiCategories] = useState<CategoryOption[]>([])
  const [apiBrands, setApiBrands] = useState<BrandApi[]>([])

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  const [isCategoryLoading, setIsCategoryLoading] = useState(false)
  const [isProductsLoading, setIsProductsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isBulkUploading, setIsBulkUploading] = useState(false)

  const [categorySearchQuery, setCategorySearchQuery] = useState('')
  const [availableCategories, setAvailableCategories] = useState<CategoryOption[]>([])
  const [isCategoriesFetching, setIsCategoriesFetching] = useState(false)
  const [categoryPagination, setCategoryPagination] = useState<PaginationMeta>(initialPagination)
  const [categoryCurrentPage, setCategoryCurrentPage] = useState(1)
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)
  const [categoryInputDisplay, setCategoryInputDisplay] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState<ProductFormData>(initialFormData)
  const [editingProduct, setEditingProduct] = useState<ProductApi | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<ProductApi | null>(null)
  const [activeTab, setActiveTab] = useState('basic')

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

  const brandNameById = useMemo(() => {
    const map = new Map<number, string>()
    apiBrands.forEach((brand) => {
      map.set(brand.id, brand.name)
    })
    return map
  }, [apiBrands])

  // ═══════════════════════════════════════════════════════════════════════════
  //  DATA LOADING
  // ═══════════════════════════════════════════════════════════════════════════

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
      handleApiError(error, dispatch, 'Failed to load categories')
    } finally {
      setIsCategoryLoading(false)
    }
  }, [dispatch])

  const loadBrands = useCallback(async () => {
    try {
      const response = await api.get<PaginatedApiResponse<BrandApi[]>>('/admin/brands', {
        params: { page: 1, page_size: 100 },
      })
      setApiBrands(response.data.data || [])
    } catch (error) {
      // Brands endpoint might not exist, ignore error
    }
  }, [])

  const fetchAvailableCategories = useCallback(async (page: number, search: string) => {
    setIsCategoriesFetching(true)
    try {
      const response = await api.get<PaginatedApiResponse<CategoryApi[]>>('/categories/child-category', {
        params: { page, page_size: 10, search }
      })
      const items = response.data.data || []
      const options = items.map(cat => ({
        id: cat.id,
        name: cat.name,
        label: cat.name
      }))
      setAvailableCategories(options)
      setCategoryPagination(response.data.pagination || initialPagination)
    } catch (error) {
      handleApiError(error, dispatch, 'Failed to fetch categories')
    } finally {
      setIsCategoriesFetching(false)
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
    void loadBrands()
  }, [loadCategories, loadBrands])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProducts(currentPage, searchQuery, categoryFilter)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [currentPage, searchQuery, categoryFilter, loadProducts])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isCategoryDropdownOpen) {
      const timer = setTimeout(() => {
        void fetchAvailableCategories(categoryCurrentPage, categorySearchQuery)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [categoryCurrentPage, categorySearchQuery, isCategoryDropdownOpen, fetchAvailableCategories])

  // ═══════════════════════════════════════════════════════════════════════════
  //  DIALOG HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const openCreateDialog = () => {
    originalStockRef.current = 0
    setEditingProduct(null)
    setFormData(initialFormData)
    setCategoryInputDisplay('')
    setCategorySearchQuery('')
    setCategoryCurrentPage(1)
    setActiveTab('basic')
    setIsDialogOpen(true)
  }

  const openEditDialog = async (product: ProductApi) => {
    originalStockRef.current = null
    setEditingProduct(product)
    setActiveTab('basic')

    const initialCategoryName = categoryLabelById.get(product.category_id) || `Category ${product.category_id}`
    setCategoryInputDisplay(initialCategoryName)
    setCategorySearchQuery('')
    setCategoryCurrentPage(1)

    const productImages = (product.images || [])
      .filter(img => !img.variant_id)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map(img => resolveMediaUrl(img.url))

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
      brand_id: product.brand_id ? String(product.brand_id) : 'none',
      product_type: product.product_type,
      images: productImages.length > 0 ? productImages : [],
      is_active: product.is_active !== false,
      is_featured: product.is_featured === true,
      is_customizable: product.is_customizable === true,
      is_perishable: product.is_perishable || false,
      weight_grams: product.weight_grams ? String(product.weight_grams) : '',
      tax_rate: String(product.tax_rate || 18),
      occasions: product.occasions || [],
      recipient_types: product.recipient_types || [],
      age_groups: product.age_groups || [],
      meta_title: product.meta_title || '',
      meta_desc: product.meta_desc || '',
      customization_template: { ...initialCustomizationTemplate },
      variants: (product.variants || []).map((variant) => ({
        id: `var-${variant.id}`,
        variant_id: variant.id,
        variant_uid: variant.uid,
        sku: variant.sku,
        name: variant.name || '',
        attributes: variant.attributes,
        price: String(variant.price),
        sale_price: variant.sale_price ? String(variant.sale_price) : '',
        weight_grams: variant.weight_grams ? String(variant.weight_grams) : '',
        is_active: variant.is_active,
        is_default: variant.is_default,
        sort_order: variant.sort_order,
      })),
    })

    setIsDialogOpen(true)

    // Load customization template if product is customizable
    if (product.is_customizable) {
      try {
        const templateRes = await api.get<ApiResponse<any>>(`/customizations/products/${product.id}/template`)
        if (templateRes.data.success && templateRes.data.data) {
          const t = templateRes.data.data
          setFormData(prev => ({
            ...prev,
            customization_template: {
              id: t.id,
              uid: t.uid,
              name: t.name,
              description: t.description || '',
              preview_enabled: t.preview_enabled || false,
              preview_base_image_url: t.preview_base_image_url || null,
              is_active: t.is_active,
              fields: (t.fields || []).map((f: any) => ({
                id: f.uid,
                uid: f.uid,
                field_type: mapBackendFieldType(f.field_type),
                label: f.label,
                placeholder: f.placeholder || '',
                helper_text: f.helper_text || '',
                is_required: f.is_required,
                sort_order: f.sort_order,
                is_active: f.is_active,
                max_length: f.max_length,
                min_length: f.min_length,
                max_file_size_mb: f.max_file_size_mb,
                allowed_formats: f.allowed_formats,
                min_resolution_px: f.min_resolution_px,
                options: (f.options || []).map((o: any) => ({
                  label: o.label,
                  value: o.value,
                  sort_order: o.sort_order || 0,
                  is_active: o.is_active,
                  preview_url: o.preview_url,
                  extra_price: String(o.extra_price || 0)
                })),
                min_value: f.min_value,
                max_value: f.max_value,
                extra_charge: String(f.extra_charge || 0)
              })),
              print_areas: (t.print_areas || []).map((pa: any) => ({
                id: pa.uid,
                uid: pa.uid,
                area: pa.area,
                label: pa.label,
                width_mm: pa.width_mm,
                height_mm: pa.height_mm,
                canvas_x: pa.canvas_x,
                canvas_y: pa.canvas_y,
                canvas_width: pa.canvas_width,
                canvas_height: pa.canvas_height,
              }))
            }
          }))
        }
      } catch (e) {
        console.error('Failed to fetch customization template', e)
      }
    }

    // Load stock
    try {
      const res = await api.get<{ available: number }>(`/inventory/product/${product.id}`)
      originalStockRef.current = res.data.available
      setFormData((prev) => ({ ...prev, stock: String(res.data.available) }))
    } catch {
      originalStockRef.current = stockByProductId[product.id] ?? 0
    }
  }

  // Helper to map backend field types to frontend
  const mapBackendFieldType = (type: string): any => {
    const mapping: Record<string, any> = {
      'text': 'text',
      'textarea': 'textarea',
      'image_upload': 'image_upload',
      'color_picker': 'color_picker',
      'font_select': 'font_select',
      'dropdown': 'dropdown',
      'number': 'number',
      'date': 'date',
      'checkbox': 'checkbox',
    }
    return mapping[type] || 'text'
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  IMAGE HANDLING
  // ═══════════════════════════════════════════════════════════════════════════

  const handleImageUpload = async (file: File | undefined, variantIndex?: number) => {
    if (!file) return
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      dispatch(addToast({ type: 'error', title: 'Asset Error', message: 'Image must be less than 5MB' }))
      return
    }
    try {
      const base64 = await fileToBase64(file)
      if (variantIndex !== undefined) {
        setFormData((prev) => ({
          ...prev,
          variants: prev.variants.map((v, i) => i === variantIndex ? { ...v, images: [...(v as any).images || [], base64] } : v)
        }))
      } else {
        setFormData((prev) => ({ ...prev, images: [...prev.images, base64] }))
      }
    } catch (error) {
      handleApiError(error, dispatch, 'Failed to upload image')
    }
  }

  const handleRemoveImage = (imageIndex: number, variantIndex?: number) => {
    if (variantIndex !== undefined) {
      setFormData((prev) => ({
        ...prev,
        variants: prev.variants.map((v, i) => i === variantIndex ? { ...v, images: (v as any).images?.filter((_: any, idx: number) => idx !== imageIndex) } : v)
      }))
    } else {
      setFormData((prev) => ({ ...prev, images: prev.images.filter((_, idx) => idx !== imageIndex) }))
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  VARIANT HANDLING
  // ═══════════════════════════════════════════════════════════════════════════

  const handleAddVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, {
        id: `var-${Date.now()}`,
        sku: '',
        name: '',
        attributes: {},
        price: '',
        sale_price: '',
        weight_grams: '',
        is_active: true,
        is_default: prev.variants.length === 0,
        sort_order: prev.variants.length,
      }]
    }))
  }

  const handleRemoveVariant = async (index: number) => {
    const target = formData.variants[index]
    if (!target) return

    if (target.variant_uid) {
      setIsSubmitting(true)
      try {
        await api.delete(`/products/variants/uid/${target.variant_uid}`)
        dispatch(addToast({ type: 'success', title: 'Variant Removed', message: 'Product variant deleted successfully' }))
        setFormData((prev) => ({
          ...prev,
          variants: prev.variants.filter((_, i) => i !== index),
        }))
      } catch (error) {
        handleApiError(error, dispatch, 'Failed to delete variant')
      } finally {
        setIsSubmitting(false)
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        variants: prev.variants.filter((_, i) => i !== index),
      }))
    }
  }

  const handleVariantChange = <T extends keyof ProductVariantForm>(
    index: number,
    field: T,
    value: ProductVariantForm[T]
  ) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) => i === index ? { ...v, [field]: value } : v)
    }))
  }

  const handleToggleDefaultVariant = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) => ({ ...v, is_default: i === index }))
    }))
  }

  const handleVariantAttributeChange = (
    index: number,
    key: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) =>
        i === index ? { ...v, attributes: { ...v.attributes, [key]: value } } : v
      )
    }))
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  CUSTOMIZATION HANDLING
  // ═══════════════════════════════════════════════════════════════════════════

  const handleAddCustomField = () => {
    setFormData(prev => ({
      ...prev,
      customization_template: {
        ...prev.customization_template,
        fields: [
          ...prev.customization_template.fields,
          {
            id: `field-${Date.now()}`,
            field_type: 'text',
            label: '',
            placeholder: '',
            helper_text: '',
            is_required: false,
            sort_order: prev.customization_template.fields.length,
            is_active: true,
            max_length: null,
            min_length: null,
            max_file_size_mb: null,
            allowed_formats: undefined,
            min_resolution_px: null,
            options: [],
            min_value: null,
            max_value: null,
            extra_charge: '0'
          }
        ]
      }
    }))
  }

  const handleRemoveCustomField = (id: string) => {
    setFormData(prev => ({
      ...prev,
      customization_template: {
        ...prev.customization_template,
        fields: prev.customization_template.fields.filter(f => f.id !== id)
      }
    }))
  }

  const handleUpdateCustomField = <T extends keyof CustomizationFieldForm>(
    id: string,
    field: T,
    value: CustomizationFieldForm[T]
  ) => {
    setFormData(prev => ({
      ...prev,
      customization_template: {
        ...prev.customization_template,
        fields: prev.customization_template.fields.map(f => f.id === id ? { ...f, [field]: value } : f)
      }
    }))
  }

  const handleAddCustomOption = (fieldId: string) => {
    setFormData(prev => ({
      ...prev,
      customization_template: {
        ...prev.customization_template,
        fields: prev.customization_template.fields.map(f =>
          f.id === fieldId ? {
            ...f,
            options: [...(f.options || []), { label: '', value: '', sort_order: (f.options?.length || 0), is_active: true, extra_price: '0' }]
          } : f
        )
      }
    }))
  }

  const handleUpdateCustomOption = (fieldId: string, optionIndex: number, field: keyof CustomizationOptionForm, value: any) => {
    setFormData(prev => ({
      ...prev,
      customization_template: {
        ...prev.customization_template,
        fields: prev.customization_template.fields.map(f =>
          f.id === fieldId ? {
            ...f,
            options: f.options?.map((o, idx) => idx === optionIndex ? { ...o, [field]: value } : o)
          } : f
        )
      }
    }))
  }

  const handleRemoveCustomOption = (fieldId: string, optionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      customization_template: {
        ...prev.customization_template,
        fields: prev.customization_template.fields.map(f =>
          f.id === fieldId ? { ...f, options: f.options?.filter((_, idx) => idx !== optionIndex) } : f
        )
      }
    }))
  }

  const handleAddPrintArea = () => {
    setFormData(prev => ({
      ...prev,
      customization_template: {
        ...prev.customization_template,
        print_areas: [
          ...prev.customization_template.print_areas,
          {
            id: `area-${Date.now()}`,
            area: 'front',
            label: '',
            width_mm: null,
            height_mm: null,
            canvas_x: null,
            canvas_y: null,
            canvas_width: null,
            canvas_height: null,
          }
        ]
      }
    }))
  }

  const handleRemovePrintArea = (id: string) => {
    setFormData(prev => ({
      ...prev,
      customization_template: {
        ...prev.customization_template,
        print_areas: prev.customization_template.print_areas.filter(pa => pa.id !== id)
      }
    }))
  }

  const handleUpdatePrintArea = <T extends keyof CustomizationPrintAreaForm>(
    id: string,
    field: T,
    value: CustomizationPrintAreaForm[T]
  ) => {
    setFormData(prev => ({
      ...prev,
      customization_template: {
        ...prev.customization_template,
        print_areas: prev.customization_template.print_areas.map(pa => pa.id === id ? { ...pa, [field]: value } : pa)
      }
    }))
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  FORM SUBMISSION
  // ═══════════════════════════════════════════════════════════════════════════

  const handleSubmit = async (e: any) => {
    e.preventDefault()

    const parsedCategoryId = Number(formData.category_id)
    if (formData.category_id === 'none' || Number.isNaN(parsedCategoryId)) {
      dispatch(addToast({ type: 'error', title: 'Validation Error', message: 'Please select a category' }))
      return
    }

    const basePrice = parseOptionalNumber(formData.base_price)
    if (basePrice == null) {
      dispatch(addToast({ type: 'error', title: 'Validation Error', message: 'Please enter a valid base price' }))
      return
    }

    const payload: any = {
      category_id: parsedCategoryId,
      brand_id: formData.brand_id !== 'none' ? Number(formData.brand_id) : null,
      product_type: formData.product_type,
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      short_desc: formData.short_desc.trim() || null,
      sku: formData.sku.trim() || null,
      base_price: basePrice,
      sale_price: parseOptionalNumber(formData.sale_price),
      cost_price: parseOptionalNumber(formData.cost_price),
      currency: 'INR',
      tax_rate: parseOptionalNumber(formData.tax_rate) || 18.0,
      weight_grams: parseOptionalNumber(formData.weight_grams),
      is_perishable: formData.is_perishable,
      shelf_life_days: formData.is_perishable ? parseOptionalNumber(formData.stock) : null,
      occasions: formData.occasions.length > 0 ? formData.occasions : null,
      recipient_types: formData.recipient_types.length > 0 ? formData.recipient_types : null,
      age_groups: formData.age_groups.length > 0 ? formData.age_groups : null,
      meta_title: formData.meta_title.trim() || null,
      meta_desc: formData.meta_desc.trim() || null,
      is_active: formData.is_active,
      is_featured: formData.is_featured,
      is_customizable: formData.is_customizable,
    }

    setIsSubmitting(true)
    try {
      // 1. Save main product
      const productResponse = editingProduct
        ? await api.put<ApiResponse<ProductApi>>(`/products/uid/${editingProduct.uid}`, payload)
        : await api.post<ApiResponse<ProductApi>>('/products/', payload)

      const savedProduct = productResponse.data.data
      if (!savedProduct) throw new Error('System null response')

      // 2. Save images
      if (formData.images.length > 0) {
        await Promise.all(
          formData.images.map((img, idx) =>
            api.post(`/products/uid/${savedProduct.uid}/images`, {
              url: img,
              alt_text: `${savedProduct.name} - Image ${idx + 1}`,
              is_primary: idx === 0,
              sort_order: idx,
            })
          )
        )
      }

      // 3. Save variants
      if (formData.variants.length > 0) {
        for (const variant of formData.variants) {
          const variantPayload = {
            sku: variant.sku.trim() || `${savedProduct.sku || savedProduct.name}-VAR-${variant.id}`,
            name: variant.name?.trim() || null,
            attributes: variant.attributes,
            price: parseOptionalNumber(variant.price) || basePrice,
            sale_price: parseOptionalNumber(variant.sale_price),
            weight_grams: parseOptionalNumber(variant.weight_grams),
            is_active: variant.is_active,
            is_default: variant.is_default,
            sort_order: variant.sort_order,
          }

          if (variant.variant_uid) {
            await api.put(`/products/variants/uid/${variant.variant_uid}`, variantPayload)
          } else {
            await api.post(`/products/uid/${savedProduct.uid}/variants`, variantPayload)
          }
        }
      }

      // 4. Update stock
      const desiredStock = parseOptionalNumber(formData.stock) ?? 0
      if (editingProduct) {
        const originalStock = originalStockRef.current ?? (stockByProductId[editingProduct.id] ?? 0)
        const delta = Math.round(desiredStock - originalStock)
        if (delta !== 0) {
          await api.post('/inventory/adjust', {
            product_uid: editingProduct.uid,
            variant_uid: null,
            adjustment: delta,
            reason: 'Admin stock adjustment',
          })
        }
      } else if (desiredStock !== 0) {
        await api.post('/inventory/adjust', {
          product_uid: savedProduct.uid,
          variant_uid: null,
          adjustment: Math.round(desiredStock),
          reason: 'Initial stock',
        })
      }

      // 5. Handle customization template
      if (formData.is_customizable && formData.product_type === 'customizable') {
        await syncCustomizationTemplate(savedProduct)
      } else if (editingProduct && editingProduct.is_customizable && !formData.is_customizable) {
        // Deactivate template if product is no longer customizable
        try {
          const tRes = await api.get<ApiResponse<any>>(`/customizations/products/${editingProduct.id}/template`)
          if (tRes.data.success && tRes.data.data) {
            await api.put(`/admin/customizations/templates/${tRes.data.data.id}`, { is_active: false })
          }
        } catch (e) { /* ignore */ }
      }

      dispatch(addToast({ type: 'success', title: 'Success', message: 'Product saved successfully' }))
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

  const syncCustomizationTemplate = async (product: ProductApi) => {
    try {
      const template = formData.customization_template
      let templateData: any = null

      // Get or create template
      try {
        const tRes = await api.get<ApiResponse<any>>(`/customizations/products/${product.id}/template`)
        if (tRes.data.success && tRes.data.data) {
          templateData = tRes.data.data
        }
      } catch (e) { /* not found */ }

      const templatePayload = {
        name: template.name || `${product.name} Template`,
        description: template.description || product.description || '',
        preview_enabled: template.preview_enabled,
        preview_base_image_url: template.preview_base_image_url,
        is_active: template.is_active,
      }

      if (templateData) {
        const res = await api.put(`/admin/customizations/templates/${templateData.id}`, templatePayload)
        templateData = res.data.data
      } else {
        const res = await api.post(`/admin/customizations/products/${product.id}/template`, templatePayload)
        templateData = res.data.data
      }

      if (templateData) {
        const existingFields = templateData.fields || []

        // Delete removed fields
        const currentFieldUids = new Set(
          template.fields.filter(f => !f.id.startsWith('field-')).map(f => f.id)
        )
        for (const ef of existingFields) {
          if (!currentFieldUids.has(ef.uid)) {
            await api.delete(`/admin/customizations/fields/${ef.id}`)
          }
        }

        // Add or update fields
        for (let i = 0; i < template.fields.length; i++) {
          const field = template.fields[i]
          const isNew = field.id.startsWith('field-')

          const fieldPayload: any = {
            field_type: field.field_type,
            label: field.label,
            placeholder: field.placeholder,
            helper_text: field.helper_text,
            is_required: field.is_required,
            sort_order: i,
            is_active: field.is_active,
            extra_charge: parseOptionalNumber(field.extra_charge) || 0,
          }

          // Add type-specific constraints
          if (['text', 'textarea'].includes(field.field_type)) {
            fieldPayload.max_length = field.max_length
            fieldPayload.min_length = field.min_length
          }
          if (field.field_type === 'image_upload') {
            fieldPayload.max_file_size_mb = field.max_file_size_mb
            fieldPayload.allowed_formats = field.allowed_formats
            fieldPayload.min_resolution_px = field.min_resolution_px
          }
          if (['dropdown', 'font_select'].includes(field.field_type)) {
            fieldPayload.options = field.options?.map(o => ({
              label: o.label,
              value: o.value,
              sort_order: o.sort_order,
              is_active: o.is_active,
              preview_url: o.preview_url,
              extra_price: parseOptionalNumber(o.extra_price) || 0,
            }))
          }
          if (field.field_type === 'number') {
            fieldPayload.min_value = field.min_value
            fieldPayload.max_value = field.max_value
          }

          if (isNew) {
            await api.post(`/admin/customizations/templates/${templateData.id}/fields`, fieldPayload)
          } else {
            const ef = existingFields.find((f: any) => f.uid === field.id)
            if (ef) {
              await api.put(`/admin/customizations/fields/${ef.id}`, fieldPayload)
            }
          }
        }

        // Handle print areas
        const existingAreas = templateData.print_areas || []
        for (const pa of existingAreas) {
          await api.delete(`/admin/customizations/print-areas/${pa.id}`)
        }

        for (let i = 0; i < template.print_areas.length; i++) {
          const area = template.print_areas[i]
          await api.post(`/admin/customizations/templates/${templateData.id}/print-areas`, {
            area: area.area,
            label: area.label,
            width_mm: area.width_mm,
            height_mm: area.height_mm,
            canvas_x: area.canvas_x,
            canvas_y: area.canvas_y,
            canvas_width: area.canvas_width,
            canvas_height: area.canvas_height,
          })
        }
      }
    } catch (templateError) {
      console.error('Customization template sync failed:', templateError)
      dispatch(addToast({
        type: 'warning',
        title: 'Partial Save',
        message: 'Product saved, but customization template sync encountered an issue.'
      }))
    }
  }

  const handleDelete = async () => {
    if (!deletingProduct) return
    setIsSubmitting(true)
    try {
      await api.delete(`/products/uid/${deletingProduct.uid}`)
      dispatch(addToast({ type: 'success', title: 'Success', message: 'Product deleted successfully' }))
      setIsDeleteDialogOpen(false)
      setDeletingProduct(null)
      await loadProducts(currentPage, searchQuery, categoryFilter)
    } catch (error) {
      handleApiError(error, dispatch, 'Failed to delete product')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBulkUpload = async (file: File | undefined) => {
    if (!file) return
    setIsBulkUploading(true)
    try {
      const payload = new FormData()
      payload.append('file', file)
      const response = await api.post<ApiResponse<{ inserted?: number; skipped?: number; failed?: number }>>(
        '/products/product-bulk-upload',
        payload
      )
      if (!response.data.success) {
        dispatch(addToast({ type: 'error', title: 'Upload Error', message: response.data.message || 'Upload failed' }))
        return
      }
      setCurrentPage(1)
      await loadProducts(1, searchQuery, categoryFilter)
      const inserted = response.data.data?.inserted ?? 0
      const failed = response.data.data?.failed ?? 0
      dispatch(addToast({
        type: failed > 0 ? 'warning' : 'success',
        title: 'Upload Complete',
        message: `Inserted: ${inserted}, Failed: ${failed}`
      }))
    } catch (error) {
      handleApiError(error, dispatch, 'Bulk upload failed')
    } finally {
      setIsBulkUploading(false)
      if (bulkUploadInputRef.current) bulkUploadInputRef.current.value = ''
    }
  }

  const handleExportProducts = () => {
    if (products.length === 0) return
    const exportRows = products.map((product) => ({
      id: String(product.id),
      name: product.name,
      category_id: String(product.category_id),
      category_label: categoryLabelById.get(product.category_id) || '',
      sku: product.sku || '',
      base_price: String(product.base_price),
      sale_price: product.sale_price ? String(product.sale_price) : '',
      stock: String(stockByProductId[product.id] || 0),
      is_active: product.is_active ? 'Yes' : 'No',
      is_featured: product.is_featured ? 'Yes' : 'No',
      is_customizable: product.is_customizable ? 'Yes' : 'No',
    }))
    const filename = `products_export_${new Date().toISOString().split('T')[0]}.csv`
    downloadCsv(filename, exportRows)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = !searchQuery ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = categoryFilter === 'all' || product.category_id === Number(categoryFilter)

      return matchesSearch && matchesCategory
    })
  }, [products, searchQuery, categoryFilter])


  return (
    <div className="space-y-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between border-b border-gray-200/80 pb-6 gap-4">
        <div>
          <h1 className="text-4xl font-serif text-gray-900 mb-2">Product Catalog</h1>
          <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-gray-400 flex items-center gap-2">
             <Package className="w-3 h-3" /> Inventory & Pricing Management
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
           <input ref={bulkUploadInputRef} type="file" accept=".csv,.xls,.xlsx" className="hidden" onChange={(e) => void handleBulkUpload(e.target.files?.[0])} />
           <Button variant="outline" onClick={() => bulkUploadInputRef.current?.click()} disabled={isBulkUploading} className="h-10 px-4 bg-transparent border-gray-200 text-gray-900 rounded-none uppercase text-[10px] tracking-widest hover:bg-gray-50 transition-colors">
             {isBulkUploading ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Upload className="w-3 h-3 sm:mr-2" />}
             <span className="hidden sm:inline">Import Catalog</span>
           </Button>
           <Button variant="outline" onClick={handleExportProducts} className="h-10 px-4 bg-transparent border-gray-200 text-gray-900 rounded-none uppercase text-[10px] tracking-widest hover:bg-gray-50 transition-colors">
             <FileSpreadsheet className="w-3 h-3 sm:mr-2" />
             <span className="hidden sm:inline">Export CSV</span>
           </Button>
           <Button onClick={openCreateDialog} className="h-12 border border-amber-700 bg-amber-700 text-white rounded-none uppercase text-xs tracking-[0.2em] px-8 hover:bg-amber-800 transition-colors shadow-none shrink-0">
             <Plus className="mr-3 h-4 w-4" /> Add Item
          </Button>
        </div>
      </div>

      {/* Filters & Listing */}
      <div className="bg-white border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#faf9f6]">
           <div className="relative w-full sm:max-w-sm flex items-center border-b border-gray-300 focus-within:border-amber-700 transition-colors pb-1 bg-transparent">
             <Search className="w-4 h-4 text-gray-400 absolute left-0" />
             <input
               type="search"
               placeholder="Search products or SKUs..."
               value={searchQuery}
               onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
               className="w-full bg-transparent border-none pl-8 pr-4 h-8 text-sm font-light focus:outline-none focus:ring-0 placeholder:text-gray-400"
             />
           </div>
           
           <div className="flex gap-4 w-full sm:w-auto">
             <div className="w-full sm:w-64">
                <Select value={categoryFilter} onValueChange={(val) => { setCategoryFilter(val); setCurrentPage(1); }}>
                   <SelectTrigger className="rounded-none border-b border-gray-200 border-t-0 border-l-0 border-r-0 bg-transparent shadow-none hover:bg-gray-50 focus:ring-0 h-10 px-0">
                      <SelectValue placeholder="All Categories" />
                   </SelectTrigger>
                   <SelectContent className="rounded-none">
                      <SelectItem value="all">All Categories</SelectItem>
                      {apiCategories.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.label}
                        </SelectItem>
                      ))}
                   </SelectContent>
                </Select>
             </div>
           </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#faf9f6]">
                <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200">Product</th>
                <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200">Category</th>
                <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200">Retail Price</th>
                <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200">Stock Count</th>
                <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200 text-center">Lifecycle</th>
                <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isProductsLoading ? (
                 <tr><td colSpan={6} className="py-24 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-700" /></td></tr>
              ) : products.length === 0 ? (
                 <tr><td colSpan={6} className="py-32 text-center text-gray-400 font-serif text-lg italic">No units found in the current index.</td></tr>
              ) : (
                products.map((product) => {
                  const image = (product.images || []).find((img) => img.is_primary) || (product.images || [])[0]
                  const imageUrl = image?.url ? resolveMediaUrl(image.url) : ''
                  const categoryLabel = categoryLabelById.get(product.category_id) || `N/${product.category_id}`
                  const stock = stockByProductId[product.id] ?? 0

                  return (
                    <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-white border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                            {imageUrl ? <img src={imageUrl} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" /> : <ImageIcon className="w-5 h-5 text-gray-200" />}
                          </div>
                          <div>
                            <p className="font-serif text-gray-900 text-lg leading-tight mb-1">{product.name}</p>
                            <div className="flex items-center gap-2">
                               <p className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">SKU: {product.sku || product.uid.slice(0, 8)}</p>
                               {product.is_customizable && <Badge className="rounded-none bg-purple-50 text-purple-700 border-purple-100 text-[8px] h-4 uppercase tracking-tighter">Customizable</Badge>}
                               {product.is_featured && <Badge className="rounded-none bg-amber-50 text-amber-700 border-amber-100 text-[8px] h-4 uppercase tracking-tighter font-bold">Featured</Badge>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-gray-600 border border-gray-200 px-2 py-1 bg-white truncate max-w-[150px] inline-block mb-1">
                          {categoryLabel}
                        </span>
                        {product.brand_id && brandNameById.get(Number(product.brand_id)) && (
                           <span className="block text-[9px] text-amber-800 uppercase tracking-widest font-bold">{brandNameById.get(Number(product.brand_id))}</span>
                        )}
                      </td>
                      <td className="py-5 px-6">
                        {product.sale_price ? (
                           <div className="flex flex-col">
                              <span className="text-gray-900 font-mono text-sm leading-none mb-1">{formatPrice(product.sale_price)}</span>
                              <span className="text-gray-400 line-through text-[10px] font-mono">{formatPrice(product.base_price)}</span>
                           </div>
                        ) : <span className="text-gray-900 font-mono text-sm">{formatPrice(product.base_price)}</span>}
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex flex-col">
                           <span className={`text-sm font-mono ${stock > 0 ? 'text-gray-900' : 'text-red-700 font-bold'}`}>{stock} UNT</span>
                           <span className="text-[9px] uppercase tracking-tighter text-gray-400">Available</span>
                        </div>
                      </td>
                      <td className="py-5 px-6 text-center">
                        <span className={`text-[9px] uppercase tracking-widest px-2 py-1 font-bold border ${product.is_active !== false ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-gray-200 text-gray-500 bg-white'}`}>
                          {product.is_active !== false ? 'Active' : 'Archived'}
                        </span>
                      </td>
                      <td className="py-5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-amber-800 rounded-none mix-blend-multiply" onClick={() => openEditDialog(product)}><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-700 rounded-none mix-blend-multiply" onClick={() => { setDeletingProduct(product); setIsDeleteDialogOpen(true) }}><Trash2 className="w-4 h-4" /></Button>
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
          <div className="p-4 border-t border-gray-200 flex items-center justify-between text-xs font-light text-gray-500 bg-[#faf9f6]">
            <div className="uppercase tracking-widest text-[10px] font-bold text-gray-400 italic">
              Showing { (pagination.page - 1) * pagination.page_size + 1 } – { Math.min(pagination.page * pagination.page_size, pagination.total) } of { pagination.total } Products
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={!pagination.has_prev} 
                className="w-8 h-8 flex items-center justify-center text-gray-500 disabled:opacity-30 hover:bg-white border border-transparent hover:border-gray-200 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                .filter(p => Math.abs(currentPage - p) <= 2)
                .map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 flex items-center justify-center font-bold text-[10px] border transition-all duration-300 ${
                      currentPage === page
                        ? 'border-amber-700 bg-amber-700 text-white'
                        : 'border-transparent text-gray-400 hover:border-gray-200 hover:bg-white'
                    }`}
                  >
                    {page}
                  </button>
              ))}

              <button 
                onClick={() => setCurrentPage(p => Math.min(pagination.total_pages, p + 1))} 
                disabled={!pagination.has_next} 
                className="w-8 h-8 flex items-center justify-center text-gray-500 disabled:opacity-30 hover:bg-white border border-transparent hover:border-gray-200 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={dialogContentClass}>
          <DialogHeader className={dialogHeaderClass}>
            <DialogTitle className={dialogTitleClass}>{editingProduct ? 'Update Product Catalog' : 'Add New Product'}</DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
            <TabsList className="grid grid-cols-4 bg-white border-b border-gray-100 rounded-none h-14 p-0">
              <TabsTrigger value="basic" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-700 data-[state=active]:bg-amber-50/30 font-bold uppercase text-[10px] tracking-widest transition-all">General Info</TabsTrigger>
              <TabsTrigger value="media" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-700 data-[state=active]:bg-amber-50/30 font-bold uppercase text-[10px] tracking-widest transition-all">Media Gallery</TabsTrigger>
              <TabsTrigger value="variants" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-700 data-[state=active]:bg-amber-50/30 font-bold uppercase text-[10px] tracking-widest transition-all">Variant List</TabsTrigger>
              <TabsTrigger value="customization" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-700 data-[state=active]:bg-amber-50/30 font-bold uppercase text-[10px] tracking-widest transition-all">Customizations</TabsTrigger>
            </TabsList>

            <div className="max-h-[60vh] overflow-y-auto no-scrollbar bg-[#faf9f6] p-8">

              <TabsContent value="basic" className="space-y-8 mt-0 border-none p-0 outline-none">
                <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                  <div className="space-y-1">
                    <label className={dialogLabelClass}>Product Name *</label>
                    <input
                      className={dialogInputClass}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Handcrafted Ceramic Vessel"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={dialogLabelClass}>SKU / Reference ID</label>
                    <input
                      className={dialogInputClass}
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="SKU-TR-001"
                    />
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className={dialogLabelClass}>Detailed Description</label>
                    <textarea
                      className={dialogInputClass}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Detailed craftsmanship backstory..."
                      rows={3}
                    />
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className={dialogLabelClass}>Brief Abstract (Short Desc)</label>
                    <textarea
                      className={dialogInputClass}
                      value={formData.short_desc}
                      onChange={(e) => setFormData({ ...formData, short_desc: e.target.value })}
                      placeholder="One-sentence essence..."
                      rows={1}
                    />
                  </div>

                  <div className="grid grid-cols-3 col-span-2 gap-12">
                     <div className="space-y-1">
                        <label className={dialogLabelClass}>Base Valuation *</label>
                        <div className="relative">
                           <span className="absolute left-0 top-3 text-xs text-gray-400 font-mono">₹</span>
                           <input
                             type="number"
                             className={`${dialogInputClass} pl-4`}
                             value={formData.base_price}
                             onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                           />
                        </div>
                     </div>
                     <div className="space-y-1">
                        <label className={dialogLabelClass}>Promotional Quote</label>
                        <div className="relative">
                           <span className="absolute left-0 top-3 text-xs text-gray-400 font-mono">₹</span>
                           <input
                             type="number"
                             className={`${dialogInputClass} pl-4 font-bold text-amber-700`}
                             value={formData.sale_price}
                             onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                           />
                        </div>
                     </div>
                     <div className="space-y-1">
                        <label className={dialogLabelClass}>Acquisition Cost</label>
                        <div className="relative">
                           <span className="absolute left-0 top-3 text-xs text-gray-400 font-mono">₹</span>
                           <input
                             type="number"
                             className={`${dialogInputClass} pl-4`}
                             value={formData.cost_price}
                             onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                           />
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-12 col-span-2">
                     <div className="space-y-1">
                        <label className={dialogLabelClass}>Available Units (Stock)</label>
                        <input
                          type="number"
                          className={dialogInputClass}
                          value={formData.stock}
                          onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                          placeholder="Current reserve..."
                        />
                     </div>
                     <div className="space-y-1">
                        <label className={dialogLabelClass}>Taxation Rate (%)</label>
                        <input
                          type="number"
                          className={dialogInputClass}
                          value={formData.tax_rate}
                          onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                          placeholder="Standard 18% GST"
                        />
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-12 col-span-2">
                    <div ref={dropdownRef} className="relative space-y-1">
                      <label className={dialogLabelClass}>Taxonomic Classification *</label>
                      <div className="relative flex items-center border-b border-gray-200 focus-within:border-amber-700 transition-colors pb-1">
                        <Search className="w-3 h-3 text-gray-400 absolute left-0" />
                        <input
                          className="w-full bg-transparent border-none pl-6 pr-4 h-9 text-sm font-light focus:outline-none focus:ring-0 placeholder:text-gray-400"
                          value={categoryInputDisplay}
                          onFocus={() => setIsCategoryDropdownOpen(true)}
                          onChange={(e) => {
                            setCategoryInputDisplay(e.target.value)
                            setCategorySearchQuery(e.target.value)
                            setIsCategoryDropdownOpen(true)
                          }}
                          placeholder="Refine by category..."
                        />
                      </div>
                      {isCategoryDropdownOpen && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-200">
                          <div className="max-h-60 overflow-y-auto no-scrollbar">
                            {isCategoriesFetching ? (
                              <div className="p-8 text-center border-none"><Loader2 className="w-4 h-4 animate-spin mx-auto text-amber-700" /></div>
                            ) : availableCategories.length === 0 ? (
                               <div className="p-8 text-center text-[10px] uppercase font-bold text-gray-400 tracking-widest border-none">No Matches Found</div>
                            ) : (
                              availableCategories.map((cat) => (
                                <div
                                  key={cat.id}
                                  className="p-3 hover:bg-amber-50 cursor-pointer text-xs transition-colors border-b border-gray-50 last:border-0"
                                  onClick={() => {
                                    setFormData({ ...formData, category_id: String(cat.id) })
                                    setCategoryInputDisplay(cat.label)
                                    setIsCategoryDropdownOpen(false)
                                  }}
                                >
                                  {cat.label}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className={dialogLabelClass}>Maison / Brand</label>
                      <Select value={formData.brand_id} onValueChange={(val) => setFormData({ ...formData, brand_id: val })}>
                        <SelectTrigger className="rounded-none border-b border-t-0 border-l-0 border-r-0 border-gray-200 shadow-none px-0 h-10 hover:bg-gray-50 focus:ring-0 transition-colors">
                          <SelectValue placeholder="Select provenance..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-none border-gray-200">
                          <SelectItem value="none">Independent / No Maison</SelectItem>
                          {apiBrands.map((brand) => (
                            <SelectItem key={brand.id} value={String(brand.id)}>
                              {brand.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-12 col-span-2">
                     <div className="space-y-1">
                        <label className={dialogLabelClass}>Product Type / Model</label>
                        <Select value={formData.product_type} onValueChange={(val: any) => setFormData({ ...formData, product_type: val })}>
                          <SelectTrigger className="rounded-none border-b border-t-0 border-l-0 border-r-0 border-gray-200 shadow-none px-0 h-10 hover:bg-gray-50 focus:ring-0 transition-colors">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-none border-gray-200">
                            {PRODUCT_TYPE_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                     </div>
                     <div className="flex flex-wrap items-center gap-6 self-end pb-2">
                        <div className="flex items-center space-x-2">
                           <Switch
                             id="is_active"
                             className="data-[state=checked]:bg-amber-700 h-4 w-7"
                             checked={formData.is_active}
                             onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                           />
                           <label htmlFor="is_active" className="text-[9px] uppercase font-bold text-gray-400 tracking-[0.2em] cursor-pointer">Live</label>
                        </div>
                        <div className="flex items-center space-x-2">
                           <Switch
                             id="is_featured"
                             className="data-[state=checked]:bg-amber-700 h-4 w-7"
                             checked={formData.is_featured}
                             onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                           />
                           <label htmlFor="is_featured" className="text-[9px] uppercase font-bold text-gray-400 tracking-[0.2em] cursor-pointer">Featured</label>
                        </div>
                        <div className="flex items-center space-x-2">
                           <Switch
                             id="is_customizable"
                             className="data-[state=checked]:bg-amber-700 h-4 w-7"
                             checked={formData.is_customizable}
                             onCheckedChange={(checked) => setFormData({ ...formData, is_customizable: checked })}
                           />
                           <label htmlFor="is_customizable" className="text-[9px] uppercase font-bold text-gray-400 tracking-[0.2em] cursor-pointer">Atelier Mode</label>
                        </div>
                     </div>
                  </div>
                </div>
              </TabsContent>

                <TabsContent value="media" className="mt-0 border-none p-0 outline-none space-y-8">
                   <div className="space-y-6">
                      <h3 className={sectionHeaderClass}>Visual Inventory</h3>
                      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-6">
                        {formData.images.map((img, idx) => (
                          <div key={idx} className="aspect-square relative group bg-white border border-gray-100 p-1">
                            <img src={img} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                            <button
                              onClick={() => handleRemoveImage(idx)}
                              className="absolute -top-2 -right-2 bg-red-600 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            {idx === 0 && (
                              <div className="absolute bottom-0 left-0 right-0 bg-amber-700 text-white text-[8px] uppercase font-bold tracking-[0.2em] py-1 text-center font-sans">Primary</div>
                            )}
                          </div>
                        ))}
                        <label className="aspect-square border border-dashed border-gray-300 bg-white flex flex-col items-center justify-center cursor-pointer hover:border-amber-700 hover:bg-amber-50/20 transition-all hover:scale-[1.02]">
                           <Upload className="w-6 h-6 text-gray-300 mb-2" />
                           <span className="text-[8px] uppercase font-bold text-gray-400 tracking-widest text-center px-2">Inject Asset</span>
                           <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => {
                             const files = Array.from(e.target.files || [])
                             files.forEach(f => void handleImageUpload(f))
                           }} />
                        </label>
                      </div>
                   </div>
                </TabsContent>

                <TabsContent value="variants" className="mt-0 border-none p-0 outline-none space-y-8">
                   <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                      <h3 className={sectionHeaderClass + " mb-0 border-none pb-0"}>Product Variants</h3>
                      <Button onClick={handleAddVariant} variant="outline" className="h-8 rounded-none uppercase text-[9px] tracking-widest font-bold border-gray-200 gap-2">
                        <Plus className="w-3 h-3" /> Add Variation
                      </Button>
                   </div>

                   <div className="space-y-6">
                      {formData.variants.length === 0 ? (
                        <div className="py-20 text-center border border-dashed border-gray-200 bg-white/50">
                           <p className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.3em]">No variants defined for this item.</p>
                        </div>
                      ) : (
                        formData.variants.map((v, idx) => (
                           <div key={v.id} className="bg-white border border-gray-200 p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow relative group">
                              <button onClick={() => handleRemoveVariant(idx)} className="absolute top-4 right-4 text-gray-300 hover:text-red-700 transition-colors opacity-0 group-hover:opacity-100">
                                 <Trash2 className="w-4 h-4" />
                              </button>
                              <div className="grid grid-cols-4 gap-8">
                                 <div className="space-y-1">
                                    <label className={dialogLabelClass}>Variant SKU</label>
                                    <input className={dialogInputClass} value={v.sku} onChange={(e) => handleVariantChange(idx, 'sku', e.target.value)} />
                                 </div>
                                 <div className="space-y-1">
                                    <label className={dialogLabelClass}>Valuation</label>
                                    <input type="number" className={dialogInputClass} value={v.price} onChange={(e) => handleVariantChange(idx, 'price', e.target.value)} />
                                 </div>
                                 <div className="space-y-1">
                                    <label className={dialogLabelClass}>Promo</label>
                                    <input type="number" className={dialogInputClass} value={v.sale_price} onChange={(e) => handleVariantChange(idx, 'sale_price', e.target.value)} />
                                 </div>
                                 <div className="flex items-center gap-4 pt-4">
                                     <Switch className="data-[state=checked]:bg-amber-700 h-4 w-7" checked={v.is_active} onCheckedChange={(val) => handleVariantChange(idx, 'is_active', val)} />
                                     <span className="text-[8px] uppercase font-bold text-gray-400 tracking-widest">Active</span>
                                     <Switch className="data-[state=checked]:bg-amber-700 h-4 w-7" checked={v.is_default} onCheckedChange={(val) => handleToggleDefaultVariant(idx)} />
                                     <span className="text-[8px] uppercase font-bold text-gray-400 tracking-widest">Default</span>
                                 </div>
                              </div>
                           </div>
                        ))
                      )}
                   </div>
                </TabsContent>
                <TabsContent value="customization" className="mt-0 border-none p-0 outline-none space-y-12">
                   <div className="flex items-center justify-between bg-white border border-gray-200 p-6">
                      <div className="flex items-center gap-6">
                         <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                            <Palette className="w-6 h-6 text-amber-700" />
                         </div>
                         <div>
                            <h4 className="font-serif text-lg text-gray-900">Customization Mode</h4>
                            <p className="text-[10px] uppercase tracking-widest text-gray-400">Enable bespoke customizations for this product</p>
                         </div>
                      </div>
                      <Switch 
                        checked={formData.is_customizable} 
                        onCheckedChange={(val) => setFormData({ ...formData, is_customizable: val })} 
                        className="data-[state=checked]:bg-amber-700"
                      />
                   </div>

                   {formData.is_customizable && (
                     <div className="space-y-12">
                        {/* Template Metadata */}
                        <div className="grid grid-cols-2 gap-12">
                           <div className="space-y-1">
                              <label className={dialogLabelClass}>Experience Name</label>
                              <input 
                                className={dialogInputClass} 
                                value={formData.customization_template.name} 
                                onChange={(e) => setFormData({
                                  ...formData,
                                  customization_template: { ...formData.customization_template, name: e.target.value }
                                })}
                                placeholder="e.g. Bespoke Monogramming"
                              />
                           </div>
                           <div className="flex items-center gap-4 pt-6">
                              <Switch 
                                checked={formData.customization_template.preview_enabled} 
                                onCheckedChange={(val) => setFormData({
                                  ...formData,
                                  customization_template: { ...formData.customization_template, preview_enabled: val }
                                })} 
                                className="data-[state=checked]:bg-amber-700"
                              />
                              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Enable Real-time Visualization</span>
                           </div>
                        </div>

                        {/* Fields List */}
                        <div className="space-y-6">
                           <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                              <h3 className={sectionHeaderClass + " mb-0 border-none pb-0"}>Input Parameters</h3>
                              <Button onClick={handleAddCustomField} variant="outline" className="h-8 rounded-none uppercase text-[9px] tracking-widest font-bold border-gray-200 gap-2">
                                <Plus className="w-3 h-3" /> Add Parameter
                              </Button>
                           </div>

                           <div className="space-y-4">
                              {formData.customization_template.fields.map((field, idx) => (
                                <div key={field.id} className="bg-white border border-gray-100 p-8 space-y-6 shadow-sm relative group">
                                   <button onClick={() => handleRemoveCustomField(field.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-700 transition-colors">
                                      <Trash2 className="w-4 h-4" />
                                   </button>
                                   
                                   <div className="grid grid-cols-4 gap-8">
                                      <div className="col-span-2 space-y-1">
                                         <label className={dialogLabelClass}>Parameter Label</label>
                                         <input 
                                           className={dialogInputClass} 
                                           value={field.label} 
                                           onChange={(e) => handleUpdateCustomField(field.id, 'label', e.target.value)}
                                           placeholder="e.g. Choose Your Thread Color"
                                         />
                                      </div>
                                      <div className="space-y-1">
                                         <label className={dialogLabelClass}>Archetype</label>
                                         <Select value={field.field_type} onValueChange={(val: any) => handleUpdateCustomField(field.id, 'field_type', val)}>
                                            <SelectTrigger className="rounded-none border-b border-gray-200 border-t-0 border-l-0 border-r-0 bg-transparent shadow-none px-0 h-10 focus:ring-0">
                                               <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-none">
                                               {FIELD_TYPE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                            </SelectContent>
                                         </Select>
                                      </div>
                                      <div className="flex items-center gap-4 pt-6">
                                         <Switch checked={field.is_required} onCheckedChange={(val) => handleUpdateCustomField(field.id, 'is_required', val)} className="data-[state=checked]:bg-amber-700 h-4 w-7" />
                                         <span className="text-[8px] uppercase font-bold text-gray-400 tracking-widest">Mandatory</span>
                                      </div>
                                   </div>

                                   {['dropdown', 'font_select'].includes(field.field_type) && (
                                      <div className="space-y-4 bg-[#faf9f6] p-6">
                                         <div className="flex justify-between items-center mb-2">
                                            <span className="text-[9px] uppercase font-bold text-gray-400 tracking-[0.2em]">Selectable Options</span>
                                            <Button size="sm" variant="ghost" onClick={() => handleAddCustomOption(field.id)} className="h-6 text-amber-700 p-0 text-[10px] uppercase font-bold tracking-widest">
                                               <Plus className="w-3 h-3 mr-1" /> Add Variant
                                            </Button>
                                         </div>
                                         <div className="space-y-3">
                                            {field.options?.map((opt, optIdx) => (
                                              <div key={optIdx} className="flex gap-4 items-center">
                                                 <input className={dialogInputClass + " flex-1"} value={opt.label} onChange={(e) => handleUpdateCustomOption(field.id, optIdx, 'label', e.target.value)} placeholder="Display Text" />
                                                 <input className={dialogInputClass + " w-24"} type="number" value={opt.extra_price} onChange={(e) => handleUpdateCustomOption(field.id, optIdx, 'extra_price', e.target.value)} placeholder="+ ₹0" />
                                                 <button onClick={() => handleRemoveCustomOption(field.id, optIdx)} className="text-gray-300 hover:text-red-700"><X className="w-3 h-3" /></button>
                                              </div>
                                            ))}
                                         </div>
                                      </div>
                                   )}
                                </div>
                              ))}
                           </div>
                        </div>

                        {/* Print Areas */}
                        <div className="space-y-8">
                           <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                              <h3 className={sectionHeaderClass + " mb-0 border-none pb-0"}>Print Regions</h3>
                              <Button onClick={handleAddPrintArea} variant="outline" className="h-8 rounded-none uppercase text-[9px] tracking-widest font-bold border-gray-200 gap-2">
                                <Plus className="w-3 h-3" /> Define Region
                              </Button>
                           </div>

                           <div className="grid grid-cols-2 gap-8">
                              {formData.customization_template.print_areas.map((area, idx) => (
                                <div key={area.id} className="bg-white border border-gray-100 p-6 space-y-4 relative group">
                                   <button onClick={() => handleRemovePrintArea(area.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-700"><Trash2 className="w-3 h-3" /></button>
                                   <div className="space-y-1">
                                      <label className={dialogLabelClass}>Zone Identification</label>
                                      <input className={dialogInputClass} value={area.label} onChange={(e) => handleUpdatePrintArea(area.id, 'label', e.target.value)} placeholder="e.g. Chest Left" />
                                   </div>
                                   <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-1">
                                         <label className={dialogLabelClass}>Width (mm)</label>
                                         <input type="number" className={dialogInputClass} value={area.width_mm || ''} onChange={(e) => handleUpdatePrintArea(area.id, 'width_mm', e.target.value ? Number(e.target.value) : null)} />
                                      </div>
                                      <div className="space-y-1">
                                         <label className={dialogLabelClass}>Height (mm)</label>
                                         <input type="number" className={dialogInputClass} value={area.height_mm || ''} onChange={(e) => handleUpdatePrintArea(area.id, 'height_mm', e.target.value ? Number(e.target.value) : null)} />
                                      </div>
                                   </div>
                                </div>
                              ))}
                           </div>
                        </div>
                     </div>
                   )}
                </TabsContent>
                </div>
              </Tabs>
 
               <DialogFooter className="border-t border-gray-200 p-6 bg-white shrink-0">
                  <Button type="button" variant="outline" className="h-12 border-gray-300 text-gray-400 rounded-none uppercase text-[10px] tracking-[0.2em] px-8 hover:bg-gray-50 transition-colors" onClick={() => setIsDialogOpen(false)}>Discard Changes</Button>
                  <Button type="button" onClick={handleSubmit} disabled={isSubmitting} className="h-12 border border-amber-700 bg-amber-700 text-white rounded-none uppercase text-[10px] tracking-[0.2em] px-10 hover:bg-amber-800 transition-colors ml-2 shadow-xl shadow-amber-900/10 active:scale-95">
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Save Product
                  </Button>
               </DialogFooter>
             </DialogContent>
           </Dialog>
 
           {/* Delete Confirmation Dialog */}
           <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
             <DialogContent className="max-w-md p-0 rounded-none border-none overflow-hidden shadow-2xl">
               <div className="p-12 text-center space-y-6">
                  <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                     <AlertTriangle className="w-10 h-10 text-red-600" />
                  </div>
                  <h3 className="text-2xl font-serif text-gray-900">Delete Product</h3>
                  <p className="text-sm text-gray-500 font-light leading-relaxed">
                    You are about to permanently remove <span className="font-bold text-gray-900">"{deletingProduct?.name}"</span> from the catalog. This action cannot be undone.
                  </p>
               </div>
               <DialogFooter className="bg-gray-50 p-6 flex gap-3 sm:justify-center border-t border-gray-100">
                 <Button variant="outline" className="h-12 border-gray-300 text-gray-400 rounded-none uppercase text-[10px] tracking-[0.2em] px-8 hover:bg-gray-100" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                 <Button className="h-12 bg-red-700 hover:bg-red-800 text-white rounded-none uppercase text-[10px] tracking-[0.2em] px-8 transition-colors" onClick={handleDelete} disabled={isSubmitting}>
                   {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete Permanently'}
                 </Button>
               </DialogFooter>
             </DialogContent>
           </Dialog>
         </div>
       )
     }


