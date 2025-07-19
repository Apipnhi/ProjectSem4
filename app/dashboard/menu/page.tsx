// app/dashboard/menu/page.tsx - Organized Structure
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
import { 
  Plus, Edit, Trash2, Sparkles, Package, Search, RefreshCw, 
  TrendingUp, AlertTriangle, CheckCircle, ArrowUp, ArrowDown, Minus 
} from "lucide-react"

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
  trend?: 'rising' | 'declining' | 'stable' | 'new';
}

interface FoodPack {
  id: string | number;
  name: string;
  description: string;
  items: string[];
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  type: string;
  generated: boolean;
  reasoning?: string;
  estimatedDemand?: string;
  profitMargin?: number;
  category?: string;
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MenuManagementPage() {
  // ----------------------------------------------------------------------------
  // STATE MANAGEMENT
  // ----------------------------------------------------------------------------

  // UI State
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  // Data State
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<string[]>(['all'])
  const [existingPacks, setExistingPacks] = useState<FoodPack[]>([])
  const [aiRecommendations, setAiRecommendations] = useState<FoodPack[]>([])

  // Trends State
  const [menuTrends, setMenuTrends] = useState<MenuTrend[] | null>(null)
  const [trendSummary, setTrendSummary] = useState<TrendSummary | null>(null)
  const [isGeneratingTrends, setIsGeneratingTrends] = useState(false)
  const [trendError, setTrendError] = useState<string | null>(null)
  const [trendPeriod, setTrendPeriod] = useState<string>("month")

  // Modal State
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [isEditItemOpen, setIsEditItemOpen] = useState(false)
  const [isAddPackOpen, setIsAddPackOpen] = useState(false)
  const [isEditPackOpen, setIsEditPackOpen] = useState(false)
  const [isDeletePackOpen, setIsDeletePackOpen] = useState(false)
  const [isGeneratingPacks, setIsGeneratingPacks] = useState(false)

  // Form State
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

  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [editingPack, setEditingPack] = useState<FoodPack | null>(null)
  const [deletingPack, setDeletingPack] = useState<FoodPack | null>(null)

  // ----------------------------------------------------------------------------
  // DATA FETCHING FUNCTIONS
  // ----------------------------------------------------------------------------

  const fetchMenuItems = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/menu?restaurant_id=1&include_analytics=true')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success && result.data) {
        const items: MenuItem[] = Array.isArray(result.data.menuItems) ? result.data.menuItems : []
        const packs: FoodPack[] = Array.isArray(result.data.foodPacks) ? result.data.foodPacks : []
        
        setMenuItems(items)
        setExistingPacks(packs)
        
        const uniqueCategories: string[] = ['all']
        items.forEach((item: MenuItem) => {
          if (item.category && !uniqueCategories.includes(item.category)) {
            uniqueCategories.push(item.category)
          }
        })
        setCategories(uniqueCategories)
        
        console.log('✅ Menu data loaded:', { items: items.length, packs: packs.length })
      } else {
        throw new Error(result.error || 'Failed to fetch menu data')
      }
    } catch (error) {
      console.error('Error fetching menu items:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch menu data')
      setMenuItems([])
      setExistingPacks([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchExistingPacks = async () => {
    try {
      const response = await fetch('/api/menu?restaurant_id=1')
      const result = await response.json()
      
      if (result.success && result.data) {
        const packs: FoodPack[] = Array.isArray(result.data.foodPacks) ? result.data.foodPacks : []
        setExistingPacks(packs)
      }
    } catch (error) {
      console.error('Error fetching existing packs:', error)
    }
  }

  const generateFoodPacks = async () => {
    try {
      setIsGeneratingPacks(true)
      setError(null)
      
      const response = await fetch('/api/menu/food-packs?restaurant_id=1&type=recommendations')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success && result.data) {
        const recommendations: FoodPack[] = Array.isArray(result.data.packs) ? result.data.packs : []
        setAiRecommendations(recommendations)
        console.log('✅ AI recommendations generated:', recommendations.length)
      } else {
        throw new Error(result.error || 'Failed to generate food packs')
      }
    } catch (error) {
      console.error('Error generating food packs:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate food packs')
    } finally {
      setIsGeneratingPacks(false)
    }
  }

  const generateMenuTrends = async () => {
    try {
      setIsGeneratingTrends(true)
      setTrendError(null)
      
      if (menuItems.length === 0) {
        setTrendError('No menu items available for trend analysis')
        return
      }
      
      const mockTrends: MenuTrend[] = menuItems.slice(0, 8).map((item, index) => ({
        trend: ['rising', 'declining', 'stable', 'new'][index % 4] as 'rising' | 'declining' | 'stable' | 'new',
        itemName: item.name,
        currentSales: Math.floor(20 + Math.random() * 80),
        predictedSales: Math.floor(15 + Math.random() * 90),
        growthRate: Math.floor(-30 + Math.random() * 80),
        reasoning: `Based on recent sales data and seasonal patterns for ${item.category}`,
        recommendations: [
          'Consider promotional pricing',
          'Feature in combo deals',
          'Optimize ingredient sourcing'
        ],
        category: item.category,
        seasonality: 'High demand during current season',
        confidence: Math.floor(70 + Math.random() * 25)
      }))

      setMenuTrends(mockTrends)
      
      const summary: TrendSummary = {
        totalTrends: mockTrends.length,
        risingTrends: mockTrends.filter(t => t.trend === 'rising').length,
        decliningTrends: mockTrends.filter(t => t.trend === 'declining').length,
        stableTrends: mockTrends.filter(t => t.trend === 'stable').length,
        newOpportunities: mockTrends.filter(t => t.trend === 'new').length,
        estimatedRevenueImpact: Math.floor(50000 + Math.random() * 200000)
      }
      
      setTrendSummary(summary)
      
    } catch (error) {
      console.error('Error generating trends:', error)
      setTrendError(error instanceof Error ? error.message : 'Failed to generate trends')
    } finally {
      setIsGeneratingTrends(false)
    }
  }

  // ----------------------------------------------------------------------------
  // CRUD OPERATIONS
  // ----------------------------------------------------------------------------

  const addMenuItem = async () => {
    try {
      if (!newItem.name || !newItem.description || !newItem.category || !newItem.price) {
        setError('Please fill all required fields')
        return
      }

      const response = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newItem.name,
          description: newItem.description,
          category: newItem.category,
          price: newItem.price,
          restaurant_id: 1
        })
      })

      const result = await response.json()

      if (result.success) {
        await fetchMenuItems()
        setIsAddItemOpen(false)
        setNewItem({
          name: "",
          description: "",
          price: 0,
          category: "",
          available: true,
        })
        setError(null)
      } else {
        throw new Error(result.error || 'Failed to add menu item')
      }
    } catch (error) {
      console.error('Error adding menu item:', error)
      setError(error instanceof Error ? error.message : 'Failed to add menu item')
    }
  }

  const updateMenuItem = async () => {
    try {
      if (!editingItem) return

      const response = await fetch('/api/menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingItem.id,
          name: editingItem.name,
          description: editingItem.description,
          category: editingItem.category,
          price: editingItem.price,
          available: editingItem.available
        })
      })

      const result = await response.json()

      if (result.success) {
        await fetchMenuItems()
        setIsEditItemOpen(false)
        setEditingItem(null)
        setError(null)
      } else {
        throw new Error(result.error || 'Failed to update menu item')
      }
    } catch (error) {
      console.error('Error updating menu item:', error)
      setError(error instanceof Error ? error.message : 'Failed to update menu item')
    }
  }

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

      const result = await response.json()

      if (result.success) {
        await fetchMenuItems()
      } else {
        throw new Error(result.error || 'Failed to update menu availability')
      }
    } catch (error) {
      console.error('Error updating menu availability:', error)
      setError('Failed to update menu availability')
    }
  }

  // ----------------------------------------------------------------------------
  // UTILITY FUNCTIONS
  // ----------------------------------------------------------------------------

  const filteredItems = Array.isArray(menuItems) ? menuItems.filter((item: MenuItem) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    return matchesSearch && matchesCategory
  }) : []

  const resetNewItem = () => {
    setNewItem({
      name: "",
      description: "",
      price: 0,
      category: "",
      available: true,
    })
  }

  const resetNewPack = () => {
    setNewPack({
      id: 0,
      name: "",
      description: "",
      items: [],
      price: 0,
      type: "Pack 1",
      generated: false,
    })
  }

  // ----------------------------------------------------------------------------
  // EFFECTS
  // ----------------------------------------------------------------------------

  useEffect(() => {
    fetchMenuItems()
    fetchExistingPacks()
  }, [])

  useEffect(() => {
    if (menuItems.length > 0) {
      generateMenuTrends()
    }
  }, [trendPeriod, menuItems.length])

  // ----------------------------------------------------------------------------
  // LOADING STATE
  // ----------------------------------------------------------------------------

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

  // ----------------------------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------------------------

  return (
    <DashboardLayout title="Menu Management">
      <div className="space-y-6">
        {/* Header Section */}
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
              {isGeneratingPacks ? 'Generating...' : 'AI Recommendations'}
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setError(null)}
                  className="ml-auto"
                >
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="menu-items" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="menu-items">Menu Items ({menuItems.length})</TabsTrigger>
            <TabsTrigger value="food-packs">Food Packs ({existingPacks.length + aiRecommendations.length})</TabsTrigger>
            {/* <TabsTrigger value="trends">Menu Trends</TabsTrigger> */}
          </TabsList>

          {/* Menu Items Tab Content */}
          <TabsContent value="menu-items" className="space-y-4">
            {/* Search and Filter Controls */}
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
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={fetchMenuItems} variant="outline" disabled={isLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Menu Items Table */}
            <Card>
              <CardHeader>
                <CardTitle>Menu Items</CardTitle>
                <CardDescription>
                  Manage your restaurant's menu items
                </CardDescription>
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
                                {item.available ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
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

          {/* Food Packs Tab Content */}
          <TabsContent value="food-packs" className="space-y-4">
            {/* AI Recommendations Section */}
            {aiRecommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    AI-Generated Food Pack Recommendations
                  </CardTitle>
                  <CardDescription>
                    Smart food pack suggestions based on your menu and sales data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {aiRecommendations.map((pack) => (
                      <Card key={pack.id} className="border-yellow-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">{pack.name}</CardTitle>
                          <CardDescription>{pack.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div>
                              <strong>Items:</strong>
                              <ul className="text-sm text-gray-600 mt-1">
                                {pack.items.map((item, idx) => (
                                  <li key={idx}>• {item}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="flex justify-between items-center">
                              <div>
                                {pack.originalPrice && (
                                  <span className="text-sm text-gray-500 line-through">
                                    Rp{pack.originalPrice.toLocaleString()}
                                  </span>
                                )}
                                <div className="text-lg font-bold text-green-600">
                                  Rp{pack.price.toLocaleString()}
                                </div>
                                {pack.discountPercent && (
                                  <span className="text-sm text-green-600">
                                    {pack.discountPercent}% off
                                  </span>
                                )}
                              </div>
                              <Badge variant="outline" className="bg-yellow-50">
                                AI Generated
                              </Badge>
                            </div>
                            {pack.reasoning && (
                              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                <strong>Reasoning:</strong> {pack.reasoning}
                              </div>
                            )}
                            <Button className="w-full" size="sm">
                              Add to Menu
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Existing Packs Section */}
            <Card>
              <CardHeader>
                <CardTitle>Current Food Packs</CardTitle>
                <CardDescription>
                  Manage your existing food package deals
                </CardDescription>
              </CardHeader>
              <CardContent>
                {existingPacks.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">📦</div>
                    <div className="text-gray-600">No food packs created yet</div>
                    <Button 
                      onClick={() => setIsAddPackOpen(true)} 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                    >
                      Create First Pack
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {existingPacks.map((pack) => (
                      <Card key={pack.id}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">{pack.name}</CardTitle>
                          <CardDescription>{pack.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div>
                              <strong>Items:</strong>
                              <ul className="text-sm text-gray-600 mt-1">
                                {pack.items.map((item, idx) => (
                                  <li key={idx}>• {item}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="text-lg font-bold">
                                Rp{pack.price.toLocaleString()}
                              </div>
                              <Badge variant="outline">
                                {pack.type}
                              </Badge>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                onClick={() => {
                                  setEditingPack(pack)
                                  setIsEditPackOpen(true)
                                }}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => {
                                  setDeletingPack(pack)
                                  setIsDeletePackOpen(true)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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

          {/* Menu Trends Tab Content
          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Menu Performance Trends
                </CardTitle>
                <CardDescription>
                  AI-powered analysis of your menu performance and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end items-center mb-6">
                  <Button 
                    onClick={generateMenuTrends} 
                    disabled={isGeneratingTrends || menuItems.length === 0}
                    variant="outline"
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${isGeneratingTrends ? 'animate-spin' : ''}`} />
                    {isGeneratingTrends ? 'Analyzing...' : 'Refresh Trends'}
                  </Button>
                </div>

                {trendError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{trendError}</span>
                    </div>
                  </div>
                )}

                {menuTrends && menuTrends.length > 0 ? (
                  <div className="space-y-6">
                    {/* Simple Summary Bar */}
                    {/* {trendSummary && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-center text-sm">
                          <span>Total: {trendSummary.totalTrends}</span>
                          <span className="text-green-600">Rising: {trendSummary.risingTrends}</span>
                          <span className="text-red-600">Declining: {trendSummary.decliningTrends}</span>
                          <span className="text-blue-600">Stable: {trendSummary.stableTrends}</span>
                          <span className="text-purple-600">New: {trendSummary.newOpportunities}</span>
                        </div>
                      </div>
                    )} */}

                    {/* Simple Table Layout
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left p-3 font-semibold">Menu Item</th>
                            <th className="text-left p-3 font-semibold">Trend</th>
                            <th className="text-left p-3 font-semibold">Current Sales</th>
                            <th className="text-left p-3 font-semibold">Predicted</th>
                            <th className="text-left p-3 font-semibold">Growth</th>
                            <th className="text-left p-3 font-semibold">Confidence</th>
                          </tr>
                        </thead>
                        <tbody>
                          {menuTrends.map((trend, index) => (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="p-3">
                                <div>
                                  <div className="font-medium">{trend.itemName}</div>
                                  <div className="text-sm text-gray-500">{trend.category}</div>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  {trend.trend === 'rising' && <ArrowUp className="h-4 w-4 text-green-500" />}
                                  {trend.trend === 'declining' && <ArrowDown className="h-4 w-4 text-red-500" />}
                                  {trend.trend === 'stable' && <Minus className="h-4 w-4 text-blue-500" />}
                                  {trend.trend === 'new' && <Sparkles className="h-4 w-4 text-purple-500" />}
                                  <span className={`text-sm font-medium ${
                                    trend.trend === 'rising' ? 'text-green-600' :
                                    trend.trend === 'declining' ? 'text-red-600' :
                                    trend.trend === 'stable' ? 'text-blue-600' :
                                    'text-purple-600'
                                  }`}>
                                    {trend.trend.charAt(0).toUpperCase() + trend.trend.slice(1)}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3 font-medium">{trend.currentSales}</td>
                              <td className="p-3 font-medium">{trend.predictedSales}</td>
                              <td className="p-3">
                                <span className={`font-medium ${trend.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {trend.growthRate >= 0 ? '+' : ''}{trend.growthRate}%
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-blue-500 h-2 rounded-full" 
                                      style={{ width: `${trend.confidence}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm text-gray-600">{trend.confidence}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div> */}

                    {/* Simple Recommendations
                    <div className="mt-6">
                      <h4 className="font-semibold mb-3">Key Recommendations</h4>
                      <div className="space-y-2">
                        {menuTrends.slice(0, 3).map((trend, index) => (
                          <div key={index} className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                            <div className="font-medium text-blue-800">{trend.itemName}</div>
                            <div className="text-sm text-blue-600">{trend.reasoning}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No trend data available</h3>
                    <p className="text-gray-500 mb-4">
                      {menuItems.length === 0 ? 'Add menu items to generate trends' : 'Click "Refresh Trends" to analyze your menu'}
                    </p>
                    {menuItems.length > 0 && (
                      <Button onClick={generateMenuTrends} variant="outline">
                        Generate Trends
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent> */}
        </Tabs> 

        {/* ============================================================================ */}
        {/* MODAL COMPONENTS */}
        {/* ============================================================================ */}

        {/* Add Menu Item Modal */}
        {isAddItemOpen && (
          <Popup
            isOpen={isAddItemOpen}
            onClose={() => {
              setIsAddItemOpen(false)
              resetNewItem()
            }}
            title="Add New Menu Item"
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newItem.name || ""}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="Enter menu item name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={newItem.description || ""}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Describe the menu item"
                />
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={newItem.category || ""}
                  onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Makanan Utama">Makanan Utama</SelectItem>
                    <SelectItem value="Minuman">Minuman</SelectItem>
                    <SelectItem value="Snack">Snack</SelectItem>
                    <SelectItem value="Dessert">Dessert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="price">Price (Rp) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={newItem.price || ""}
                  onChange={(e) => setNewItem({ ...newItem, price: parseInt(e.target.value) || 0 })}
                  placeholder="Enter price"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setIsAddItemOpen(false)
                  resetNewItem()
                }}>
                  Cancel
                </Button>
                <Button onClick={addMenuItem}>
                  Add Item
                </Button>
              </div>
            </div>
          </Popup>
        )}

        {/* Edit Menu Item Modal */}
        {isEditItemOpen && editingItem && (
          <Popup
            isOpen={isEditItemOpen}
            onClose={() => {
              setIsEditItemOpen(false)
              setEditingItem(null)
            }}
            title="Edit Menu Item"
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  placeholder="Enter menu item name"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description *</Label>
                <Textarea
                  id="edit-description"
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="Describe the menu item"
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Category *</Label>
                <Select
                  value={editingItem.category}
                  onValueChange={(value) => setEditingItem({ ...editingItem, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Makanan Utama">Makanan Utama</SelectItem>
                    <SelectItem value="Minuman">Minuman</SelectItem>
                    <SelectItem value="Snack">Snack</SelectItem>
                    <SelectItem value="Dessert">Dessert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-price">Price (Rp) *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={editingItem.price}
                  onChange={(e) => setEditingItem({ ...editingItem, price: parseInt(e.target.value) || 0 })}
                  placeholder="Enter price"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-available"
                  checked={editingItem.available}
                  onChange={(e) => setEditingItem({ ...editingItem, available: e.target.checked })}
                />
                <Label htmlFor="edit-available">Available</Label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setIsEditItemOpen(false)
                  setEditingItem(null)
                }}>
                  Cancel
                </Button>
                <Button onClick={updateMenuItem}>
                  Update Item
                </Button>
              </div>
            </div>
          </Popup>
        )}

        {/* Add Food Pack Modal */}
        {isAddPackOpen && (
          <Popup
            isOpen={isAddPackOpen}
            onClose={() => {
              setIsAddPackOpen(false)
              resetNewPack()
            }}
            title="Create Food Pack"
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="pack-name">Pack Name *</Label>
                <Input
                  id="pack-name"
                  value={newPack.name}
                  onChange={(e) => setNewPack({ ...newPack, name: e.target.value })}
                  placeholder="Enter pack name"
                />
              </div>
              <div>
                <Label htmlFor="pack-description">Description *</Label>
                <Textarea
                  id="pack-description"
                  value={newPack.description}
                  onChange={(e) => setNewPack({ ...newPack, description: e.target.value })}
                  placeholder="Describe the food pack"
                />
              </div>
              <div>
                <Label htmlFor="pack-price">Price (Rp) *</Label>
                <Input
                  id="pack-price"
                  type="number"
                  value={newPack.price}
                  onChange={(e) => setNewPack({ ...newPack, price: parseInt(e.target.value) || 0 })}
                  placeholder="Enter pack price"
                />
              </div>
              <div>
                <Label>Items in Pack</Label>
                <div className="text-sm text-gray-500 mb-2">
                  Select menu items to include in this pack
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {menuItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`pack-item-${item.id}`}
                        checked={newPack.items.includes(item.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewPack({
                              ...newPack,
                              items: [...newPack.items, item.name]
                            })
                          } else {
                            setNewPack({
                              ...newPack,
                              items: newPack.items.filter(name => name !== item.name)
                            })
                          }
                        }}
                      />
                      <Label htmlFor={`pack-item-${item.id}`} className="text-sm">
                        {item.name} (Rp{item.price.toLocaleString()})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setIsAddPackOpen(false)
                  resetNewPack()
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={async () => {
                    try {
                      if (!newPack.name || !newPack.description || newPack.items.length === 0) {
                        setError('Please fill all required fields and select at least one item')
                        return
                      }

                      // API call to create pack would go here
                      // const response = await fetch('/api/menu/packs', { ... })
                      
                      setIsAddPackOpen(false)
                      resetNewPack()
                      await fetchExistingPacks()
                    } catch (error) {
                      console.error('Error creating pack:', error)
                      setError('Failed to create food pack')
                    }
                  }}
                >
                  Create Pack
                </Button>
              </div>
            </div>
          </Popup>
        )}

        {/* Edit Food Pack Modal */}
        {isEditPackOpen && editingPack && (
          <Popup
            isOpen={isEditPackOpen}
            onClose={() => {
              setIsEditPackOpen(false)
              setEditingPack(null)
            }}
            title="Edit Food Pack"
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-pack-name">Pack Name *</Label>
                <Input
                  id="edit-pack-name"
                  value={editingPack.name}
                  onChange={(e) => setEditingPack({ ...editingPack, name: e.target.value })}
                  placeholder="Enter pack name"
                />
              </div>
              <div>
                <Label htmlFor="edit-pack-description">Description *</Label>
                <Textarea
                  id="edit-pack-description"
                  value={editingPack.description}
                  onChange={(e) => setEditingPack({ ...editingPack, description: e.target.value })}
                  placeholder="Describe the food pack"
                />
              </div>
              <div>
                <Label htmlFor="edit-pack-price">Price (Rp) *</Label>
                <Input
                  id="edit-pack-price"
                  type="number"
                  value={editingPack.price}
                  onChange={(e) => setEditingPack({ ...editingPack, price: parseInt(e.target.value) || 0 })}
                  placeholder="Enter pack price"
                />
              </div>
              <div>
                <Label>Items in Pack</Label>
                <div className="text-sm text-gray-500 mb-2">
                  Select menu items to include in this pack
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {menuItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`edit-pack-item-${item.id}`}
                        checked={editingPack.items.includes(item.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditingPack({
                              ...editingPack,
                              items: [...editingPack.items, item.name]
                            })
                          } else {
                            setEditingPack({
                              ...editingPack,
                              items: editingPack.items.filter(name => name !== item.name)
                            })
                          }
                        }}
                      />
                      <Label htmlFor={`edit-pack-item-${item.id}`} className="text-sm">
                        {item.name} (Rp{item.price.toLocaleString()})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setIsEditPackOpen(false)
                  setEditingPack(null)
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={async () => {
                    try {
                      if (!editingPack.name || !editingPack.description || editingPack.items.length === 0) {
                        setError('Please fill all required fields and select at least one item')
                        return
                      }

                      // API call to update pack would go here
                      // const response = await fetch(`/api/menu/packs/${editingPack.id}`, { method: 'PUT', ... })
                      
                      setIsEditPackOpen(false)
                      setEditingPack(null)
                      await fetchExistingPacks()
                    } catch (error) {
                      console.error('Error updating pack:', error)
                      setError('Failed to update food pack')
                    }
                  }}
                >
                  Update Pack
                </Button>
              </div>
            </div>
          </Popup>
        )}

        {/* Delete Food Pack Confirmation Modal */}
        {isDeletePackOpen && deletingPack && (
          <Popup
            isOpen={isDeletePackOpen}
            onClose={() => {
              setIsDeletePackOpen(false)
              setDeletingPack(null)
            }}
            title="Delete Food Pack"
          >
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-red-600 mb-4">
                  <AlertTriangle className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Are you sure?</h3>
                <p className="text-gray-600 mb-4">
                  This will permanently delete the food pack "{deletingPack.name}". This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setIsDeletePackOpen(false)
                  setDeletingPack(null)
                }}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={async () => {
                    try {
                      // API call to delete pack would go here
                      // const response = await fetch(`/api/menu/packs/${deletingPack.id}`, { method: 'DELETE' })
                      
                      setIsDeletePackOpen(false)
                      setDeletingPack(null)
                      await fetchExistingPacks()
                    } catch (error) {
                      console.error('Error deleting pack:', error)
                      setError('Failed to delete food pack')
                    }
                  }}
                >
                  Delete Pack
                </Button>
              </div>
            </div>
          </Popup>
        )}
      </div>
    </DashboardLayout>
  )
}