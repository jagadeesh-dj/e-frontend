import { useState, useEffect } from 'react'
import {
  Search, Eye, Mail, Calendar, ChevronLeft, ChevronRight, FileSpreadsheet
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { User } from '../../types'
import { downloadCsv } from '../../utils/csv'
import { useAppDispatch } from '../../store/hooks'
import { addToast } from '../../store/slices/uiSlice'
import api from '../../services/api'

export default function AdminCustomers() {
  const dispatch = useAppDispatch()
  const [customers, setCustomers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await api.get('/admin/users', { 
          params: { page: 1, page_size: 1000 } 
        })
        setCustomers(response.data.items || [])
      } catch (error) {
        console.error('Failed to load customers', error)
        dispatch(addToast({ type: 'error', title: 'Error', message: 'Failed to load customers' }))
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
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleExportCustomers = () => {
    if (filteredCustomers.length === 0) {
      dispatch(
        addToast({
          type: 'info',
          title: 'No data to export',
          message: 'There are no customers to export.',
        })
      )
      return
    }

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

    downloadCsv('customers_export.csv', exportRows, [
      'id',
      'first_name',
      'last_name',
      'email',
      'username',
      'role',
      'status',
      'joined_at',
    ])

    dispatch(
      addToast({
        type: 'success',
        title: 'Export complete',
        message: 'Customers exported successfully.',
      })
    )
  }

  const getInitials = (user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    }
    return (user.username || user.email || 'U')[0].toUpperCase()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage your customers</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleExportCustomers}
          className="h-10 w-10 p-0 sm:w-auto sm:px-4"
          aria-label="Export customers"
        >
          <FileSpreadsheet className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Export Excel</span>
        </Button>
      </div>

      <Card className="card-premium">
        <CardHeader className="px-6 py-5">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0">
          <div className="table-shell">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Customer</th>
                  <th className="text-left py-3 px-4 font-medium">Email</th>
                  <th className="text-left py-3 px-4 font-medium">Username</th>
                  <th className="text-left py-3 px-4 font-medium">Role</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Joined</th>
                  <th className="text-right py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      No customers found
                    </td>
                  </tr>
                ) : (
                  paginatedCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={customer.avatar} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(customer)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {customer.first_name && customer.last_name
                                ? `${customer.first_name} ${customer.last_name}`
                                : customer.username}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          {customer.email}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">@{customer.username}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={customer.role === 'admin' ? 'default' : 'secondary'}>
                          {customer.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={customer.is_active ? 'success' : 'secondary'}>
                          {customer.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="icon">
                          <Eye className="w-4 h-4" />
                        </Button>
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
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length} customers
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
    </div>
  )
}

