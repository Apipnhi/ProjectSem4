"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, RefreshCw, CreditCard, Banknote, Smartphone, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("all")
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewingTransaction, setViewingTransaction] = useState<typeof transactions[0] | null>(null)

  // Sample transactions data
  const transactions = [
    {
      id: "TXN-001",
      orderId: "#1234",
      customer: "Table 5",
      amount: 65.2,
      paymentMethod: "cash",
      status: "completed",
      timestamp: "2024-01-15 14:30:00",
      items: ["Grilled Salmon", "Caesar Salad", "Sparkling Water"],
    },
    {
      id: "TXN-002",
      orderId: "#1233",
      customer: "John Smith",
      amount: 28.5,
      paymentMethod: "card",
      status: "completed",
      timestamp: "2024-01-15 14:25:00",
      items: ["Margherita Pizza", "Tiramisu"],
    },
    {
      id: "TXN-003",
      orderId: "#1232",
      customer: "Emma Johnson",
      amount: 42.75,
      paymentMethod: "digital",
      status: "pending",
      timestamp: "2024-01-15 14:20:00",
      items: ["Pasta Carbonara", "Garlic Bread", "Cheesecake"],
    },
    {
      id: "TXN-004",
      orderId: "#1231",
      customer: "Table 8",
      amount: 87.3,
      paymentMethod: "cash",
      status: "completed",
      timestamp: "2024-01-15 14:15:00",
      items: ["Steak", "Mashed Potatoes", "Red Wine"],
    },
    {
      id: "TXN-005",
      orderId: "#1230",
      customer: "Michael Brown",
      amount: 30.9,
      paymentMethod: "card",
      status: "failed",
      timestamp: "2024-01-15 14:10:00",
      items: ["Chicken Curry", "Naan Bread", "Mango Lassi"],
    },
  ]

  // Transaction stats
  const transactionStats = [
    { title: "Total Revenue Today", value: "$1,254.65", change: "+12.5%" },
    { title: "Completed Transactions", value: "45", change: "+8.2%" },
    { title: "Pending Payments", value: "3", change: "-2" },
    { title: "Average Transaction", value: "$32.50", change: "+5.1%" },
  ]

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case "cash":
        return <Banknote className="h-4 w-4" />
      case "card":
        return <CreditCard className="h-4 w-4" />
      case "digital":
        return <Smartphone className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>
      case "failed":
        return <Badge className="bg-red-500">Failed</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === "all" || transaction.status === selectedStatus
    const matchesPaymentMethod = selectedPaymentMethod === "all" || transaction.paymentMethod === selectedPaymentMethod
    return matchesSearch && matchesStatus && matchesPaymentMethod
  })

  return (
    <DashboardLayout title="Transactions">
      <div className="space-y-6">
        {/* Transaction Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {transactionStats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={stat.change.startsWith("+") ? "text-green-500" : "text-red-500"}>{stat.change}</span>{" "}
                  from yesterday
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Transactions Management */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>View and manage all payment transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
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
                setSearchTerm("");
                setSelectedStatus("all");
                setSelectedPaymentMethod("all");
              }}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

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
                    <TableCell className="font-medium">${transaction.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPaymentIcon(transaction.paymentMethod)}
                        <span className="capitalize">{transaction.paymentMethod}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    <TableCell>{new Date(transaction.timestamp).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => { setViewingTransaction(transaction); setViewModalOpen(true); }}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Payment Methods Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Cash Payments</CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$652.50</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500">+15.2%</span> from yesterday
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Card Payments</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$485.90</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500">+8.7%</span> from yesterday
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Digital Payments</CardTitle>
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$116.25</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500">+22.1%</span> from yesterday
              </p>
            </CardContent>
          </Card>
        </div>

        {/* View Transaction Modal */}
        <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transaction Details</DialogTitle>
            </DialogHeader>
            {viewingTransaction && (
              <div className="space-y-2">
                <div><span className="font-semibold">Transaction ID:</span> {viewingTransaction.id}</div>
                <div><span className="font-semibold">Order ID:</span> {viewingTransaction.orderId}</div>
                <div><span className="font-semibold">Customer:</span> {viewingTransaction.customer}</div>
                <div><span className="font-semibold">Amount:</span> ${viewingTransaction.amount.toFixed(2)}</div>
                <div><span className="font-semibold">Payment Method:</span> <span className="capitalize">{viewingTransaction.paymentMethod}</span></div>
                <div><span className="font-semibold">Status:</span> {getStatusBadge(viewingTransaction.status)}</div>
                <div><span className="font-semibold">Date & Time:</span> {new Date(viewingTransaction.timestamp).toLocaleString()}</div>
                <div>
                  <span className="font-semibold">Items:</span>
                  <ul className="list-disc list-inside ml-4">
                    {viewingTransaction.items.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setViewModalOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
