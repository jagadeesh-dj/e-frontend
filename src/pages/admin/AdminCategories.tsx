import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Plus, Pencil, Trash2, Search, Image as ImageIcon, ChevronLeft, ChevronRight,
  ChevronDown, Loader2, Upload, FileSpreadsheet, Tag
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog'
import { addToast } from '../../store/slices/uiSlice'
import { useAppDispatch } from '../../store/hooks'
import api from '../../services/api'
import { ApiResponse } from '../../types'
import { handleApiError } from '../../utils/apiErrorHandler'
import { fileToBase64 } from '../../utils/fileToBase64'
import { downloadCsv } from '../../utils/csv'

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
  uid: string
  name: string
  slug: string
  description?: string | null
  image_url?: string | null
  is_active?: boolean
  sort_order?: number | null
  parent_uid?: string | null
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
  parent_uid: string
}

interface CategoryParent {
  uid: string
  name: string
  slug: string
}

const DEFAULT_PAGE_SIZE = 8
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

const initialFormData: CategoryFormData = {
  name: '',
  slug: '',
  description: '',
  sort_order: '0',
  image_url: '',
  parent_uid: 'none',
}

const initialPagination: PaginationMeta = {
  page: 1,
  page_size: DEFAULT_PAGE_SIZE,
  total: 0,
  total_pages: 0,
  has_next: false,
  has_prev: false,
}

