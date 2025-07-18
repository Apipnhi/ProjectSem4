// app/dashboard/transactions/page.tsx - Connected to Backend API
"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, RefreshCw, CreditCard, Banknote, Smartphone, Eye, Download, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"

// Types from backend
interface TransactionData {
  id: string;
  orderId: string;
  customer: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'digital';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  timestamp: string | Date;
  restaurant_id: number;
  restaurant_name: string;
  items: string[];
  total_items: number;
  total_quantity: number;
  vs_restaurant_avg?: number;
  daily_transaction_count?: number;
  amount_category?: 'low' | 'medium' | 'high';
  time_period?: 'morning' | 'afternoon' | 'evening';
}

interface TransactionSummary {
  total_transactions: number;
  total_revenue: number;
  avg_transaction_value: number;
  payment_methods: {
    cash: number;
    card: number;
    digital: number;
  };
  status_distribution: {
    completed: number;
    failed: number;
    pending: number;
  };
  today_revenue: number;
  today_transactions: number;
  revenue_growth: number;
}

interface TransactionResponse {
  success: boolean;
  data?: {
    transactions: TransactionData[];
    summary: TransactionSummary;
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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionData[]>([])
  const [summary, setSummary] = useState<TransactionSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("all")
  const [pagination, setPagination] = useState({ total: 0, limit: 50, offset: 0, hasMore: false })
  
  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewingTransaction, setViewingTransaction] = useState<TransactionData | null>(null)
  
  const { toast } = useToast()

