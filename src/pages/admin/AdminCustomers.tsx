import { useState, useEffect } from 'react'
import {
  Search, Eye, Mail, Calendar, ChevronLeft, ChevronRight, FileSpreadsheet,
  Globe, User
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { User as UserType } from '../../types'
import { downloadCsv } from '../../utils/csv'
import { useAppDispatch } from '../../store/hooks'
import { addToast } from '../../store/slices/uiSlice'
import api from '../../services/api'

export default function AdminCustomers() {
  const dispatch = useAppDispatch()
  const [customers, setCustomers] = useState<UserType[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await api.get('/admin/users', { 
          params: { page: 1, page_size: 1000 } 
        })
        setCustomers(response.data.items || [])
      } catch (error) {
        dispatch(addToast({ type: 'error', title: 'System Error', message: 'Failed to access clientele registry.' }))
      }
    }
    fetchCustomers()
  }, [dispatch])

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch =
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage)
  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleExportCustomers = () => {
    if (filteredCustomers.length === 0) return

    const exportRows = filteredCustomers.map((customer) => ({
      id: customer.id,
      first_name: customer.first_name || '',
      last_name: customer.last_name || '',
      email: customer.email || '',
      username: customer.username || '',
      role: customer.role || '',
      status: customer.is_active ? 'Active' : 'Inactive',
      joined_at: customer.created_at ? new Date(customer.created_at).toLocaleDateString() : '',
    }))

    downloadCsv('clientele_manifest.csv', exportRows, [
      'id', 'first_name', 'last_name', 'email', 'username', 'role', 'status', 'joined_at'
    ])
    dispatch(addToast({ type: 'success', title: 'Manifest Exported', message: 'Clientele database written to file.' }))
  }

  const getInitials = (user: UserType) => {
    if (user.first_name && user.last_name) return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    return (user.username || user.email || 'U')[0].toUpperCase()
  }

  return (
    <div className="space-y-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between border-b border-gray-200/80 pb-6 gap-4">
        <div>
          <h1 className="text-4xl font-serif text-gray-900 mb-2">Customers</h1>
          <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-gray-400 flex items-center gap-2">
             <Globe className="w-3 h-3" /> Customer Database & Membership
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={handleExportCustomers} className="h-10 px-8 bg-white border border-amber-900/20 text-amber-900 rounded-none uppercase text-[10px] tracking-[0.2em] hover:bg-amber-50 transition-colors font-bold shadow-sm">
            <FileSpreadsheet className="w-3 h-3 mr-2" /> Export Customers
          </Button>
        </div>
      </div>

      <div className="bg-white border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
           <div className="relative w-full sm:max-w-md flex items-center border-b border-gray-300 focus-within:border-amber-700 transition-colors pb-1">
             <Search className="w-4 h-4 text-gray-400 absolute left-0" />
             <input
               type="search"
               placeholder="Search registry by identifier or moniker..."
               value={searchQuery}
               onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
               className="w-full bg-transparent border-none pl-8 pr-4 h-8 text-sm font-light focus:outline-none focus:ring-0 placeholder:text-gray-400"
             />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#faf9f6]">
                <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200">Customer</th>
                <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200">Email Address</th>
                <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200">Account Role</th>
                <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200">Account Status</th>
                <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200">Joined Date</th>
                <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200 text-right">Details</th>
                <th className="py-4 px-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-200 text-right">Actions</th>

              </tr>
            </thead>
            <tbody>
              {paginatedCustomers.length === 0 ? (
                <tr>
                   <td colSpan={6} className="py-16 text-center text-gray-400 font-serif text-lg">No individuals found on roll</td>
                </tr>
              ) : (
                 paginatedCustomers.map((customer) => (
                   <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                     <td className="py-4 px-6">
                       <div className="flex items-center gap-4">
                         {customer.avatar ? (
                           <img src={customer.avatar} className="w-10 h-10 object-cover border border-gray-200 transition-all hover:scale-110" alt={customer.first_name} />
                         ) : (
                           <div className="w-10 h-10 bg-amber-700 border border-amber-900/10 flex items-center justify-center text-white text-xs font-serif uppercase shrink-0 shadow-inner">
                             {getInitials(customer)}
                           </div>
                         )}
                         <div>
                           <p className="font-serif text-amber-800 text-lg leading-tight">
                             {customer.first_name && customer.last_name ? `${customer.first_name} ${customer.last_name}` : customer.username || 'Unknown'}
                           </p>
                           <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">@{customer.username}</p>
                         </div>
                       </div>
                     </td>
                     <td className="py-4 px-6">
                       <div className="flex items-center gap-2 text-xs font-mono text-gray-600 truncate max-w-[200px]">
                         <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                         {customer.email}
                       </div>
                     </td>
                     <td className="py-4 px-6">
                        <span className={`text-[9px] uppercase tracking-widest px-2 py-1 font-bold border ${customer.role === 'admin' ? 'border-amber-200 text-amber-700 bg-amber-50' : 'border-gray-200 text-gray-600 bg-white'}`}>
                           {customer.role === 'admin' || customer.role === 'superadmin' ? 'Admin' : 'Customer'}
                        </span>
                     </td>
                     <td className="py-4 px-6">
                        <span className={`text-[9px] uppercase tracking-widest px-2 py-1 font-bold border ${customer.is_active ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-red-200 text-red-700 bg-red-50'}`}>
                           {customer.is_active ? 'Active' : 'Suspended'}
                        </span>
                     </td>
                     <td className="py-4 px-6">
                       <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                         <Calendar className="w-3 h-3" />
                         {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : '-'}
                       </div>
                     </td>
                     <td className="py-4 px-6 text-right">
                       <button className="text-gray-400 hover:text-amber-800 transition-colors p-2">
                         <Eye className="w-4 h-4" />
                       </button>
                     </td>
                   </tr>
                  
                 ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between text-xs font-light text-gray-500 bg-[#faf9f6]">
            <div className="uppercase tracking-widest">
              Roll {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length}
            </div>
            <div className="flex items-center gap-1 font-sans">
              <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center text-gray-500 disabled:opacity-30 hover:bg-white border border-transparent hover:border-gray-200 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => Math.abs(currentPage - p) <= 2).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 flex items-center justify-center font-bold text-xs border transition-colors ${currentPage === page ? 'bg-amber-700 text-white border-amber-700' : 'bg-transparent text-gray-400 border-transparent hover:border-gray-200 hover:bg-white'}`}
                >
                  {page}
                </button>
              ))}
              <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="w-8 h-8 flex items-center justify-center text-gray-500 disabled:opacity-30 hover:bg-white border border-transparent hover:border-gray-200 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
