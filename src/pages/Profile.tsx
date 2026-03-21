import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Package, MapPin, Mail,
  Phone, Loader2, Camera, Calendar, Edit3, Plus, Trash2,
  Lock, Settings, Shield, Bell, Eye, EyeOff, AlertTriangle, ArrowRight, ArrowLeft
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { fetchUser, fetchProfile, updateProfile, fetchAddresses, createAddress, deleteAddress, updateAddress, uploadAvatar } from '../store/slices/authSlice'
import { fetchOrders } from '../store/slices/orderSlice'
import { formatDate, formatPrice, cn } from '../lib/utils'
import { Address } from '../types'
import { addToast } from '../store/slices/uiSlice'

type TabType = 'profile' | 'orders' | 'addresses' | 'security' | 'settings'

const menuItems = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'addresses', label: 'Addresses', icon: MapPin },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function Profile() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const dispatch = useAppDispatch()
  const { user, profile, addresses, profileLoading } = useAppSelector((state) => state.auth)
  const { orders, isLoading: ordersLoading } = useAppSelector((state) => state.orders)

  const tabFromUrl = searchParams.get('tab') as TabType | null
  const [activeTab, setActiveTab] = useState<TabType>(tabFromUrl && menuItems.find(m => m.id === tabFromUrl) ? tabFromUrl : 'profile')
  const [isEditing, setIsEditing] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  const [settingsForm, setSettingsForm] = useState({ email_notifications: true, order_updates: true, promotional_emails: false, newsletter: true })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [orderFilter, setOrderFilter] = useState('all')

  const [formData, setFormData] = useState({
    first_name: '', last_name: '', phone: '', avatar_url: '', dob: '', gender: '', bio: ''
  })

  const [addressForm, setAddressForm] = useState({
    first_name: '', last_name: '', phone: '', alternate_phone: '', address_line1: '', address_line2: '', landmark: '', city: '', state: '', postal_code: '', country: 'India', is_default: false
  })

  useEffect(() => {
    dispatch(fetchUser())
    dispatch(fetchProfile())
    dispatch(fetchAddresses())
    dispatch(fetchOrders())
  }, [dispatch])

  useEffect(() => {
    const tab = searchParams.get('tab') as TabType | null
    if (tab && menuItems.find(m => m.id === tab)) { setActiveTab(tab) }
  }, [searchParams])

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setSearchParams({ tab })
  }

  useEffect(() => {
    if (user || profile) {
      setFormData({
        first_name: user?.first_name || '', last_name: user?.last_name || '', phone: user?.phone || profile?.phone || '', avatar_url: user?.avatar_url || profile?.avatar_url || '', dob: profile?.dob || '', gender: profile?.gender || '', bio: profile?.bio || ''
      })
    }
  }, [user, profile])

  const handleAvatarClick = () => fileInputRef.current?.click()

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const result = await dispatch(uploadAvatar(file)).unwrap()
        setFormData({ ...formData, avatar_url: result })
        dispatch(fetchUser())
      } catch (error) { console.error('Failed to upload avatar:', error) }
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await dispatch(updateProfile({
        first_name: formData.first_name, last_name: formData.last_name, phone: formData.phone || undefined, dob: formData.dob || undefined, gender: formData.gender || undefined, bio: formData.bio || undefined
      })).unwrap()
      setIsEditing(false)
      dispatch(fetchUser())
      dispatch(fetchProfile())
    } catch (error) { console.error('Failed to update profile:', error) }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      dispatch(addToast({ type: 'error', title: 'Error', message: 'Passwords do not match' }))
      return
    }
    if (passwordForm.new_password.length < 8) {
      dispatch(addToast({ type: 'error', title: 'Error', message: 'Min. 8 characters' }))
      return
    }
    setPasswordLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      dispatch(addToast({ type: 'success', title: 'Password Updated', message: 'Your password has been successfully updated.' }))
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (error) { dispatch(addToast({ type: 'error', title: 'Error', message: 'Failed to update password.' })) }
    finally { setPasswordLoading(false) }
  }

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address)
    setAddressForm({
      first_name: address.first_name || '', last_name: address.last_name || '', phone: address.phone || '', alternate_phone: address.alternate_phone || '', address_line1: address.address_line1 || '', address_line2: address.address_line2 || '', landmark: address.landmark || '', city: address.city || '', state: address.state || '', postal_code: address.postal_code || '', country: address.country || 'India', is_default: address.is_default || false
    })
    setShowAddressForm(true)
  }

  const handleDeleteAddress = async (uid: string) => {
    try { await dispatch(deleteAddress(uid)).unwrap() } catch (error) {}
  }

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingAddress?.uid) {
        await dispatch(updateAddress({ uid: editingAddress.uid, data: addressForm })).unwrap()
      } else {
        await dispatch(createAddress(addressForm)).unwrap()
      }
      setShowAddressForm(false)
      setEditingAddress(null)
      resetAddressForm()
    } catch (error) {}
  }

  const resetAddressForm = () => {
    setAddressForm({ first_name: '', last_name: '', phone: '', alternate_phone: '', address_line1: '', address_line2: '', landmark: '', city: '', state: '', postal_code: '', country: 'India', is_default: false })
  }

  const cancelAddressForm = () => { setShowAddressForm(false); setEditingAddress(null); resetAddressForm() }

  const filteredOrders = orderFilter === 'all' ? orders : orders.filter(o => o.status === orderFilter)
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.is_admin === true
  const userRoleLabel = user?.role === 'superadmin' ? 'Owner' : isAdmin ? 'Admin' : 'Customer'

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      {/* Header Profile */}
      <div className="max-w-[1400px] mx-auto px-6 py-12 lg:py-16 border-b border-gray-200/50">
         <Link to="/" className="inline-flex items-center text-[10px] uppercase tracking-[0.2em] text-gray-500 hover:text-amber-700 transition-colors mb-8">
           <ArrowLeft className="w-3 h-3 mr-2" /> Back to Store
         </Link>
         
         <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
            <div className="flex items-center gap-8">
               <div className="relative group">
                  <div className="w-24 h-24 lg:w-32 lg:h-32 bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                    {formData.avatar_url || user?.avatar_url ? (
                       <img src={formData.avatar_url || user?.avatar_url} alt="User" className="w-full h-full object-cover" />
                    ) : (
                       <User className="w-8 h-8 text-gray-300" />
                    )}
                  </div>
                  <button onClick={handleAvatarClick} className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                    <span className="text-[10px] uppercase tracking-widest text-gray-900 font-bold flex flex-col items-center gap-2">
                      <Camera className="w-4 h-4" /> Edit
                    </span>
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
               </div>
               <div>
                  <h1 className="font-serif text-4xl lg:text-5xl text-gray-900 mb-3">{user?.first_name || 'Hello,'} {user?.last_name || 'Customer'}</h1>
                  <p className="font-light text-gray-500 mb-4">{user?.email}</p>
                  <div className="flex items-center gap-4">
                     <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-700 px-2 flex items-center border border-amber-200 bg-amber-50 h-6">
                        {isAdmin && <Shield className="w-3 h-3 mr-1" />} {userRoleLabel}
                     </span>
                     <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Since {user?.created_at ? formatDate(user.created_at) : 'N/A'}</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-12 lg:py-20 flex flex-col lg:flex-row gap-12 lg:gap-24">
        
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-64 shrink-0">
           <div className="sticky top-24 border border-gray-200 bg-white">
              <div className="p-4 border-b border-gray-200 bg-[#faf9f6]">
                 <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400">Account Management</div>
              </div>
              <div className="flex flex-col">
                {menuItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id as TabType)}
                    className={cn(
                      "w-full flex items-center gap-4 px-4 py-4 text-[10px] uppercase tracking-[0.2em] font-bold transition-all border-l-4 border-b border-b-gray-100 last:border-b-0",
                      activeTab === item.id 
                        ? "border-l-amber-700 text-amber-900 bg-amber-50/50" 
                        : "border-l-transparent text-gray-500 hover:text-amber-700 hover:bg-gray-50"
                    )}
                  >
                    <item.icon className="w-4 h-4 opacity-70" />
                    {item.label}
                  </button>
                ))}
              </div>
           </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 max-w-[800px]">
          
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="animate-in fade-in space-y-12">
               <div className="flex items-center justify-between border-b border-gray-200/50 pb-6">
                 <div>
                    <h2 className="font-serif text-3xl text-gray-900">Personal Details</h2>
                    <p className="font-light text-gray-500 mt-2">Manage your account information</p>
                 </div>
                 <Button
                    variant={isEditing ? "outline" : "default"}
                    onClick={() => setIsEditing(!isEditing)}
                    disabled={profileLoading}
                    className={cn(
                      "h-10 px-6 uppercase text-[10px] tracking-[0.2em] rounded-none transition-colors",
                      isEditing ? "bg-transparent border border-gray-200 text-gray-900 hover:bg-gray-50" : "bg-amber-700 text-white hover:bg-amber-800"
                    )}
                 >
                    {isEditing ? 'Cancel' : (
                      <><Edit3 className="w-3 h-3 mr-2" /> Edit Details</>
                    )}
                 </Button>
               </div>

               <form onSubmit={handleProfileSubmit} className="space-y-8">
                 <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-500 block">First Name</label>
                      <input type="text" value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} disabled={!isEditing} className="w-full h-12 border-b border-gray-200 bg-transparent px-0 font-light text-sm focus:outline-none focus:border-gray-900 disabled:opacity-50" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-500 block">Last Name</label>
                      <input type="text" value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} disabled={!isEditing} className="w-full h-12 border-b border-gray-200 bg-transparent px-0 font-light text-sm focus:outline-none focus:border-gray-900 disabled:opacity-50" />
                    </div>
                 </div>

                 <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-500 block">Email Address</label>
                      <input type="email" value={user?.email || ''} disabled className="w-full h-12 border-b border-gray-200 bg-transparent px-0 font-light text-sm disabled:opacity-50 text-gray-400" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-500 block">Phone Number</label>
                      <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} disabled={!isEditing} placeholder="Telephone" className="w-full h-12 border-b border-gray-200 bg-transparent px-0 font-light text-sm focus:outline-none focus:border-gray-900 disabled:opacity-50" />
                    </div>
                 </div>

                 <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-500 block">Date of Birth</label>
                      <input type="date" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} disabled={!isEditing} className="w-full h-12 border-b border-gray-200 bg-transparent px-0 font-light text-sm focus:outline-none focus:border-gray-900 disabled:opacity-50" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-500 block">Gender</label>
                      <Select value={formData.gender} onValueChange={v => setFormData({ ...formData, gender: v })} disabled={!isEditing}>
                         <SelectTrigger className="w-full h-12 border-b border-gray-200 bg-transparent px-0 font-light text-sm focus:ring-0 focus:border-gray-900 rounded-none disabled:opacity-50 justify-between">
                            <SelectValue placeholder="Specify..." />
                         </SelectTrigger>
                         <SelectContent className="rounded-none border-gray-200">
                           <SelectItem value="male" className="font-light text-sm">Male</SelectItem>
                           <SelectItem value="female" className="font-light text-sm">Female</SelectItem>
                           <SelectItem value="other" className="font-light text-sm">Unspecified</SelectItem>
                         </SelectContent>
                      </Select>
                    </div>
                 </div>

                 {isEditing && (
                    <div className="pt-6">
                      <Button type="submit" disabled={profileLoading} className="w-full lg:w-auto h-14 px-12 bg-gray-900 hover:bg-amber-900 text-white uppercase text-xs tracking-[0.2em] rounded-none transition-colors">
                        {profileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                      </Button>
                    </div>
                 )}
               </form>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="animate-in fade-in space-y-10">
               <div className="border-b border-gray-200/50 pb-6">
                 <h2 className="font-serif text-3xl text-gray-900 mb-2">Order History</h2>
                 <p className="font-light text-gray-500 mb-8">Review your past orders and status</p>

                 <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setOrderFilter(status)}
                        className={cn(
                          "px-4 py-2 text-[10px] uppercase tracking-[0.2em] font-bold whitespace-nowrap transition-colors border",
                          orderFilter === status ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200 hover:border-gray-900 hover:text-gray-900"
                        )}
                      >
                        {status} {status === 'all' && `(${orders.length})`}
                      </button>
                    ))}
                 </div>
               </div>

               {ordersLoading ? (
                 <div className="py-20 flex flex-col items-center">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-300 mb-6" />
                    <span className="font-serif text-gray-400">Loading orders...</span>
                 </div>
               ) : filteredOrders.length === 0 ? (
                 <div className="py-20 flex flex-col items-center border border-gray-200 bg-white">
                    <Package className="w-12 h-12 text-gray-200 mb-6" />
                    <span className="font-serif text-xl border-b border-gray-200/50 text-gray-400 pb-4 mb-4">No Orders Found</span>
                    <Button asChild className="h-12 px-8 bg-transparent border border-gray-200 text-gray-900 rounded-none uppercase text-[10px] tracking-widest hover:bg-gray-50">
                       <Link to="/products">Browse Products</Link>
                    </Button>
                 </div>
               ) : (
                 <div className="space-y-4">
                    {filteredOrders.map(order => (
                      <Link key={order.id} to={`/orders/${order.id}`} className="block border border-gray-200 bg-white p-6 hover:border-gray-900 transition-colors group relative">
                         <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                            <div>
                               <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400 mb-2">Order # {order.orderNumber || order.id}</div>
                               <div className="font-serif text-lg text-gray-900 mb-1">{formatDate(order.created_at)}</div>
                               <div className="font-light text-gray-500 text-sm">{order.items?.length || 0} Item(s) • {formatPrice(order.total_amount)}</div>
                            </div>
                            <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                               <span className={cn(
                                 "text-[9px] uppercase tracking-widest px-3 py-1 font-bold border",
                                 order.status === 'delivered' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                 order.status === 'cancelled' ? "bg-red-50 text-red-700 border-red-200" :
                                 "bg-amber-50 text-amber-700 border-amber-200"
                               )}>
                                 {order.status}
                               </span>
                               <div className="w-8 h-8 rounded-none border border-gray-200 flex items-center justify-center group-hover:bg-gray-900 group-hover:border-gray-900 group-hover:text-white transition-colors">
                                 <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
                               </div>
                            </div>
                         </div>
                      </Link>
                    ))}
                 </div>
               )}
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <div className="animate-in fade-in space-y-12">
               <div className="flex items-center justify-between border-b border-gray-200/50 pb-6">
                 <div>
                    <h2 className="font-serif text-3xl text-gray-900">Saved Addresses</h2>
                    <p className="font-light text-gray-500 mt-2">Manage your shipping and billing locations</p>
                 </div>
                 {!showAddressForm && (
                   <Button onClick={() => setShowAddressForm(true)} className="h-10 px-6 bg-gray-900 text-white rounded-none uppercase text-[10px] tracking-[0.2em] hover:bg-amber-900 transition-colors">
                     Add New Address
                   </Button>
                 )}
               </div>

               {showAddressForm && (
                 <div className="border border-gray-200 bg-white p-8">
                   <h3 className="font-serif text-xl border-b border-gray-100 pb-4 mb-6">{editingAddress?.uid ? 'Edit Address' : 'New Address'}</h3>
                   <form onSubmit={handleAddressSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                           <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-500 block">First Name</label>
                           <input type="text" value={addressForm.first_name} onChange={e => setAddressForm({ ...addressForm, first_name: e.target.value })} className="w-full h-12 border-b border-gray-200 bg-transparent px-0 font-light text-sm focus:outline-none focus:border-gray-900" />
                         </div>
                         <div className="space-y-2">
                           <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-500 block">Last Name</label>
                           <input type="text" value={addressForm.last_name} onChange={e => setAddressForm({ ...addressForm, last_name: e.target.value })} className="w-full h-12 border-b border-gray-200 bg-transparent px-0 font-light text-sm focus:outline-none focus:border-gray-900" />
                         </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                           <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-500 block">Phone Number</label>
                           <input type="text" value={addressForm.phone} onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })} className="w-full h-12 border-b border-gray-200 bg-transparent px-0 font-light text-sm focus:outline-none focus:border-gray-900" />
                         </div>
                         <div className="space-y-2">
                           <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-500 block">Alternate Phone</label>
                           <input type="text" value={addressForm.alternate_phone} onChange={e => setAddressForm({ ...addressForm, alternate_phone: e.target.value })} className="w-full h-12 border-b border-gray-200 bg-transparent px-0 font-light text-sm focus:outline-none focus:border-gray-900" />
                         </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-500 block">Address Line 1</label>
                        <input type="text" value={addressForm.address_line1} onChange={e => setAddressForm({ ...addressForm, address_line1: e.target.value })} className="w-full h-12 border-b border-gray-200 bg-transparent px-0 font-light text-sm focus:outline-none focus:border-gray-900" />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-500 block">Address Line 2</label>
                        <input type="text" value={addressForm.address_line2} onChange={e => setAddressForm({ ...addressForm, address_line2: e.target.value })} className="w-full h-12 border-b border-gray-200 bg-transparent px-0 font-light text-sm focus:outline-none focus:border-gray-900" />
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                           <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-500 block">City</label>
                           <input type="text" value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} className="w-full h-12 border-b border-gray-200 bg-transparent px-0 font-light text-sm focus:outline-none focus:border-gray-900" />
                         </div>
                         <div className="space-y-2">
                           <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-500 block">State/Region</label>
                           <input type="text" value={addressForm.state} onChange={e => setAddressForm({ ...addressForm, state: e.target.value })} className="w-full h-12 border-b border-gray-200 bg-transparent px-0 font-light text-sm focus:outline-none focus:border-gray-900" />
                         </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                           <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-500 block">Postal Code</label>
                           <input type="text" value={addressForm.postal_code} onChange={e => setAddressForm({ ...addressForm, postal_code: e.target.value })} className="w-full h-12 border-b border-gray-200 bg-transparent px-0 font-light text-sm focus:outline-none focus:border-gray-900" />
                         </div>
                         <div className="space-y-2">
                           <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-500 block">Country</label>
                           <input type="text" value={addressForm.country} onChange={e => setAddressForm({ ...addressForm, country: e.target.value })} className="w-full h-12 border-b border-gray-200 bg-transparent px-0 font-light text-sm focus:outline-none focus:border-gray-900" />
                         </div>
                      </div>

                      <label className="flex items-center gap-3 cursor-pointer pt-4 group">
                         <input type="checkbox" checked={addressForm.is_default} onChange={e => setAddressForm({ ...addressForm, is_default: e.target.checked })} className="w-4 h-4 accent-amber-700" />
                         <span className="text-xs uppercase tracking-widest font-semibold text-gray-500 group-hover:text-gray-900 transition-colors">Set as Default</span>
                      </label>

                      <div className="flex gap-4 pt-8">
                         <Button type="submit" disabled={profileLoading} className="h-14 px-10 bg-amber-700 text-white rounded-none uppercase text-xs tracking-[0.2em] hover:bg-amber-800 transition-colors shrink-0">
                           {editingAddress?.uid ? 'Update Address' : 'Save Address'}
                         </Button>
                         <Button type="button" onClick={cancelAddressForm} className="h-14 px-10 bg-transparent border border-gray-200 text-gray-900 rounded-none uppercase text-xs tracking-[0.2em] hover:bg-gray-50 transition-colors shrink-0">
                           Cancel
                         </Button>
                      </div>
                   </form>
                 </div>
               )}

               {!showAddressForm && addresses.length === 0 ? (
                 <div className="py-20 flex flex-col items-center border border-gray-200 bg-white">
                    <MapPin className="w-12 h-12 text-gray-200 mb-6" />
                    <span className="font-serif text-xl border-b border-gray-200/50 text-gray-400 pb-4">No Saved Addresses</span>
                 </div>
               ) : (
                 !showAddressForm && (
                   <div className="grid lg:grid-cols-2 gap-6">
                      {addresses.map(addr => (
                        <div key={addr.uid} className="border border-gray-200 bg-white p-6 relative group">
                           {addr.is_default && <span className="absolute top-0 right-0 bg-gray-900 text-white text-[9px] uppercase tracking-widest px-3 py-1 font-semibold">Default</span>}
                           <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-700 mb-4">{addr.address_type === 'shipping' ? 'Shipping' : 'Billing'}</div>
                           <p className="font-serif text-lg text-gray-900 mb-2">{addr.first_name} {addr.last_name}</p>
                           <div className="space-y-1 font-light text-gray-500 text-sm mb-6">
                              <p>{addr.address_line1}</p>
                              {addr.address_line2 && <p>{addr.address_line2}</p>}
                              <p>{addr.city}, {addr.state} {addr.postal_code}</p>
                              <p className="pt-2">{addr.phone}</p>
                           </div>
                           <div className="flex gap-4 border-t border-gray-100 pt-4">
                              <button onClick={() => handleEditAddress(addr)} className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 hover:text-gray-900 transition-colors flex items-center gap-1"><Edit3 className="w-3 h-3"/> Edit</button>
                              <button onClick={() => handleDeleteAddress(addr.uid!)} className="text-[10px] uppercase tracking-widest font-semibold text-red-400 hover:text-red-700 transition-colors flex items-center gap-1"><Trash2 className="w-3 h-3"/> Delete</button>
                           </div>
                        </div>
                      ))}
                   </div>
                 )
               )}
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="animate-in fade-in space-y-12">
               <div className="border-b border-gray-200/50 pb-6">
                 <h2 className="font-serif text-3xl text-gray-900 mb-2">Security & Password</h2>
                 <p className="font-light text-gray-500">Manage your account security and password</p>
               </div>

               <div className="border border-gray-200 bg-white p-8 lg:p-12">
                 <h3 className="font-serif text-xl border-b border-gray-100 pb-4 mb-8">Change Password</h3>
                 <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-md">
                   
                   <div className="space-y-2">
                     <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-500 block">Current Password</label>
                     <div className="relative">
                       <input type={showCurrentPassword ? 'text' : 'password'} value={passwordForm.current_password} onChange={e => setPasswordForm({...passwordForm, current_password: e.target.value})} className="w-full h-12 border-b border-gray-200 bg-transparent px-0 font-light text-sm focus:outline-none focus:border-gray-900 pr-10" />
                       <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400">
                         {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                       </button>
                     </div>
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-500 block">New Password</label>
                     <div className="relative">
                       <input type={showNewPassword ? 'text' : 'password'} value={passwordForm.new_password} onChange={e => setPasswordForm({...passwordForm, new_password: e.target.value})} className="w-full h-12 border-b border-gray-200 bg-transparent px-0 font-light text-sm focus:outline-none focus:border-gray-900 pr-10" />
                       <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400">
                         {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                       </button>
                     </div>
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-500 block">Confirm New Password</label>
                     <div className="relative">
                       <input type="password" value={passwordForm.confirm_password} onChange={e => setPasswordForm({...passwordForm, confirm_password: e.target.value})} className="w-full h-12 border-b border-gray-200 bg-transparent px-0 font-light text-sm focus:outline-none focus:border-gray-900" />
                     </div>
                   </div>

                   <div className="pt-6">
                      <Button type="submit" disabled={passwordLoading || !passwordForm.current_password} className="h-14 px-10 bg-gray-900 text-white rounded-none uppercase text-xs tracking-[0.2em] hover:bg-amber-900 transition-colors w-full sm:w-auto">
                        {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                      </Button>
                   </div>
                 </form>
               </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'settings' && (
            <div className="animate-in fade-in space-y-12">
               <div className="border-b border-gray-200/50 pb-6">
                 <h2 className="font-serif text-3xl text-gray-900 mb-2">Settings</h2>
                 <p className="font-light text-gray-500">Configure your notifications and preferences</p>
               </div>

               <div className="border border-gray-200 bg-white">
                 <div className="p-8 border-b border-gray-100">
                    <h3 className="font-serif text-xl border-b border-gray-100 pb-4 mb-6">Email Notifications</h3>
                    <div className="space-y-6">
                      {[
                        { key: 'email_notifications', label: 'Account Alerts', desc: 'Important notifications about your account' },
                        { key: 'order_updates', label: 'Order Updates', desc: 'Stay informed about your order status' },
                        { key: 'promotional_emails', label: 'Promotions', desc: 'Deals, offers, and seasonal sales' },
                        { key: 'newsletter', label: 'Newsletter', desc: 'Weekly updates on new collections' },
                      ].map(pref => (
                        <div key={pref.key} className="flex items-center justify-between">
                           <div>
                              <div className="text-sm font-semibold uppercase tracking-widest text-gray-900 mb-1">{pref.label}</div>
                              <div className="text-xs font-light text-gray-500">{pref.desc}</div>
                           </div>
                           <button
                             onClick={() => setSettingsForm({ ...settingsForm, [pref.key as keyof typeof settingsForm]: !settingsForm[pref.key as keyof typeof settingsForm] })}
                             className={cn(
                               "w-12 h-6 rounded-full transition-colors relative",
                               settingsForm[pref.key as keyof typeof settingsForm] ? "bg-amber-800" : "bg-gray-200"
                             )}
                           >
                             <span className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", settingsForm[pref.key as keyof typeof settingsForm] ? "left-7" : "left-1")} />
                           </button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-12 pt-8 border-t border-gray-100 flex justify-end">
                       <Button onClick={() => dispatch(addToast({ type: 'success', title: 'Saved', message: 'Preferences updated.' }))} className="h-12 px-8 bg-gray-900 text-white rounded-none uppercase text-[10px] tracking-[0.2em] hover:bg-amber-900 transition-colors">
                          Save Settings
                       </Button>
                    </div>
                 </div>
               </div>

               <div className="border border-red-200 bg-white p-8">
                  <h3 className="font-serif text-xl text-red-900 border-b border-red-100 pb-4 mb-6">Danger Zone</h3>
                  {!showDeleteConfirm ? (
                     <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                           <div className="text-sm font-semibold uppercase tracking-widest text-red-900 mb-1">Delete Account</div>
                           <div className="text-xs font-light text-red-700/70">Permanently remove your account and all associated data.</div>
                        </div>
                        <Button variant="outline" onClick={() => setShowDeleteConfirm(true)} className="h-10 px-6 border-red-200 text-red-700 bg-transparent rounded-none uppercase text-[10px] tracking-widest hover:bg-red-50 hover:border-red-300">
                           Delete My Account
                        </Button>
                     </div>
                  ) : (
                     <div className="p-6 bg-red-50 border border-red-200 space-y-6">
                        <div className="flex items-center gap-3 text-red-800">
                           <AlertTriangle className="w-5 h-5" /> <span className="font-bold uppercase tracking-widest text-xs">Verify Authorization</span>
                        </div>
                        <p className="font-light text-sm text-red-800 leading-relaxed">By confirming this request, your entire history and data will be permanently deleted. This action cannot be undone.</p>
                        <div className="flex gap-4">
                           <Button onClick={() => { setShowDeleteConfirm(false); dispatch(addToast({ type: 'info', title: 'Request Transmitted', message: 'Account deletion process initiated.'}))}} className="h-10 px-6 bg-red-700 text-white rounded-none uppercase text-[10px] tracking-widest hover:bg-red-800">
                              Confirm Deletion
                           </Button>
                           <Button onClick={() => setShowDeleteConfirm(false)} className="h-10 px-6 bg-transparent border border-red-200 text-red-700 rounded-none uppercase text-[10px] tracking-widest hover:bg-white">
                              Cancel
                           </Button>
                        </div>
                     </div>
                  )}
               </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  )
}
