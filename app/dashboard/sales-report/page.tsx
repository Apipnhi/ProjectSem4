// app/dashboard/sales-report/page.tsx - Fixed version
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

  // Helper function to format currency safely
  const formatCurrency = (amount: number | string | undefined) => {
    const numAmount = Number(amount) || 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  };

  // Helper function to safely format numbers
  const safeToFixed = (num: number | string | undefined, decimals: number = 1) => {
    const numValue = Number(num) || 0;
    return numValue.toFixed(decimals);
  };

  // Fetch sales overview data
  const fetchSalesOverview = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/sales-report');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        // Set overview data from the API response structure
        setSalesOverview(data.data.overview);
        
        // Set other data if available
        if (data.data.topProducts) {
          setTopProducts(data.data.topProducts);
        }
        
        if (data.data.feedback) {
          setFeedback(data.data.feedback.items || []);
          setFeedbackSummary(data.data.feedback.summary);
        }
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
    setPredictionError(null);
    
    try {
      const response = await fetch("/api/generate-predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: reportPeriod }),
      });

      const data = await response.json();
      if (data.predictions) {
        setPredictions(data.predictions);
      } else {
        setPredictionError("Failed to generate predictions");
      }
    } catch (error) {
      console.error("Error generating predictions:", error);
      setPredictionError("Error generating predictions");
      // Fallback predictions
      setPredictions({
        nextDay: { sales: 85000, confidence: 85 },
        nextMonth: { sales: 2500000, confidence: 78 },
        nextYear: { sales: 30000000, confidence: 70 }
      });
    } finally {
      setIsGeneratingPrediction(false);
    }
  };

  // Generate Top Menu Predictions  
  const generateTopMenuPrediction = async () => {
    setIsPredictingTopMenu(true);
    setPredictionError(null);
    
    try {
      const response = await fetch("/api/predict-top-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (data.success) {
        setTopMenuPrediction(data.predictions);
      } else {
        setPredictionError(data.error || "Failed to generate menu predictions");
      }
    } catch (error) {
      console.error("Error predicting top menu:", error);
      setPredictionError("Error generating menu predictions");
    } finally {
      setIsPredictingTopMenu(false);
    }
  };

  // Generate Promo Recommendations
  const generatePromoRecommendations = async () => {
    setIsGeneratingPromos(true);
    setPromoError(null);
    
    try {
      const response = await fetch("/api/generate-promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (data.success) {
        setPromoRecommendations(data.recommendations);
      } else {
        setPromoError(data.error || "Failed to generate recommendations");
      }
    } catch (error) {
      console.error("Error generating promos:", error);
      setPromoError("Error generating promo recommendations");
    } finally {
      setIsGeneratingPromos(false);
    }
  };

  // Apply Promotion
  const applyPromotion = async (promo: Promotion) => {
    setIsApplyingPromo(promo.type);
    setPromoError(null);
    setApplySuccess(null);
    
    try {
      const response = await fetch("/api/apply-promotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(promo),
      });

      const data = await response.json();
      if (data.success) {
        setApplySuccess(`${promo.type} promotion applied successfully!`);
        // Refresh applied promotions
        fetchAppliedPromotions();
      } else {
        setPromoError(data.error || "Failed to apply promotion");
      }
    } catch (error) {
      console.error("Error applying promotion:", error);
      setPromoError("Error applying promotion");
    } finally {
      setIsApplyingPromo(null);
    }
  };

  // Fetch Applied Promotions
  const fetchAppliedPromotions = async () => {
    try {
      const response = await fetch("/api/applied-promotions");
      const data = await response.json();
      
      if (data.success) {
        setAppliedPromotions(data.promotions);
      }
    } catch (error) {
      console.error("Error fetching applied promotions:", error);
    }
  };

  // Toggle Promotion Status
  const togglePromotionStatus = async (id: string, newStatus: 'active' | 'paused' | 'completed') => {
    try {
      const response = await fetch(`/api/applied-promotions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchAppliedPromotions();
      }
    } catch (error) {
      console.error("Error toggling promotion status:", error);
    }
  };

  // Export report
  const exportReport = () => {
    // Simple CSV export
    const csvData = currentData.map(item => {
      const key = reportPeriod === 'daily' ? 'date' : reportPeriod === 'monthly' ? 'month_name' : 'year';
      return `${item[key]},${item.sales},${item.orders},${item.avgOrder}`;
    }).join('\n');
    
    const blob = new Blob([`Period,Sales,Orders,Avg Order\n${csvData}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${reportPeriod}.csv`;
    a.click();
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchSalesOverview();
    fetchAppliedPromotions();
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [ratingFilter, timeFilter]);

  // Get current data based on selected period
  const getCurrentData = () => {
    if (!salesOverview) return [];
    
    switch (reportPeriod) {
      case 'daily':
        return salesOverview.daily || [];
      case 'monthly':
        return salesOverview.monthly || [];
      case 'yearly':
        return salesOverview.yearly || [];
      default:
        return [];
    }
  };

  const currentData = getCurrentData();
  
  // Get data key for chart
  const getDataKey = () => {
    switch (reportPeriod) {
      case 'daily':
        return 'date';
      case 'monthly':
        return 'month_name';
      case 'yearly':
        return 'year';
      default:
        return 'date';
    }
  };

  const dataKey = getDataKey();

  // Helper function to safely get summary data
  const getSummaryData = () => {
    const defaultSummary = {
      totalSales: 0,
      totalOrders: 0,
      avgOrderValue: 0,
      growthRate: 0
    };

    if (!salesOverview?.summary) {
      return defaultSummary;
    }

    const summary = salesOverview.summary;
    
    return {
      totalSales: Number(summary.totalSales) || 0,
      totalOrders: Number(summary.totalOrders) || 0,
      avgOrderValue: Number(summary.avgOrderValue) || 0,
      growthRate: Number(summary.growthRate) || 0
    };
  };

  const summaryData = getSummaryData();

  return (
    <DashboardLayout title="Sales Report">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Sales Report</h2>
          <div className="flex items-center space-x-2">
            <Select value={reportPeriod} onValueChange={setReportPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportReport} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
                <Button 
                  onClick={fetchSalesOverview} 
                  variant="outline" 
                  size="sm" 
                  className="ml-4"
                >
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading sales data...</p>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        {!isLoading && !error && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summaryData.totalSales)}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={`${summaryData.growthRate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {summaryData.growthRate >= 0 ? '+' : ''}{safeToFixed(summaryData.growthRate)}%
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
                <div className="text-2xl font-bold">{summaryData.totalOrders.toLocaleString()}</div>
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
                <div className="text-2xl font-bold">{formatCurrency(Math.round(summaryData.avgOrderValue))}</div>
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
                <div className="text-2xl font-bold">{safeToFixed(summaryData.growthRate)}%</div>
                <p className="text-xs text-muted-foreground">
                  Period over period growth
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* AI Predictions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Sales Predictions
            </CardTitle>
            <CardDescription>
              AI-powered predictions based on historical data and trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Button
                onClick={generatePredictions}
                disabled={isGeneratingPrediction}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isGeneratingPrediction ? "Generating..." : "Generate Predictions"}
              </Button>
              <Button
                onClick={generateTopMenuPrediction}
                disabled={isPredictingTopMenu}
                variant="outline"
              >
                {isPredictingTopMenu ? "Predicting..." : "Predict Top Menu"}
              </Button>
            </div>

            {predictionError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{predictionError}</p>
              </div>
            )}

            {predictions && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
            )}
          </CardContent>
        </Card>

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
                      <div className="text-gray-400 mb-2">📈</div>
                      <div className="text-gray-600">No order data available</div>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={currentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey={dataKey} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="orders" fill="#8884d8" name="Orders" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sales Trends</CardTitle>
                <CardDescription>Sales and orders trend analysis</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                {currentData.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-gray-400 mb-2">📈</div>
                      <div className="text-gray-600">No trend data available</div>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={currentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey={dataKey} />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip 
                        formatter={(value: any, name: string) => [
                          name === 'Sales' ? formatCurrency(value) : value, 
                          name
                        ]}
                      />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="sales"
                        stroke="#8884d8"
                        strokeWidth={2}
                        name="Sales"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="orders"
                        stroke="#82ca9d"
                        strokeWidth={2}
                        name="Orders"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>Best performing products by sales</CardDescription>
              </CardHeader>
              <CardContent>
                {topProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">🍽️</div>
                    <div className="text-gray-600">No product data available</div>
                    <Button 
                      onClick={fetchTopProducts} 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                    >
                      🔄 Load Products
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topProducts.map((product, index) => (
                      <div key={product.id_menu} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-blue-600">#{index + 1}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold">{product.nama_menu}</h3>
                            <p className="text-sm text-gray-500">
                              {product.total_quantity} sold • {formatCurrency(product.avg_price)} avg price
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(product.total_revenue)}</div>
                          <div className="text-sm text-gray-500">{product.total_sales} sales</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Top Menu Predictions */}
                {topMenuPrediction && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      AI Predicted Top Menu Items
                    </h3>
                    <div className="space-y-3">
                      {topMenuPrediction.map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div>
                            <span className="font-medium">{item.menu_name}</span>
                            <p className="text-sm text-gray-600">{item.reasoning}</p>
                          </div>
                          <Badge variant="outline" className="bg-blue-100">
                            {item.confidence}% likely
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-x-2">
                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="1">1 Star</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">Latest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="highest">Highest Rating</SelectItem>
                    <SelectItem value="lowest">Lowest Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

                {feedbackSummary ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{feedbackSummary.total_feedback || 0}</div>
                        <p className="text-xs text-muted-foreground">Customer reviews</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold flex items-center">
                          {safeToFixed(feedbackSummary.avg_rating)}
                          <Star className="ml-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
                        </div>
                        <p className="text-xs text-muted-foreground">Out of 5 stars</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">5-Star Reviews</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{feedbackSummary.five_star || 0}</div>
                        <p className="text-xs text-muted-foreground">
                          {safeToFixed(((feedbackSummary.five_star || 0) / (feedbackSummary.total_feedback || 1)) * 100)}% of total
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Recent Reviews</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{feedbackSummary.recent_feedback || 0}</div>
                        <p className="text-xs text-muted-foreground">Last 7 days</p>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">⭐</div>
                    <div className="text-gray-600">No feedback summary available</div>
                  </div>
                )}

            {/* Feedback List */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Reviews</CardTitle>
                <CardDescription>Recent customer feedback and ratings</CardDescription>
              </CardHeader>
              <CardContent>
                {feedback.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">💬</div>
                    <div className="text-gray-600">No reviews available</div>
                    <Button 
                      onClick={fetchFeedback} 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                    >
                      🔄 Refresh Reviews
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {feedback.map((review) => (
                      <div key={review.id_feedback} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{review.customer_name}</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.feedback_date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                        <div className="mt-2 text-xs text-gray-500">
                          {review.restaurant_name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="promotions" className="space-y-4">
            {/* Promo Generation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  AI Promotion Recommendations
                </CardTitle>
                <CardDescription>
                  Generate personalized promotion strategies based on sales data and customer behavior
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={generatePromoRecommendations}
                  disabled={isGeneratingPromos}
                  className="mb-4"
                >
                  {isGeneratingPromos ? "Generating..." : "Generate AI Recommendations"}
                </Button>

                {promoError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{promoError}</p>
                  </div>
                )}

                {applySuccess && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 text-sm">{applySuccess}</p>
                  </div>
                )}

                {promoRecommendations && (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Recommended Promotions</h3>
                    {promoRecommendations.map((promo, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{promo.type}</h4>
                          <Button
                            onClick={() => applyPromotion(promo)}
                            disabled={isApplyingPromo === promo.type}
                            size="sm"
                          >
                            {isApplyingPromo === promo.type ? "Applying..." : "Apply"}
                          </Button>
                        </div>
                        <p className="text-gray-700 mb-2">{promo.description}</p>
                        <p className="text-sm text-gray-600 mb-2">{promo.reasoning}</p>
                        <Badge variant="outline">{promo.estimatedImpact}</Badge>
                        {promo.details && (
                          <p className="text-xs text-gray-500 mt-2">{promo.details}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Applied Promotions */}
            <Card>
              <CardHeader>
                <CardTitle>Active Promotions</CardTitle>
                <CardDescription>Currently running promotional campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                {appliedPromotions.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">🎯</div>
                    <div className="text-gray-600">No active promotions</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appliedPromotions.map((promo) => (
                      <div key={promo.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{promo.type}</h4>
                            <Badge 
                              variant={promo.status === 'active' ? 'default' : promo.status === 'paused' ? 'secondary' : 'outline'}
                            >
                              {promo.status}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            {promo.status === 'active' ? (
                              <Button
                                onClick={() => togglePromotionStatus(promo.id, 'paused')}
                                size="sm"
                                variant="outline"
                              >
                                <Pause className="h-4 w-4" />
                              </Button>
                            ) : promo.status === 'paused' ? (
                              <Button
                                onClick={() => togglePromotionStatus(promo.id, 'active')}
                                size="sm"
                                variant="outline"
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            ) : null}
                            <Button
                              onClick={() => togglePromotionStatus(promo.id, 'completed')}
                              size="sm"
                              variant="outline"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-2">{promo.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Applied: {new Date(promo.appliedAt).toLocaleDateString()}</span>
                          <span>Start: {new Date(promo.startDate).toLocaleDateString()}</span>
                          {promo.endDate && (
                            <span>End: {new Date(promo.endDate).toLocaleDateString()}</span>
                          )}
                        </div>
                        {promo.performance && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Orders:</span>
                                <span className="ml-1 font-medium">{promo.performance.orders}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Revenue:</span>
                                <span className="ml-1 font-medium">{formatCurrency(promo.performance.revenue)}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Conversion:</span>
                                <span className="ml-1 font-medium">{promo.performance.conversionRate}%</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}