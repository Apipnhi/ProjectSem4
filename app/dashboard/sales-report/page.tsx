"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Calendar, Download, Sparkles, Star, CheckCircle, Clock, Pause, Play } from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

// Add types for sales data, transactions, and predictions
interface SalesData {
  date?: string;
  month?: string;
  year?: string;
  sales: number;
  orders: number;
  avgOrder: number;
}
interface Transaction {
  timestamp: string;
}
interface Predictions {
  nextDay?: { sales: number; confidence: number };
  nextMonth?: { sales: number; confidence: number };
  nextYear?: { sales: number; confidence: number };
}

// Add mock feedback for reviews tab
interface Feedback {
  name: string
  rating: number
  comment: string
  date: string // ISO string
}

// Add types for promotions
interface Promotion {
  type: string
  description: string
  reasoning: string
  estimatedImpact: string
  details?: string
}

interface AppliedPromotion extends Promotion {
  id: string
  appliedAt: string
  status: 'active' | 'paused' | 'completed'
  startDate: string
  endDate?: string
  performance?: {
    orders: number
    revenue: number
    conversionRate: number
  }
}

export default function SalesReportPage() {
  const [reportPeriod, setReportPeriod] = useState<string>("daily")
  const [isGeneratingPrediction, setIsGeneratingPrediction] = useState(false)
  const [predictions, setPredictions] = useState<Predictions | null>(null)
  const [ratingFilter, setRatingFilter] = useState<string>("all")
  const [timeFilter, setTimeFilter] = useState<string>("latest")
  
  // Promotion states
  const [promoRecommendations, setPromoRecommendations] = useState<Promotion[] | null>(null)
  const [appliedPromotions, setAppliedPromotions] = useState<AppliedPromotion[]>([])
  const [isGeneratingPromos, setIsGeneratingPromos] = useState(false)
  const [isApplyingPromo, setIsApplyingPromo] = useState<string | null>(null)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [applySuccess, setApplySuccess] = useState<string | null>(null)

  // Sample sales data
  const dailySalesData: SalesData[] = [
    { date: "2024-01-01", sales: 1200, orders: 45, avgOrder: 26.67 },
    { date: "2024-01-02", sales: 1350, orders: 52, avgOrder: 25.96 },
    { date: "2024-01-03", sales: 980, orders: 38, avgOrder: 25.79 },
    { date: "2024-01-04", sales: 1450, orders: 58, avgOrder: 25.0 },
    { date: "2024-01-05", sales: 1680, orders: 62, avgOrder: 27.1 },
    { date: "2024-01-06", sales: 1820, orders: 68, avgOrder: 26.76 },
    { date: "2024-01-07", sales: 1950, orders: 72, avgOrder: 27.08 },
  ]

  const monthlySalesData: SalesData[] = [
    { month: "Jan", sales: 35000, orders: 1200, avgOrder: 29.17 },
    { month: "Feb", sales: 32000, orders: 1100, avgOrder: 29.09 },
    { month: "Mar", sales: 38000, orders: 1350, avgOrder: 28.15 },
    { month: "Apr", sales: 42000, orders: 1500, avgOrder: 28.0 },
    { month: "May", sales: 45000, orders: 1600, avgOrder: 28.13 },
    { month: "Jun", sales: 48000, orders: 1700, avgOrder: 28.24 },
  ]

  const yearlySalesData: SalesData[] = [
    { year: "2021", sales: 420000, orders: 15000, avgOrder: 28.0 },
    { year: "2022", sales: 485000, orders: 17200, avgOrder: 28.2 },
    { year: "2023", sales: 520000, orders: 18500, avgOrder: 28.11 },
    { year: "2024", sales: 280000, orders: 9950, avgOrder: 28.14 },
  ]

  // Top selling items
  const topItems = [
    { name: "Grilled Salmon", sales: 245, revenue: 6125.5 },
    { name: "Caesar Salad", sales: 189, revenue: 2453.11 },
    { name: "Chocolate Cake", sales: 156, revenue: 1402.44 },
    { name: "Margherita Pizza", sales: 134, revenue: 1943.0 },
    { name: "Pasta Carbonara", sales: 98, revenue: 1661.1 },
  ]

  // Add mock feedback for reviews tab
  const mockFeedback: Feedback[] = [
    { name: "Alice", rating: 5, comment: "Amazing food and service!", date: "2024-06-01T14:30:00" },
    { name: "Bob", rating: 3, comment: "It was okay, but the wait was long.", date: "2024-06-02T12:10:00" },
    { name: "Charlie", rating: 4, comment: "Great atmosphere and tasty menu.", date: "2024-06-03T18:45:00" },
    { name: "Dana", rating: 2, comment: "Food was cold when served.", date: "2024-06-04T09:20:00" },
    { name: "Eve", rating: 5, comment: "Best restaurant in town!", date: "2024-06-05T20:00:00" },
  ]

  const generatePredictions = async () => {
    setIsGeneratingPrediction(true)

    try {
      const response = await fetch("/api/generate-predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          salesData:
            reportPeriod === "daily" ? dailySalesData : reportPeriod === "monthly" ? monthlySalesData : yearlySalesData,
          period: reportPeriod,
        }),
      })

      const data = await response.json()
      setPredictions(data.predictions as Predictions)
    } catch (error) {
      console.error("Error generating predictions:", error)
      // Fallback predictions
      setPredictions({
        nextDay: { sales: 2100, confidence: 85 },
        nextMonth: { sales: 52000, confidence: 78 },
        nextYear: { sales: 580000, confidence: 72 },
      })
    }

    setIsGeneratingPrediction(false)
  }

  const getCurrentData = (): SalesData[] => {
    switch (reportPeriod) {
      case "daily":
        return dailySalesData
      case "monthly":
        return monthlySalesData
      case "yearly":
        return yearlySalesData
      default:
        return dailySalesData
    }
  }

  const getDataKey = (): string => {
    switch (reportPeriod) {
      case "daily":
        return "date"
      case "monthly":
        return "month"
      case "yearly":
        return "year"
      default:
        return "date"
    }
  }

  const currentData = getCurrentData()
  const dataKey = getDataKey()

  // Add mock rush hour data and a function to aggregate by hour
  const mockTransactions: Transaction[] = [
    { timestamp: "2024-06-01T08:15:00" },
    { timestamp: "2024-06-01T09:30:00" },
    { timestamp: "2024-06-01T09:45:00" },
    { timestamp: "2024-06-01T10:00:00" },
    { timestamp: "2024-06-01T12:10:00" },
    { timestamp: "2024-06-01T12:20:00" },
    { timestamp: "2024-06-01T12:45:00" },
    { timestamp: "2024-06-01T13:00:00" },
    { timestamp: "2024-06-01T13:15:00" },
    { timestamp: "2024-06-01T14:00:00" },
    { timestamp: "2024-06-01T14:30:00" },
    { timestamp: "2024-06-01T15:00:00" },
    { timestamp: "2024-06-01T18:00:00" },
    { timestamp: "2024-06-01T18:15:00" },
    { timestamp: "2024-06-01T19:00:00" },
    { timestamp: "2024-06-01T19:30:00" },
    { timestamp: "2024-06-01T20:00:00" },
    { timestamp: "2024-06-01T20:15:00" },
  ]

  // Function to aggregate transactions by hour
  function getRushHourData(transactions: Transaction[]): { hour: string; count: number }[] {
    const hourCounts = Array(24).fill(0)
    transactions.forEach((tx: Transaction) => {
      const hour = new Date(tx.timestamp).getHours()
      hourCounts[hour]++
    })
    return hourCounts.map((count, hour) => ({ hour: `${hour}:00`, count }))
  }
  const rushHourData = getRushHourData(mockTransactions)

  // Mock menu sales data for prediction
  const mockMenuSales = [
    { name: "Grilled Salmon", sales: 245, revenue: 6125.5 },
    { name: "Caesar Salad", sales: 189, revenue: 2453.11 },
    { name: "Chocolate Cake", sales: 156, revenue: 1402.44 },
    { name: "Margherita Pizza", sales: 134, revenue: 1943.0 },
    { name: "Pasta Carbonara", sales: 98, revenue: 1661.1 },
  ]

  const [topMenuPrediction, setTopMenuPrediction] = useState<any[] | null>(null)
  const [isPredictingTopMenu, setIsPredictingTopMenu] = useState(false)
  const [predictionError, setPredictionError] = useState<string | null>(null)

  async function fetchTopMenuPrediction() {
    setIsPredictingTopMenu(true)
    setPredictionError(null)
    try {
      const res = await fetch("/api/generate-predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuSales: mockMenuSales, period: reportPeriod }),
      })
      const data = await res.json()
      if (data.topItems) {
        setTopMenuPrediction(data.topItems)
      } else {
        setPredictionError(data.error || "No prediction returned")
        setTopMenuPrediction(null)
      }
    } catch (err) {
      setPredictionError("Failed to fetch prediction")
      setTopMenuPrediction(null)
    }
    setIsPredictingTopMenu(false)
  }

  useEffect(() => {
    fetchTopMenuPrediction()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportPeriod, JSON.stringify(mockMenuSales)])



  async function fetchPromoRecommendations() {
    setIsGeneratingPromos(true)
    setPromoError(null)
    try {
      const res = await fetch("/api/generate-predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          menuSales: mockMenuSales, 
          period: reportPeriod,
          promoAnalysis: true 
        }),
      })
      const data = await res.json()
      if (data.promos) {
        setPromoRecommendations(data.promos)
      } else {
        setPromoError(data.error || "No promo recommendations returned")
        setPromoRecommendations(null)
      }
    } catch (err) {
      setPromoError("Failed to fetch promo recommendations")
      setPromoRecommendations(null)
    }
    setIsGeneratingPromos(false)
  }

  useEffect(() => {
    fetchPromoRecommendations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportPeriod, JSON.stringify(mockMenuSales)])

  // Function to apply a promotion
  const applyPromotion = async (promotion: Promotion) => {
    setIsApplyingPromo(promotion.description)
    setApplySuccess(null)
    
    try {
      const response = await fetch("/api/apply-promotion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          promotion,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setAppliedPromotions(prev => [...prev, data.promotion])
        setApplySuccess(data.message)
        // Remove the applied promotion from recommendations
        setPromoRecommendations(prev => prev?.filter(p => p.description !== promotion.description) || null)
      } else {
        setPromoError(data.error || "Failed to apply promotion")
      }
    } catch (error) {
      console.error("Error applying promotion:", error)
      setPromoError("Failed to apply promotion")
    }
    
    setIsApplyingPromo(null)
  }

  // Function to update promotion status
  const updatePromotionStatus = async (promotionId: string, status: 'active' | 'paused' | 'completed') => {
    try {
      const response = await fetch("/api/apply-promotion", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          promotionId,
          status,
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setAppliedPromotions(prev => 
          prev.map(p => p.id === promotionId ? { ...p, status } : p)
        )
        setApplySuccess(data.message)
      } else {
        setPromoError(data.error || "Failed to update promotion status")
      }
    } catch (error) {
      console.error("Error updating promotion status:", error)
      setPromoError("Failed to update promotion status")
    }
  }

  // Function to fetch applied promotions
  const fetchAppliedPromotions = async () => {
    try {
      const response = await fetch("/api/apply-promotion")
      const data = await response.json()
      
      if (data.promotions) {
        setAppliedPromotions(data.promotions)
      }
    } catch (error) {
      console.error("Error fetching applied promotions:", error)
    }
  }

  // Fetch applied promotions on component mount
  useEffect(() => {
    fetchAppliedPromotions()
  }, [])

  // Clear success/error messages after 5 seconds
  useEffect(() => {
    if (applySuccess) {
      const timer = setTimeout(() => setApplySuccess(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [applySuccess])

  useEffect(() => {
    if (promoError) {
      const timer = setTimeout(() => setPromoError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [promoError])

  return (
    <DashboardLayout title="Reports">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-navy-blue">Reports</h2>
            <p className="text-gray-600">Analyze your restaurant's sales performance, rush hours, and more</p>
          </div>
          <div className="flex gap-2">
            <Select value={reportPeriod} onValueChange={setReportPeriod}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={generatePredictions}
              disabled={isGeneratingPrediction}
              className="bg-navy-blue hover:bg-navy-blue-700"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {isGeneratingPrediction ? "Generating..." : "AI Predictions"}
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${currentData[currentData.length - 1]?.sales.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500">+12.5%</span> from last period
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentData[currentData.length - 1]?.orders.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500">+8.2%</span> from last period
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Average Order</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${currentData[currentData.length - 1]?.avgOrder.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500">+3.1%</span> from last period
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15.3%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500">+2.1%</span> from last period
              </p>
            </CardContent>
          </Card>
        </div>

        {/* AI Predictions */}
        {predictions && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                AI Sales Predictions
              </CardTitle>
              <CardDescription>AI-powered sales forecasting based on historical data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg">Next Day</h3>
                  <p className="text-2xl font-bold text-navy-blue">${predictions.nextDay?.sales.toLocaleString()}</p>
                  <Badge className="mt-2 bg-green-500">{predictions.nextDay?.confidence}% Confidence</Badge>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg">Next Month</h3>
                  <p className="text-2xl font-bold text-navy-blue">${predictions.nextMonth?.sales.toLocaleString()}</p>
                  <Badge className="mt-2 bg-yellow-500">{predictions.nextMonth?.confidence}% Confidence</Badge>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg">Next Year</h3>
                  <p className="text-2xl font-bold text-navy-blue">${predictions.nextYear?.sales.toLocaleString()}</p>
                  <Badge className="mt-2 bg-orange-500">{predictions.nextYear?.confidence}% Confidence</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="products">Top Products</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="promotions">Promotions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Sales Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Sales Overview</CardTitle>
                <CardDescription>
                  {reportPeriod.charAt(0).toUpperCase() + reportPeriod.slice(1)} sales performance
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={currentData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0f2b5b" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#0f2b5b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey={dataKey} />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#0f2b5b"
                      fillOpacity={1}
                      fill="url(#colorSales)"
                      name="Sales ($)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Orders Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Orders Overview</CardTitle>
                <CardDescription>Number of orders over time</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={currentData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <XAxis dataKey={dataKey} />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="orders" fill="#0f2b5b" name="Orders" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Average Order Value Trend</CardTitle>
                <CardDescription>Track how your average order value changes over time</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={currentData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <XAxis dataKey={dataKey} />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="avgOrder"
                      stroke="#0f2b5b"
                      strokeWidth={3}
                      name="Average Order ($)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Items</CardTitle>
                <CardDescription>Best performing menu items by sales volume and revenue</CardDescription>
                <div className="flex gap-2 mt-4">
                  <Button onClick={fetchTopMenuPrediction} disabled={isPredictingTopMenu} variant="outline">
                    {isPredictingTopMenu ? "Predicting..." : "Refresh Prediction"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isPredictingTopMenu && <div className="text-blue-600">Predicting top sellers...</div>}
                  {predictionError && <div className="text-red-600">{predictionError}</div>}
                  {topMenuPrediction && (
                    <div className="mb-4">
                      <h3 className="font-semibold text-lg mb-2">LLM Predicted Top Sellers</h3>
                      <ul className="space-y-2">
                        {topMenuPrediction.map((item, idx) => (
                          <li key={item.name} className="border rounded p-3 bg-white">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-navy-blue">{idx + 1}.</span>
                              <span className="font-semibold">{item.name}</span>
                              <span className="ml-2 text-xs text-gray-500">Predicted Sales: {item.predictedSales}</span>
                            </div>
                            <div className="text-gray-700 text-sm mt-1">{item.reason}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {/* Existing topItems list below */}
                  <h3 className="font-semibold text-lg mb-2">Historical Top Sellers</h3>
                  {topItems.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-navy-blue text-white flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold">{item.name}</div>
                          <div className="text-xs text-gray-500">{item.sales} sales, ${item.revenue.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="font-bold text-lg text-navy-blue">#{index + 1}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Customer Feedback & Reviews</CardTitle>
                <div className="flex gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">Filter by Rating</label>
                    <Select value={ratingFilter} onValueChange={setRatingFilter}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="All Ratings" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {[5, 4, 3, 2, 1].map(r => (
                          <SelectItem key={r} value={String(r)}>{r} Star{r > 1 ? "s" : ""}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Sort by</label>
                    <Select value={timeFilter} onValueChange={setTimeFilter}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="latest">Latest</SelectItem>
                        <SelectItem value="oldest">Oldest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {(mockFeedback
                  .filter(fb => ratingFilter === "all" || fb.rating === Number(ratingFilter))
                  .sort((a, b) =>
                    timeFilter === "latest"
                      ? new Date(b.date).getTime() - new Date(a.date).getTime()
                      : new Date(a.date).getTime() - new Date(b.date).getTime()
                  )).length === 0 ? (
                  <div className="text-center text-gray-500 py-8">No feedback found for this filter.</div>
                ) : (
                  <ul className="space-y-4">
                    {mockFeedback
                      .filter(fb => ratingFilter === "all" || fb.rating === Number(ratingFilter))
                      .sort((a, b) =>
                        timeFilter === "latest"
                          ? new Date(b.date).getTime() - new Date(a.date).getTime()
                          : new Date(a.date).getTime() - new Date(b.date).getTime()
                      )
                      .map((fb, idx) => (
                        <li key={idx} className="border rounded p-4 bg-white shadow-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-navy-blue">{fb.name}</span>
                            <span className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star key={star} className="h-4 w-4" fill={star <= fb.rating ? "#facc15" : "none"} stroke="#facc15" />
                              ))}
                            </span>
                            <span className="ml-auto text-xs text-gray-400">{new Date(fb.date).toLocaleString()}</span>
                          </div>
                          <div className="text-gray-700">{fb.comment}</div>
                        </li>
                      ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="promotions" className="space-y-4">
            {/* Success/Error Messages */}
            {applySuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-800">{applySuccess}</span>
                </div>
              </div>
            )}
            {promoError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <span className="text-red-800">{promoError}</span>
              </div>
            )}

            {/* Applied Promotions */}
            {appliedPromotions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Active Promotions</CardTitle>
                  <CardDescription>Currently running promotional campaigns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {appliedPromotions.map((promotion) => (
                      <div key={promotion.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-navy-blue">{promotion.type}</h4>
                            <p className="text-sm text-gray-600">{promotion.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              className={
                                promotion.status === 'active' ? 'bg-green-500' :
                                promotion.status === 'paused' ? 'bg-yellow-500' :
                                'bg-gray-500'
                              }
                            >
                              {promotion.status}
                            </Badge>
                            <div className="flex gap-1">
                              {promotion.status === 'active' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updatePromotionStatus(promotion.id, 'paused')}
                                >
                                  <Pause className="h-4 w-4" />
                                </Button>
                              )}
                              {promotion.status === 'paused' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updatePromotionStatus(promotion.id, 'active')}
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updatePromotionStatus(promotion.id, 'completed')}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <div><strong>Applied:</strong> {new Date(promotion.appliedAt).toLocaleDateString()}</div>
                          <div><strong>Start Date:</strong> {new Date(promotion.startDate).toLocaleDateString()}</div>
                          {promotion.endDate && (
                            <div><strong>End Date:</strong> {new Date(promotion.endDate).toLocaleDateString()}</div>
                          )}
                          {promotion.performance && (
                            <div className="mt-2 pt-2 border-t">
                              <strong>Performance:</strong> {promotion.performance.orders} orders, 
                              ${promotion.performance.revenue.toLocaleString()} revenue
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Promotion Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Promotion Recommendations</CardTitle>
                <CardDescription>AI-powered suggestions for discounts, bundles, and promotional strategies</CardDescription>
                <div className="flex gap-2 mt-4">
                  <Button onClick={fetchPromoRecommendations} disabled={isGeneratingPromos} variant="outline">
                    {isGeneratingPromos ? "Generating..." : "Refresh Promos"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isGeneratingPromos && <div className="text-blue-600">Generating promotion recommendations...</div>}
                  {promoRecommendations && promoRecommendations.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {promoRecommendations.map((promo, idx) => (
                        <Card key={idx} className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-navy-blue">{promo.type}</h4>
                            <Badge className="bg-green-500">{promo.estimatedImpact}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{promo.description}</p>
                          <div className="text-xs text-gray-500 mb-3">
                            <strong>Reasoning:</strong> {promo.reasoning}
                          </div>
                          {promo.details && (
                            <div className="text-xs text-gray-500 mb-3">
                              <strong>Details:</strong> {promo.details}
                            </div>
                          )}
                          <Button
                            onClick={() => applyPromotion(promo)}
                            disabled={isApplyingPromo === promo.description}
                            className="w-full bg-navy-blue hover:bg-navy-blue-700"
                            size="sm"
                          >
                            {isApplyingPromo === promo.description ? (
                              <>
                                <Clock className="mr-2 h-4 w-4 animate-spin" />
                                Applying...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Apply Promotion
                              </>
                            )}
                          </Button>
                        </Card>
                      ))}
                    </div>
                  ) : promoRecommendations && promoRecommendations.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      All recommendations have been applied or no new recommendations available.
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Rush Hour Data Section */}
        <Card>
          <CardHeader>
            <CardTitle>Rush Hour Data</CardTitle>
            <CardDescription>See when your restaurant is busiest based on transaction volume</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rushHourData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#2563eb" name="Transactions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
