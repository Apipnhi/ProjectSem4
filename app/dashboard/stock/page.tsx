"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus, Filter, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

// Define StockItem type
interface StockItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  status: string;
  lastUpdated: string;
}

export default function StockManagementPage() {
  // Sample inventory data
  const [inventoryItems, setInventoryItems] = useState<StockItem[]>([
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
  ])
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<StockItem | null>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [updateModalOpen, setUpdateModalOpen] = useState(false)
  const [updatingItem, setUpdatingItem] = useState<StockItem | null>(null)

  // Stats for inventory overview
  const inventoryStats = [
    { title: "Total Items", value: "124", change: "+3" },
    { title: "Low Stock Items", value: "18", change: "-2" },
    { title: "Out of Stock", value: "5", change: "-1" },
    { title: "Value of Inventory", value: "$12,450", change: "+$320" },
  ]

  // Helper to auto-calculate status
  function getStatus(quantity: number) {
    if (quantity === 0) return "Out of Stock"
    if (quantity <= 5) return "Low Stock"
    return "In Stock"
  }

  // Filtered and searched items
  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus ? item.status === filterStatus : true
    const matchesCategory = filterCategory ? item.category === filterCategory : true
    return matchesSearch && matchesStatus && matchesCategory
  })

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
          <Button onClick={() => setAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input placeholder="Search inventory..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setFilterModalOpen(true)}>
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => {
                setSearchTerm("");
                setFilterStatus(null);
                setFilterCategory(null);
              }}>
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
              {filteredItems.map((item) => (
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
                      <Button variant="default" size="sm" onClick={() => { setEditingItem(item); setEditModalOpen(true); }}>
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setUpdatingItem(item); setUpdateModalOpen(true); }}>
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

      {/* Edit Stock Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Stock Item</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <form
              onSubmit={e => {
                e.preventDefault()
                if (!editingItem) return;
                const form = e.target as HTMLFormElement
                const formData = new FormData(form)
                const updatedItem: StockItem = {
                  ...editingItem,
                  name: String(formData.get("name") ?? ""),
                  category: String(formData.get("category") ?? ""),
                  quantity: Number(formData.get("quantity") ?? 0),
                  unit: String(formData.get("unit") ?? ""),
                  status: String(formData.get("status") ?? ""),
                }
                setInventoryItems((items: StockItem[]) => items.map(i => i.id === updatedItem.id ? updatedItem : i))
                setEditModalOpen(false)
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input name="name" defaultValue={editingItem.name} className="w-full border rounded px-2 py-1" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <input name="category" defaultValue={editingItem.category} className="w-full border rounded px-2 py-1" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <input name="quantity" type="number" defaultValue={editingItem.quantity} className="w-full border rounded px-2 py-1" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit</label>
                <input name="unit" defaultValue={editingItem.unit} className="w-full border rounded px-2 py-1" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  name="status"
                  defaultValue={editingItem.status}
                  className="w-full border rounded px-2 py-1 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-navy-blue"
                >
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>
              <DialogFooter>
                <Button type="submit">Save</Button>
                <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Item Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={e => {
              e.preventDefault()
              const form = e.target as HTMLFormElement
              const formData = new FormData(form)
              const quantity = Number(formData.get("quantity") ?? 0)
              const newItem: StockItem = {
                id: Math.max(0, ...inventoryItems.map(i => i.id)) + 1,
                name: String(formData.get("name") ?? ""),
                category: String(formData.get("category") ?? ""),
                quantity,
                unit: String(formData.get("unit") ?? ""),
                status: getStatus(quantity),
                lastUpdated: new Date().toLocaleString(),
              }
              setInventoryItems(items => [...items, newItem])
              setAddModalOpen(false)
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input name="name" className="w-full border rounded px-2 py-1" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <input name="category" className="w-full border rounded px-2 py-1" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <input name="quantity" type="number" className="w-full border rounded px-2 py-1" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unit</label>
              <input name="unit" className="w-full border rounded px-2 py-1" required />
            </div>
            <DialogFooter>
              <Button type="submit">Add</Button>
              <Button type="button" variant="outline" onClick={() => setAddModalOpen(false)}>Cancel</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Filter Modal */}
      <Dialog open={filterModalOpen} onOpenChange={setFilterModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter Inventory</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={e => {
              e.preventDefault()
              const form = e.target as HTMLFormElement
              const formData = new FormData(form)
              setFilterStatus(formData.get("status") ? String(formData.get("status")) : null)
              setFilterCategory(formData.get("category") ? String(formData.get("category")) : null)
              setFilterModalOpen(false)
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1">Stock Status</label>
              <select name="status" defaultValue={filterStatus ?? ""} className="w-full border rounded px-2 py-1 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-navy-blue">
                <option value="">All</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <input name="category" defaultValue={filterCategory ?? ""} className="w-full border rounded px-2 py-1" />
            </div>
            <DialogFooter>
              <Button type="submit">Apply</Button>
              <Button type="button" variant="outline" onClick={() => setFilterModalOpen(false)}>Cancel</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Update Quantity Modal */}
      <Dialog open={updateModalOpen} onOpenChange={setUpdateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Quantity</DialogTitle>
          </DialogHeader>
          {updatingItem && (
            <form
              onSubmit={e => {
                e.preventDefault()
                const form = e.target as HTMLFormElement
                const formData = new FormData(form)
                const quantity = Number(formData.get("quantity") ?? updatingItem.quantity)
                const unit = String(formData.get("unit") ?? updatingItem.unit)
                const updatedItem: StockItem = {
                  ...updatingItem,
                  quantity,
                  unit,
                  status: getStatus(quantity),
                  lastUpdated: new Date().toLocaleString(),
                }
                setInventoryItems(items => items.map(i => i.id === updatedItem.id ? updatedItem : i))
                setUpdateModalOpen(false)
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <input name="quantity" type="number" defaultValue={updatingItem.quantity} className="w-full border rounded px-2 py-1" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit</label>
                <input name="unit" defaultValue={updatingItem.unit} className="w-full border rounded px-2 py-1" required />
              </div>
              <DialogFooter>
                <Button type="submit">Update</Button>
                <Button type="button" variant="outline" onClick={() => setUpdateModalOpen(false)}>Cancel</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