  // Fetch transactions from backend API
  const fetchTransactions = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
        restaurant_id: "1" // Default restaurant
      })

      if (selectedStatus !== "all") {
        params.append("status", selectedStatus)
      }

      if (selectedPaymentMethod !== "all") {
        params.append("payment_method", selectedPaymentMethod)
      }

      if (searchTerm) {
        params.append("search", searchTerm)
      }

      const response = await fetch(`/api/transactions?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: TransactionResponse = await response.json()

      if (result.success && result.data) {
        setTransactions(result.data.transactions)
        setSummary(result.data.summary)
        setPagination(result.data.pagination)
      } else {
        throw new Error(result.error || 'Failed to fetch transactions')
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch transactions')
      toast({
        title: "Error",
        description: "Failed to fetch transactions. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Create new transaction
  const createTransaction = async (transactionData: {
    order_id: string;
    customer_id: string;
    amount: number;
    payment_method: string;
    restaurant_id: number;
  }) => {
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData)
      })

      const result = await response.json()

      if (result.success) {
        // Refresh transactions list
        fetchTransactions()
        
        toast({
          title: "Success",
          description: `Transaction ${result.data.transaction.id} created successfully`,
        })
      } else {
        throw new Error(result.error || 'Failed to create transaction')
      }
    } catch (error) {
      console.error('Error creating transaction:', error)
      toast({
        title: "Error",
        description: "Failed to create transaction. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Update transaction status
  const updateTransactionStatus = async (transactionId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/transactions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction_id: transactionId,
          status: newStatus,
          notes: `Status updated to ${newStatus} via dashboard`
        })
      })

      const result = await response.json()

      if (result.success) {
        // Update local state
        setTransactions(prevTransactions => 
          prevTransactions.map(transaction => 
            transaction.id === transactionId 
              ? { ...transaction, status: newStatus as any }
              : transaction
          )
        )

        toast({
          title: "Success",
          description: `Transaction ${transactionId} status updated to ${newStatus}`,
        })
      } else {
        throw new Error(result.error || 'Failed to update transaction status')
      }
    } catch (error) {
      console.error('Error updating transaction status:', error)
      toast({
        title: "Error",
        description: "Failed to update transaction status. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Load transactions on component mount and when filters change
  useEffect(() => {
    fetchTransactions()
  }, [selectedStatus, selectedPaymentMethod, searchTerm])

  // Get payment method icon
  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'card':
        return <CreditCard className="h-4 w-4" />
      case 'cash':
        return <Banknote className="h-4 w-4" />
      case 'digital':
        return <Smartphone className="h-4 w-4" />
      default:
        return <Banknote className="h-4 w-4" />
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, className: "bg-yellow-100 text-yellow-800" },
      completed: { variant: "default" as const, className: "bg-green-100 text-green-800" },
      failed: { variant: "destructive" as const, className: "bg-red-100 text-red-800" },
      refunded: { variant: "outline" as const, className: "bg-blue-100 text-blue-800" }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

    return (
      <Badge variant={config.variant} className={config.className}>
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

  // Filter transactions based on search and filters
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = searchTerm === "" || 
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.customer.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = selectedStatus === "all" || transaction.status === selectedStatus
    const matchesPayment = selectedPaymentMethod === "all" || transaction.paymentMethod === selectedPaymentMethod

    return matchesSearch && matchesStatus && matchesPayment
  })

  if (error) {
    return (
      <DashboardLayout title="Transactions - Error">
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="flex items-center justify-center h-96">
              <div className="text-center">
                <CreditCard className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Error Loading Transactions</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={fetchTransactions}>
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
    <DashboardLayout title="Transactions">
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Transactions</h1>
            <p className="text-gray-600">Track and manage payment transactions</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchTransactions} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(summary.total_revenue)}</p>
                  </div>
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <div className="flex items-center mt-2">
                  {summary.revenue_growth >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${summary.revenue_growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.abs(summary.revenue_growth).toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                    <p className="text-2xl font-bold">{summary.total_transactions.toLocaleString()}</p>
                  </div>
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {summary.today_transactions} today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Transaction</p>
                    <p className="text-2xl font-bold">{formatCurrency(summary.avg_transaction_value)}</p>
                  </div>
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Banknote className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Per transaction average
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(summary.today_revenue)}</p>
                  </div>
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Smartphone className="h-4 w-4 text-orange-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  From {summary.today_transactions} transactions
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payment Methods Summary */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Cash</span>
                  </div>
                  <span className="font-bold">{summary.payment_methods.cash}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Card</span>
                  </div>
                  <span className="font-bold">{summary.payment_methods.card}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">Digital</span>
                  </div>
                  <span className="font-bold">{summary.payment_methods.digital}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              Transactions ({pagination.total})
              {isLoading && <span className="text-sm font-normal text-gray-500 ml-2">Loading...</span>}
            </CardTitle>
            <CardDescription>
              View and manage all payment transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input 
                    placeholder="Search transactions..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="digital">Digital</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => {
                  setSearchTerm("")
                  setSelectedStatus("all")
                  setSelectedPaymentMethod("all")
                }}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Transactions Table */}
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Loading transactions...</p>
                </div>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
                <p className="text-gray-600">No transactions match your current filters.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.id}</TableCell>
                      <TableCell>{transaction.orderId}</TableCell>
                      <TableCell>{transaction.customer}</TableCell>
                      <TableCell className="font-medium">
                        <div>
                          {formatCurrency(transaction.amount)}
                          {transaction.amount_category && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {transaction.amount_category}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPaymentIcon(transaction.paymentMethod)}
                          <span className="capitalize">{transaction.paymentMethod}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDateTime(transaction.timestamp)}</div>
                          {transaction.time_period && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {transaction.time_period}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setViewingTransaction(transaction)
                              setViewModalOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {transaction.status === "pending" && (
                            <Button 
                              size="sm"
                              onClick={() => updateTransactionStatus(transaction.id, "completed")}
                            >
                              Confirm
                            </Button>
                          )}
                          
                          {transaction.status === "completed" && (
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => updateTransactionStatus(transaction.id, "refunded")}
                            >
                              Refund
                            </Button>
                          )}
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
                Showing {transactions.length} of {pagination.total} transactions
                {pagination.hasMore && " (load more available)"}
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Transaction Modal */}
        <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Transaction Details</DialogTitle>
            </DialogHeader>
            {viewingTransaction && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold">Transaction ID:</label>
                    <p>{viewingTransaction.id}</p>
                  </div>
                  <div>
                    <label className="font-semibold">Order ID:</label>
                    <p>{viewingTransaction.orderId}</p>
                  </div>
                  <div>
                    <label className="font-semibold">Customer:</label>
                    <p>{viewingTransaction.customer}</p>
                  </div>
                  <div>
                    <label className="font-semibold">Amount:</label>
                    <p className="font-bold text-lg">{formatCurrency(viewingTransaction.amount)}</p>
                  </div>
                  <div>
                    <label className="font-semibold">Payment Method:</label>
                    <div className="flex items-center gap-2 mt-1">
                      {getPaymentIcon(viewingTransaction.paymentMethod)}
                      <span className="capitalize">{viewingTransaction.paymentMethod}</span>
                    </div>
                  </div>
                  <div>
                    <label className="font-semibold">Status:</label>
                    <div className="mt-1">{getStatusBadge(viewingTransaction.status)}</div>
                  </div>
                  <div>
                    <label className="font-semibold">Date & Time:</label>
                    <p>{formatDateTime(viewingTransaction.timestamp)}</p>
                  </div>
                  <div>
                    <label className="font-semibold">Restaurant:</label>
                    <p>{viewingTransaction.restaurant_name}</p>
                  </div>
                </div>
                
                {viewingTransaction.items.length > 0 && (
                  <div>
                    <label className="font-semibold">Items:</label>
                    <div className="mt-2">
                      <Badge variant="outline" className="mr-2">
                        {viewingTransaction.total_items} items
                      </Badge>
                      <Badge variant="outline">
                        {viewingTransaction.total_quantity} total qty
                      </Badge>
                      <div className="mt-2 text-sm text-gray-600">
                        {viewingTransaction.items.join(', ')}
                      </div>
                    </div>
                  </div>
                )}

                {viewingTransaction.vs_restaurant_avg && (
                  <div>
                    <label className="font-semibold">Performance vs Restaurant Average:</label>
                    <p className={`${viewingTransaction.vs_restaurant_avg > 1 ? 'text-green-600' : 'text-red-600'}`}>
                      {(viewingTransaction.vs_restaurant_avg * 100).toFixed(1)}% of average
                    </p>
                  </div>
                )}
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