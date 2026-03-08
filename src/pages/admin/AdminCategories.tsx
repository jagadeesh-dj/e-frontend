import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Image,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  Upload,
  FileSpreadsheet,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { addToast } from '../../store/slices/uiSlice'
import { useAppDispatch } from '../../store/hooks'
import api from '../../services/api'
import { ApiResponse } from '../../types'
import { handleApiError } from '../../utils/apiErrorHandler'
import { fileToBase64 } from '../../utils/fileToBase64'
import { downloadCsv, getCsvField, parseCsv } from '../../utils/csv'

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

interface CategoryTreeNode {
  id: number
  name: string
  slug: string
  description?: string | null
  image_url?: string | null
  is_active?: boolean
  sort_order?: number | null
  parent_id?: number | null
  created_at?: string
  children?: CategoryTreeNode[]
}

interface CategoryRow extends Omit<CategoryTreeNode, 'children'> {
  level: number
  parent_name?: string
  has_children: boolean
}

interface CategoryFormData {
  name: string
  slug: string
  description: string
  sort_order: string
  image_url: string
  parent_id: string
}

const DEFAULT_PAGE_SIZE = 6
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

const initialFormData: CategoryFormData = {
  name: '',
  slug: '',
  description: '',
  sort_order: '0',
  image_url: '',
  parent_id: 'none',
}

const initialPagination: PaginationMeta = {
  page: 1,
  page_size: DEFAULT_PAGE_SIZE,
  total: 0,
  total_pages: 0,
  has_next: false,
  has_prev: false,
}

const flattenTreeForOptions = (
  nodes: CategoryTreeNode[],
  level = 0,
  parentName?: string
): CategoryRow[] => {
  const rows: CategoryRow[] = []

  for (const node of nodes) {
    const children = node.children || []
    rows.push({
      ...node,
      is_active: node.is_active ?? true,
      level,
      parent_name: parentName,
      has_children: children.length > 0,
    })
    rows.push(...flattenTreeForOptions(children, level + 1, node.name))
  }

  return rows
}

const flattenTreeForTable = (
  nodes: CategoryTreeNode[],
  expandedCategoryIds: Set<number>,
  forceExpandAll: boolean,
  level = 0,
  parentName?: string
): CategoryRow[] => {
  const rows: CategoryRow[] = []

  for (const node of nodes) {
    const children = node.children || []
    const hasChildren = children.length > 0
    const isExpanded = forceExpandAll || expandedCategoryIds.has(node.id)

    rows.push({
      ...node,
      is_active: node.is_active ?? true,
      level,
      parent_name: parentName,
      has_children: hasChildren,
    })

    if (hasChildren && isExpanded) {
      rows.push(
        ...flattenTreeForTable(children, expandedCategoryIds, forceExpandAll, level + 1, node.name)
      )
    }
  }

  return rows
}

