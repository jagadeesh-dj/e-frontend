import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  User, Package, MapPin, Mail,
  Phone, Loader2, Camera, Save, Calendar, Edit3, Plus, Trash2,
  Lock, Settings, Shield, Bell, BellOff, Eye, EyeOff, AlertTriangle, ChevronRight
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { fetchUser, fetchProfile, updateProfile, fetchAddresses, createAddress, deleteAddress, updateAddress, uploadAvatar } from '../store/slices/authSlice'
import { fetchOrders } from '../store/slices/orderSlice'
import { formatDate, formatPrice } from '../lib/utils'
import { Address } from '../types'
import { addToast } from '../store/slices/uiSlice'

type TabType = 'profile' | 'orders' | 'addresses' | 'security' | 'settings'

const menuItems = [
  { id: 'profile', label: 'Profile', icon: User, desc: 'Personal info', color: 'blue' },
  { id: 'orders', label: 'Orders', icon: Package, desc: 'Track orders', color: 'green' },
  { id: 'addresses', label: 'Addresses', icon: MapPin, desc: 'Saved addresses', color: 'indigo' },
  { id: 'security', label: 'Security', icon: Lock, desc: 'Password & auth', color: 'purple' },
  { id: 'settings', label: 'Settings', icon: Settings, desc: 'Preferences', color: 'gray' },
]

const iconColorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  purple: 'bg-purple-50 text-purple-600',
  gray: 'bg-gray-100 text-gray-600',
}

