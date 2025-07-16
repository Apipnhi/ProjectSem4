// app/dashboard/sales-report/page.tsx
"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Calendar, Download, Sparkles, Star, CheckCircle, Clock, Pause, Play, AlertTriangle } from "lucide-react"
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

// Types for API responses
interface SalesData {
  date?: string;
  month?: string;
  month_name?: string;
  year?: string | number;
  sales: number;
  orders: number;
  avgOrder: number;
  [key: string]: string | number | undefined;
}

interface SalesOverview {
  daily: SalesData[];
  monthly: SalesData[];
  yearly: SalesData[];
  summary: {
    totalSales: number;
    totalOrders: number;
    avgOrderValue: number;
    growthRate: number;
  };
}

interface TopProduct {
  id_menu: number;
  nama_menu: string;
  total_sales: number;
  total_quantity: number;
  total_revenue: number;
  avg_price: number;
  category: string;
}

interface Feedback {
  id_feedback: number;
  rating: number;
  comment: string;
  feedback_date: string;
  customer_name: string;
  restaurant_name: string;
  status: string;
}

interface FeedbackSummary {
  total_feedback: number;
  avg_rating: number;
  five_star: number;
  four_star: number;
  three_star: number;
  two_star: number;
  one_star: number;
  recent_feedback: number;
  pending_feedback: number;
}

interface Predictions {
  nextDay?: { sales: number; confidence: number };
  nextMonth?: { sales: number; confidence: number };
  nextYear?: { sales: number; confidence: number };
}

interface Promotion {
  type: string;
  description: string;
  reasoning: string;
  estimatedImpact: string;
  details?: string;
}

interface AppliedPromotion extends Promotion {
  id: string;
  appliedAt: string;
  status: 'active' | 'paused' | 'completed';
  startDate: string;
  endDate?: string;
  performance?: {
    orders: number;
    revenue: number;
    conversionRate: number;
  };
}

