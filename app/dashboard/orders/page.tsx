// app/dashboard/orders/page.tsx - Connected to Backend API
"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Filter, RefreshCw, Eye, CheckCircle, XCircle, Clock, Plus, Edit, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"

// Types from backend
interface OrderItem {
  name: string;
  quantity?: number;
  kuantitas?: number;
  price: number;
}

interface Order {
  id: string;
  invoice_id: number | string;
  customer: string;
  date: string | Date;
  total: number;
  restaurant_id: number;
  restaurant_name: string;
  total_items: number;
  total_quantity: number;
  menu_items: string;
  status: 'pending' | 'in-progress' | 'ready' | 'completed' | 'cancelled';
  items: OrderItem[];
  type?: 'dine-in' | 'takeout' | 'delivery';
  time?: string;
  order_size?: 'small' | 'medium' | 'large';
  order_time_period?: 'morning' | 'afternoon' | 'evening';
}

interface OrderResponse {
  success: boolean;
  data?: {
    orders: Order[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
  error?: string;
  message?: string;
}

export default function OrdersManagementPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [orderType, setOrderType] = useState("all")
  const [pagination, setPagination] = useState({ total: 0, limit: 50, offset: 0, hasMore: false })
  
  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  
  const { toast } = useToast()

  // Fetch orders from backend API
  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
        restaurant_id: "1" // Default restaurant
      })

      if (selectedTab !== "all") {
        params.append("status", selectedTab)
      }

      if (orderType !== "all") {
        params.append("order_type", orderType)
      }

      if (searchTerm) {
        params.append("search", searchTerm)
      }

      const response = await fetch(`/api/orders?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: OrderResponse = await response.json()

      if (result.success && result.data) {
        setOrders(result.data.orders)
        setPagination(result.data.pagination)
      } else {
        throw new Error(result.error || 'Failed to fetch orders')
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch orders')
      toast({
        title: "Error",
        description: "Failed to fetch orders. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Update order status
  const updateOrderStatus = async (invoiceId: string | number, newStatus: string) => {
    try {
      setIsUpdatingStatus(true)

      const response = await fetch('/api/orders/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoice_id: invoiceId,
          status: newStatus,
          notes: `Status updated to ${newStatus} via dashboard`
        })
      })

      const result = await response.json()

      if (result.success) {
        // Update local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.invoice_id === invoiceId 
              ? { ...order, status: newStatus as any }
              : order
          )
        )

        toast({
          title: "Success",
          description: `Order ${invoiceId} status updated to ${newStatus}`,
        })
      } else {
        throw new Error(result.error || 'Failed to update order status')
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Delete order
  const deleteOrder = async (invoiceId: string | number) => {
    if (!confirm(`Are you sure you want to delete order ${invoiceId}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/orders?invoice_id=${invoiceId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        // Remove from local state
        setOrders(prevOrders => 
          prevOrders.filter(order => order.invoice_id !== invoiceId)
        )

        toast({
          title: "Success",
          description: `Order ${invoiceId} deleted successfully`,
        })
      } else {
        throw new Error(result.error || 'Failed to delete order')
      }
    } catch (error) {
      console.error('Error deleting order:', error)
      toast({
        title: "Error",
        description: "Failed to delete order. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Load orders on component mount and when filters change
  useEffect(() => {
    fetchOrders()
  }, [selectedTab, orderType, searchTerm])

  // Status badge component
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, icon: Clock },
      "in-progress": { variant: "default" as const, icon: Clock },
      ready: { variant: "outline" as const, icon: CheckCircle },
      completed: { variant: "default" as const, icon: CheckCircle },
      cancelled: { variant: "destructive" as const, icon: XCircle }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  // Format currency for Indonesian Rupiah
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // Format date time
  const formatDateTime = (dateTime: string | Date) => {
    return new Date(dateTime).toLocaleString('id-ID')
  }

  // Filter orders based on search and filters
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === "" || 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.menu_items.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = orderType === "all" || order.type === orderType

    return matchesSearch && matchesType
  })

  if (error) {
    return (
      <DashboardLayout title="Orders Management - Error">
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="flex items-center justify-center h-96">
              <div className="text-center">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Error Loading Orders</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={fetchOrders}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Orders Management">
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Orders Management</h1>
            <p className="text-gray-600">Manage and track customer orders</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchOrders} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              Orders ({pagination.total})
              {isLoading && <span className="text-sm font-normal text-gray-500 ml-2">Loading...</span>}
            </CardTitle>
            <CardDescription>
              View and manage all customer orders in real-time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input 
                  placeholder="Search orders by ID, customer, or menu items..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                />
              </div>
              <div className="flex gap-2">
                <Select value={orderType} onValueChange={setOrderType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Order Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="dine-in">Dine-in</SelectItem>
                    <SelectItem value="takeout">Takeout</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => {
                  setSearchTerm("")
                  setOrderType("all")
                  setSelectedTab("all")
                }}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Status Tabs */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-6">
              <TabsList>
                <TabsTrigger value="all">All Orders</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                <TabsTrigger value="ready">Ready</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Orders Table */}
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Loading orders...</p>
                </div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Orders Found</h3>
                <p className="text-gray-600">No orders match your current filters.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{order.total_items} items</span>
                          <Badge variant="outline" className="text-xs">
                            {order.total_quantity} qty
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(order.total)}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDateTime(order.date)}</div>
                          {order.order_time_period && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {order.order_time_period}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.type && (
                          <Badge variant="outline" className="capitalize">
                            {order.type}
                          </Badge>
                        )}
                        {order.order_size && (
                          <Badge variant="secondary" className="ml-1 text-xs">
                            {order.order_size}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setViewingOrder(order)
                              setViewModalOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {order.status === "pending" && (
                            <Button 
                              size="sm"
                              onClick={() => updateOrderStatus(order.invoice_id, "in-progress")}
                              disabled={isUpdatingStatus}
                            >
                              Process
                            </Button>
                          )}
                          
                          {order.status === "in-progress" && (
                            <Button 
                              size="sm"
                              onClick={() => updateOrderStatus(order.invoice_id, "ready")}
                              disabled={isUpdatingStatus}
                            >
                              Mark Ready
                            </Button>
                          )}
                          
                          {order.status === "ready" && (
                            <Button 
                              size="sm"
                              onClick={() => updateOrderStatus(order.invoice_id, "completed")}
                              disabled={isUpdatingStatus}
                            >
                              Complete
                            </Button>
                          )}

                          {(order.status === "pending" || order.status === "in-progress") && (
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => updateOrderStatus(order.invoice_id, "cancelled")}
                              disabled={isUpdatingStatus}
                            >
                              Cancel
                            </Button>
                          )}

                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => deleteOrder(order.invoice_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination Info */}
            {pagination.total > 0 && (
              <div className="mt-4 text-sm text-gray-600">
                Showing {orders.length} of {pagination.total} orders
                {pagination.hasMore && " (load more available)"}
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Order Modal */}
        <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
            </DialogHeader>
            {viewingOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold">Order ID:</label>
                    <p>{viewingOrder.id}</p>
                  </div>
                  <div>
                    <label className="font-semibold">Customer:</label>
                    <p>{viewingOrder.customer}</p>
                  </div>
                  <div>
                    <label className="font-semibold">Status:</label>
                    <div className="mt-1">{getStatusBadge(viewingOrder.status)}</div>
                  </div>
                  <div>
                    <label className="font-semibold">Total:</label>
                    <p className="font-bold text-lg">{formatCurrency(viewingOrder.total)}</p>
                  </div>
                  <div>
                    <label className="font-semibold">Date & Time:</label>
                    <p>{formatDateTime(viewingOrder.date)}</p>
                  </div>
                  <div>
                    <label className="font-semibold">Restaurant:</label>
                    <p>{viewingOrder.restaurant_name}</p>
                  </div>
                </div>
                
                <div>
                  <label className="font-semibold">Items:</label>
                  <div className="mt-2 space-y-2">
                    {viewingOrder.items.length > 0 ? (
                      viewingOrder.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span>{item.name}</span>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(item.price)}</div>
                            <div className="text-sm text-gray-600">
                              Qty: {item.quantity || item.kuantitas || 1}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600">Items: {viewingOrder.menu_items}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setViewModalOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}