import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Package, Plus, Pencil, Trash2, Search, Image, ChevronLeft, ChevronRight
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

interface ProductFormData {
  name: string
  description: string
  price: string
  stock: string
  category: string
  brand: string
  image_url: string
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
}

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
const DEFAULT_PAGE_SIZE = 7

const flattenCategoryOptions = (nodes: CategoryApi[], parentLabel = ''): CategoryOption[] =>
  nodes.flatMap((node) => {
    const label = parentLabel ? `${parentLabel} / ${node.name}` : node.name
    return [
      { name: node.name, label },
      ...flattenCategoryOptions(node.children || [], label),
    ]
  })

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
  const itemsPerPage = 10

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
    
    const newProduct = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      category: formData.category,
      brand: formData.brand,
      image_url: formData.image_url,
      images: [formData.image_url],
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your product inventory</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      <Card>
        <CardHeader>
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
        <CardContent>
          <div className="overflow-x-auto">
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="min-h-24 rounded-md border border-input bg-background px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
              <div className="grid grid-cols-2 gap-4">
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
              <div className="grid gap-2">
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
            <DialogFooter>
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
