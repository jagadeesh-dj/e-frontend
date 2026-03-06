import { useState } from 'react'
import { 
  Plus, Pencil, Trash2, Search, Image, ChevronLeft, ChevronRight
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from '../../components/ui/dialog'
import { Label } from '../../components/ui/label'
import { addToast } from '../../store/slices/uiSlice'
import { useAppDispatch } from '../../store/hooks'

interface Category {
  id: string
  name: string
  slug: string
  image?: string
  product_count: number
  is_active: boolean
  created_at: string
}

const initialCategories: Category[] = [
  { id: '1', name: 'Electronics', slug: 'electronics', product_count: 45, is_active: true, created_at: '2024-01-15' },
  { id: '2', name: 'Fashion', slug: 'fashion', product_count: 32, is_active: true, created_at: '2024-02-20' },
  { id: '3', name: 'Home & Living', slug: 'home-living', product_count: 28, is_active: true, created_at: '2024-03-10' },
  { id: '4', name: 'Beauty', slug: 'beauty', product_count: 21, is_active: true, created_at: '2024-04-05' },
  { id: '5', name: 'Sports', slug: 'sports', product_count: 18, is_active: true, created_at: '2024-05-12' },
  { id: '6', name: 'Books', slug: 'books', product_count: 15, is_active: false, created_at: '2024-06-18' },
]

interface CategoryFormData {
  name: string
  slug: string
  image: string
}

const initialFormData: CategoryFormData = {
  name: '',
  slug: '',
  image: '',
}

export default function AdminCategories() {
  const dispatch = useAppDispatch()
  const [categories, setCategories] = useState(initialCategories)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [formData, setFormData] = useState<CategoryFormData>(initialFormData)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage)
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const newCategory = {
      id: editingCategory ? editingCategory.id : `cat-${Date.now()}`,
      name: formData.name,
      slug: formData.slug || generateSlug(formData.name),
      image: formData.image,
      product_count: editingCategory ? editingCategory.product_count : 0,
      is_active: true,
      created_at: editingCategory ? editingCategory.created_at : new Date().toISOString().split('T')[0],
    }

    if (editingCategory) {
      setCategories(categories.map(c => c.id === editingCategory.id ? { ...c, ...newCategory } : c))
      dispatch(addToast({ type: 'success', title: 'Category updated', message: 'Category has been updated successfully' }))
    } else {
      setCategories([newCategory, ...categories])
      dispatch(addToast({ type: 'success', title: 'Category created', message: 'Category has been added successfully' }))
    }
    setIsDialogOpen(false)
    setFormData(initialFormData)
    setEditingCategory(null)
  }

  const handleDelete = () => {
    if (!deletingCategory) return
    setCategories(categories.filter(c => c.id !== deletingCategory.id))
    dispatch(addToast({ type: 'success', title: 'Category deleted', message: 'Category has been deleted successfully' }))
    setIsDeleteDialogOpen(false)
    setDeletingCategory(null)
  }

  const toggleStatus = (category: Category) => {
    setCategories(categories.map(c => 
      c.id === category.id ? { ...c, is_active: !c.is_active } : c
    ))
    dispatch(addToast({ 
      type: 'success', 
      title: 'Category updated', 
      message: `Category is now ${category.is_active ? 'inactive' : 'active'}` 
    }))
  }

  const openEditDialog = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      image: category.image || '',
    })
    setIsDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingCategory(null)
    setFormData(initialFormData)
    setIsDialogOpen(true)
  }

  const handleNameChange = (name: string) => {
    setFormData({ 
      ...formData, 
      name, 
      slug: formData.slug || generateSlug(name) 
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-muted-foreground">Manage product categories</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Category</th>
                  <th className="text-left py-3 px-4 font-medium">Slug</th>
                  <th className="text-left py-3 px-4 font-medium">Products</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Created</th>
                  <th className="text-right py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCategories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      No categories found
                    </td>
                  </tr>
                ) : (
                  paginatedCategories.map((category) => (
                    <tr key={category.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                            {category.image ? (
                              <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Image className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <span className="font-medium">{category.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <code className="text-xs bg-muted px-2 py-1 rounded">{category.slug}</code>
                      </td>
                      <td className="py-3 px-4">{category.product_count}</td>
                      <td className="py-3 px-4">
                        <Badge 
                          variant={category.is_active ? 'success' : 'secondary'}
                          className="cursor-pointer"
                          onClick={() => toggleStatus(category)}
                        >
                          {category.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {category.created_at}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(category)}>
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredCategories.length)} of {filteredCategories.length} categories
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
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
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g., electronics"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingCategory ? 'Update Category' : 'Add Category'}
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