const flattenTreeForOptions = (nodes: CategoryTreeNode[], level = 0, parentName?: string): CategoryRow[] => {
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

const flattenTreeForTable = (nodes: CategoryTreeNode[], expandedCategoryUids: Set<string>, forceExpandAll: boolean, level = 0, parentName?: string): CategoryRow[] => {
  const rows: CategoryRow[] = []
  for (const node of nodes) {
    const children = node.children || []
    const hasChildren = children.length > 0
    const isExpanded = forceExpandAll || expandedCategoryUids.has(node.uid)

    rows.push({
      ...node,
      is_active: node.is_active ?? true,
      level,
      parent_name: parentName,
      has_children: hasChildren,
    })

    if (hasChildren && isExpanded) {
      rows.push(...flattenTreeForTable(children, expandedCategoryUids, forceExpandAll, level + 1, node.name))
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
  const [expandedCategoryUids, setExpandedCategoryUids] = useState<Set<string>>(new Set())
  const [parentSearchQuery, setParentSearchQuery] = useState('')
  const [availableParents, setAvailableParents] = useState<CategoryParent[]>([])
  const [isParentsLoading, setIsParentsLoading] = useState(false)
  const [parentPagination, setParentPagination] = useState<PaginationMeta>(initialPagination)
  const [parentCurrentPage, setParentCurrentPage] = useState(1)
  const [isParentDropdownOpen, setIsParentDropdownOpen] = useState(false)
  const [parentInputDisplay, setParentInputDisplay] = useState('')
  const bulkUploadInputRef = useRef<HTMLInputElement>(null)

  const allCategoryRows = useMemo(() => flattenTreeForOptions(categoryTree), [categoryTree])
  const isSearchActive = searchQuery.trim().length > 0
  const rows = useMemo(() => flattenTreeForTable(categoryTree, expandedCategoryUids, isSearchActive), [categoryTree, expandedCategoryUids, isSearchActive])

  const selectedParentName = useMemo(() => {
    if (formData.parent_uid === 'none') return 'TOP LEVEL'
    const found = availableParents.find(p => p.uid === formData.parent_uid)
    if (found) return found.name
    if (editingCategory && editingCategory.parent_name && editingCategory.parent_uid === formData.parent_uid) return editingCategory.parent_name
    return 'Select Parent...'
  }, [formData.parent_uid, availableParents, editingCategory])

  useEffect(() => {
    if (!isParentDropdownOpen) {
      setParentInputDisplay(selectedParentName === 'Select Parent...' ? '' : selectedParentName)
    }
  }, [selectedParentName, isParentDropdownOpen])

  const loadCategories = useCallback(async (page: number, search: string) => {
    setIsLoading(true)
    try {
      const params: { page: number; page_size: number; search?: string } = { page, page_size: DEFAULT_PAGE_SIZE }
      const trimmedSearch = search.trim()
      if (trimmedSearch) params.search = trimmedSearch

      const response = await api.get<PaginatedApiResponse<CategoryTreeNode[]>>('/categories/tree', { params })
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
  }, [dispatch])

  useEffect(() => {
    const timer = window.setTimeout(() => loadCategories(currentPage, searchQuery), 300)
    return () => window.clearTimeout(timer)
  }, [currentPage, searchQuery, loadCategories])

  const loadParents = useCallback(async (page: number, search: string) => {
    setIsParentsLoading(true)
    try {
      const params = { page, page_size: 10, search: search.trim() || undefined }
      const response = await api.get<PaginatedApiResponse<CategoryParent[]>>('/categories/parent-category', { params })
      setAvailableParents(response.data.data || [])
      setParentPagination(response.data.pagination || initialPagination)
    } catch (error) {
      console.error('Failed to load parent categories:', error)
    } finally {
      setIsParentsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isParentDropdownOpen) {
      const timer = window.setTimeout(() => loadParents(parentCurrentPage, parentSearchQuery), 300)
      return () => window.clearTimeout(timer)
    }
  }, [parentCurrentPage, parentSearchQuery, loadParents, isParentDropdownOpen])

  const generateSlug = (name: string) => name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const resetDialogState = () => {
    setFormData(initialFormData)
    setEditingCategory(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const parentUid = formData.parent_uid === 'none' ? null : formData.parent_uid
    const payload = {
      name: formData.name.trim(),
      slug: (formData.slug || generateSlug(formData.name)).trim(),
      description: formData.description.trim() || null,
      sort_order: Number.isNaN(Number(formData.sort_order)) ? 0 : Number(formData.sort_order),
      image_url: formData.image_url || null,
      parent_uid: parentUid,
    }

    try {
      if (editingCategory) {
        await api.put<ApiResponse<CategoryTreeNode>>(`/categories/${editingCategory.uid}`, payload)
        dispatch(addToast({ type: 'success', title: 'Category Updated', message: 'Category details have been successfully modified.' }))
      } else {
        await api.post<ApiResponse<CategoryTreeNode>>('/categories/', payload)
        dispatch(addToast({ type: 'success', title: 'Category Created', message: 'New category has been successfully created.' }))
      }
      await loadCategories(currentPage, searchQuery)
      setIsDialogOpen(false)
      resetDialogState()
    } catch (error) {
      handleApiError(error, dispatch, 'Update Failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingCategory) return
    setIsSubmitting(true)
    try {
      await api.delete(`/categories/uid/${deletingCategory.uid}`)
      dispatch(addToast({ type: 'success', title: 'Category Deleted', message: 'Category has been permanently removed.' }))
      await loadCategories(currentPage, searchQuery)
      setIsDeleteDialogOpen(false)
      setDeletingCategory(null)
    } catch (error) {
      handleApiError(error, dispatch, 'Deletion Failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleStatus = async (category: CategoryRow) => {
    try {
      await api.put<ApiResponse<CategoryTreeNode>>(`/categories/${category.uid}`, { is_active: !category.is_active })
      await loadCategories(currentPage, searchQuery)
      dispatch(addToast({ type: 'success', title: 'Status Updated', message: `Category is now ${category.is_active ? 'inactive' : 'active'}` }))
    } catch (error) {
      handleApiError(error, dispatch, 'Failed to update status')
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
      parent_uid: category.parent_uid ? category.parent_uid : 'none',
    })
    setIsDialogOpen(true)
    setIsParentDropdownOpen(false)
    setParentSearchQuery('')
    setParentCurrentPage(1)
    setParentInputDisplay(category.parent_name || '')
  }

  const handleBulkUpload = async (file: File | undefined) => {
    if (!file) return
    setIsBulkUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await api.post<ApiResponse<{ count?: number }>>('/categories/category-bulk-upload', formData)
      if (!response.data.success) {
        dispatch(addToast({ type: 'error', title: 'Import Failed', message: response.data.message || 'The data structure is invalid.' }))
        return
      }
      await loadCategories(currentPage, searchQuery)
      dispatch(addToast({ type: 'success', title: 'Bulk Import Complete', message: `Successfully imported ${response.data.data?.count || 0} categories.` }))
    } catch (error) {
      handleApiError(error, dispatch, 'Upload interrupted')
    } finally {
      setIsBulkUploading(false)
      if (bulkUploadInputRef.current) bulkUploadInputRef.current.value = ''
    }
  }

  const handleExportCategories = () => {
    if (allCategoryRows.length === 0) return
    const exportRows = allCategoryRows.map((category) => ({
      uid: category.uid, name: category.name, slug: category.slug, description: category.description || '',
      sort_order: category.sort_order ?? 0, parent_uid: category.parent_uid ?? '', parent_name: category.parent_name || '',
      level: category.level, status: category.is_active ? 'Active' : 'Inactive',
      created_at: category.created_at ? new Date(category.created_at).toLocaleDateString() : '',
    }))
    downloadCsv('taxonomy_tree_export.csv', exportRows, ['uid', 'name', 'slug', 'description', 'sort_order', 'parent_uid', 'parent_name', 'level', 'status', 'created_at'])
    dispatch(addToast({ type: 'success', title: 'Export Complete', message: 'Category list exported successfully.' }))
  }

  const handleImageUpload = async (file: File | undefined) => {
    if (!file) return
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
       dispatch(addToast({ type: 'error', title: 'Asset Error', message: 'Payload exceeds 5MB limit.' }))
       return
    }
    try {
       const base64 = await fileToBase64(file)
       setFormData((prev) => ({ ...prev, image_url: base64 }))
    } catch (error) {
       handleApiError(error, dispatch, 'Failed to encode asset')
    }
  }

  const dialogContentClass = "w-[calc(100%-2rem)] max-w-2xl p-0 bg-white border border-amber-900/10 rounded-none shadow-2xl"
  const dialogHeaderClass = "p-8 border-b border-gray-100 bg-[#faf9f6]"
  const dialogTitleClass = "font-serif text-3xl text-gray-900 tracking-tight"
  const dialogInputClass = "w-full rounded-none border-b border-gray-200 px-0 py-3 text-sm font-light bg-transparent focus:outline-none focus:border-amber-700 transition-colors shadow-none"
  const dialogLabelClass = "text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 mb-1 block"

  return (
    <div className="space-y-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between border-b border-gray-200/80 pb-6 gap-4">
        <div>
          <h1 className="text-4xl font-serif text-gray-900 mb-2">Categories</h1>
          <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-gray-400 flex items-center gap-2">
             <Tag className="w-3 h-3" /> Product Categories & Hierarchy
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
           <input ref={bulkUploadInputRef} type="file" accept=".csv,.xls,.xlsx" className="hidden" onChange={(e) => void handleBulkUpload(e.target.files?.[0])} />
           <Button variant="outline" onClick={() => bulkUploadInputRef.current?.click()} disabled={isBulkUploading} className="h-10 px-4 bg-transparent border-gray-200 text-gray-900 rounded-none uppercase text-[10px] tracking-widest hover:bg-gray-50">
             {isBulkUploading ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Upload className="w-3 h-3 sm:mr-2" />}
             <span className="hidden sm:inline">Import</span>
           </Button>
           <Button variant="outline" onClick={handleExportCategories} className="h-10 px-4 bg-transparent border-gray-200 text-gray-900 rounded-none uppercase text-[10px] tracking-widest hover:bg-gray-50">
             <FileSpreadsheet className="w-3 h-3 sm:mr-2" />
             <span className="hidden sm:inline">Export</span>
           </Button>
           <Button onClick={() => { resetDialogState(); setIsDialogOpen(true); }} className="h-10 px-6 bg-amber-700 text-white rounded-none uppercase text-[10px] tracking-[0.2em] hover:bg-amber-800 transition-colors">
             <Plus className="w-3 h-3 mr-2" /> Add Category
           </Button>
        </div>
      </div>

      <div className="bg-white border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
           <div className="relative w-full sm:max-w-md flex items-center border-b border-gray-300 focus-within:border-amber-700 transition-colors pb-1">
             <Search className="w-4 h-4 text-gray-400 absolute left-0" />
             <input
               type="search"
               placeholder="Search categories..."
               value={searchQuery}
               onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
               className="w-full bg-transparent border-none pl-8 pr-4 h-8 text-sm font-light focus:outline-none focus:ring-0 placeholder:text-gray-400"
             />
           </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#faf9f6]">
                <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200">Category Name</th>
                <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200">Slug</th>
                <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200 text-center">Type</th>
                <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200 text-center">Status</th>
                <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="py-16 text-center text-gray-400 font-serif text-lg">No categories found.</td></tr>
              ) : (
                rows.map((category) => {
                  const isExpanded = isSearchActive || expandedCategoryUids.has(category.uid);
                  return (
                   <tr key={category.uid} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                     <td className="py-4 px-6">
                       <div className="flex items-center gap-3" style={{ paddingLeft: `${category.level * 24}px` }}>
                         {category.has_children ? (
                           <button onClick={() => setExpandedCategoryUids(prev => { const next = new Set(prev); if(next.has(category.uid)) next.delete(category.uid); else next.add(category.uid); return next; })} disabled={isSearchActive} className={`p-1.5 border ${isExpanded ? 'border-amber-700 bg-amber-700 text-white' : 'border-gray-300 text-gray-500 bg-white hover:border-amber-700'} transition-colors disabled:opacity-50`}>
                             {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                           </button>
                         ) : (
                           <span className="w-[26px] h-6 inline-block" />
                         )}
                         <div className="w-10 h-10 border border-gray-200 bg-gray-100 flex items-center justify-center shrink-0">
                           {category.image_url ? <img src={category.image_url} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-4 h-4 text-gray-400" />}
                         </div>
                         <div>
                           <p className="font-serif text-gray-900 text-lg leading-tight">{category.name}</p>
                           {category.parent_name && <p className="text-[9px] uppercase tracking-widest text-gray-400 mt-1 flex items-center gap-1">↳ Parent: {category.parent_name}</p>}
                         </div>
                       </div>
                     </td>
                     <td className="py-4 px-6">
                        <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 border border-gray-200">/{category.slug}</span>
                     </td>
                     <td className="py-4 px-6 text-center">
                        <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-gray-600 border border-gray-200 px-2 py-1">
                          {category.level === 0 ? 'Category' : 'Sub-Category'}
                        </span>
                     </td>
                     <td className="py-4 px-6 text-center">
                        <span onClick={() => void toggleStatus(category)} className={`cursor-pointer text-[9px] uppercase tracking-widest px-2 py-1 font-bold border ${category.is_active ? 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100' : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50'} transition-colors`}>
                           {category.is_active ? 'Active' : 'InActive'}
                        </span>
                     </td>
                     <td className="py-4 px-6 text-right">
                       <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-amber-800 rounded-none mix-blend-multiply" onClick={() => openEditDialog(category)}><Pencil className="w-4 h-4" /></Button>
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-700 rounded-none" onClick={() => { setDeletingCategory(category); setIsDeleteDialogOpen(true); }}><Trash2 className="w-4 h-4" /></Button>
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
            <div className="uppercase tracking-widest">
              Categories {(pagination.page - 1) * pagination.page_size + 1} - {Math.min(pagination.page * pagination.page_size, pagination.total)} of {pagination.total}
            </div>
            <div className="flex items-center gap-1 font-sans">
              <button onClick={() => setCurrentPage(p => p - 1)} disabled={!pagination.has_prev} className="w-8 h-8 flex items-center justify-center text-gray-500 disabled:opacity-30 hover:bg-white border border-transparent hover:border-gray-200 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).filter(p => Math.abs(currentPage - p) <= 2).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 flex items-center justify-center font-bold text-xs border transition-colors ${currentPage === page ? 'bg-amber-700 text-white border-amber-700' : 'bg-transparent text-gray-500 border-transparent hover:border-gray-200 hover:bg-white'}`}
                >
                  {page}
                </button>
              ))}
              <button onClick={() => setCurrentPage(p => p + 1)} disabled={!pagination.has_next} className="w-8 h-8 flex items-center justify-center text-gray-500 disabled:opacity-30 hover:bg-white border border-transparent hover:border-gray-200 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={dialogContentClass}>
          <DialogHeader className={dialogHeaderClass}><DialogTitle className={dialogTitleClass}>{editingCategory ? 'Edit Category Details' : 'Create New Category'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="grid gap-5 max-h-[68vh] overflow-y-auto no-scrollbar p-6 bg-[#faf9f6]">
               <div className="grid sm:grid-cols-2 gap-5">
                 <div><label className={dialogLabelClass}>Category Name *</label><input required className={dialogInputClass} value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value, slug: p.slug || generateSlug(e.target.value) }))} /></div>
                 <div><label className={dialogLabelClass}>Category Slug</label><input className={dialogInputClass} value={formData.slug} onChange={(e) => setFormData(p => ({ ...p, slug: e.target.value }))} /></div>
               </div>
               <div className="grid sm:grid-cols-2 gap-5">
                 <div className="relative">
                   <label className={dialogLabelClass}>Parent Category</label>
                   <div className="relative flex items-center pb-1">
                     <Search className="w-3 h-3 text-gray-400 absolute left-0 z-10" />
                     <input
                       className={`${dialogInputClass} pl-6 cursor-text`}
                       placeholder="Search to select parent..."
                       value={parentInputDisplay}
                       onFocus={() => setIsParentDropdownOpen(true)}
                       onChange={(e) => {
                         setParentInputDisplay(e.target.value)
                         setParentSearchQuery(e.target.value)
                         setParentCurrentPage(1)
                       }}
                     />
                     <ChevronDown 
                       className={`w-4 h-4 text-gray-400 absolute right-0 cursor-pointer transition-transform ${isParentDropdownOpen ? 'rotate-180' : ''}`}
                       onClick={() => setIsParentDropdownOpen(!isParentDropdownOpen)}
                     />
                   </div>

                   {isParentDropdownOpen && (
                     <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 shadow-xl animate-in fade-in slide-in-from-top-1 duration-200">
                       <div className="max-h-60 overflow-y-auto no-scrollbar">
                         <div 
                           className={`px-4 py-2 text-xs cursor-pointer hover:bg-amber-50 transition-colors ${formData.parent_uid === 'none' ? 'bg-amber-50 font-bold text-amber-900' : 'text-gray-700'}`}
                           onClick={() => { 
                             setFormData(p => ({ ...p, parent_uid: 'none' })); 
                             setParentInputDisplay('TOP LEVEL');
                             setIsParentDropdownOpen(false); 
                           }}
                         >
                           -- TOP LEVEL --
                         </div>
                         
                         {isParentsLoading && availableParents.length === 0 ? (
                           <div className="px-4 py-8 text-center text-[10px] text-gray-400 uppercase tracking-widest">
                             <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                             Loading Parents...
                           </div>
                         ) : availableParents.length === 0 ? (
                           <div className="px-4 py-8 text-center text-[10px] text-gray-400 uppercase tracking-widest">
                             No results found
                           </div>
                         ) : (
                           availableParents.map((parent) => (
                             <div
                               key={parent.uid}
                               className={`px-4 py-2 text-xs cursor-pointer hover:bg-amber-50 transition-colors ${formData.parent_uid === parent.uid ? 'bg-amber-50 font-bold text-amber-900' : 'text-gray-700'} ${editingCategory?.uid === parent.uid ? 'opacity-50 pointer-events-none' : ''}`}
                               onClick={() => {
                                 setFormData(p => ({ ...p, parent_uid: parent.uid }));
                                 setParentInputDisplay(parent.name);
                                 setIsParentDropdownOpen(false);
                               }}
                             >
                               <div className="flex flex-col">
                                 <span>{parent.name}</span>
                                 <span className="text-[10px] text-gray-400">/{parent.slug}</span>
                               </div>
                             </div>
                           ))
                         )}
                       </div>

                       {parentPagination.total_pages > 1 && (
                         <div className="p-2 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                           <Button
                             type="button"
                             variant="ghost"
                             size="sm"
                             className="h-7 px-2 text-[10px] uppercase tracking-widest disabled:opacity-30"
                             disabled={!parentPagination.has_prev || isParentsLoading}
                             onClick={(e) => { e.stopPropagation(); setParentCurrentPage(p => p - 1); }}
                           >
                             Prev
                           </Button>
                           <span className="text-[9px] uppercase tracking-tighter text-gray-400 font-bold">
                             Page {parentCurrentPage} of {parentPagination.total_pages}
                           </span>
                           <Button
                             type="button"
                             variant="ghost"
                             size="sm"
                             className="h-7 px-2 text-[10px] uppercase tracking-widest disabled:opacity-30"
                             disabled={!parentPagination.has_next || isParentsLoading}
                             onClick={(e) => { e.stopPropagation(); setParentCurrentPage(p => p + 1); }}
                           >
                             Next
                           </Button>
                         </div>
                       )}
                     </div>
                   )}
                 </div>
                 <div><label className={dialogLabelClass}>Sort Order</label><input type="number" className={dialogInputClass} value={formData.sort_order} onChange={(e) => setFormData(p => ({ ...p, sort_order: e.target.value }))} /></div>
               </div>
               <div><label className={dialogLabelClass}>Description</label><textarea className={dialogInputClass} rows={3} value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} /></div>
               <div>
                  <label className={dialogLabelClass}>Category Image</label>
                  <div className="flex items-center gap-4">
                     <div className="w-20 h-20 border border-gray-300 bg-white flex items-center justify-center overflow-hidden">
                       {formData.image_url ? <img src={formData.image_url} alt="" className="w-full h-full object-cover grayscale opacity-80" /> : <ImageIcon className="w-6 h-6 text-gray-300" />}
                     </div>
                     <div className="flex-1">
                       <label className="cursor-pointer">
                         <span className="bg-amber-700 hover:bg-amber-800 transition-colors text-white uppercase tracking-widest text-[10px] font-bold px-4 py-2 block w-max">Upload Image</span>
                         <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e.target.files?.[0])} />
                       </label>
                       <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-2">Maximum file size: 5MB.</p>
                     </div>
                  </div>
               </div>
            </div>
            <DialogFooter className="border-t border-gray-200 p-4 bg-white">
              <Button type="button" variant="outline" className="rounded-none uppercase text-[10px] font-bold tracking-widest border-gray-300" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-none bg-amber-700 text-white hover:bg-amber-800 uppercase text-[10px] font-bold tracking-widest ml-2">
                {isSubmitting ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : null} Save Category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className={dialogContentClass}>
          <DialogHeader className={dialogHeaderClass}><DialogTitle className={dialogTitleClass}>Confirm Deletion</DialogTitle></DialogHeader>
          <div className="p-6 bg-[#faf9f6]">
            <p className="text-gray-600 font-serif text-lg leading-relaxed">Are you sure you want to delete "<span className="font-bold text-gray-900">{deletingCategory?.name}</span>"? This action cannot be undone and all sub-categories will also be deleted.</p>
          </div>
          <DialogFooter className="border-t border-gray-200 p-4 bg-white">
            <Button variant="outline" className="rounded-none uppercase text-[10px] font-bold tracking-widest border-gray-300" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" className="rounded-none bg-red-700 text-white hover:bg-red-900 uppercase text-[10px] font-bold tracking-widest ml-2" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : 'Delete Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
