"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Filter, RefreshCw, Eye, CheckCircle, XCircle, Clock } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function OrdersManagementPage() {
  const [selectedTab, setSelectedTab] = useState("all")

  // Sample orders data
  const orders = [
    {
      id: "#1234",
      customer: "Table 5",
      items: [
        { name: "Grilled Salmon", quantity: 2, price: 24.5 },
        { name: "Caesar Salad", quantity: 1, price: 8.95 },
        { name: "Sparkling Water", quantity: 2, price: 3.5 },
      ],
      total: 65.2,
      status: "pending",
      time: "5 min ago",
      type: "dine-in",
    },
    {
      id: "#1233",
      customer: "John Smith",
      items: [
        { name: "Margherita Pizza", quantity: 1, price: 14.5 },
        { name: "Tiramisu", quantity: 1, price: 7.95 },
      ],
      total: 28.5,
      status: "in-progress",
      time: "12 min ago",
      type: "takeout",
    },
    {
      id: "#1232",
      customer: "Emma Johnson",
      items: [
        { name: "Pasta Carbonara", quantity: 1, price: 16.95 },
        { name: "Garlic Bread", quantity: 1, price: 4.5 },
        { name: "Cheesecake", quantity: 1, price: 6.95 },
      ],
      total: 42.75,
      status: "ready",
      time: "18 min ago",
      type: "delivery",
    },
    {
      id: "#1231",
      customer: "Table 8",
      items: [
        { name: "Steak", quantity: 2, price: 32.95 },
        { name: "Mashed Potatoes", quantity: 2, price: 5.95 },
        { name: "Red Wine", quantity: 1, price: 9.5 },
      ],
      total: 87.3,
      status: "completed",
      time: "25 min ago",
      type: "dine-in",
    },
    {
      id: "#1230",
      customer: "Michael Brown",
      items: [
        { name: "Chicken Curry", quantity: 1, price: 18.95 },
        { name: "Naan Bread", quantity: 2, price: 3.5 },
        { name: "Mango Lassi", quantity: 1, price: 4.95 },
      ],
      total: 30.9,
      status: "cancelled",
      time: "35 min ago",
      type: "delivery",
    },
  ]

  // Filter orders based on selected tab
  const filteredOrders = selectedTab === "all" ? orders : orders.filter((order) => order.status === selectedTab)

  // Stats for orders overview
  const orderStats = [
    { title: "New Orders", value: "12", change: "+3" },
    { title: "In Progress", value: "8", change: "+2" },
    { title: "Ready for Pickup", value: "5", change: "-1" },
    { title: "Completed Today", value: "45", change: "+15" },
  ]

  // Function to get badge color based on status
  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>
      case "in-progress":
        return <Badge className="bg-blue-500">In Progress</Badge>
      case "ready":
        return <Badge className="bg-green-500">Ready</Badge>
      case "completed":
        return <Badge className="bg-navy-blue">Completed</Badge>
      case "cancelled":
        return <Badge className="bg-red-500">Cancelled</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  // Function to get icon based on status
  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 mr-1" />
      case "in-progress":
        return <RefreshCw className="h-4 w-4 mr-1" />
      case "ready":
        return <CheckCircle className="h-4 w-4 mr-1" />
      case "completed":
        return <CheckCircle className="h-4 w-4 mr-1" />
      case "cancelled":
        return <XCircle className="h-4 w-4 mr-1" />
      default:
        return null
    }
  }

  return (
    <DashboardLayout title="Orders Management">
      {/* Order Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {orderStats.map((stat, index) => (
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

      {/* Orders Management */}
      <Card>
        <CardHeader>
          <CardTitle>Incoming Orders</CardTitle>
          <CardDescription>Manage and track customer orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input placeholder="Search orders..." />
            </div>
            <div className="flex gap-2">
              <Select defaultValue="all">
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
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Tabs defaultValue="all" className="mb-6" onValueChange={setSelectedTab}>
            <TabsList>
              <TabsTrigger value="all">All Orders</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="ready">Ready</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>
          </Tabs>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{order.items.length} items</TableCell>
                  <TableCell>${order.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {getStatusIcon(order.status)}
                      {getStatusBadge(order.status)}
                    </div>
                  </TableCell>
                  <TableCell>{order.time}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {order.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {order.status === "pending" && <Button size="sm">Process</Button>}
                      {order.status === "in-progress" && <Button size="sm">Mark Ready</Button>}
                      {order.status === "ready" && <Button size="sm">Complete</Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