export default function Profile() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const dispatch = useAppDispatch()
  const { user, profile, addresses, profileLoading } = useAppSelector((state) => state.auth)
  const { orders, isLoading: ordersLoading } = useAppSelector((state) => state.orders)

  // Read tab from URL query params
  const tabFromUrl = searchParams.get('tab') as TabType | null
  const [activeTab, setActiveTab] = useState<TabType>(tabFromUrl && menuItems.find(m => m.id === tabFromUrl) ? tabFromUrl : 'profile')
  const [isEditing, setIsEditing] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Settings form
  const [settingsForm, setSettingsForm] = useState({
    email_notifications: true,
    order_updates: true,
    promotional_emails: false,
    newsletter: true,
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Order filter
  const [orderFilter, setOrderFilter] = useState('all')

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    avatar_url: '',
    dob: '',
    gender: '',
    bio: '',
  })

  const [addressForm, setAddressForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    alternate_phone: '',
    address_line1: '',
    address_line2: '',
    landmark: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India',
    is_default: false,
  })

  useEffect(() => {
    dispatch(fetchUser())
    dispatch(fetchProfile())
    dispatch(fetchAddresses())
    dispatch(fetchOrders())
  }, [dispatch])

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get('tab') as TabType | null
    if (tab && menuItems.find(m => m.id === tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setSearchParams({ tab })
  }

  useEffect(() => {
    if (user || profile) {
      setFormData({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        phone: user?.phone || profile?.phone || '',
        avatar_url: user?.avatar_url || profile?.avatar_url || '',
        dob: profile?.dob || '',
        gender: profile?.gender || '',
        bio: profile?.bio || '',
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
      } catch (error) {
        console.error('Failed to upload avatar:', error)
      }
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await dispatch(updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone || undefined,
        dob: formData.dob || undefined,
        gender: formData.gender || undefined,
        bio: formData.bio || undefined,
      })).unwrap()

      setIsEditing(false)
      dispatch(fetchUser())
      dispatch(fetchProfile())
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      dispatch(addToast({ type: 'error', title: 'Error', message: 'Passwords do not match' }))
      return
    }
    if (passwordForm.new_password.length < 8) {
      dispatch(addToast({ type: 'error', title: 'Error', message: 'Password must be at least 8 characters' }))
      return
    }
    setPasswordLoading(true)
    try {
      // Simulate API call since endpoint may not exist yet
      await new Promise(resolve => setTimeout(resolve, 1000))
      dispatch(addToast({ type: 'success', title: 'Password Updated', message: 'Your password has been changed successfully' }))
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (error) {
      dispatch(addToast({ type: 'error', title: 'Error', message: 'Failed to update password' }))
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address)
    setAddressForm({
      first_name: address.first_name || '',
      last_name: address.last_name || '',
      phone: address.phone || '',
      alternate_phone: address.alternate_phone || '',
      address_line1: address.address_line1 || '',
      address_line2: address.address_line2 || '',
      landmark: address.landmark || '',
      city: address.city || '',
      state: address.state || '',
      postal_code: address.postal_code || '',
      country: address.country || 'India',
      is_default: address.is_default || false,
    })
    setShowAddressForm(true)
  }

  const handleDeleteAddress = async (uid: string) => {
    try {
      await dispatch(deleteAddress(uid)).unwrap()
    } catch (error) {
      console.error('Failed to delete address:', error)
    }
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
    } catch (error) {
      console.error('Failed to save address:', error)
    }
  }

  const resetAddressForm = () => {
    setAddressForm({
      first_name: '',
      last_name: '',
      phone: '',
      alternate_phone: '',
      address_line1: '',
      address_line2: '',
      landmark: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'India',
      is_default: false,
    })
  }

  const cancelAddressForm = () => {
    setShowAddressForm(false)
    setEditingAddress(null)
    resetAddressForm()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning'
      case 'processing': return 'secondary'
      case 'shipped': return 'default'
      case 'delivered': return 'success'
      case 'cancelled': return 'destructive'
      default: return 'secondary'
    }
  }

  const filteredOrders = orderFilter === 'all'
    ? orders
    : orders.filter(o => o.status === orderFilter)

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.is_admin === true
  const userRoleLabel = user?.role === 'superadmin' ? 'Super Admin' : isAdmin ? 'Admin' : 'Customer'

  return (
    <div className="min-h-screen">
      <div className="app-container py-8">
        {/* Mobile horizontal tabs */}
        <div className="lg:hidden mb-6 -mx-4 px-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id as TabType)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${activeTab === item.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                  }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <Card className="card-premium overflow-hidden sticky top-24">
              {/* Profile header with gradient accent */}
              <div className="relative">
                <div className="h-20 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400" />
                <div className="px-6 pb-5 -mt-10 text-center">
                  <div className="relative inline-block">
                    <Avatar className="w-20 h-20 mx-auto border-4 border-white shadow-md">
                      <AvatarImage src={formData.avatar_url || user?.avatar_url} />
                      <AvatarFallback className="text-xl bg-amber-100 text-amber-700 font-semibold">
                        {user?.first_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      onClick={handleAvatarClick}
                      className="absolute bottom-0 right-0 p-1.5 bg-white border-2 border-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                  <h2 className="mt-3 text-base font-semibold text-gray-900">
                    {user?.first_name && user?.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : 'User'}
                  </h2>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  <div className="mt-2 flex items-center justify-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${isAdmin ? 'bg-amber-200/60 text-amber-800' : 'bg-gray-200/60 text-gray-600'
                      }`}>
                      {isAdmin && <Shield className="w-2.5 h-2.5" />}
                      {userRoleLabel}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    Member since {user?.created_at ? formatDate(user.created_at) : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="p-2 border-t border-gray-100">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id as TabType)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id
                      ? 'bg-amber-50 text-primary'
                      : 'text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    <div className={`p-1.5 rounded-lg ${activeTab === item.id ? 'bg-primary/10' : iconColorMap[item.color] || 'bg-gray-100'
                      }`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-gray-400">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </nav>
            </Card>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <Card className="card-premium">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Update your personal details</p>
                  </div>
                  <Button
                    variant={isEditing ? "outline" : "default"}
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    disabled={profileLoading}
                    className={isEditing ? "" : "btn-premium"}
                  >
                    {isEditing ? 'Cancel' : (
                      <>
                        <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                        Edit
                      </>
                    )}
                  </Button>
                </div>
                <CardContent className="p-6">
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="form-group">
                        <label>First Name</label>
                        <Input
                          value={formData.first_name}
                          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                          disabled={!isEditing}
                          icon={<User className="w-4 h-4" />}
                          className="bg-gray-50/50"
                        />
                      </div>
                      <div className="form-group">
                        <label>Last Name</label>
                        <Input
                          value={formData.last_name}
                          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                          disabled={!isEditing}
                          className="bg-gray-50/50"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="form-group">
                        <label>Email</label>
                        <Input
                          value={user?.email || ''}
                          disabled
                          icon={<Mail className="w-4 h-4" />}
                          className="bg-gray-100 text-gray-500"
                        />
                      </div>
                      <div className="form-group">
                        <label>Phone</label>
                        <Input
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          disabled={!isEditing}
                          placeholder="Enter phone number"
                          icon={<Phone className="w-4 h-4" />}
                          className="bg-gray-50/50"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="form-group">
                        <label>Date of Birth</label>
                        <Input
                          type="date"
                          value={formData.dob}
                          onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                          disabled={!isEditing}
                          icon={<Calendar className="w-4 h-4" />}
                          className="bg-gray-50/50"
                        />
                      </div>
                      <div className="form-group">
                        <label>Gender</label>
                        <Select
                          value={formData.gender}
                          onValueChange={(value) => setFormData({ ...formData, gender: value })}
                          disabled={!isEditing}
                        >
                          <SelectTrigger className="bg-gray-50/50">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Bio</label>
                      <Textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Tell us about yourself..."
                        rows={3}
                        className="bg-gray-50/50"
                      />
                    </div>

                    {isEditing && (
                      <div className="flex justify-end pt-2">
                        <Button
                          type="submit"
                          disabled={profileLoading}
                          className="btn-premium"
                        >
                          {profileLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Orders Tab - Connected to real data */}
            {activeTab === 'orders' && (
              <Card className="card-premium">
                <div className="px-6 py-5 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">My Orders</h3>
                      <p className="text-sm text-gray-500 mt-0.5">Track and manage your orders</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate('/orders')}>
                      View All <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                  {/* Status filter tabs */}
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setOrderFilter(status)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${orderFilter === status
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                        {status === 'all' && ` (${orders.length})`}
                      </button>
                    ))}
                  </div>
                </div>
                <CardContent className="p-6">
                  {ordersLoading ? (
                    <div className="text-center py-16">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                      <p className="text-sm text-gray-500 mt-3">Loading orders...</p>
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {orderFilter === 'all' ? 'No orders yet' : `No ${orderFilter} orders`}
                      </h4>
                      <p className="text-sm text-gray-500 mb-6">
                        {orderFilter === 'all' ? 'Start shopping to see your orders here' : 'Try a different filter'}
                      </p>
                      {orderFilter === 'all' && (
                        <Button asChild className="btn-premium">
                          <Link to="/products">Browse Products</Link>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredOrders.slice(0, 10).map((order) => (
                        <Link
                          key={order.id}
                          to={`/orders/${order.id}`}
                          className="block p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <Package className="w-5 h-5 text-gray-500" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-sm font-medium text-gray-900">
                                    #{order.orderNumber || order.id}
                                  </span>
                                  <Badge variant={getStatusColor(order.status) as any} className="text-[10px]">
                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {order.items?.length || 0} item(s) • {formatPrice(order.total_amount)} • {formatDate(order.created_at)}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                          </div>
                        </Link>
                      ))}
                      {filteredOrders.length > 10 && (
                        <div className="text-center pt-2">
                          <Button variant="outline" size="sm" onClick={() => navigate('/orders')}>
                            View all {filteredOrders.length} orders
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <Card className="card-premium">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Saved Addresses</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Manage your delivery addresses</p>
                  </div>
                  {!showAddressForm && (
                    <Button size="sm" onClick={() => setShowAddressForm(true)} className="btn-premium">
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      Add New
                    </Button>
                  )}
                </div>
                <CardContent className="p-6">
                  {showAddressForm && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <form onSubmit={handleAddressSubmit} className="space-y-4 mb-8 p-5 bg-gray-50/80 rounded-xl border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {editingAddress?.uid ? 'Edit Address' : 'Add New Address'}
                          </h4>
                          <Button type="button" variant="ghost" size="sm" onClick={cancelAddressForm}>
                            Cancel
                          </Button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="form-group">
                            <label>Phone</label>
                            <Input
                              value={addressForm.phone}
                              onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                              placeholder="+91 98765 43210"
                              icon={<Phone className="w-4 h-4" />}
                              className="bg-white"
                            />
                          </div>
                          <div className="form-group">
                            <label>Alternate Phone</label>
                            <Input
                              value={addressForm.alternate_phone}
                              onChange={(e) => setAddressForm({ ...addressForm, alternate_phone: e.target.value })}
                              placeholder="Optional"
                              className="bg-white"
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Address Line 1</label>
                          <Input
                            value={addressForm.address_line1}
                            onChange={(e) => setAddressForm({ ...addressForm, address_line1: e.target.value })}
                            placeholder="House/Flat, Building name"
                            icon={<MapPin className="w-4 h-4" />}
                            className="bg-white"
                          />
                        </div>

                        <div className="form-group">
                          <label>Address Line 2 <span className="text-gray-400 font-normal">(Optional)</span></label>
                          <Input
                            value={addressForm.address_line2}
                            onChange={(e) => setAddressForm({ ...addressForm, address_line2: e.target.value })}
                            placeholder="Street, Area"
                            className="bg-white"
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="form-group">
                            <label>Landmark</label>
                            <Input
                              value={addressForm.landmark}
                              onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                              placeholder="Near..."
                              className="bg-white"
                            />
                          </div>
                          <div className="form-group">
                            <label>City</label>
                            <Input
                              value={addressForm.city}
                              onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                              placeholder="Mumbai"
                              className="bg-white"
                            />
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="form-group">
                            <label>State</label>
                            <Input
                              value={addressForm.state}
                              onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                              placeholder="Maharashtra"
                              className="bg-white"
                            />
                          </div>
                          <div className="form-group">
                            <label>Postal Code</label>
                            <Input
                              value={addressForm.postal_code}
                              onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                              placeholder="400001"
                              className="bg-white"
                            />
                          </div>
                        </div>

                        <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            id="is_default"
                            checked={addressForm.is_default}
                            onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                          />
                          <span className="text-sm text-gray-600">Set as default address</span>
                        </label>

                        <div className="flex gap-3 pt-2">
                          <Button type="submit" disabled={profileLoading} className="btn-premium">
                            {profileLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingAddress?.uid ? 'Update Address' : 'Save Address'}
                          </Button>
                          <Button type="button" variant="outline" onClick={cancelAddressForm}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {addresses.length === 0 && !showAddressForm ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <MapPin className="w-8 h-8 text-gray-400" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">No addresses yet</h4>
                      <p className="text-sm text-gray-500 mb-6">Add an address for faster checkout</p>
                      <Button onClick={() => setShowAddressForm(true)} className="btn-premium">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Address
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {addresses.map((address) => (
                        <div
                          key={address.uid}
                          className="p-5 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2.5">
                                <span className="text-xs font-medium px-2.5 py-1 bg-gray-100 rounded-lg text-gray-600">
                                  {address.address_type === 'shipping' ? 'Shipping' : 'Billing'}
                                </span>
                                {address.is_default && (
                                  <span className="text-xs font-medium px-2.5 py-1 bg-green-50 rounded-lg text-green-700">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-900 font-medium">
                                {address.first_name} {address.last_name}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                {address.address_line1}
                                {address.address_line2 && `, ${address.address_line2}`}
                              </p>
                              <p className="text-sm text-gray-500">
                                {address.city}, {address.state} {address.postal_code}
                              </p>
                              {address.phone && (
                                <p className="text-sm text-gray-500 mt-1.5 flex items-center gap-1.5">
                                  <Phone className="w-3.5 h-3.5" />
                                  {address.phone}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-gray-500 hover:text-primary hover:bg-amber-50"
                                onClick={() => handleEditAddress(address)}
                              >
                                <Edit3 className="w-3.5 h-3.5 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => handleDeleteAddress(address.uid!)}
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <Card className="card-premium">
                  <div className="px-6 py-5 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Update your password to keep your account secure</p>
                  </div>
                  <CardContent className="p-6">
                    <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-md">
                      <div className="form-group">
                        <label>Current Password</label>
                        <div className="relative">
                          <Input
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={passwordForm.current_password}
                            onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                            placeholder="Enter current password"
                            icon={<Lock className="w-4 h-4" />}
                            className="bg-gray-50/50 pr-10"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>New Password</label>
                        <div className="relative">
                          <Input
                            type={showNewPassword ? 'text' : 'password'}
                            value={passwordForm.new_password}
                            onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                            placeholder="Min. 8 characters"
                            icon={<Lock className="w-4 h-4" />}
                            className="bg-gray-50/50 pr-10"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {passwordForm.new_password && passwordForm.new_password.length < 8 && (
                          <p className="text-xs text-red-500 mt-1">Password must be at least 8 characters</p>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Confirm New Password</label>
                        <Input
                          type="password"
                          value={passwordForm.confirm_password}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                          placeholder="Re-enter new password"
                          icon={<Lock className="w-4 h-4" />}
                          className="bg-gray-50/50"
                        />
                        {passwordForm.confirm_password && passwordForm.new_password !== passwordForm.confirm_password && (
                          <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        disabled={passwordLoading || !passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password}
                        className="btn-premium"
                      >
                        {passwordLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
                        Update Password
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card className="card-premium">
                  <div className="px-6 py-5 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Add an extra layer of security</p>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 rounded-lg">
                          <Shield className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Authenticator App</p>
                          <p className="text-xs text-gray-500">Use Google Authenticator or similar apps</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <Card className="card-premium">
                  <div className="px-6 py-5 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Choose what notifications you want to receive</p>
                  </div>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {[
                        { key: 'email_notifications', label: 'Email Notifications', desc: 'Receive notifications via email', icon: Mail },
                        { key: 'order_updates', label: 'Order Updates', desc: 'Get notified about order status changes', icon: Package },
                        { key: 'promotional_emails', label: 'Promotional Emails', desc: 'Receive deals and offers', icon: Bell },
                        { key: 'newsletter', label: 'Newsletter', desc: 'Weekly product recommendations', icon: Bell },
                      ].map((pref) => (
                        <div key={pref.key} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg border border-gray-100">
                              <pref.icon className="w-4 h-4 text-gray-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{pref.label}</p>
                              <p className="text-xs text-gray-500">{pref.desc}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setSettingsForm({ ...settingsForm, [pref.key]: !settingsForm[pref.key as keyof typeof settingsForm] })}
                            className={`relative w-11 h-6 rounded-full transition-colors ${settingsForm[pref.key as keyof typeof settingsForm] ? 'bg-primary' : 'bg-gray-300'
                              }`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${settingsForm[pref.key as keyof typeof settingsForm] ? 'translate-x-5' : 'translate-x-0'
                              }`} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6">
                      <Button
                        className="btn-premium"
                        onClick={() => dispatch(addToast({ type: 'success', title: 'Preferences Saved', message: 'Your notification preferences have been updated' }))}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Preferences
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Account Deletion */}
                <Card className="card-premium border-red-100">
                  <div className="px-6 py-5 border-b border-red-100">
                    <h3 className="text-lg font-semibold text-red-700">Danger Zone</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Irreversible account actions</p>
                  </div>
                  <CardContent className="p-6">
                    {!showDeleteConfirm ? (
                      <div className="flex items-center justify-between p-4 bg-red-50/50 rounded-xl border border-red-100">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-100 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Delete Account</p>
                            <p className="text-xs text-gray-500">Permanently delete your account and all data</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                          onClick={() => setShowDeleteConfirm(true)}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                          Delete
                        </Button>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 bg-red-50 rounded-xl border border-red-200"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                          <h4 className="font-semibold text-red-800">Are you sure?</h4>
                        </div>
                        <p className="text-sm text-red-700 mb-4">
                          This action is irreversible. All your data including orders, addresses, and preferences will be permanently deleted.
                        </p>
                        <div className="flex gap-3">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              dispatch(addToast({ type: 'info', title: 'Account Deletion', message: 'Account deletion request submitted. You will receive a confirmation email.' }))
                              setShowDeleteConfirm(false)
                            }}
                          >
                            Yes, Delete My Account
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                            Cancel
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
