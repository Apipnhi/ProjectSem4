"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus, Filter, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function StockManagementPage() {
  // Sample inventory data
  const inventoryItems = [
    {
      id: 1,
      name: "Chicken Breast",
      category: "Meat",
      quantity: 25,
      unit: "kg",
      status: "In Stock",
      lastUpdated: "Today, 9:30 AM",
    },
    {
      id: 2,
      name: "Olive Oil",
      category: "Oils",
      quantity: 5,
      unit: "liters",
      status: "Low Stock",
      lastUpdated: "Yesterday, 2:15 PM",
    },
    {
      id: 3,
      name: "Basmati Rice",
      category: "Grains",
      quantity: 30,
      unit: "kg",
      status: "In Stock",
      lastUpdated: "2 days ago",
    },
    {
      id: 4,
      name: "Fresh Tomatoes",
      category: "Vegetables",
      quantity: 8,
      unit: "kg",
      status: "Low Stock",
      lastUpdated: "Today, 8:00 AM",
    },
    {
      id: 5,
      name: "Heavy Cream",
      category: "Dairy",
      quantity: 12,
      unit: "liters",
      status: "In Stock",
      lastUpdated: "Yesterday, 11:45 AM",
    },
    {
      id: 6,
      name: "Vanilla Extract",
      category: "Baking",
      quantity: 2,
      unit: "bottles",
      status: "Low Stock",
      lastUpdated: "3 days ago",
    },
  ]

  // Stats for inventory overview
  const inventoryStats = [
    { title: "Total Items", value: "124", change: "+3" },
    { title: "Low Stock Items", value: "18", change: "-2" },
    { title: "Out of Stock", value: "5", change: "-1" },
    { title: "Value of Inventory", value: "$12,450", change: "+$320" },
  ]

  return (
    <DashboardLayout title="Stock Management">
      {/* Inventory Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {inventoryStats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={stat.change.startsWith("+") ? "text-green-500" : "text-red-500"}>{stat.change}</span>{" "}
                from last week
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Inventory Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Inventory Items</CardTitle>
            <CardDescription>Manage your restaurant inventory</CardDescription>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input placeholder="Search inventory..." />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>
                    {item.quantity} {item.unit}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        item.status === "In Stock"
                          ? "bg-green-500"
                          : item.status === "Low Stock"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.lastUpdated}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        Update
                      </Button>
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
