"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { Plus, Edit, Trash2, Sparkles, Package, Search, RefreshCw, TrendingUp, AlertTriangle, CheckCircle, ArrowUp, ArrowDown, Minus } from "lucide-react"

// Add types for editing and deleting
interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
}
interface FoodPack {
  id: number;
  name: string;
  description: string;
  items: string[];
  price: number;
  type: string;
  generated: boolean;
}

// Define MenuTrend type
interface MenuTrend {
  trend: 'rising' | 'declining' | 'stable' | 'new'
  itemName: string
  currentSales: number
  predictedSales: number
  growthRate: number
  reasoning: string
  recommendations: string[]
  category: string
  seasonality?: string
}

interface TrendSummary {
  totalTrends: number
  risingTrends: number
  decliningTrends: number
  newOpportunities: number
  estimatedRevenueImpact: number
}

export default function MenuManagementPage() {
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [isAddPackOpen, setIsAddPackOpen] = useState(false)
  const [isGeneratingPacks, setIsGeneratingPacks] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  // Sample menu items
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
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
  const [foodPacks, setFoodPacks] = useState<FoodPack[]>([
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

  const [newItem, setNewItem] = useState<MenuItem>({
    id: 0,
    name: "",
    description: "",
    price: 0,
    category: "",
    image: "",
    available: true,
  })

  const [newPack, setNewPack] = useState<FoodPack>({
    id: 0,
    name: "",
    description: "",
    items: [],
    price: 0,
    type: "Pack 1",
    generated: false,
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
      ...newItem,
      id: Date.now(),
      price: Number(newItem.price),
      available: true,
    }
    setMenuItems((prev) => [...prev, item])
    setNewItem({ id: 0, name: "", description: "", price: 0, category: "", image: "", available: true })
    setIsAddItemOpen(false)
  }

  const handleAddPack = (e: React.FormEvent) => {
    e.preventDefault()
    const pack = {
      ...newPack,
      id: Date.now(),
      price: Number(newPack.price),
      generated: false,
    }
    setFoodPacks((prev) => [...prev, pack])
    setNewPack({ id: 0, name: "", description: "", items: [], price: 0, type: "Pack 1", generated: false })
    setIsAddPackOpen(false)
  }

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Mock menu sales data for trend predictions
  const mockMenuSales = [
    { name: "Grilled Salmon", sales: 245, revenue: 6125.5 },
    { name: "Caesar Salad", sales: 189, revenue: 2453.11 },
    { name: "Chocolate Cake", sales: 156, revenue: 1402.44 },
    { name: "Margherita Pizza", sales: 134, revenue: 1943.0 },
    { name: "Pasta Carbonara", sales: 98, revenue: 1661.1 },
  ]

  // Function to generate menu trends
  const generateMenuTrends = async () => {
    setIsGeneratingTrends(true)
    setTrendError(null)
    
    try {
      const response = await fetch("/api/generate-menu-trends", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          menuSales: mockMenuSales,
          period: trendPeriod,
        }),
      })

      const data = await response.json()
      
      if (data.trends) {
        setMenuTrends(data.trends)
        setTrendSummary(data.summary)
      } else {
        setTrendError(data.error || "Failed to generate menu trends")
        setMenuTrends(null)
        setTrendSummary(null)
      }
    } catch (error) {
      console.error("Error generating menu trends:", error)
      setTrendError("Failed to generate menu trends")
      setMenuTrends(null)
      setTrendSummary(null)
    }
    
    setIsGeneratingTrends(false)
  }

  // Add state for editing and deleting
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [isEditItemOpen, setIsEditItemOpen] = useState(false)
  const [editingPack, setEditingPack] = useState<FoodPack | null>(null)
  const [isEditPackOpen, setIsEditPackOpen] = useState(false)
  const [deletingPack, setDeletingPack] = useState<FoodPack | null>(null)
  const [isDeletePackOpen, setIsDeletePackOpen] = useState(false)

  // Menu trend states
  const [menuTrends, setMenuTrends] = useState<MenuTrend[] | null>(null)
  const [trendSummary, setTrendSummary] = useState<TrendSummary | null>(null)
  const [isGeneratingTrends, setIsGeneratingTrends] = useState(false)
  const [trendError, setTrendError] = useState<string | null>(null)
  const [trendPeriod, setTrendPeriod] = useState<string>("month")

  // Generate trends on component mount
  useEffect(() => {
    generateMenuTrends()
  }, [trendPeriod])

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
            <TabsTrigger value="trends">AI Trends</TabsTrigger>
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
              <Button variant="outline" size="icon" onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}>
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
                            {item.available ? "Available" : "Sold Out"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => { setEditingItem(item); setIsEditItemOpen(true); }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={item.available ? "destructive" : "default"}
                              size="sm"
                              onClick={() => {
                                setMenuItems((prev) => prev.map((m) => m.id === item.id ? { ...m, available: !m.available } : m))
                              }}
                            >
                              {item.available ? "Mark Sold Out" : "Mark Available"}
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
                              <Button variant="outline" size="sm" onClick={() => { setEditingPack(pack); setIsEditPackOpen(true); }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => { setDeletingPack(pack); setIsDeletePackOpen(true); }}>
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

          <TabsContent value="trends" className="space-y-4">
            {/* AI Menu Trends */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-500" />
                      AI Menu Trend Analysis
                    </CardTitle>
                    <CardDescription>AI-powered menu performance predictions and recommendations</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={trendPeriod} onValueChange={setTrendPeriod}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="week">Next Week</SelectItem>
                        <SelectItem value="month">Next Month</SelectItem>
                        <SelectItem value="quarter">Next Quarter</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={generateMenuTrends}
                      disabled={isGeneratingTrends}
                      variant="outline"
                    >
                      <TrendingUp className="mr-2 h-4 w-4" />
                      {isGeneratingTrends ? "Analyzing..." : "Refresh"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isGeneratingTrends && (
                  <div className="text-center py-8">
                    <div className="text-blue-600 mb-2">Analyzing menu trends...</div>
                    <div className="text-sm text-gray-500">Processing sales data and generating predictions</div>
                  </div>
                )}
                
                {trendError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <span className="text-red-800">{trendError}</span>
                    </div>
                  </div>
                )}

                {menuTrends && trendSummary && (
                  <div className="space-y-6">
                    {/* Trend Summary */}
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="text-center p-4 border rounded-lg bg-blue-50">
                        <h3 className="font-semibold text-lg text-blue-800">Total Trends</h3>
                        <p className="text-2xl font-bold text-blue-600">{trendSummary.totalTrends}</p>
                        <p className="text-xs text-blue-600">Items analyzed</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg bg-green-50">
                        <h3 className="font-semibold text-lg text-green-800">Rising Trends</h3>
                        <p className="text-2xl font-bold text-green-600">{trendSummary.risingTrends}</p>
                        <p className="text-xs text-green-600">Growing items</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg bg-yellow-50">
                        <h3 className="font-semibold text-lg text-yellow-800">New Opportunities</h3>
                        <p className="text-2xl font-bold text-yellow-600">{trendSummary.newOpportunities}</p>
                        <p className="text-xs text-yellow-600">Potential items</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg bg-purple-50">
                        <h3 className="font-semibold text-lg text-purple-800">Revenue Impact</h3>
                        <p className="text-2xl font-bold text-purple-600">${trendSummary.estimatedRevenueImpact.toLocaleString()}</p>
                        <p className="text-xs text-purple-600">Estimated gain</p>
                      </div>
                    </div>

                    {/* Menu Trends List */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Menu Trend Analysis</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        {menuTrends.map((trend, idx) => (
                          <Card key={idx} className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-navy-blue">{trend.itemName}</h4>
                                <p className="text-sm text-gray-600 capitalize">{trend.category}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  className={
                                    trend.trend === 'rising' ? 'bg-green-500' :
                                    trend.trend === 'declining' ? 'bg-red-500' :
                                    trend.trend === 'stable' ? 'bg-blue-500' :
                                    'bg-yellow-500'
                                  }
                                >
                                  {trend.trend}
                                </Badge>
                                {trend.growthRate > 0 ? (
                                  <ArrowUp className="h-4 w-4 text-green-600" />
                                ) : trend.growthRate < 0 ? (
                                  <ArrowDown className="h-4 w-4 text-red-600" />
                                ) : (
                                  <Minus className="h-4 w-4 text-blue-600" />
                                )}
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Current Sales:</span>
                                <span className="font-semibold">{trend.currentSales}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Predicted Sales:</span>
                                <span className="font-semibold">{trend.predictedSales}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Growth Rate:</span>
                                <span className={`font-semibold ${trend.growthRate > 0 ? 'text-green-600' : trend.growthRate < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                                  {trend.growthRate > 0 ? '+' : ''}{trend.growthRate.toFixed(1)}%
                                </span>
                              </div>
                              {trend.seasonality && (
                                <div className="text-xs text-gray-500">
                                  <strong>Seasonality:</strong> {trend.seasonality}
                                </div>
                              )}
                              <div className="text-xs text-gray-500 mt-2">
                                <strong>Reasoning:</strong> {trend.reasoning}
                              </div>
                              {trend.recommendations.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-xs font-semibold text-gray-700 mb-1">Recommendations:</p>
                                  <ul className="text-xs text-gray-600 space-y-1">
                                    {trend.recommendations.map((rec, recIdx) => (
                                      <li key={recIdx} className="flex items-start gap-1">
                                        <CheckCircle className="h-3 w-3 mt-0.5 text-green-600 flex-shrink-0" />
                                        {rec}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
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
                onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
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
              value={Number(newPack.price) || 0}
              onChange={e => setNewPack({ ...newPack, price: Number(e.target.value) })}
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

      {/* Edit Item Popup */}
      <Popup
        isOpen={isEditItemOpen}
        onClose={() => setIsEditItemOpen(false)}
        title="Edit Menu Item"
        description="Edit the details of this menu item"
        size="lg"
      >
        {editingItem && (
          <form
            onSubmit={e => {
              e.preventDefault()
              setMenuItems(prev => prev.map(m => m.id === editingItem.id ? editingItem : m))
              setIsEditItemOpen(false)
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editItemName">Item Name</Label>
                <Input
                  id="editItemName"
                  value={editingItem.name}
                  onChange={e => setEditingItem({ ...editingItem!, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editItemCategory">Category</Label>
                <Select value={editingItem.category} onValueChange={value => setEditingItem({ ...editingItem!, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.slice(1).map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editItemDescription">Description</Label>
              <Textarea
                id="editItemDescription"
                value={editingItem.description}
                onChange={e => setEditingItem({ ...editingItem!, description: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editItemPrice">Price ($)</Label>
                <Input
                  id="editItemPrice"
                  type="number"
                  step="0.01"
                  value={editingItem.price}
                  onChange={e => setEditingItem({ ...editingItem!, price: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editItemImage">Image URL</Label>
                <Input
                  id="editItemImage"
                  value={editingItem.image}
                  onChange={e => setEditingItem({ ...editingItem!, image: e.target.value })}
                  placeholder="/placeholder.svg?height=100&width=100"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditItemOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-navy-blue hover:bg-navy-blue-700">
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Popup>

      {/* Edit Pack Popup */}
      <Popup
        isOpen={isEditPackOpen}
        onClose={() => setIsEditPackOpen(false)}
        title="Edit Food Pack"
        description="Edit the details of this food pack"
        size="lg"
      >
        {editingPack && (
          <form
            onSubmit={e => {
              e.preventDefault()
              setFoodPacks(prev => prev.map(p => p.id === editingPack.id ? editingPack : p))
              setIsEditPackOpen(false)
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editPackName">Pack Name</Label>
                <Input
                  id="editPackName"
                  value={editingPack.name}
                  onChange={e => setEditingPack({ ...editingPack!, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPackType">Pack Type</Label>
                <Select value={editingPack.type} onValueChange={value => setEditingPack({ ...editingPack!, type: value })}>
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
              <Label htmlFor="editPackDescription">Description</Label>
              <Textarea
                id="editPackDescription"
                value={editingPack.description}
                onChange={e => setEditingPack({ ...editingPack!, description: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPackPrice">Price ($)</Label>
              <Input
                id="editPackPrice"
                type="number"
                step="0.01"
                value={editingPack.price}
                onChange={e => setEditingPack({ ...editingPack!, price: Number(e.target.value) })}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditPackOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-navy-blue hover:bg-navy-blue-700">
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Popup>

      {/* Delete Pack Confirmation Popup */}
      <Popup
        isOpen={isDeletePackOpen}
        onClose={() => setIsDeletePackOpen(false)}
        title="Delete Food Pack"
        description="Are you sure you want to delete this food pack? This action cannot be undone."
        size="sm"
      >
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setIsDeletePackOpen(false)}>
            Cancel
          </Button>
          <Button type="button" className="bg-red-600 hover:bg-red-700" onClick={() => {
            setFoodPacks(prev => prev.filter(p => p.id !== deletingPack?.id))
            setIsDeletePackOpen(false)
          }}>
            Delete
          </Button>
        </div>
      </Popup>
    </DashboardLayout>
  )
}
