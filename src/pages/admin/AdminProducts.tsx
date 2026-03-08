import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Package, Plus, Pencil, Trash2, Search, Image, ChevronLeft, ChevronRight, Upload, FileSpreadsheet, X
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from '../../components/ui/dialog'
import { Label } from '../../components/ui/label'
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '../../components/ui/select'
import { mockAdminProducts } from '../../data/mockData'
import { addToast } from '../../store/slices/uiSlice'
import { formatPrice } from '../../lib/utils'
import { useAppDispatch } from '../../store/hooks'
import api from '../../services/api'
import { handleApiError } from '../../utils/apiErrorHandler'
import { fileToBase64 } from '../../utils/fileToBase64'
import { Product, ProductVariant } from '../../types'
import { downloadCsv, getCsvField, parseCsv } from '../../utils/csv'

interface ProductVarietyForm {
  id: string
  name: string
  type: ProductVariant['type']
  value: string
  stock: string
}

interface ProductFormData {
  name: string
  description: string
  price: string
  stock: string
  category: string
  brand: string
  image_url: string
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
  name: string
  label: string
}

const initialFormData: ProductFormData = {
  name: '',
  description: '',
  price: '',
  stock: '',
  category: '',
  brand: '',
  image_url: '',
  varieties: [],
}

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
const DEFAULT_PAGE_SIZE = 6

const flattenCategoryOptions = (nodes: CategoryApi[], parentLabel = ''): CategoryOption[] =>
  nodes.flatMap((node) => {
    const label = parentLabel ? `${parentLabel} / ${node.name}` : node.name
    return [
      { name: node.name, label },
      ...flattenCategoryOptions(node.children || [], label),
    ]
  })

