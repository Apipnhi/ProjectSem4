"use client"

import type React from "react"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Popup } from "@/components/ui/popup"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, Sparkles, Package, Search, RefreshCw } from "lucide-react"

export default function MenuManagementPage() {
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [isAddPackOpen, setIsAddPackOpen] = useState(false)
  const [isGeneratingPacks, setIsGeneratingPacks] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  // Sample menu items
  const [menuItems, setMenuItems] = useState([
    {
      id: 1,
      name: "Grilled Salmon",
      description: "Fresh Atlantic salmon grilled to perfection with herbs",
      price: 24.99,
      category: "Main Course",
      image: "/placeholder.svg?height=100&width=100",
      available: true,
    },
    {
      id: 2,
      name: "Caesar Salad",
      description: "Crisp romaine lettuce with parmesan and croutons",
      price: 12.99,
      category: "Salad",
      image: "/placeholder.svg?height=100&width=100",
      available: true,
    },
    {
      id: 3,
      name: "Chocolate Cake",
      description: "Rich chocolate cake with vanilla ice cream",
      price: 8.99,
      category: "Dessert",
      image: "/placeholder.svg?height=100&width=100",
      available: true,
    },
    {
      id: 4,
      name: "Coca Cola",
      description: "Refreshing cola drink",
      price: 2.99,
      category: "Beverage",
      image: "/placeholder.svg?height=100&width=100",
      available: true,
    },
  ])

  // Sample food packs
  const [foodPacks, setFoodPacks] = useState([
    {
      id: 1,
      name: "Lunch Pack 1",
      description: "Grilled Salmon + Coca Cola",
      items: ["Grilled Salmon", "Coca Cola"],
      price: 25.99,
      type: "Pack 1",
      generated: false,
    },
    {
      id: 2,
      name: "Family Pack",
      description: "Caesar Salad + Coca Cola + Chocolate Cake",
      items: ["Caesar Salad", "Coca Cola", "Chocolate Cake"],
      price: 22.99,
      type: "Pack 2",
      generated: false,
    },
  ])

  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image: "",
  })

  const [newPack, setNewPack] = useState({
    name: "",
    description: "",
    items: [],
    price: "",
    type: "Pack 1",
  })

  const categories = ["all", "Main Course", "Salad", "Dessert", "Beverage", "Appetizer"]

  const generateFoodPacks = async () => {
    setIsGeneratingPacks(true)

    try {
      const response = await fetch("/api/generate-packs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ menuItems }),
      })

      const data = await response.json()

      if (data.packs) {
        setFoodPacks((prev) => [...prev, ...data.packs])
      }
    } catch (error) {
      console.error("Error generating packs:", error)
      // Fallback to mock generated packs
      const mockPacks = [
        {
          id: Date.now() + 1,
          name: "AI Generated Pack 1",
          description: "Grilled Salmon + Coca Cola (AI Recommended)",
          items: ["Grilled Salmon", "Coca Cola"],
          price: 24.99,
          type: "Pack 1",
          generated: true,
        },
        {
          id: Date.now() + 2,
          name: "AI Generated Pack 2",
          description: "Caesar Salad + Coca Cola + Chocolate Cake (AI Recommended)",
          items: ["Caesar Salad", "Coca Cola", "Chocolate Cake"],
          price: 21.99,
          type: "Pack 2",
          generated: true,
        },
      ]
      setFoodPacks((prev) => [...prev, ...mockPacks])
    }

    setIsGeneratingPacks(false)
  }

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault()
    const item = {
      id: Date.now(),
      ...newItem,
      price: Number.parseFloat(newItem.price),
      available: true,
    }
    setMenuItems((prev) => [...prev, item])
    setNewItem({ name: "", description: "", price: "", category: "", image: "" })
    setIsAddItemOpen(false)
  }

  const handleAddPack = (e: React.FormEvent) => {
    e.preventDefault()
    const pack = {
      id: Date.now(),
      ...newPack,
      price: Number.parseFloat(newPack.price),
      generated: false,
    }
    setFoodPacks((prev) => [...prev, pack])
    setNewPack({ name: "", description: "", items: [], price: "", type: "Pack 1" })
    setIsAddPackOpen(false)
  }

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <DashboardLayout title="Menu Management">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-navy-blue">Menu Management</h2>
            <p className="text-gray-600">Manage your restaurant menu items and food packs</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsAddItemOpen(true)} className="bg-navy-blue hover:bg-navy-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
            <Button onClick={() => setIsAddPackOpen(true)} variant="outline">
              <Package className="mr-2 h-4 w-4" />
              Create Pack
            </Button>
            <Button onClick={generateFoodPacks} variant="outline" disabled={isGeneratingPacks}>
              <Sparkles className="mr-2 h-4 w-4" />
              {isGeneratingPacks ? "Generating..." : "AI Generate Packs"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="items" className="space-y-4">
          <TabsList>
            <TabsTrigger value="items">Menu Items</TabsTrigger>
            <TabsTrigger value="packs">Food Packs</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-4">
            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search menu items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {/* Menu Items Table */}
            <Card>
              <CardHeader>
                <CardTitle>Menu Items ({filteredItems.length})</CardTitle>
                <CardDescription>Manage your restaurant menu items</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <img
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category}</Badge>
                        </TableCell>
                        <TableCell>${item.price.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={item.available ? "bg-green-500" : "bg-red-500"}>
                            {item.available ? "Available" : "Unavailable"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="packs" className="space-y-4">
            {/* Food Packs */}
            <Card>
              <CardHeader>
                <CardTitle>Food Packs ({foodPacks.length})</CardTitle>
                <CardDescription>Manage your restaurant food pack combinations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {foodPacks.map((pack) => (
                    <Card key={pack.id} className="relative">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{pack.name}</CardTitle>
                          {pack.generated && (
                            <Badge className="bg-purple-500">
                              <Sparkles className="h-3 w-3 mr-1" />
                              AI Generated
                            </Badge>
                          )}
                        </div>
                        <CardDescription>{pack.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <Badge variant="outline">{pack.type}</Badge>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Items:</p>
                            <ul className="text-sm">
                              {pack.items.map((item, index) => (
                                <li key={index}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="flex justify-between items-center pt-2">
                            <span className="text-lg font-bold">${pack.price.toFixed(2)}</span>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Item Popup */}
      <Popup
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        title="Add New Menu Item"
        description="Create a new item for your restaurant menu"
        size="lg"
      >
        <form onSubmit={handleAddItem} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="itemName">Item Name</Label>
              <Input
                id="itemName"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemCategory">Category</Label>
              <Select value={newItem.category} onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.slice(1).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="itemDescription">Description</Label>
            <Textarea
              id="itemDescription"
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="itemPrice">Price ($)</Label>
              <Input
                id="itemPrice"
                type="number"
                step="0.01"
                value={newItem.price}
                onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemImage">Image URL</Label>
              <Input
                id="itemImage"
                value={newItem.image}
                onChange={(e) => setNewItem({ ...newItem, image: e.target.value })}
                placeholder="/placeholder.svg?height=100&width=100"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAddItemOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-navy-blue hover:bg-navy-blue-700">
              Add Item
            </Button>
          </div>
        </form>
      </Popup>

      {/* Add Pack Popup */}
      <Popup
        isOpen={isAddPackOpen}
        onClose={() => setIsAddPackOpen(false)}
        title="Create Food Pack"
        description="Create a new food pack combination"
        size="lg"
      >
        <form onSubmit={handleAddPack} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="packName">Pack Name</Label>
              <Input
                id="packName"
                value={newPack.name}
                onChange={(e) => setNewPack({ ...newPack, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="packType">Pack Type</Label>
              <Select value={newPack.type} onValueChange={(value) => setNewPack({ ...newPack, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pack 1">Pack 1 (1 food + 1 drink)</SelectItem>
                  <SelectItem value="Pack 2">Pack 2 (1 food + 1 drink + 1 snack)</SelectItem>
                  <SelectItem value="Pack 3">Pack 3 (Most paired items)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="packDescription">Description</Label>
            <Textarea
              id="packDescription"
              value={newPack.description}
              onChange={(e) => setNewPack({ ...newPack, description: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="packPrice">Price ($)</Label>
            <Input
              id="packPrice"
              type="number"
              step="0.01"
              value={newPack.price}
              onChange={(e) => setNewPack({ ...newPack, price: e.target.value })}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAddPackOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-navy-blue hover:bg-navy-blue-700">
              Create Pack
            </Button>
          </div>
        </form>
      </Popup>
    </DashboardLayout>
  )
}
