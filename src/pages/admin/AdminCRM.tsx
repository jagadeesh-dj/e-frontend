import { useEffect, useMemo, useState } from 'react'
import {
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  Megaphone,
  Menu as MenuIcon,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { useAppDispatch } from '../../store/hooks'
import { addToast } from '../../store/slices/uiSlice'
import { downloadCsv } from '../../utils/csv'

type MenuLocation = 'header' | 'footer' | 'mobile'
type MenuVisibility = 'all' | 'guest' | 'authenticated'

type BannerItem = {
  id: string
  title: string
  subtitle: string
  image_url: string
  cta_url: string
  sort_order: number
  is_active: boolean
}

type MenuItem = {
  id: string
  label: string
  path: string
  location: MenuLocation
  visibility: MenuVisibility
  sort_order: number
  is_active: boolean
}

type ViewItem = {
  id: string
  name: string
  slug: string
  content: string
  is_published: boolean
}

const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const slugify = (value: string) => value.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

const loadSaved = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

const save = <T,>(key: string, value: T) => localStorage.setItem(key, JSON.stringify(value))

const BANNER_KEY = 'admin_crm_banners_v1'
const MENU_KEY = 'admin_crm_menus_v1'
const VIEW_KEY = 'admin_crm_views_v1'

export default function AdminCRM() {
  const dispatch = useAppDispatch()
  const [banners, setBanners] = useState<BannerItem[]>(() =>
    loadSaved(BANNER_KEY, [{ id: createId('banner'), title: 'Main Promo', subtitle: 'Homepage promo banner', image_url: '', cta_url: '/products', sort_order: 1, is_active: true }])
  )
  const [menus, setMenus] = useState<MenuItem[]>(() =>
    loadSaved(MENU_KEY, [{ id: createId('menu'), label: 'New Arrivals', path: '/products?sort=newest', location: 'header', visibility: 'all', sort_order: 1, is_active: true }])
  )
  const [views, setViews] = useState<ViewItem[]>(() =>
    loadSaved(VIEW_KEY, [{ id: createId('view'), name: 'About Us', slug: 'about', content: 'Managed by CRM', is_published: true }])
  )

  const [bannerDialogOpen, setBannerDialogOpen] = useState(false)
  const [menuDialogOpen, setMenuDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null)
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null)
  const [editingView, setEditingView] = useState<ViewItem | null>(null)
  const [bannerForm, setBannerForm] = useState<Omit<BannerItem, 'id'>>({ title: '', subtitle: '', image_url: '', cta_url: '', sort_order: 0, is_active: true })
  const [menuForm, setMenuForm] = useState<Omit<MenuItem, 'id'>>({ label: '', path: '', location: 'header', visibility: 'all', sort_order: 0, is_active: true })
  const [viewForm, setViewForm] = useState<Omit<ViewItem, 'id'>>({ name: '', slug: '', content: '', is_published: true })

  useEffect(() => save(BANNER_KEY, banners), [banners])
  useEffect(() => save(MENU_KEY, menus), [menus])
  useEffect(() => save(VIEW_KEY, views), [views])

  const bannerRows = useMemo(() => [...banners].sort((a, b) => a.sort_order - b.sort_order), [banners])
  const menuRows = useMemo(() => [...menus].sort((a, b) => a.sort_order - b.sort_order), [menus])
  const viewRows = useMemo(() => [...views].sort((a, b) => a.slug.localeCompare(b.slug)), [views])

  const exportRows = (name: string, rows: Array<Record<string, unknown>>) => {
    if (rows.length === 0) {
      dispatch(addToast({ type: 'info', title: 'No data', message: 'Nothing to export.' }))
      return
    }
    downloadCsv(name, rows)
    dispatch(addToast({ type: 'success', title: 'Export complete', message: `${name} exported.` }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">CRM Management</h1>
        <p className="text-muted-foreground">Manage banners, menus, and CMS views from admin panel.</p>
      </div>

      <Tabs defaultValue="banners">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="banners" className="gap-2"><Megaphone className="h-4 w-4" />Banners</TabsTrigger>
          <TabsTrigger value="menus" className="gap-2"><MenuIcon className="h-4 w-4" />Menus</TabsTrigger>
          <TabsTrigger value="views" className="gap-2"><FileText className="h-4 w-4" />Views</TabsTrigger>
        </TabsList>

        <TabsContent value="banners">
          <Card className="card-premium">
            <CardHeader className="px-6 py-5">
              <div className="flex items-center justify-between">
                <CardTitle>Banners</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="h-10 w-10 p-0 sm:w-auto sm:px-4" onClick={() => exportRows('crm_banners_export.csv', bannerRows)} aria-label="Export banners"><FileSpreadsheet className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Export</span></Button>
                  <Button className="h-10 w-10 p-0 sm:w-auto sm:px-4" onClick={() => { setEditingBanner(null); setBannerForm({ title: '', subtitle: '', image_url: '', cta_url: '', sort_order: 0, is_active: true }); setBannerDialogOpen(true) }} aria-label="Add banner"><Plus className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Add Banner</span></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              <div className="table-shell">
                <table className="w-full">
                  <thead><tr className="border-b"><th className="px-4 py-3 text-left">Title</th><th className="px-4 py-3 text-left">Order</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
                  <tbody>
                    {bannerRows.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-muted/40">
                        <td className="px-4 py-3"><p className="font-medium">{item.title}</p><p className="text-xs text-muted-foreground line-clamp-1">{item.subtitle}</p></td>
                        <td className="px-4 py-3">{item.sort_order}</td>
                        <td className="px-4 py-3"><Badge variant={item.is_active ? 'success' : 'secondary'}>{item.is_active ? 'Active' : 'Inactive'}</Badge></td>
                        <td className="px-4 py-3"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" onClick={() => { setEditingBanner(item); setBannerForm({ title: item.title, subtitle: item.subtitle, image_url: item.image_url, cta_url: item.cta_url, sort_order: item.sort_order, is_active: item.is_active }); setBannerDialogOpen(true) }}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => setBanners((prev) => prev.map((row) => row.id === item.id ? { ...row, is_active: !row.is_active } : row))}>{item.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button><Button variant="ghost" size="icon" onClick={() => setBanners((prev) => prev.filter((row) => row.id !== item.id))}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="menus">
          <Card className="card-premium">
            <CardHeader className="px-6 py-5">
              <div className="flex items-center justify-between">
                <CardTitle>Menus</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="h-10 w-10 p-0 sm:w-auto sm:px-4" onClick={() => exportRows('crm_menus_export.csv', menuRows)} aria-label="Export menus"><FileSpreadsheet className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Export</span></Button>
                  <Button className="h-10 w-10 p-0 sm:w-auto sm:px-4" onClick={() => { setEditingMenu(null); setMenuForm({ label: '', path: '', location: 'header', visibility: 'all', sort_order: 0, is_active: true }); setMenuDialogOpen(true) }} aria-label="Add menu"><Plus className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Add Menu</span></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              <div className="table-shell">
                <table className="w-full">
                  <thead><tr className="border-b"><th className="px-4 py-3 text-left">Label</th><th className="px-4 py-3 text-left">Path</th><th className="px-4 py-3 text-left">Location</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
                  <tbody>
                    {menuRows.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-muted/40">
                        <td className="px-4 py-3 font-medium">{item.label}</td>
                        <td className="px-4 py-3">{item.path}</td>
                        <td className="px-4 py-3 capitalize">{item.location}</td>
                        <td className="px-4 py-3"><Badge variant={item.is_active ? 'success' : 'secondary'}>{item.is_active ? 'Active' : 'Inactive'}</Badge></td>
                        <td className="px-4 py-3"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" onClick={() => { setEditingMenu(item); setMenuForm({ label: item.label, path: item.path, location: item.location, visibility: item.visibility, sort_order: item.sort_order, is_active: item.is_active }); setMenuDialogOpen(true) }}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => setMenus((prev) => prev.map((row) => row.id === item.id ? { ...row, is_active: !row.is_active } : row))}>{item.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button><Button variant="ghost" size="icon" onClick={() => setMenus((prev) => prev.filter((row) => row.id !== item.id))}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="views">
          <Card className="card-premium">
            <CardHeader className="px-6 py-5">
              <div className="flex items-center justify-between">
                <CardTitle>Views</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="h-10 w-10 p-0 sm:w-auto sm:px-4" onClick={() => exportRows('crm_views_export.csv', viewRows)} aria-label="Export views"><FileSpreadsheet className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Export</span></Button>
                  <Button className="h-10 w-10 p-0 sm:w-auto sm:px-4" onClick={() => { setEditingView(null); setViewForm({ name: '', slug: '', content: '', is_published: true }); setViewDialogOpen(true) }} aria-label="Add view"><Plus className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Add View</span></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              <div className="table-shell">
                <table className="w-full">
                  <thead><tr className="border-b"><th className="px-4 py-3 text-left">Name</th><th className="px-4 py-3 text-left">Slug</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
                  <tbody>
                    {viewRows.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-muted/40">
                        <td className="px-4 py-3 font-medium">{item.name}</td>
                        <td className="px-4 py-3">{item.slug}</td>
                        <td className="px-4 py-3"><Badge variant={item.is_published ? 'success' : 'secondary'}>{item.is_published ? 'Published' : 'Draft'}</Badge></td>
                        <td className="px-4 py-3"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" onClick={() => { setEditingView(item); setViewForm({ name: item.name, slug: item.slug, content: item.content, is_published: item.is_published }); setViewDialogOpen(true) }}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => setViews((prev) => prev.map((row) => row.id === item.id ? { ...row, is_published: !row.is_published } : row))}>{item.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button><Button variant="ghost" size="icon" onClick={() => setViews((prev) => prev.filter((row) => row.id !== item.id))}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={bannerDialogOpen} onOpenChange={setBannerDialogOpen}>
        <DialogContent className="w-[calc(100%-1rem)] sm:w-full max-w-xl p-0 overflow-hidden">
          <DialogHeader className="border-b px-6 py-5"><DialogTitle>{editingBanner ? 'Edit Banner' : 'Add Banner'}</DialogTitle></DialogHeader>
          <div className="grid max-h-[68vh] gap-3 overflow-y-auto px-6 py-5">
            <div className="grid gap-1.5"><Label>Title</Label><Input value={bannerForm.title} onChange={(e) => setBannerForm((prev) => ({ ...prev, title: e.target.value }))} /></div>
            <div className="grid gap-1.5"><Label>Subtitle</Label><Textarea rows={2} value={bannerForm.subtitle} onChange={(e) => setBannerForm((prev) => ({ ...prev, subtitle: e.target.value }))} /></div>
            <div className="grid gap-1.5"><Label>Image URL</Label><Input value={bannerForm.image_url} onChange={(e) => setBannerForm((prev) => ({ ...prev, image_url: e.target.value }))} /></div>
            <div className="grid gap-1.5"><Label>CTA URL</Label><Input value={bannerForm.cta_url} onChange={(e) => setBannerForm((prev) => ({ ...prev, cta_url: e.target.value }))} /></div>
            <div className="grid gap-1.5"><Label>Sort Order</Label><Input type="number" value={bannerForm.sort_order} onChange={(e) => setBannerForm((prev) => ({ ...prev, sort_order: Number(e.target.value || 0) }))} /></div>
          </div>
          <DialogFooter className="border-t px-6 py-4">
            <Button variant="outline" onClick={() => setBannerDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => { if (!bannerForm.title.trim()) return; const payload: BannerItem = { id: editingBanner?.id || createId('banner'), ...bannerForm }; setBanners((prev) => editingBanner ? prev.map((row) => row.id === editingBanner.id ? payload : row) : [payload, ...prev]); setBannerDialogOpen(false); dispatch(addToast({ type: 'success', title: 'Saved', message: 'Banner saved.' })) }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={menuDialogOpen} onOpenChange={setMenuDialogOpen}>
        <DialogContent className="w-[calc(100%-1rem)] sm:w-full max-w-xl p-0 overflow-hidden">
          <DialogHeader className="border-b px-6 py-5"><DialogTitle>{editingMenu ? 'Edit Menu' : 'Add Menu'}</DialogTitle></DialogHeader>
          <div className="grid max-h-[68vh] gap-3 overflow-y-auto px-6 py-5">
            <div className="grid gap-1.5"><Label>Label</Label><Input value={menuForm.label} onChange={(e) => setMenuForm((prev) => ({ ...prev, label: e.target.value }))} /></div>
            <div className="grid gap-1.5"><Label>Path</Label><Input value={menuForm.path} onChange={(e) => setMenuForm((prev) => ({ ...prev, path: e.target.value }))} /></div>
            <div className="grid gap-1.5"><Label>Location</Label><Select value={menuForm.location} onValueChange={(value) => setMenuForm((prev) => ({ ...prev, location: value as MenuLocation }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="header">Header</SelectItem><SelectItem value="footer">Footer</SelectItem><SelectItem value="mobile">Mobile</SelectItem></SelectContent></Select></div>
            <div className="grid gap-1.5"><Label>Visibility</Label><Select value={menuForm.visibility} onValueChange={(value) => setMenuForm((prev) => ({ ...prev, visibility: value as MenuVisibility }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="guest">Guest</SelectItem><SelectItem value="authenticated">Authenticated</SelectItem></SelectContent></Select></div>
            <div className="grid gap-1.5"><Label>Sort Order</Label><Input type="number" value={menuForm.sort_order} onChange={(e) => setMenuForm((prev) => ({ ...prev, sort_order: Number(e.target.value || 0) }))} /></div>
          </div>
          <DialogFooter className="border-t px-6 py-4">
            <Button variant="outline" onClick={() => setMenuDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => { if (!menuForm.label.trim() || !menuForm.path.trim()) return; const payload: MenuItem = { id: editingMenu?.id || createId('menu'), ...menuForm }; setMenus((prev) => editingMenu ? prev.map((row) => row.id === editingMenu.id ? payload : row) : [payload, ...prev]); setMenuDialogOpen(false); dispatch(addToast({ type: 'success', title: 'Saved', message: 'Menu saved.' })) }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="w-[calc(100%-1rem)] sm:w-full max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="border-b px-6 py-5"><DialogTitle>{editingView ? 'Edit View' : 'Add View'}</DialogTitle></DialogHeader>
          <div className="grid max-h-[68vh] gap-3 overflow-y-auto px-6 py-5">
            <div className="grid gap-1.5"><Label>Name</Label><Input value={viewForm.name} onChange={(e) => setViewForm((prev) => ({ ...prev, name: e.target.value, slug: prev.slug || slugify(e.target.value) }))} /></div>
            <div className="grid gap-1.5"><Label>Slug</Label><Input value={viewForm.slug} onChange={(e) => setViewForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))} /></div>
            <div className="grid gap-1.5"><Label>Content</Label><Textarea rows={6} value={viewForm.content} onChange={(e) => setViewForm((prev) => ({ ...prev, content: e.target.value }))} /></div>
          </div>
          <DialogFooter className="border-t px-6 py-4">
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => { if (!viewForm.name.trim() || !viewForm.slug.trim()) return; const payload: ViewItem = { id: editingView?.id || createId('view'), ...viewForm }; setViews((prev) => editingView ? prev.map((row) => row.id === editingView.id ? payload : row) : [payload, ...prev]); setViewDialogOpen(false); dispatch(addToast({ type: 'success', title: 'Saved', message: 'View saved.' })) }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