const createEmptyVariety = (): ProductVarietyForm => ({
  id: `var-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: '',
  type: 'size',
  value: '',
  stock: '0',
})

const parseVarietiesText = (value: string): ProductVariant[] => {
  const trimmed = value.trim()
  if (!trimmed) return []

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item) => item && typeof item === 'object')
          .map((item, index) => ({
            id: String(item.id || `var-${index + 1}`),
            name: String(item.name || item.type || 'Variant'),
            type: (item.type === 'color' || item.type === 'material' ? item.type : 'size') as ProductVariant['type'],
            value: String(item.value || ''),
            stock: Number(item.stock || 0),
          }))
      }
    } catch {
      return []
    }
  }

  return trimmed
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part, index) => {
      const [type = 'size', valuePart = '', stockPart = '0'] = part
        .split(/[|:]/)
        .map((token) => token.trim())

      return {
        id: `var-${index + 1}`,
        name: type || 'Variant',
        type: (type === 'color' || type === 'material' ? type : 'size') as ProductVariant['type'],
        value: valuePart,
        stock: Number(stockPart || 0),
      }
    })
    .filter((variant) => variant.value)
}

export default function AdminProducts() {
  const dispatch = useAppDispatch()
  const [products, setProducts] = useState(mockAdminProducts)
  const [apiCategories, setApiCategories] = useState<CategoryOption[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [formData, setFormData] = useState<ProductFormData>(initialFormData)
  const [editingProduct, setEditingProduct] = useState<typeof mockAdminProducts[0] | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<typeof mockAdminProducts[0] | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isCategoryLoading, setIsCategoryLoading] = useState(false)
  const [isBulkUploading, setIsBulkUploading] = useState(false)
  const bulkUploadInputRef = useRef<HTMLInputElement>(null)
  const itemsPerPage = DEFAULT_PAGE_SIZE

  useEffect(() => {
    const fetchCategories = async () => {
      setIsCategoryLoading(true)
      try {
        let page = 1
        let hasNext = true
        const collected: CategoryOption[] = []

        while (hasNext) {
          const response = await api.get<PaginatedApiResponse<CategoryApi[]>>('/categories/tree', {
            params: {
              page,
              page_size: DEFAULT_PAGE_SIZE,
            },
          })

          collected.push(...flattenCategoryOptions(response.data.data || []))
          hasNext = response.data.pagination?.has_next || false
          page += 1
        }

        const uniqueByName = new Map<string, string>()
        collected.forEach((category) => {
          if (!uniqueByName.has(category.name)) {
            uniqueByName.set(category.name, category.label)
          }
        })

        setApiCategories(
          Array.from(uniqueByName.entries()).map(([name, label]) => ({
            name,
            label,
          }))
        )
      } catch (error) {
        handleApiError(error, dispatch, 'Failed to fetch category menu')
      } finally {
        setIsCategoryLoading(false)
      }
    }

    void fetchCategories()
  }, [dispatch])

  const categoryOptions = useMemo(() => {
    if (apiCategories.length > 0) {
      return apiCategories
    }
    return [...new Set(products.map((product) => product.category).filter(Boolean))].map((name) => ({
      name,
      label: name,
    }))
  }, [apiCategories, products])

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const parsedVarieties: ProductVariant[] = formData.varieties
      .filter((variety) => variety.value.trim())
      .map((variety, index) => {
        const parsedStock = Number(variety.stock)
        return {
          id: variety.id || `var-${index + 1}`,
          name: variety.name.trim() || variety.type,
          type: variety.type,
          value: variety.value.trim(),
          stock: Number.isNaN(parsedStock) ? 0 : parsedStock,
        }
      })

    const newProduct = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      price: Number.isNaN(Number(formData.price)) ? 0 : Number(formData.price),
      stock: Number.isNaN(Number(formData.stock)) ? 0 : Number(formData.stock),
      category: formData.category,
      brand: formData.brand,
      image_url: formData.image_url,
      images: [formData.image_url],
      variants: parsedVarieties,
      rating: 0,
      reviewCount: 0,
      is_active: true,
      created_at: new Date().toISOString().split('T')[0],
    }

    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...newProduct } : p))
      dispatch(addToast({ type: 'success', title: 'Product updated', message: 'Product has been updated successfully' }))
    } else {
      setProducts([newProduct, ...products])
      dispatch(addToast({ type: 'success', title: 'Product created', message: 'Product has been added successfully' }))
    }
    setIsDialogOpen(false)
    setFormData(initialFormData)
    setEditingProduct(null)
  }

  const handleDelete = () => {
    if (!deletingProduct) return
    setProducts(products.filter(p => p.id !== deletingProduct.id))
    dispatch(addToast({ type: 'success', title: 'Product deleted', message: 'Product has been deleted successfully' }))
    setIsDeleteDialogOpen(false)
    setDeletingProduct(null)
  }

  const openEditDialog = (product: typeof mockAdminProducts[0]) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category || '',
      brand: product.brand || '',
      image_url: product.image_url || product.images?.[0] || '',
      varieties: (product.variants || []).map((variant) => ({
        id: variant.id,
        name: variant.name,
        type: variant.type,
        value: variant.value,
        stock: String(variant.stock),
      })),
    })
    setIsDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingProduct(null)
    setFormData(initialFormData)
    setIsDialogOpen(true)
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

  const handleVarietyChange = (
    index: number,
    field: keyof ProductVarietyForm,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      varieties: prev.varieties.map((variety, varietyIndex) =>
        varietyIndex === index ? { ...variety, [field]: value } : variety
      ),
    }))
  }

  const handleAddVariety = () => {
    setFormData((prev) => ({
      ...prev,
      varieties: [...prev.varieties, createEmptyVariety()],
    }))
  }

  const handleRemoveVariety = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      varieties: prev.varieties.filter((_, varietyIndex) => varietyIndex !== index),
    }))
  }

  const handleBulkUpload = async (file: File | undefined) => {
    if (!file) return

    setIsBulkUploading(true)
    try {
      const text = await file.text()
      const rowsToImport = parseCsv(text)

      if (rowsToImport.length === 0) {
        dispatch(
          addToast({
            type: 'error',
            title: 'Invalid CSV',
            message: 'No valid rows found in the uploaded file.',
          })
        )
        return
      }

      const uploadedProducts: Product[] = []

      rowsToImport.forEach((row, index) => {
        const name = getCsvField(row, 'name').trim()
        if (!name) return

        const price = Number(getCsvField(row, 'price').trim() || '0')
        const stock = Number(getCsvField(row, 'stock').trim() || '0')
        const imageUrl = getCsvField(row, 'image_url').trim()

        uploadedProducts.push({
          id: `bulk-prod-${Date.now()}-${index}`,
          name,
          description: getCsvField(row, 'description').trim() || 'Bulk uploaded product',
          price: Number.isNaN(price) ? 0 : price,
          stock: Number.isNaN(stock) ? 0 : stock,
          category: getCsvField(row, 'category').trim() || 'Uncategorized',
          brand: getCsvField(row, 'brand').trim() || '',
          image_url: imageUrl,
          images: [imageUrl || `https://picsum.photos/seed/bulk-${Date.now()}-${index}/400/400`],
          variants: parseVarietiesText(getCsvField(row, 'varieties')),
          rating: 0,
          reviewCount: 0,
          is_active: true,
          created_at: new Date().toISOString().split('T')[0],
        })
      })

      if (uploadedProducts.length === 0) {
        dispatch(
          addToast({
            type: 'error',
            title: 'Invalid CSV',
            message: 'No product rows with a valid name were found.',
          })
        )
        return
      }

      setProducts((prev) => [...uploadedProducts, ...prev])
      setCurrentPage(1)

      const skippedCount = rowsToImport.length - uploadedProducts.length
      dispatch(
        addToast({
          type: skippedCount > 0 ? 'warning' : 'success',
          title: 'Product bulk upload complete',
          message: `Imported ${uploadedProducts.length} products${skippedCount > 0 ? `, skipped ${skippedCount}` : ''}.`,
        })
      )
    } catch (error) {
      handleApiError(error, dispatch, 'Failed to process product bulk upload')
    } finally {
      setIsBulkUploading(false)
      if (bulkUploadInputRef.current) {
        bulkUploadInputRef.current.value = ''
      }
    }
  }

  const handleExportProducts = () => {
    if (filteredProducts.length === 0) {
      dispatch(
        addToast({
          type: 'info',
          title: 'No data to export',
          message: 'There are no products to export.',
        })
      )
      return
    }

    const exportRows = filteredProducts.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description || '',
      category: product.category || '',
      brand: product.brand || '',
      price: product.price,
      stock: product.stock,
      status: product.is_active !== false ? 'Active' : 'Inactive',
      varieties: JSON.stringify(product.variants || []),
      created_at: product.created_at || '',
    }))

    downloadCsv('products_export.csv', exportRows, [
      'id',
      'name',
      'description',
      'category',
      'brand',
      'price',
      'stock',
      'status',
      'varieties',
      'created_at',
    ])

    dispatch(
      addToast({
        type: 'success',
        title: 'Export complete',
        message: 'Products exported successfully.',
      })
    )
  }

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
            accept=".csv,text/csv"
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
            <span className="hidden sm:inline">Export Excel</span>
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
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categoryOptions.map((category) => (
                  <SelectItem key={category.label} value={category.name}>
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
                  <th className="text-left py-3 px-4 font-medium">Category</th>
                  <th className="text-left py-3 px-4 font-medium">Brand</th>
                  <th className="text-left py-3 px-4 font-medium">Price</th>
                  <th className="text-left py-3 px-4 font-medium">Stock</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-right py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      No products found
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                            {product.image_url || product.images?.[0] ? (
                              <img 
                                src={product.image_url || product.images?.[0]} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Image className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium line-clamp-1">{product.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {product.description?.substring(0, 50)}...
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{product.category || 'N/A'}</Badge>
                      </td>
                      <td className="py-3 px-4">{product.brand || '-'}</td>
                      <td className="py-3 px-4 font-medium">{formatPrice(product.price)}</td>
                      <td className="py-3 px-4">
                        <span className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                          {product.stock}
                        </span>
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(p => p - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
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
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={currentPage === totalPages}
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
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2 xl:col-span-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="min-h-24 rounded-md border border-input bg-background px-3 py-2"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stock">Stock *</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.length === 0 ? (
                        <SelectItem value="no-categories" disabled>
                          {isCategoryLoading ? 'Loading categories...' : 'No categories available'}
                        </SelectItem>
                      ) : (
                        categoryOptions.map((category) => (
                          <SelectItem key={category.label} value={category.name}>
                            {category.label}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-3 xl:col-span-2">
                <div className="flex items-center justify-between">
                  <Label>Product Varieties</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddVariety}>
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Variety
                  </Button>
                </div>

                {formData.varieties.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No varieties added. You can add size/color/material options.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {formData.varieties.map((variety, index) => (
                      <div
                        key={variety.id}
                        className="grid grid-cols-1 sm:grid-cols-[1fr_130px_1fr_110px_auto] gap-2 items-end rounded-lg border p-3"
                      >
                        <div className="grid gap-1.5">
                          <Label className="text-xs text-muted-foreground">Label</Label>
                          <Input
                            value={variety.name}
                            onChange={(e) => handleVarietyChange(index, 'name', e.target.value)}
                            placeholder="e.g. Size Small"
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label className="text-xs text-muted-foreground">Type</Label>
                          <Select
                            value={variety.type}
                            onValueChange={(value) =>
                              handleVarietyChange(index, 'type', value as ProductVariant['type'])
                            }
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
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label className="text-xs text-muted-foreground">Stock</Label>
                          <Input
                            type="number"
                            min="0"
                            value={variety.stock}
                            onChange={(e) => handleVarietyChange(index, 'stock', e.target.value)}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveVariety(index)}
                          aria-label="Remove variety"
                        >
                          <X className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
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
              <Button type="submit">
                {editingProduct ? 'Update Product' : 'Add Product'}
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
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