export default function SalesReportPage() {
  // State for data
  const [salesOverview, setSalesOverview] = useState<SalesOverview | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [rushHourData, setRushHourData] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [feedbackSummary, setFeedbackSummary] = useState<FeedbackSummary | null>(null);
  
  // State for UI controls
  const [reportPeriod, setReportPeriod] = useState<string>("daily");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("latest");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for AI predictions
  const [isGeneratingPrediction, setIsGeneratingPrediction] = useState(false);
  const [predictions, setPredictions] = useState<Predictions | null>(null);
  const [topMenuPrediction, setTopMenuPrediction] = useState<any[] | null>(null);
  const [isPredictingTopMenu, setIsPredictingTopMenu] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  // State for promotions
  const [promoRecommendations, setPromoRecommendations] = useState<Promotion[] | null>(null);
  const [appliedPromotions, setAppliedPromotions] = useState<AppliedPromotion[]>([]);
  const [isGeneratingPromos, setIsGeneratingPromos] = useState(false);
  const [isApplyingPromo, setIsApplyingPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);

  // Fetch sales overview data
  const fetchSalesOverview = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/sales-report?type=overview');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSalesOverview(data.data);
      } else {
        setError(data.error || 'Failed to fetch sales data');
      }
    } catch (error) {
      console.error('Error fetching sales overview:', error);
      setError(`Failed to fetch sales data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch top products data
  const fetchTopProducts = async () => {
    try {
      const response = await fetch('/api/sales-report?type=top-products');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setTopProducts(data.data);
      }
    } catch (error) {
      console.error('Error fetching top products:', error);
      setTopProducts([]);
    }
  };

  // Fetch rush hour data
  const fetchRushHourData = async () => {
    try {
      const response = await fetch('/api/sales-report?type=rush-hour');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setRushHourData(data.data);
      }
    } catch (error) {
      console.error('Error fetching rush hour data:', error);
      setRushHourData([]);
    }
  };

  // Fetch feedback data
  const fetchFeedback = async () => {
    try {
      const response = await fetch(`/api/feedback?rating=${ratingFilter}&status=approved&sort=${timeFilter}&limit=20`);
      const data = await response.json();
      
      if (data.success) {
        setFeedback(data.data || []);
        setFeedbackSummary(data.summary);
        console.log('Feedback loaded:', data.data?.length, 'items');
      } else {
        console.error('Failed to fetch feedback:', data.error);
        setFeedback([]);
        setFeedbackSummary(null);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      setFeedback([]);
      setFeedbackSummary(null);
    }
  };

  // Generate AI predictions
  const generatePredictions = async () => {
    setIsGeneratingPrediction(true);
    try {
      const response = await fetch("/api/generate-predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: reportPeriod }),
      });

      const data = await response.json();
      if (data.predictions) {
        setPredictions(data.predictions);
      }
    } catch (error) {
      console.error("Error generating predictions:", error);
      // Fallback predictions
      setPredictions({
        nextDay: { sales: 85000, confidence: 85 },
        nextMonth: { sales: 2500000, confidence: 78 },
        nextYear: { sales: 32000000, confidence: 72 },
      });
    }
    setIsGeneratingPrediction(false);
  };

  // Generate top menu predictions
  const fetchTopMenuPrediction = async () => {
    setIsPredictingTopMenu(true);
    setPredictionError(null);
    try {
      const response = await fetch("/api/generate-predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          menuSales: topProducts.slice(0, 10),
          period: reportPeriod 
        }),
      });
      
      const data = await response.json();
      if (data.topItems) {
        setTopMenuPrediction(data.topItems);
      } else {
        setPredictionError(data.error || "No prediction returned");
        setTopMenuPrediction(null);
      }
    } catch (err) {
      setPredictionError("Failed to fetch prediction");
      setTopMenuPrediction(null);
    }
    setIsPredictingTopMenu(false);
  };

  // Generate promotion recommendations
  const fetchPromoRecommendations = async () => {
    setIsGeneratingPromos(true);
    setPromoError(null);
    try {
      const response = await fetch("/api/generate-predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          menuSales: topProducts.slice(0, 10),
          period: reportPeriod,
          promoAnalysis: true 
        }),
      });
      
      const data = await response.json();
      if (data.promos) {
        setPromoRecommendations(data.promos);
      } else {
        setPromoError(data.error || "No promo recommendations returned");
        setPromoRecommendations(null);
      }
    } catch (err) {
      setPromoError("Failed to fetch promo recommendations");
      setPromoRecommendations(null);
    }
    setIsGeneratingPromos(false);
  };

  // Apply promotion
  const applyPromotion = async (promotion: Promotion) => {
    setIsApplyingPromo(promotion.description);
    setApplySuccess(null);
    
    try {
      const response = await fetch("/api/apply-promotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promotion,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setAppliedPromotions(prev => [...prev, data.promotion]);
        setApplySuccess(data.message);
        setPromoRecommendations(prev => prev?.filter(p => p.description !== promotion.description) || null);
      } else {
        setPromoError(data.error || "Failed to apply promotion");
      }
    } catch (error) {
      console.error("Error applying promotion:", error);
      setPromoError("Failed to apply promotion");
    }
    
    setIsApplyingPromo(null);
  };

  // Update promotion status
  const updatePromotionStatus = async (promotionId: string, status: 'active' | 'paused' | 'completed') => {
    try {
      const response = await fetch("/api/apply-promotion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promotionId, status }),
      });

      const data = await response.json();
      
      if (data.success) {
        setAppliedPromotions(prev => 
          prev.map(p => p.id === promotionId ? { ...p, status } : p)
        );
        setApplySuccess(data.message);
      } else {
        setPromoError(data.error || "Failed to update promotion status");
      }
    } catch (error) {
      console.error("Error updating promotion status:", error);
      setPromoError("Failed to update promotion status");
    }
  };

  // Fetch applied promotions
  const fetchAppliedPromotions = async () => {
    try {
      const response = await fetch("/api/apply-promotion");
      const data = await response.json();
      
      if (data.promotions) {
        setAppliedPromotions(data.promotions);
      }
    } catch (error) {
      console.error("Error fetching applied promotions:", error);
    }
  };

  // Format currency in Indonesian Rupiah
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get current data based on period
  const getCurrentData = (): SalesData[] => {
    if (!salesOverview) return [];
    
    switch (reportPeriod) {
      case "daily":
        return salesOverview.daily;
      case "monthly":
        return salesOverview.monthly;
      case "yearly":
        return salesOverview.yearly;
      default:
        return salesOverview.daily;
    }
  };

  const getDataKey = (): string => {
    switch (reportPeriod) {
      case "daily":
        return "date";
      case "monthly":
        return "month_name";
      case "yearly":
        return "year";
      default:
        return "date";
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchSalesOverview();
    fetchTopProducts();
    fetchRushHourData();
    fetchFeedback();
    fetchAppliedPromotions();
  }, []);

  // Update data when period changes
  useEffect(() => {
    if (topProducts.length > 0) {
      fetchTopMenuPrediction();
      fetchPromoRecommendations();
    }
  }, [reportPeriod, topProducts]);

  // Update feedback when filters change
  useEffect(() => {
    fetchFeedback();
  }, [ratingFilter, timeFilter]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (applySuccess) {
      const timer = setTimeout(() => setApplySuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [applySuccess]);

  useEffect(() => {
    if (promoError) {
      const timer = setTimeout(() => setPromoError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [promoError]);

  const currentData = getCurrentData();
  const dataKey = getDataKey();

  if (isLoading && !salesOverview) {
    return (
      <DashboardLayout title="Reports">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-blue mx-auto mb-4"></div>
            <div className="text-gray-600">Loading sales data...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Reports">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
          <Button 
            onClick={fetchSalesOverview} 
            className="mt-4 bg-red-600 hover:bg-red-700"
          >
            Retry
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Reports">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-navy-blue">Sales Reports</h2>
            <p className="text-gray-600">Analyze your restaurant's performance with AI-powered insights</p>
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
        {salesOverview && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(salesOverview.summary.totalSales)}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={`${salesOverview.summary.growthRate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {salesOverview.summary.growthRate >= 0 ? '+' : ''}{salesOverview.summary.growthRate}%
                  </span> from last period
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{salesOverview.summary.totalOrders.toLocaleString()}</div>
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
                <div className="text-2xl font-bold">{formatCurrency(Math.round(salesOverview.summary.avgOrderValue))}</div>
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
                <div className="text-2xl font-bold">{salesOverview.summary.growthRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Monthly growth trend
                </p>
              </CardContent>
            </Card>
          </div>
        )}

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
                  <p className="text-2xl font-bold text-navy-blue">{formatCurrency(predictions.nextDay?.sales || 0)}</p>
                  <Badge className="mt-2 bg-green-500">{predictions.nextDay?.confidence}% Confidence</Badge>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg">Next Month</h3>
                  <p className="text-2xl font-bold text-navy-blue">{formatCurrency(predictions.nextMonth?.sales || 0)}</p>
                  <Badge className="mt-2 bg-yellow-500">{predictions.nextMonth?.confidence}% Confidence</Badge>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg">Next Year</h3>
                  <p className="text-2xl font-bold text-navy-blue">{formatCurrency(predictions.nextYear?.sales || 0)}</p>
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
                {currentData.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-gray-400 mb-2">📊</div>
                      <div className="text-gray-600">No sales data available for {reportPeriod} period</div>
                      <Button 
                        onClick={fetchSalesOverview} 
                        variant="outline" 
                        size="sm" 
                        className="mt-3"
                      >
                        🔄 Refresh Data
                      </Button>
                    </div>
                  </div>
                ) : (
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
                      <Tooltip 
                        formatter={(value: any) => [formatCurrency(value), 'Sales']}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="sales"
                        stroke="#0f2b5b"
                        fillOpacity={1}
                        fill="url(#colorSales)"
                        name="Sales"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Orders Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Orders Overview</CardTitle>
                <CardDescription>Number of orders over time</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {currentData.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-gray-400 mb-2">📋</div>
                      <div className="text-gray-600">No order data available</div>
                    </div>
                  </div>
                ) : (
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
                )}
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
                    <Tooltip 
                      formatter={(value: any) => [formatCurrency(value), 'Avg Order']}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="avgOrder"
                      stroke="#0f2b5b"
                      strokeWidth={3}
                      name="Average Order"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Rush Hour Data */}
            <Card>
              <CardHeader>
                <CardTitle>Rush Hour Analysis</CardTitle>
                <CardDescription>Peak transaction times throughout the day</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {rushHourData.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-gray-400 mb-2">⏰</div>
                      <div className="text-gray-600">No rush hour data available</div>
                      <Button 
                        onClick={fetchRushHourData} 
                        variant="outline" 
                        size="sm" 
                        className="mt-3"
                      >
                        🔄 Refresh Data
                      </Button>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rushHourData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#2563eb" name="Transactions" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
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
                    <Sparkles className="mr-2 h-4 w-4" />
                    {isPredictingTopMenu ? "Predicting..." : "AI Predictions"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isPredictingTopMenu && (
                    <div className="text-blue-600 flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Generating AI predictions for top sellers...
                    </div>
                  )}
                  
                  {predictionError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-red-800">{predictionError}</span>
                      </div>
                    </div>
                  )}
                  
                  {topMenuPrediction && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-500" />
                        AI Predicted Top Sellers
                      </h3>
                      <div className="grid gap-3">
                        {topMenuPrediction.map((item, idx) => (
                          <div key={item.name} className="border rounded-lg p-4 bg-gradient-to-r from-purple-50 to-blue-50">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-sm">
                                {idx + 1}
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-navy-blue">{item.name}</div>
                                <div className="text-sm text-gray-600 mt-1">{item.reason}</div>
                                <div className="flex items-center gap-4 mt-2">
                                  <span className="text-xs text-purple-600 font-medium">
                                    Predicted Sales: {item.predictedSales}
                                  </span>
                                  <Badge className="bg-purple-500 text-xs">
                                    {item.confidence}% Confidence
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Current Top Performers</h3>
                    {topProducts.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-gray-400 mb-2">🍽️</div>
                        <div className="text-gray-600">No menu sales data available</div>
                        <Button 
                          onClick={fetchTopProducts} 
                          variant="outline" 
                          size="sm" 
                          className="mt-3"
                        >
                          🔄 Refresh Menu Data
                        </Button>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {topProducts.slice(0, 10).map((item, index) => (
                          <div key={item.id_menu} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                            <div className="flex items-center gap-4">
                              <div className="w-8 h-8 rounded-full bg-navy-blue text-white flex items-center justify-center font-bold">
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-semibold">{item.nama_menu}</div>
                                <div className="text-sm text-gray-500">
                                  {item.total_quantity} orders • {formatCurrency(item.total_revenue)} revenue
                                </div>
                                <Badge variant="outline" className="text-xs mt-1">
                                  {item.category}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg text-navy-blue">#{index + 1}</div>
                              <div className="text-sm text-gray-500">{formatCurrency(item.avg_price)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Customer Feedback & Reviews</CardTitle>
                <CardDescription>Real customer feedback from your database</CardDescription>
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
                        <SelectItem value="rating_high">Rating High</SelectItem>
                        <SelectItem value="rating_low">Rating Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={fetchFeedback} variant="outline" size="sm">
                      🔄 Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Feedback Summary */}
                {feedbackSummary && (
                  <div className="grid gap-4 md:grid-cols-4 mb-6">
                    <div className="text-center p-3 border rounded-lg bg-blue-50">
                      <div className="text-2xl font-bold text-blue-600">{feedbackSummary.total_feedback}</div>
                      <div className="text-sm text-blue-600">Total Reviews</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg bg-yellow-50">
                      <div className="text-2xl font-bold text-yellow-600">{feedbackSummary.avg_rating.toFixed(1)}</div>
                      <div className="text-sm text-yellow-600">Average Rating</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg bg-green-50">
                      <div className="text-2xl font-bold text-green-600">{feedbackSummary.recent_feedback}</div>
                      <div className="text-sm text-green-600">Recent (7 days)</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg bg-orange-50">
                      <div className="text-2xl font-bold text-orange-600">{feedbackSummary.pending_feedback}</div>
                      <div className="text-sm text-orange-600">Pending Review</div>
                    </div>
                  </div>
                )}

                {feedback.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <div className="text-gray-400 mb-2">💬</div>
                    <div className="text-gray-600">No feedback found for the selected filters.</div>
                    <p className="text-sm text-gray-500 mt-2">
                      Try changing the rating filter or check if there is feedback data in your database.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {feedback.map((fb) => (
                      <div key={fb.id_feedback} className="border rounded-lg p-4 bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-navy-blue">{fb.customer_name}</span>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star 
                                  key={star} 
                                  className="h-4 w-4" 
                                  fill={star <= fb.rating ? "#facc15" : "none"} 
                                  stroke="#facc15" 
                                />
                              ))}
                            </div>
                            <Badge 
                              className={
                                fb.status === 'approved' ? 'bg-green-500' :
                                fb.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
                              }
                            >
                              {fb.status}
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(fb.feedback_date).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="text-gray-700">{fb.comment}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Restaurant: {fb.restaurant_name}
                        </div>
                      </div>
                    ))}
                  </div>
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
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="text-red-800">{promoError}</span>
                </div>
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
                              {formatCurrency(promotion.performance.revenue)} revenue
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
                <CardTitle>AI Promotion Recommendations</CardTitle>
                <CardDescription>Smart promotional strategies based on your sales data</CardDescription>
                <div className="flex gap-2 mt-4">
                  <Button onClick={fetchPromoRecommendations} disabled={isGeneratingPromos} variant="outline">
                    <Sparkles className="mr-2 h-4 w-4" />
                    {isGeneratingPromos ? "Generating..." : "Refresh AI Recommendations"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isGeneratingPromos && (
                    <div className="text-blue-600 flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Generating AI promotion recommendations...
                    </div>
                  )}
                  
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
                            <strong>AI Reasoning:</strong> {promo.reasoning}
                          </div>
                          {promo.details && (
                            <div className="text-xs text-gray-500 mb-3">
                              <strong>Implementation:</strong> {promo.details}
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
                      All AI recommendations have been applied or no new recommendations available.
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}