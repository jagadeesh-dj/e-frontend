import { useEffect, useMemo, useState } from 'react'
import {
  Eye, EyeOff, FileSpreadsheet, FileText, Megaphone, Menu as MenuIcon,
  Pencil, Plus, Trash2, Settings
} from 'lucide-react'
import { Button } from '../../components/ui/button'
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
  const [activeTab, setActiveTab] = useState<'banners'|'menus'|'views'>('banners')
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
    if (rows.length === 0) return
    downloadCsv(name, rows)
    dispatch(addToast({ type: 'success', title: 'Export Generated', message: `${name} downloaded.` }))
  }

  // Common Dialog styling rules to overwrite the rounded dialog content
  const dialogContentClass = "w-[calc(100%-2rem)] max-w-lg p-0 bg-white border border-amber-900/10 rounded-none shadow-2xl"
  const dialogHeaderClass = "p-8 border-b border-gray-100 bg-[#faf9f6]"
  const dialogTitleClass = "font-serif text-3xl text-gray-900 tracking-tight"
  const dialogInputClass = "w-full rounded-none border-b border-gray-200 px-0 py-3 text-sm font-light bg-transparent focus:outline-none focus:border-amber-700 transition-colors shadow-none"
  const dialogLabelClass = "text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 mb-1 block"

  return (
    <div className="space-y-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between border-b border-gray-200/80 pb-6 gap-4">
        <div>
          <h1 className="text-4xl font-serif text-gray-900 mb-2">Marketing & CRM</h1>
          <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-gray-400 flex items-center gap-2">
             <Settings className="w-3 h-3" /> Promotions & Content Management
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-start gap-12">
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-48 shrink-0 flex gap-2 lg:flex-col border-b lg:border-b-0 border-gray-200 pb-4 lg:pb-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('banners')}
            className={`flex items-center gap-3 px-4 py-3 text-[10px] uppercase tracking-[0.2em] font-bold whitespace-nowrap transition-all border-l-2 ${activeTab === 'banners' ? 'border-amber-700 bg-gray-50 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50/50'}`}
          >
            <Megaphone className="w-4 h-4" /> Promo Banners
          </button>
          <button
            onClick={() => setActiveTab('menus')}
            className={`flex items-center gap-3 px-4 py-3 text-[10px] uppercase tracking-[0.2em] font-bold whitespace-nowrap transition-all border-l-2 ${activeTab === 'menus' ? 'border-amber-700 bg-gray-50 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50/50'}`}
          >
            <MenuIcon className="w-4 h-4" /> Site Menu
          </button>
          <button
            onClick={() => setActiveTab('views')}
            className={`flex items-center gap-3 px-4 py-3 text-[10px] uppercase tracking-[0.2em] font-bold whitespace-nowrap transition-all border-l-2 ${activeTab === 'views' ? 'border-amber-700 bg-gray-50 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50/50'}`}
          >
            <FileText className="w-4 h-4" /> Static Pages
          </button>
        </aside>

        {/* Content Area */}
        <div className="flex-1 w-full bg-white border border-gray-200">
          
          {/* BANNERS TAB */}
          {activeTab === 'banners' && (
             <>
               <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="max-w-md">
                    <h2 className="font-serif text-2xl text-gray-900 mb-1">Broadcast Configuration</h2>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Deploy and revoke promotional banners on the central stage.</p>
                  </div>
                  <div className="flex items-center gap-2">
                     <Button variant="outline" onClick={() => exportRows('crm_banners_export.csv', bannerRows)} className="h-9 px-4 bg-transparent border-gray-200 text-gray-900 rounded-none uppercase text-[10px] tracking-widest hover:bg-gray-50">
                        <FileSpreadsheet className="w-3 h-3 mr-2" /> Backup
                     </Button>
                     <Button onClick={() => { setEditingBanner(null); setBannerForm({ title: '', subtitle: '', image_url: '', cta_url: '', sort_order: 0, is_active: true }); setBannerDialogOpen(true) }} className="h-9 px-6 bg-amber-700 text-white hover:bg-amber-800 border-none rounded-none uppercase text-[10px] tracking-widest transition-colors font-bold shadow-lg shadow-amber-900/10">
                        <Plus className="w-3 h-3 mr-2" /> Create Banner
                     </Button>
                  </div>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-[#faf9f6]">
                       <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200">Creative Copy</th>
                       <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200 text-center">Hierarchy</th>
                       <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200 text-center">State</th>
                       <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200 text-right">Modifier</th>
                     </tr>
                   </thead>
                   <tbody>
                     {bannerRows.length === 0 ? <tr><td colSpan={4} className="py-12 text-center text-gray-400 font-serif">No active broadcasts.</td></tr> : bannerRows.map((item) => (
                       <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                         <td className="py-4 px-6">
                           <p className="font-serif text-lg text-gray-900">{item.title}</p>
                           <p className="text-xs text-gray-500 font-light mt-1 max-w-sm truncate">{item.subtitle}</p>
                         </td>
                         <td className="py-4 px-6 text-center font-mono text-gray-500">{item.sort_order}</td>
                         <td className="py-4 px-6 text-center">
                           <span className={`text-[9px] uppercase tracking-widest px-2 py-1 font-bold border ${item.is_active ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-gray-200 text-gray-500 bg-white'}`}>
                             {item.is_active ? 'Active' : 'InActive'}
                           </span>
                         </td>
                         <td className="py-4 px-6 text-right">
                           <div className="flex items-center justify-end gap-1">
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-amber-800 rounded-none mix-blend-multiply" onClick={() => { setEditingBanner(item); setBannerForm({ title: item.title, subtitle: item.subtitle, image_url: item.image_url, cta_url: item.cta_url, sort_order: item.sort_order, is_active: item.is_active }); setBannerDialogOpen(true) }}><Pencil className="h-4 w-4" /></Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900 rounded-none" onClick={() => setBanners((prev) => prev.map((row) => row.id === item.id ? { ...row, is_active: !row.is_active } : row))}>{item.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-700 rounded-none" onClick={() => setBanners((prev) => prev.filter((row) => row.id !== item.id))}><Trash2 className="h-4 w-4" /></Button>
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </>
          )}

          {/* MENUS TAB */}
          {activeTab === 'menus' && (
             <>
               <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="max-w-md">
                    <h2 className="font-serif text-2xl text-gray-900 mb-1">Topography Configuration</h2>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Organize navigation nodes across the interface.</p>
                  </div>
                  <div className="flex items-center gap-2">
                     <Button variant="outline" onClick={() => exportRows('crm_menus_export.csv', menuRows)} className="h-9 px-4 bg-transparent border-gray-200 text-gray-900 rounded-none uppercase text-[10px] tracking-widest hover:bg-gray-50">
                        <FileSpreadsheet className="w-3 h-3 mr-2" /> Backup
                     </Button>
                     <Button onClick={() => { setEditingMenu(null); setMenuForm({ label: '', path: '', location: 'header', visibility: 'all', sort_order: 0, is_active: true }); setMenuDialogOpen(true) }} className="h-9 px-4 bg-amber-700 text-white hover:bg-amber-800 border-none rounded-none uppercase text-[10px] tracking-widest transition-colors font-bold">
                        <Plus className="w-3 h-3 mr-2" /> Add Node
                     </Button>
                  </div>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-[#faf9f6]">
                       <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200">Identifier</th>
                       <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200">Mount Point</th>
                       <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200 text-center">Zone</th>
                       <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200 text-center">State</th>
                       <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200 text-right">Modifier</th>
                     </tr>
                   </thead>
                   <tbody>
                     {menuRows.length === 0 ? <tr><td colSpan={5} className="py-12 text-center text-gray-400 font-serif">No nodes specified.</td></tr> : menuRows.map((item) => (
                       <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                         <td className="py-4 px-6 font-serif text-lg text-gray-900">{item.label}</td>
                         <td className="py-4 px-6 text-xs font-mono text-gray-500">{item.path}</td>
                         <td className="py-4 px-6 text-center">
                           <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-gray-600 border border-gray-200 px-2 py-1">{item.location}</span>
                         </td>
                         <td className="py-4 px-6 text-center">
                           <span className={`text-[9px] uppercase tracking-widest px-2 py-1 font-bold border ${item.is_active ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-gray-200 text-gray-500 bg-white'}`}>
                             {item.is_active ? 'Active' : 'InActive'}
                           </span>
                         </td>
                         <td className="py-4 px-6 text-right">
                           <div className="flex items-center justify-end gap-1">
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-amber-800 rounded-none mix-blend-multiply" onClick={() => { setEditingMenu(item); setMenuForm({ label: item.label, path: item.path, location: item.location, visibility: item.visibility, sort_order: item.sort_order, is_active: item.is_active }); setMenuDialogOpen(true) }}><Pencil className="h-4 w-4" /></Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900 rounded-none" onClick={() => setMenus((prev) => prev.map((row) => row.id === item.id ? { ...row, is_active: !row.is_active } : row))}>{item.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-700 rounded-none" onClick={() => setMenus((prev) => prev.filter((row) => row.id !== item.id))}><Trash2 className="h-4 w-4" /></Button>
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </>
          )}

          {/* VIEWS TAB */}
          {activeTab === 'views' && (
             <>
               <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="max-w-md">
                    <h2 className="font-serif text-2xl text-gray-900 mb-1">Exhibit Compilation</h2>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Generate static text-heavy informational pages.</p>
                  </div>
                  <div className="flex items-center gap-2">
                     <Button variant="outline" onClick={() => exportRows('crm_views_export.csv', viewRows)} className="h-9 px-4 bg-transparent border-gray-200 text-gray-900 rounded-none uppercase text-[10px] tracking-widest hover:bg-gray-50">
                        <FileSpreadsheet className="w-3 h-3 mr-2" /> Backup
                     </Button>
                     <Button onClick={() => { setEditingView(null); setViewForm({ name: '', slug: '', content: '', is_published: true }); setViewDialogOpen(true) }} className="h-9 px-4 bg-amber-700 text-white hover:bg-amber-800 border-none rounded-none uppercase text-[10px] tracking-widest transition-colors font-bold">
                        <Plus className="w-3 h-3 mr-2" /> Publish Exhibit
                     </Button>
                  </div>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-[#faf9f6]">
                       <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200">Title</th>
                       <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200">Permalink Ref</th>
                       <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200 text-center">State</th>
                       <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200 text-right">Modifier</th>
                     </tr>
                   </thead>
                   <tbody>
                     {viewRows.length === 0 ? <tr><td colSpan={4} className="py-12 text-center text-gray-400 font-serif">No exhibits online.</td></tr> : viewRows.map((item) => (
                       <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                         <td className="py-4 px-6 font-serif text-lg text-gray-900">{item.name}</td>
                         <td className="py-4 px-6 text-xs font-mono text-gray-500">/{item.slug}</td>
                         <td className="py-4 px-6 text-center">
                           <span className={`text-[9px] uppercase tracking-widest px-2 py-1 font-bold border ${item.is_published ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-gray-200 text-gray-500 bg-white'}`}>
                             {item.is_published ? 'Public' : 'Drafted'}
                           </span>
                         </td>
                         <td className="py-4 px-6 text-right">
                           <div className="flex items-center justify-end gap-1">
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-amber-800 rounded-none mix-blend-multiply" onClick={() => { setEditingView(item); setViewForm({ name: item.name, slug: item.slug, content: item.content, is_published: item.is_published }); setViewDialogOpen(true) }}><Pencil className="h-4 w-4" /></Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900 rounded-none" onClick={() => setViews((prev) => prev.map((row) => row.id === item.id ? { ...row, is_published: !row.is_published } : row))}>{item.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-700 rounded-none" onClick={() => setViews((prev) => prev.filter((row) => row.id !== item.id))}><Trash2 className="h-4 w-4" /></Button>
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </>
          )}

        </div>
      </div>

      {/* DIALOGS */}
      <Dialog open={bannerDialogOpen} onOpenChange={setBannerDialogOpen}>
        <DialogContent className={dialogContentClass}>
          <DialogHeader className={dialogHeaderClass}><DialogTitle className={dialogTitleClass}>{editingBanner ? 'Modulate Broadcast' : 'Issue Broadcast'}</DialogTitle></DialogHeader>
          <div className="grid max-h-[68vh] gap-5 overflow-y-auto p-6 bg-[#faf9f6]">
            <div><label className={dialogLabelClass}>Headline</label><input className={dialogInputClass} value={bannerForm.title} onChange={(e) => setBannerForm((prev) => ({ ...prev, title: e.target.value }))} /></div>
            <div><label className={dialogLabelClass}>Subtext</label><textarea className={dialogInputClass} rows={2} value={bannerForm.subtitle} onChange={(e) => setBannerForm((prev) => ({ ...prev, subtitle: e.target.value }))} /></div>
            <div><label className={dialogLabelClass}>Image URI</label><input className={dialogInputClass} value={bannerForm.image_url} onChange={(e) => setBannerForm((prev) => ({ ...prev, image_url: e.target.value }))} /></div>
            <div><label className={dialogLabelClass}>Target Endpoint</label><input className={dialogInputClass} value={bannerForm.cta_url} onChange={(e) => setBannerForm((prev) => ({ ...prev, cta_url: e.target.value }))} /></div>
            <div><label className={dialogLabelClass}>Hierarchy Score</label><input type="number" className={dialogInputClass} value={bannerForm.sort_order} onChange={(e) => setBannerForm((prev) => ({ ...prev, sort_order: Number(e.target.value || 0) }))} /></div>
          </div>
          <DialogFooter className="border-t border-gray-200 p-4 bg-white">
            <Button variant="outline" className="rounded-none uppercase text-[10px] font-bold tracking-widest border-gray-300" onClick={() => setBannerDialogOpen(false)}>Discard</Button>
            <Button className="rounded-none bg-amber-700 text-white hover:bg-amber-800 uppercase text-[10px] font-bold tracking-widest ml-2" onClick={() => { if (!bannerForm.title.trim()) return; const payload: BannerItem = { id: editingBanner?.id || createId('banner'), ...bannerForm }; setBanners((prev) => editingBanner ? prev.map((row) => row.id === editingBanner.id ? payload : row) : [payload, ...prev]); setBannerDialogOpen(false); dispatch(addToast({ type: 'success', title: 'Broadcast Configured', message: 'Parameters written successfully.' })) }}>Commit Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={menuDialogOpen} onOpenChange={setMenuDialogOpen}>
        <DialogContent className={dialogContentClass}>
          <DialogHeader className={dialogHeaderClass}><DialogTitle className={dialogTitleClass}>{editingMenu ? 'Relocate Node' : 'Establish Node'}</DialogTitle></DialogHeader>
          <div className="grid max-h-[68vh] gap-5 overflow-y-auto p-6 bg-[#faf9f6]">
            <div><label className={dialogLabelClass}>Designation</label><input className={dialogInputClass} value={menuForm.label} onChange={(e) => setMenuForm((prev) => ({ ...prev, label: e.target.value }))} /></div>
            <div><label className={dialogLabelClass}>Endpoint PATH</label><input className={dialogInputClass} value={menuForm.path} onChange={(e) => setMenuForm((prev) => ({ ...prev, path: e.target.value }))} /></div>
            <div><label className={dialogLabelClass}>Mount Zone</label>
               <select className={dialogInputClass} value={menuForm.location} onChange={(e) => setMenuForm((prev) => ({ ...prev, location: e.target.value as MenuLocation }))}>
                 <option value="header">Global Header</option>
                 <option value="footer">Global Footer</option>
                 <option value="mobile">Mobile Drawer</option>
               </select>
            </div>
            <div><label className={dialogLabelClass}>Exposure Level</label>
               <select className={dialogInputClass} value={menuForm.visibility} onChange={(e) => setMenuForm((prev) => ({ ...prev, visibility: e.target.value as MenuVisibility }))}>
                 <option value="all">Universal (All)</option>
                 <option value="guest">Unauthenticated Only</option>
                 <option value="authenticated">Patrons Only</option>
               </select>
            </div>
            <div><label className={dialogLabelClass}>Hierarchy Score</label><input type="number" className={dialogInputClass} value={menuForm.sort_order} onChange={(e) => setMenuForm((prev) => ({ ...prev, sort_order: Number(e.target.value || 0) }))} /></div>
          </div>
          <DialogFooter className="border-t border-gray-200 p-4 bg-white">
            <Button variant="outline" className="rounded-none uppercase text-[10px] font-bold tracking-widest border-gray-300" onClick={() => setMenuDialogOpen(false)}>Discard</Button>
            <Button className="rounded-none bg-amber-700 text-white hover:bg-amber-800 uppercase text-[10px] font-bold tracking-widest ml-2" onClick={() => { if (!menuForm.label.trim() || !menuForm.path.trim()) return; const payload: MenuItem = { id: editingMenu?.id || createId('menu'), ...menuForm }; setMenus((prev) => editingMenu ? prev.map((row) => row.id === editingMenu.id ? payload : row) : [payload, ...prev]); setMenuDialogOpen(false); dispatch(addToast({ type: 'success', title: 'Topography Updated', message: 'Node configured.' })) }}>Commit Route</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className={`w-[calc(100%-2rem)] max-w-2xl p-0 bg-white border border-amber-700/20 rounded-none shadow-2xl`}>
            <DialogHeader className={dialogHeaderClass}><DialogTitle className={dialogTitleClass}>{editingView ? 'Revise Exhibit' : 'Compile Exhibit'}</DialogTitle></DialogHeader>
            <div className="grid max-h-[68vh] gap-5 overflow-y-auto p-6 bg-[#faf9f6]">
              <div><label className={dialogLabelClass}>Exhibition Title</label><input className={dialogInputClass} value={viewForm.name} onChange={(e) => setViewForm((prev) => ({ ...prev, name: e.target.value, slug: prev.slug || slugify(e.target.value) }))} /></div>
              <div><label className={dialogLabelClass}>Namespace /slug</label><input className={dialogInputClass} value={viewForm.slug} onChange={(e) => setViewForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))} /></div>
              <div><label className={dialogLabelClass}>Render Body (Markdown/HTML)</label><textarea className={`${dialogInputClass} min-h-[300px] font-mono`} value={viewForm.content} onChange={(e) => setViewForm((prev) => ({ ...prev, content: e.target.value }))} /></div>
            </div>
            <DialogFooter className="border-t border-gray-200 p-4 bg-white">
              <Button variant="outline" className="rounded-none uppercase text-[10px] font-bold tracking-widest border-gray-300" onClick={() => setViewDialogOpen(false)}>Abandon</Button>
              <Button className="rounded-none bg-amber-700 text-white hover:bg-amber-800 uppercase text-[10px] font-bold tracking-widest ml-2" onClick={() => { if (!viewForm.name.trim() || !viewForm.slug.trim()) return; const payload: ViewItem = { id: editingView?.id || createId('view'), ...viewForm }; setViews((prev) => editingView ? prev.map((row) => row.id === editingView.id ? payload : row) : [payload, ...prev]); setViewDialogOpen(false); dispatch(addToast({ type: 'success', title: 'Exhibit Processed', message: 'Deployment synchronized.' })) }}>Force Build</Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  )
}
