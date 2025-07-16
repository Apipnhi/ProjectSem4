// app/dashboard/menu/page.tsx - Updated version
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

// Types
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
  reasoning?: string;
  discountPercent?: number;
}

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
  confidence: number
}

interface TrendSummary {
  totalTrends: number
  risingTrends: number
  decliningTrends: number
  stableTrends: number
  newOpportunities: number
  estimatedRevenueImpact: number
}

export default function MenuManagementPage() {
  // State for UI
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [isAddPackOpen, setIsAddPackOpen] = useState(false)
  const [isGeneratingPacks, setIsGeneratingPacks] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // State for data
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<string[]>(['all'])
  const [existingPacks, setExistingPacks] = useState<FoodPack[]>([])
  const [aiRecommendations, setAiRecommendations] = useState<FoodPack[]>([])
  
  // State for menu trends
  const [menuTrends, setMenuTrends] = useState<MenuTrend[] | null>(null)
  const [trendSummary, setTrendSummary] = useState<TrendSummary | null>(null)
  const [isGeneratingTrends, setIsGeneratingTrends] = useState(false)
  const [trendError, setTrendError] = useState<string | null>(null)
  const [trendPeriod, setTrendPeriod] = useState<string>("month")

  // State for forms
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: "",
    description: "",
    price: 0,
    category: "",
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

  // State for editing
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [isEditItemOpen, setIsEditItemOpen] = useState(false)
  const [editingPack, setEditingPack] = useState<FoodPack | null>(null)
  const [isEditPackOpen, setIsEditPackOpen] = useState(false)
  const [deletingPack, setDeletingPack] = useState<FoodPack | null>(null)
  const [isDeletePackOpen, setIsDeletePackOpen] = useState(false)

  // Fetch menu items from backend
  const fetchMenuItems = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/menu?restaurant_id=1')
      const data = await response.json()
      
      if (data.success) {
        setMenuItems(data.data)
        setCategories(data.categories)
        console.log(`Loaded ${data.data.length} menu items`)
      } else {
        setError(data.error || 'Failed to fetch menu items')
      }
    } catch (error) {
      console.error('Error fetching menu items:', error)
      setError('Failed to fetch menu items')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch existing food packs
  const fetchExistingPacks = async () => {
    try {
      const response = await fetch('/api/food-packs?restaurant_id=1&type=existing')
      const data = await response.json()
      
      if (data.success) {
        setExistingPacks(data.data)
        console.log(`Loaded ${data.data.length} existing packs`)
      }
    } catch (error) {
      console.error('Error fetching existing packs:', error)
    }
  }

  // Generate AI pack recommendations
  const generateFoodPacks = async () => {
    setIsGeneratingPacks(true)
    try {
      const response = await fetch('/api/food-packs?restaurant_id=1&type=recommendations')
      const data = await response.json()
      
      if (data.success) {
        setAiRecommendations(data.data)
        console.log(`Generated ${data.data.length} AI pack recommendations`)
      } else {
        console.error('Failed to generate pack recommendations:', data.error)
        setError(data.error || 'Failed to generate pack recommendations')
      }
    } catch (error) {
      console.error('Error generating pack recommendations:', error)
      setError('Failed to generate pack recommendations')
    } finally {
      setIsGeneratingPacks(false)
    }
  }

  // Save selected AI pack to database
  const saveSelectedPack = async (pack: FoodPack) => {
    try {
      const response = await fetch('/api/food-packs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedPack: pack,
          restaurantId: 1
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Remove from AI recommendations and add to existing packs
        setAiRecommendations(prev => prev.filter(p => p.id !== pack.id))
        setExistingPacks(prev => [...prev, { ...pack, generated: false }])
        console.log('Pack saved successfully')
      } else {
        console.error('Failed to save pack:', data.error)
        setError(data.error || 'Failed to save pack')
      }
    } catch (error) {
      console.error('Error saving pack:', error)
      setError('Failed to save pack')
    }
  }

  // Generate menu trends
  const generateMenuTrends = async () => {
    setIsGeneratingTrends(true)
    setTrendError(null)
    
    try {
      const response = await fetch('/api/menu-trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period: trendPeriod,
          restaurantId: 1
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setMenuTrends(data.data.trends)
        setTrendSummary(data.data.summary)
        console.log(`Generated ${data.data.trends.length} menu trend predictions`)
      } else {
        setTrendError(data.error || 'Failed to generate menu trends')
      }
    } catch (error) {
      console.error('Error generating menu trends:', error)
      setTrendError('Failed to generate menu trends')
    } finally {
      setIsGeneratingTrends(false)
    }
  }

  // Handle add new menu item
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newItem.name,
          description: newItem.description,
          price: newItem.price,
          category: newItem.category,
          restaurantId: 1
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchMenuItems() // Refresh menu items
        setNewItem({ name: "", description: "", price: 0, category: "", available: true })
        setIsAddItemOpen(false)
        console.log('Menu item added successfully')
      } else {
        console.error('Failed to add menu item:', data.error)
        setError(data.error || 'Failed to add menu item')
      }
    } catch (error) {
      console.error('Error adding menu item:', error)
      setError('Failed to add menu item')
    }
  }

  // Handle add new pack manually
  const handleAddPack = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const pack = {
      ...newPack,
      id: Date.now(),
      price: Number(newPack.price),
      generated: false,
    }
    setExistingPacks((prev) => [...prev, pack])
    setNewPack({ id: 0, name: "", description: "", items: [], price: 0, type: "Pack 1", generated: false })
    setIsAddPackOpen(false)
  }

  // Handle edit menu item
  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    
    try {
      const response = await fetch('/api/menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem)
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchMenuItems() // Refresh menu items
        setEditingItem(null)
        setIsEditItemOpen(false)
        console.log('Menu item updated successfully')
      } else {
        console.error('Failed to update menu item:', data.error)
        setError(data.error || 'Failed to update menu item')
      }
    } catch (error) {
      console.error('Error updating menu item:', error)
      setError('Failed to update menu item')
    }
  }

  // Handle toggle menu availability
  const toggleMenuAvailability = async (item: MenuItem) => {
    try {
      const response = await fetch('/api/menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          available: !item.available
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchMenuItems() // Refresh menu items
        console.log('Menu availability updated')
      } else {
        console.error('Failed to update menu availability:', data.error)
        setError(data.error || 'Failed to update menu availability')
      }
    } catch (error) {
      console.error('Error updating menu availability:', error)
      setError('Failed to update menu availability')
    }
  }

  // Filter menu items
  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Load data on component mount
  useEffect(() => {
    fetchMenuItems()
    fetchExistingPacks()
    generateMenuTrends()
  }, [])

  // Update trends when period changes
  useEffect(() => {
    generateMenuTrends()
  }, [trendPeriod])

  if (isLoading && menuItems.length === 0) {
    return (
      <DashboardLayout title="Menu Management">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-blue mx-auto mb-4"></div>
            <div className="text-gray-600">Loading menu data...</div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

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

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

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
                {filteredItems.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">🍽️</div>
                    <div className="text-gray-600">No menu items found</div>
                    <Button 
                      onClick={() => setIsAddItemOpen(true)} 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                    >
                      Add First Menu Item
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
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
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.category}</Badge>
                          </TableCell>
                          <TableCell>Rp{item.price.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge className={item.available ? "bg-green-500" : "bg-red-500"}>
                              {item.available ? "Available" : "Sold Out"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => { 
                                  setEditingItem(item); 
                                  setIsEditItemOpen(true); 
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant={item.available ? "destructive" : "default"}
                                size="sm"
                                onClick={() => toggleMenuAvailability(item)}
                              >
                                {item.available ? "Mark Sold Out" : "Mark Available"}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="packs" className="space-y-4">
            {/* AI Recommendations */}
            {aiRecommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    AI Pack Recommendations
                  </CardTitle>
                  <CardDescription>Smart pack suggestions based on your sales data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {aiRecommendations.map((pack) => (
                      <Card key={pack.id} className="relative border-purple-200 bg-purple-50">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{pack.name}</CardTitle>
                            <Badge className="bg-purple-500">
                              <Sparkles className="h-3 w-3 mr-1" />
                              AI Recommended
                            </Badge>
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
                            {pack.reasoning && (
                              <div className="text-xs text-purple-700 bg-purple-100 p-2 rounded">
                                <strong>AI Reasoning:</strong> {pack.reasoning}
                              </div>
                            )}
                            <div className="flex justify-between items-center pt-2">
                              <div>
                                <span className="text-lg font-bold">Rp{pack.price.toLocaleString()}</span>
                                {pack.discountPercent && (
                                  <Badge className="ml-2 bg-green-500 text-xs">
                                    {pack.discountPercent}% OFF
                                  </Badge>
                                )}
                              </div>
                              <Button 
                                size="sm"
                                onClick={() => saveSelectedPack(pack)}
                                className="bg-purple-600 hover:bg-purple-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Select
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Current Food Packs */}
            <Card>
              <CardHeader>
                <CardTitle>Current Food Packs ({existingPacks.length})</CardTitle>
                <CardDescription>Your restaurant's food pack combinations</CardDescription>
              </CardHeader>
              <CardContent>
                {existingPacks.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">📦</div>
                    <div className="text-gray-600">No food packs created yet</div>
                    <div className="flex gap-2 justify-center mt-3">
                      <Button 
                        onClick={() => setIsAddPackOpen(true)} 
                        variant="outline" 
                        size="sm"
                      >
                        Create Manual Pack
                      </Button>
                      <Button 
                        onClick={generateFoodPacks} 
                        variant="outline" 
                        size="sm"
                        disabled={isGeneratingPacks}
                      >
                        <Sparkles className="h-4 w-4 mr-1" />
                        {isGeneratingPacks ? "Generating..." : "AI Generate"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {existingPacks.map((pack) => (
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
                              <span className="text-lg font-bold">Rp{pack.price.toLocaleString()}</span>
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
                )}
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
                        <p className="text-2xl font-bold text-purple-600">Rp{trendSummary.estimatedRevenueImpact.toLocaleString()}</p>
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
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Confidence:</span>
                                <span className="font-semibold">{trend.confidence}%</span>
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
                value={newItem.name || ""}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemCategory">Category</Label>
              <Select value={newItem.category || ""} onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.slice(1).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                  <SelectItem value="Main Course">Main Course</SelectItem>
                  <SelectItem value="Appetizer">Appetizer</SelectItem>
                  <SelectItem value="Beverage">Beverage</SelectItem>
                  <SelectItem value="Dessert">Dessert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="itemDescription">Description</Label>
            <Textarea
              id="itemDescription"
              value={newItem.description || ""}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="itemPrice">Price (Rp)</Label>
            <Input
              id="itemPrice"
              type="number"
              step="1000"
              value={newItem.price || 0}
              onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
              required
            />
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
            <Label htmlFor="packPrice">Price (Rp)</Label>
            <Input
              id="packPrice"
              type="number"
              step="1000"
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
          <form onSubmit={handleEditItem} className="space-y-4">
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
                    <SelectItem value="Main Course">Main Course</SelectItem>
                    <SelectItem value="Appetizer">Appetizer</SelectItem>
                    <SelectItem value="Beverage">Beverage</SelectItem>
                    <SelectItem value="Dessert">Dessert</SelectItem>
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
            <div className="space-y-2">
              <Label htmlFor="editItemPrice">Price (Rp)</Label>
              <Input
                id="editItemPrice"
                type="number"
                step="1000"
                value={editingItem.price}
                onChange={e => setEditingItem({ ...editingItem!, price: Number(e.target.value) })}
                required
              />
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
              setExistingPacks(prev => prev.map(p => p.id === editingPack.id ? editingPack : p))
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
              <Label htmlFor="editPackPrice">Price (Rp)</Label>
              <Input
                id="editPackPrice"
                type="number"
                step="1000"
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
            setExistingPacks(prev => prev.filter(p => p.id !== deletingPack?.id))
            setIsDeletePackOpen(false)
          }}>
            Delete
          </Button>
        </div>
      </Popup>
    </DashboardLayout>
  )
}