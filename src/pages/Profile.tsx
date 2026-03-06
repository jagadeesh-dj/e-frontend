import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  User, Package, MapPin, ChevronLeft,
  Phone, Loader2, Camera, Save, Calendar
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '../components/ui/select'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { fetchUser, fetchProfile, updateProfile, fetchAddresses, createAddress, deleteAddress, updateAddress, uploadAvatar } from '../store/slices/authSlice'
import { formatDate } from '../lib/utils'
import { Address } from '../types'
import { addToast } from '../store/slices/uiSlice'

type TabType = 'profile' | 'orders' | 'addresses'

const menuItems = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'addresses', label: 'Addresses', icon: MapPin },
]

export default function Profile() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { user, profile, addresses, profileLoading } = useAppSelector((state) => state.auth)
  const [activeTab, setActiveTab] = useState<TabType>('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
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
  }, [dispatch])

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
      
      dispatch(addToast({ type: 'success', title: 'Profile Updated', message: 'Your profile has been updated successfully' }))
      setIsEditing(false)
      dispatch(fetchUser())
      dispatch(fetchProfile())
    } catch (error) {
      console.error('Failed to update profile:', error)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 h-16">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(-1)}
              className="hover:bg-gray-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-gray-900">My Account</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Card className="border-gray-200 shadow-soft rounded-xl overflow-hidden sticky top-24">
              <div className="p-6 text-center border-b border-gray-100">
                <div className="relative inline-block">
                  <Avatar className="w-24 h-24 mx-auto border-2 border-gray-100">
                    <AvatarImage src={formData.avatar_url || user?.avatar_url} />
                    <AvatarFallback className="text-2xl bg-gray-100 text-gray-600">
                      {user?.first_name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={handleAvatarClick}
                    className="absolute bottom-0 right-0 p-2 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50"
                  >
                    <Camera className="w-4 h-4 text-gray-600" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-gray-900">
                  {user?.first_name && user?.last_name 
                    ? `${user.first_name} ${user.last_name}` 
                    : 'User'}
                </h2>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <p className="text-xs text-gray-400 mt-1">Member since {user?.created_at ? formatDate(user.created_at) : 'N/A'}</p>
              </div>
              <nav className="p-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as TabType)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === item.id
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </Card>
          </div>

          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <Card className="border-gray-200 shadow-soft rounded-xl">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                  <Button 
                    variant={isEditing ? "outline" : "default"}
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    disabled={profileLoading}
                    className={isEditing ? "border-gray-300" : "btn-premium"}
                  >
                    {isEditing ? 'Cancel' : 'Edit'}
                  </Button>
                </div>
                <CardContent className="p-6">
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">First Name</label>
                        <Input
                          value={formData.first_name}
                          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                          disabled={!isEditing}
                          className="bg-gray-50 border-gray-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Last Name</label>
                        <Input
                          value={formData.last_name}
                          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                          disabled={!isEditing}
                          className="bg-gray-50 border-gray-200"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <Input
                          value={user?.email || ''}
                          disabled
                          className="bg-gray-100 border-gray-200 text-gray-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Phone</label>
                        <Input
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          disabled={!isEditing}
                          placeholder="Enter phone number"
                          className="bg-gray-50 border-gray-200"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Date of Birth</label>
                        <Input
                          type="date"
                          value={formData.dob}
                          onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                          disabled={!isEditing}
                          className="bg-gray-50 border-gray-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Gender</label>
                        <Select 
                          value={formData.gender} 
                          onValueChange={(value) => setFormData({ ...formData, gender: value })}
                          disabled={!isEditing}
                        >
                          <SelectTrigger className="bg-gray-50 border-gray-200">
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

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Bio</label>
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Tell us about yourself..."
                        rows={3}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm resize-none focus:border-primary focus:bg-white"
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

            {activeTab === 'orders' && (
              <Card className="border-gray-200 shadow-soft rounded-xl">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">My Orders</h3>
                </div>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">No orders yet</h4>
                    <p className="text-sm text-gray-500 mb-4">Start shopping to see your orders</p>
                    <Button asChild className="btn-premium">
                      <Link to="/products">Browse Products</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'addresses' && (
              <Card className="border-gray-200 shadow-soft rounded-xl">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Saved Addresses</h3>
                  {!showAddressForm && (
                    <Button size="sm" onClick={() => setShowAddressForm(true)} className="btn-premium">
                      Add New
                    </Button>
                  )}
                </div>
                <CardContent className="p-6">
                  {showAddressForm && (
                    <form onSubmit={handleAddressSubmit} className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          {editingAddress?.uid ? 'Edit Address' : 'Add New Address'}
                        </h4>
                        <Button type="button" variant="ghost" size="sm" onClick={cancelAddressForm}>
                          Cancel
                        </Button>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <Input
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                          placeholder="Phone"
                          className="bg-white border-gray-200"
                        />
                        <Input
                          value={addressForm.alternate_phone}
                          onChange={(e) => setAddressForm({ ...addressForm, alternate_phone: e.target.value })}
                          placeholder="Alternate phone"
                          className="bg-white border-gray-200"
                        />
                      </div>

                      <Input
                        value={addressForm.address_line1}
                        onChange={(e) => setAddressForm({ ...addressForm, address_line1: e.target.value })}
                        placeholder="Address line 1"
                        className="bg-white border-gray-200"
                      />

                      <Input
                        value={addressForm.address_line2}
                        onChange={(e) => setAddressForm({ ...addressForm, address_line2: e.target.value })}
                        placeholder="Address line 2 (optional)"
                        className="bg-white border-gray-200"
                      />

                      <div className="grid md:grid-cols-2 gap-4">
                        <Input
                          value={addressForm.landmark}
                          onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                          placeholder="Landmark"
                          className="bg-white border-gray-200"
                        />
                        <Input
                          value={addressForm.city}
                          onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                          placeholder="City"
                          className="bg-white border-gray-200"
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <Input
                          value={addressForm.state}
                          onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                          placeholder="State"
                          className="bg-white border-gray-200"
                        />
                        <Input
                          value={addressForm.postal_code}
                          onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                          placeholder="Postal code"
                          className="bg-white border-gray-200"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="is_default"
                          checked={addressForm.is_default}
                          onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor="is_default" className="text-sm text-gray-600">Set as default address</label>
                      </div>

                      <div className="flex gap-2">
                        <Button type="submit" disabled={profileLoading} className="btn-premium">
                          {profileLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {editingAddress?.uid ? 'Update' : 'Save'}
                        </Button>
                      </div>
                    </form>
                  )}

                  {addresses.length === 0 && !showAddressForm ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <MapPin className="w-8 h-8 text-gray-400" />
                      </div>
                      <h4 className="font-medium text-gray-900 mb-1">No addresses yet</h4>
                      <p className="text-sm text-gray-500 mb-4">Add an address for faster checkout</p>
                      <Button onClick={() => setShowAddressForm(true)} className="btn-premium">
                        Add Address
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {addresses.map((address) => (
                        <div
                          key={address.uid}
                          className="p-4 bg-gray-50 rounded-lg border border-gray-100"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-medium px-2 py-1 bg-gray-200 rounded-full text-gray-600">
                                  {address.address_type === 'shipping' ? 'Shipping' : 'Billing'}
                                </span>
                                {address.is_default && (
                                  <span className="text-xs font-medium px-2 py-1 bg-green-100 rounded-full text-green-700">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-900 font-medium">
                                {address.first_name} {address.last_name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {address.address_line1}
                                {address.address_line2 && `, ${address.address_line2}`}
                              </p>
                              <p className="text-sm text-gray-500">
                                {address.city}, {address.state} {address.postal_code}
                              </p>
                              {address.phone && (
                                <p className="text-sm text-gray-500 mt-1">{address.phone}</p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 hover:bg-gray-200"
                                onClick={() => handleEditAddress(address)}
                              >
                                <span className="text-sm">Edit</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                                onClick={() => handleDeleteAddress(address.uid!)}
                              >
                                <span className="text-sm">Delete</span>
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
          </div>
        </div>
      </div>
    </div>
  )
}