export default function AdminCategories() {
  const dispatch = useAppDispatch()
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>([])
  const [pagination, setPagination] = useState<PaginationMeta>(initialPagination)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [formData, setFormData] = useState<CategoryFormData>(initialFormData)
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<CategoryRow | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isBulkUploading, setIsBulkUploading] = useState(false)
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<number>>(new Set())
  const bulkUploadInputRef = useRef<HTMLInputElement>(null)

  const parentOptions = useMemo(() => flattenTreeForOptions(categoryTree), [categoryTree])
  const allCategoryRows = useMemo(() => flattenTreeForOptions(categoryTree), [categoryTree])
  const isSearchActive = searchQuery.trim().length > 0
  const rows = useMemo(
    () => flattenTreeForTable(categoryTree, expandedCategoryIds, isSearchActive),
    [categoryTree, expandedCategoryIds, isSearchActive]
  )

  const loadCategories = useCallback(
    async (page: number, search: string) => {
      setIsLoading(true)
      try {
        const params: { page: number; page_size: number; search?: string } = {
          page,
          page_size: DEFAULT_PAGE_SIZE,
        }
        const trimmedSearch = search.trim()
        if (trimmedSearch) {
          params.search = trimmedSearch
        }

        const response = await api.get<PaginatedApiResponse<CategoryTreeNode[]>>('/categories/tree', {
          params,
        })
        const tree = response.data.data || []
        const meta = response.data.pagination || initialPagination

        if (meta.total_pages > 0 && page > meta.total_pages) {
          setCurrentPage(meta.total_pages)
          return
        }

        setCategoryTree(tree)
        setPagination(meta)
      } catch (error) {
        handleApiError(error, dispatch, 'Failed to load categories')
      } finally {
        setIsLoading(false)
      }
    },
    [dispatch]
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCategories(currentPage, searchQuery)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [currentPage, searchQuery, loadCategories])

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

  const resetDialogState = () => {
    setFormData(initialFormData)
    setEditingCategory(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const parentId = formData.parent_id === 'none' ? null : Number(formData.parent_id)
    const payload = {
      name: formData.name.trim(),
      slug: (formData.slug || generateSlug(formData.name)).trim(),
      description: formData.description.trim() || null,
      sort_order: Number.isNaN(Number(formData.sort_order))
        ? 0
        : Number(formData.sort_order),
      image_url: formData.image_url || null,
      parent_id: typeof parentId === 'number' && !Number.isNaN(parentId) ? parentId : null,
    }

    try {
      if (editingCategory) {
        await api.put<ApiResponse<CategoryTreeNode>>(`/categories/${editingCategory.id}`, payload)
        dispatch(
          addToast({
            type: 'success',
            title: 'Category updated',
            message: 'Category has been updated successfully',
          })
        )
      } else {
        await api.post<ApiResponse<CategoryTreeNode>>('/categories/', payload)
        dispatch(
          addToast({
            type: 'success',
            title: 'Category created',
            message: 'Category has been added successfully',
          })
        )
      }

      await loadCategories(currentPage, searchQuery)
      setIsDialogOpen(false)
      resetDialogState()
    } catch (error) {
      handleApiError(error, dispatch, 'Failed to save category')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingCategory) return

    setIsSubmitting(true)
    try {
      await api.delete(`/categories/${deletingCategory.id}`)
      dispatch(
        addToast({
          type: 'success',
          title: 'Category deleted',
          message: 'Category has been deleted successfully',
        })
      )

      await loadCategories(currentPage, searchQuery)
      setIsDeleteDialogOpen(false)
      setDeletingCategory(null)
    } catch (error) {
      handleApiError(error, dispatch, 'Failed to delete category')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleStatus = async (category: CategoryRow) => {
    try {
      await api.put<ApiResponse<CategoryTreeNode>>(`/categories/${category.id}`, {
        is_active: !category.is_active,
      })
      await loadCategories(currentPage, searchQuery)
      dispatch(
        addToast({
          type: 'success',
          title: 'Category updated',
          message: `Category is now ${category.is_active ? 'inactive' : 'active'}`,
        })
      )
    } catch (error) {
      handleApiError(error, dispatch, 'Failed to update category status')
    }
  }

  const openEditDialog = (category: CategoryRow) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      sort_order: String(category.sort_order ?? 0),
      image_url: category.image_url || '',
      parent_id: category.parent_id ? String(category.parent_id) : 'none',
    })
    setIsDialogOpen(true)
  }

  const openCreateDialog = () => {
    resetDialogState()
    setIsDialogOpen(true)
  }

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name),
    }))
  }

  const toggleCategoryExpansion = (categoryId: number) => {
    setExpandedCategoryIds((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
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

      let createdCount = 0
      let failedCount = 0

      for (const row of rowsToImport) {
        const name = getCsvField(row, 'name').trim()
        if (!name) {
          failedCount += 1
          continue
        }

        const parentValue = getCsvField(row, 'parent_id').trim()
        const parsedParentId = Number(parentValue)
        const sortOrderValue = Number(getCsvField(row, 'sort_order').trim() || '0')

        const payload = {
          name,
          slug: getCsvField(row, 'slug').trim() || generateSlug(name),
          description: getCsvField(row, 'description').trim() || null,
          sort_order: Number.isNaN(sortOrderValue) ? 0 : sortOrderValue,
          image_url: getCsvField(row, 'image_url').trim() || null,
          parent_id:
            parentValue && parentValue.toLowerCase() !== 'none' && !Number.isNaN(parsedParentId)
              ? parsedParentId
              : null,
        }

        try {
          await api.post<ApiResponse<CategoryTreeNode>>('/categories/', payload)
          createdCount += 1
        } catch {
          failedCount += 1
        }
      }

      await loadCategories(currentPage, searchQuery)
      dispatch(
        addToast({
          type: failedCount > 0 ? 'warning' : 'success',
          title: 'Category bulk upload complete',
          message: `Created ${createdCount} categories${failedCount > 0 ? `, failed ${failedCount}` : ''}.`,
        })
      )
    } catch (error) {
      handleApiError(error, dispatch, 'Failed to process bulk upload file')
    } finally {
      setIsBulkUploading(false)
      if (bulkUploadInputRef.current) {
        bulkUploadInputRef.current.value = ''
      }
    }
  }

  const handleExportCategories = () => {
    if (allCategoryRows.length === 0) {
      dispatch(
        addToast({
          type: 'info',
          title: 'No data to export',
          message: 'There are no categories to export.',
        })
      )
      return
    }

    const exportRows = allCategoryRows.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      sort_order: category.sort_order ?? 0,
      parent_id: category.parent_id ?? '',
      parent_name: category.parent_name || '',
      level: category.level,
      status: category.is_active ? 'Active' : 'Inactive',
      created_at: category.created_at ? new Date(category.created_at).toLocaleDateString() : '',
    }))

    downloadCsv('categories_export.csv', exportRows, [
      'id',
      'name',
      'slug',
      'description',
      'sort_order',
      'parent_id',
      'parent_name',
      'level',
      'status',
      'created_at',
    ])

    dispatch(
      addToast({
        type: 'success',
        title: 'Export complete',
        message: 'Categories exported successfully.',
      })
    )
  }

  const formatDate = (value?: string) => {
    if (!value) return '-'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value
    return parsed.toISOString().split('T')[0]
  }

  const pageStart = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.page_size + 1
  const pageEnd = Math.min(pagination.page * pagination.page_size, pagination.total)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-muted-foreground">Manage categories and subcategories</p>
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
            aria-label="Bulk upload categories"
          >
            {isBulkUploading ? (
              <Loader2 className="w-4 h-4 animate-spin sm:mr-2" />
            ) : (
              <Upload className="w-4 h-4 sm:mr-2" />
            )}
            <span className="hidden sm:inline">Bulk Upload</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleExportCategories}
            className="h-10 w-10 p-0 sm:w-auto sm:px-4"
            aria-label="Export categories"
          >
            <FileSpreadsheet className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Export Excel</span>
          </Button>
          <Button
            onClick={openCreateDialog}
            className="h-10 w-10 p-0 sm:w-auto sm:px-4"
            aria-label="Add category"
          >
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Add Category</span>
          </Button>
        </div>
      </div>

      <Card className="card-premium">
        <CardHeader className="px-6 py-5">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0">
          <div className="table-shell">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Category</th>
                  <th className="text-left py-3 px-4 font-medium">Slug</th>
                  <th className="text-left py-3 px-4 font-medium">Type</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Created</th>
                  <th className="text-right py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      <div className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading categories...
                      </div>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      No categories found
                    </td>
                  </tr>
                ) : (
                  rows.map((category) => {
                    const isExpanded = isSearchActive || expandedCategoryIds.has(category.id)
                    return (
                      <tr key={category.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div
                            className="flex items-center gap-3"
                            style={{ paddingLeft: `${category.level * 16}px` }}
                          >
                            {category.has_children ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 p-0"
                                onClick={() => toggleCategoryExpansion(category.id)}
                                disabled={isSearchActive}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </Button>
                            ) : (
                              <span className="w-6 h-6 inline-block" />
                            )}
                            <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                              {category.image_url ? (
                                <img
                                  src={category.image_url}
                                  alt={category.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Image className="w-5 h-5 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{category.name}</p>
                              {category.parent_name && (
                                <p className="text-xs text-muted-foreground">
                                  Parent: {category.parent_name}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <code className="text-xs bg-muted px-2 py-1 rounded">{category.slug}</code>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">
                            {category.level === 0 ? 'Category' : 'Subcategory'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={category.is_active ? 'success' : 'secondary'}
                            className="cursor-pointer"
                            onClick={() => void toggleStatus(category)}
                          >
                            {category.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {category.created_at ? new Date(category.created_at).toLocaleDateString() : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(category)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setDeletingCategory(category)
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
                Showing {pageStart} to {pageEnd} of {pagination.total} root categories
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((page) => page - 1)}
                  disabled={!pagination.has_prev}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, index) => {
                  let pageNum: number
                  if (pagination.total_pages <= 5) {
                    pageNum = index + 1
                  } else if (currentPage <= 3) {
                    pageNum = index + 1
                  } else if (currentPage >= pagination.total_pages - 2) {
                    pageNum = pagination.total_pages - 4 + index
                  } else {
                    pageNum = currentPage - 2 + index
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
                  onClick={() => setCurrentPage((page) => page + 1)}
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
        <DialogContent className="w-[calc(100%-1rem)] sm:w-full max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="border-b px-6 py-5">
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex max-h-[82vh] flex-col">
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Electronics"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder="e.g., electronics"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData((prev) => ({ ...prev, sort_order: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Short description for this category"
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="parent_id">Parent Category</Label>
                <Select
                  value={formData.parent_id}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, parent_id: value }))}
                >
                  <SelectTrigger id="parent_id">
                    <SelectValue placeholder="Select parent category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Top level)</SelectItem>
                    {parentOptions.map((category) => (
                      <SelectItem
                        key={category.id}
                        value={String(category.id)}
                        disabled={editingCategory?.id === category.id}
                      >
                        {`${'-- '.repeat(category.level)}${category.name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="image">Category Image (Upload)</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => void handleImageUpload(e.target.files?.[0])}
                />
                {formData.image_url && (
                  <div className="space-y-2">
                    <img
                      src={formData.image_url}
                      alt="Category preview"
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
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : editingCategory ? (
                  'Update Category'
                ) : (
                  'Add Category'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete "{deletingCategory?.name}"? This action cannot be undone.</p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleDelete()} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

