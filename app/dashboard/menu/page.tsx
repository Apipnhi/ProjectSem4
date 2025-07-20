// app/dashboard/menu/page.tsx - Clean & Error-Free Version
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
  rating?: number;
  orders_count?: number;
}

interface FoodPack {
  id: string | number;
  name: string;
  description: string;
  items: string[];
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  type?: string;
  category?: string;
  generated: boolean;
  reasoning?: string;
  estimatedDemand?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Safe currency formatter
const formatCurrency = (value: any): string => {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? '0' : num.toLocaleString();
};

// Safe price component
const SafePrice = ({ price }: { price: any }) => {
  return <span>Rp{formatCurrency(price)}</span>;
};

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2">Loading...</span>
  </div>
);

// Error display component
const ErrorDisplay = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <div className="text-red-600 mb-4">
      <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
      <p className="text-lg font-semibold">Error</p>
      <p className="text-sm">{error}</p>
    </div>
    <Button onClick={onRetry} variant="outline">
      Try Again
    </Button>
  </div>
);

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
  const [activeTab, setActiveTab] = useState("menu-items")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  // Data State
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<string[]>(['all'])
  const [existingPacks, setExistingPacks] = useState<FoodPack[]>([])
  const [aiRecommendations, setAiRecommendations] = useState<FoodPack[]>([])

  // Modal State
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [isEditItemOpen, setIsEditItemOpen] = useState(false)
  const [isAddPackOpen, setIsAddPackOpen] = useState(false)
  const [isGeneratingPacks, setIsGeneratingPacks] = useState(false)

  // Form State
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: "",
    description: "",
    price: 0,
    category: "",
    available: true,
  })

  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)

  // ----------------------------------------------------------------------------
  // DATA FETCHING FUNCTIONS
  // ----------------------------------------------------------------------------

  const fetchMenuItems = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/menu?restaurant_id=1&include_packs=true');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Safely handle menu items
        const items = Array.isArray(result.data.menuItems) ? result.data.menuItems : [];
        const packs = Array.isArray(result.data.foodPacks) ? result.data.foodPacks : [];
        
        // Validate menu items
        const validatedItems = items.map((item: any) => ({
          id: item.id || Math.random(),
          name: item.name || 'Unnamed Item',
          description: item.description || 'No description',
          category: item.category || 'Other',
          price: typeof item.price === 'number' ? item.price : 0,
          image: item.image || '/placeholder-food.jpg',
          available: item.available !== false,
          rating: item.rating,
          orders_count: item.orders_count
        }));
        
        setMenuItems(validatedItems);
        setExistingPacks(packs);
        
        // Extract unique categories safely
        const uniqueCategories = ['all'];
        validatedItems.forEach((item: any) => {
          if (item.category && !uniqueCategories.includes(item.category)) {
            uniqueCategories.push(item.category);
          }
        });
        setCategories(uniqueCategories);
        
        console.log('✅ Menu data loaded:', { items: validatedItems.length, packs: packs.length });
      } else {
        throw new Error(result.error || 'Failed to fetch menu data');
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch menu data');
      
      // Set empty arrays as fallback
      setMenuItems([]);
      setExistingPacks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateFoodPacks = async () => {
    try {
      setIsGeneratingPacks(true);
      setError(null);
      
      const response = await fetch('/api/menu/food-packs?restaurant_id=1&type=recommendations');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Safely handle the response data
        const packs = Array.isArray(result.data.packs) ? result.data.packs : [];
        
        // Validate each pack before setting state
        const validatedPacks = packs.map((pack: any) => ({
          id: pack.id || `pack_${Date.now()}_${Math.random()}`,
          name: pack.name || 'Generated Pack',
          description: pack.description || 'AI-generated food pack',
          items: Array.isArray(pack.items) ? pack.items : [],
          price: typeof pack.price === 'number' ? pack.price : 0,
          originalPrice: typeof pack.originalPrice === 'number' ? pack.originalPrice : pack.price || 0,
          discountPercent: typeof pack.discountPercent === 'number' ? pack.discountPercent : 0,
          reasoning: pack.reasoning || 'Generated based on data analysis',
          estimatedDemand: pack.estimatedDemand || 'Medium',
          category: pack.category || 'AI Pack',
          generated: true
        }));
        
        setAiRecommendations(validatedPacks);
        console.log('✅ AI recommendations generated:', validatedPacks.length);
      } else {
        throw new Error(result.error || 'Failed to generate food packs');
      }
    } catch (error) {
      console.error('Error generating food packs:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate food packs');
      
      // Set empty array as fallback
      setAiRecommendations([]);
    } finally {
      setIsGeneratingPacks(false);
    }
  };

  // ----------------------------------------------------------------------------
  // CRUD OPERATIONS
  // ----------------------------------------------------------------------------

  const toggleMenuAvailability = async (item: MenuItem) => {
    try {
      const response = await fetch('/api/menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_availability',
          id: item.id,
          available: !item.available,
          restaurant_id: '1'
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

  // ----------------------------------------------------------------------------
  // COMPONENTS
  // ----------------------------------------------------------------------------

  // Menu item display component
  const MenuItemDisplay = ({ item }: { item: MenuItem }) => {
    const safePrice = item?.price || 0;
    const safeName = item?.name || 'Unnamed Item';
    const safeCategory = item?.category || 'Other';
    const safeDescription = item?.description || 'No description';
    const safeAvailable = item?.available !== false;

    return (
      <TableRow key={item?.id || Math.random()}>
        <TableCell>
          <div className="flex items-center space-x-3">
            <img
              src={item?.image || '/placeholder-food.jpg'}
              alt={safeName}
              className="w-12 h-12 rounded-lg object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-food.jpg';
              }}
            />
            <div>
              <div className="font-medium">{safeName}</div>
              <div className="text-sm text-gray-500">{safeDescription}</div>
            </div>
          </div>
        </TableCell>
        <TableCell>{safeCategory}</TableCell>
        <TableCell>
          <SafePrice price={safePrice} />
        </TableCell>
        <TableCell>
          <Badge 
            variant={safeAvailable ? "default" : "secondary"}
            className={safeAvailable ? "bg-green-500" : "bg-red-500"}
          >
            {safeAvailable ? "Available" : "Sold Out"}
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
              variant={safeAvailable ? "destructive" : "default"}
              size="sm"
              onClick={() => toggleMenuAvailability(item)}
            >
              {safeAvailable ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  // Pack display component
  const PackDisplay = ({ pack }: { pack: FoodPack }) => {
    const safePrice = pack?.price || 0;
    const safeOriginalPrice = pack?.originalPrice || safePrice;
    const safeDiscountPercent = pack?.discountPercent || 0;
    const safeName = pack?.name || 'Unnamed Pack';
    const safeDescription = pack?.description || 'No description';
    const safeItems = pack?.items || [];
    const safeType = pack?.type || pack?.category || 'Standard';

    return (
      <Card key={pack.id} className="border-yellow-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{safeName}</CardTitle>
          <CardDescription>{safeDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <strong>Items:</strong>
              <ul className="text-sm text-gray-600 mt-1">
                {safeItems.map((item: string, idx: number) => (
                  <li key={idx}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="flex justify-between items-center">
              <div>
                {safeOriginalPrice > safePrice && (
                  <span className="text-sm text-gray-500 line-through">
                    <SafePrice price={safeOriginalPrice} />
                  </span>
                )}
                <div className="text-lg font-bold text-green-600">
                  <SafePrice price={safePrice} />
                </div>
                {safeDiscountPercent > 0 && (
                  <span className="text-sm text-green-600">
                    {safeDiscountPercent}% off
                  </span>
                )}
              </div>
              <Badge variant="outline" className="bg-yellow-50">
                AI Generated
              </Badge>
            </div>
            {pack?.reasoning && (
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
    );
  };

  // ----------------------------------------------------------------------------
  // EFFECTS
  // ----------------------------------------------------------------------------

  useEffect(() => {
    fetchMenuItems()
  }, [])

  // ----------------------------------------------------------------------------
  // LOADING STATE
  // ----------------------------------------------------------------------------

  if (isLoading && menuItems.length === 0) {
    return (
      <DashboardLayout title="Menu Management">
        <LoadingSpinner />
      </DashboardLayout>
    )
  }

  // ----------------------------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------------------------

  return (
    <DashboardLayout title="Menu Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Menu Management</h1>
            <p className="text-muted-foreground">
              Manage your restaurant's menu items and food packages
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsAddItemOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Menu Item
            </Button>
            <Button onClick={() => setIsAddPackOpen(true)} variant="outline">
              <Package className="h-4 w-4 mr-2" />
              Create Pack
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <ErrorDisplay 
            error={error} 
            onRetry={() => {
              setError(null);
              fetchMenuItems();
            }} 
          />
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="menu-items">Menu Items</TabsTrigger>
            <TabsTrigger value="food-packs">Food Packs</TabsTrigger>
          </TabsList>

          {/* Menu Items Tab */}
          <TabsContent value="menu-items" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Menu Items</CardTitle>
                <CardDescription>
                  Manage your restaurant's menu items
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search and Filter */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <Input
                      placeholder="Search menu items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category === 'all' ? 'All Categories' : category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isLoading ? (
                  <LoadingSpinner />
                ) : filteredItems.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      {menuItems.length === 0 ? 'No menu items found' : 'No items match your search'}
                    </p>
                    <Button onClick={() => setIsAddItemOpen(true)} className="mt-4">
                      Add First Menu Item
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.map((item) => (
                        <MenuItemDisplay key={item.id} item={item} />
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Food Packs Tab */}
          <TabsContent value="food-packs" className="space-y-4">
            {/* AI Recommendations Section */}
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
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-gray-600">
                    {aiRecommendations.length} recommendations generated
                  </p>
                  <Button 
                    onClick={generateFoodPacks} 
                    disabled={isGeneratingPacks}
                    size="sm"
                  >
                    {isGeneratingPacks ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate
                      </>
                    )}
                  </Button>
                </div>
                
                {isGeneratingPacks ? (
                  <LoadingSpinner />
                ) : aiRecommendations.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No AI recommendations yet</p>
                    <Button onClick={generateFoodPacks} className="mt-4">
                      Generate Recommendations
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {aiRecommendations.map((pack) => (
                      <PackDisplay key={pack.id} pack={pack} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

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
                    <p className="text-gray-500">No existing food packs</p>
                    <Button onClick={() => setIsAddPackOpen(true)} className="mt-4">
                      Create First Pack
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {existingPacks.map((pack) => (
                      <PackDisplay key={pack.id} pack={pack} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Item Modal - Placeholder */}
        {isAddItemOpen && (
          <Popup
            isOpen={isAddItemOpen}
            onClose={() => setIsAddItemOpen(false)}
            title="Add New Menu Item"
          >
            <div className="space-y-4">
              <p>Add new menu item form would go here...</p>
              <Button onClick={() => setIsAddItemOpen(false)}>
                Close
              </Button>
            </div>
          </Popup>
        )}

        {/* Add Pack Modal - Placeholder */}
        {isAddPackOpen && (
          <Popup
            isOpen={isAddPackOpen}
            onClose={() => setIsAddPackOpen(false)}
            title="Create Food Pack"
          >
            <div className="space-y-4">
              <p>Create food pack form would go here...</p>
              <Button onClick={() => setIsAddPackOpen(false)}>
                Close
              </Button>
            </div>
          </Popup>
        )}
      </div>
    </DashboardLayout>
  )
}