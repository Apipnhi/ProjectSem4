// app/dashboard/sales-report/page.tsx - Complete Fixed version
"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Calendar, Download, Sparkles, Star, CheckCircle, Clock, Pause, Play, AlertTriangle, RefreshCw } from "lucide-react"
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
  PieChart,
  Pie,
  Cell
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
  cumulative_sales?: number;
  growth_rate?: number;
  market_share?: number;
  customer_acquisition?: number;
  retention_rate?: number;
  seasonal_index?: number;
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
    customerLifetimeValue?: number;
    marketPenetration?: number;
    seasonalityIndex?: number;
    revenuePerCustomer?: number;
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
  id_restaurant?: number;
  restaurant_name?: string;
  growth_rate?: number;
  market_share?: number;
  popularity_index?: number;
}

interface Feedback {
  id_feedback: number;
  rating: number;
  comment: string;
  feedback_date: string;
  customer_name: string;
  restaurant_name: string;
  status: string;
  id_restaurant?: number;
  sentiment_score?: number;
  category?: string;
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
  sentiment_analysis?: {
    positive: number;
    neutral: number;
    negative: number;
  };
  trend_data?: Array<{
    month: string;
    avg_rating: number;
    count: number;
  }>;
}

interface Predictions {
  nextDay?: { sales: number; confidence: number };
  nextMonth?: { sales: number; confidence: number };
  nextYear?: { sales: number; confidence: number };
}

interface TopMenuPrediction {
  menu_name: string;
  predicted_sales: number;
  confidence: number;
  reasoning: string;
  trend: 'rising' | 'stable' | 'declining';
  recommendation: string;
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

interface RushHourData {
  hour: number;
  orders: number;
  revenue: number;
  avg_order_value: number;
}

export default function SalesReportPage() {
  // State for data
  const [salesOverview, setSalesOverview] = useState<SalesOverview | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [rushHourData, setRushHourData] = useState<RushHourData[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [feedbackSummary, setFeedbackSummary] = useState<FeedbackSummary | null>(null);
  
  // State for UI controls
  const [reportPeriod, setReportPeriod] = useState<string>("daily");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("latest");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // State for AI predictions
  const [isGeneratingPrediction, setIsGeneratingPrediction] = useState(false);
  const [predictions, setPredictions] = useState<Predictions | null>(null);
  const [topMenuPrediction, setTopMenuPrediction] = useState<TopMenuPrediction[] | null>(null);
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

  // Helper function to format percentage
  const formatPercentage = (value: number | string | undefined) => {
    const numValue = Number(value) || 0;
    return `${numValue >= 0 ? '+' : ''}${numValue.toFixed(1)}%`;
  };

  // Fetch sales overview data
  const fetchSalesOverview = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching sales overview...');
      const response = await fetch('/api/sales-report');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Sales overview response:', data);
      
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
        
        setLastUpdated(new Date());
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
      console.log('Fetching top products...');
      const response = await fetch('/api/sales-report?type=top-products');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Top products response:', data);
      
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
      console.log('Fetching rush hour data...');
      const response = await fetch('/api/sales-report?type=rush-hour');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Rush hour response:', data);
      
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
      console.log('Fetching feedback...');
      const response = await fetch(`/api/feedback?rating=${ratingFilter}&status=approved&sort=${timeFilter}&limit=20`);
      const data = await response.json();
      console.log('Feedback response:', data);
      
      if (data.success) {
        setFeedback(data.data || []);
        setFeedbackSummary(data.summary);
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

  // Fetch applied promotions
  const fetchAppliedPromotions = async () => {
    try {
      console.log('Fetching applied promotions...');
      const response = await fetch('/api/promotions/applied');
      const data = await response.json();
      console.log('Applied promotions response:', data);
      
      if (data.success) {
        setAppliedPromotions(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching applied promotions:', error);
      setAppliedPromotions([]);
    }
  };

  // Generate AI predictions
  const generatePredictions = async () => {
    setIsGeneratingPrediction(true);
    setPredictionError(null);
    
    try {
      console.log('Generating predictions...');
      const response = await fetch("/api/generate-predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: reportPeriod }),
      });

      const data = await response.json();
      console.log('Predictions response:', data);
      
      if (data.success && data.predictions) {
        setPredictions(data.predictions);
      } else {
        setPredictionError(data.error || "Failed to generate predictions");
      }
    } catch (error) {
      console.error("Error generating predictions:", error);
      setPredictionError("Error generating predictions");
    } finally {
      setIsGeneratingPrediction(false);
    }
  };

  // Generate top menu predictions
  const generateTopMenuPredictions = async () => {
    setIsPredictingTopMenu(true);
    setPredictionError(null);
    
    try {
      console.log('Generating top menu predictions...');
      const response = await fetch("/api/predict-top-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      console.log('Top menu predictions response:', data);
      
      if (data.success && data.predictions) {
        setTopMenuPrediction(data.predictions);
      } else {
        setPredictionError(data.error || "Failed to generate top menu predictions");
      }
    } catch (error) {
      console.error("Error generating top menu predictions:", error);
      setPredictionError("Error generating top menu predictions");
    } finally {
      setIsPredictingTopMenu(false);
    }
  };

  // Generate promotion recommendations
  const generatePromoRecommendations = async () => {
    setIsGeneratingPromos(true);
    setPromoError(null);
    
    try {
      console.log('Generating promotion recommendations...');
      const response = await fetch("/api/generate-promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      console.log('Promotion recommendations response:', data);
      
      if (data.success && data.recommendations) {
        setPromoRecommendations(data.recommendations);
      } else {
        setPromoError(data.error || "Failed to generate promotion recommendations");
      }
    } catch (error) {
      console.error("Error generating promotion recommendations:", error);
      setPromoError("Error generating promotion recommendations");
    } finally {
      setIsGeneratingPromos(false);
    }
  };

  // Apply promotion
  const applyPromotion = async (promotion: Promotion) => {
    setIsApplyingPromo(promotion.type);
    setPromoError(null);
    setApplySuccess(null);
    
    try {
      console.log('Applying promotion:', promotion);
      const response = await fetch("/api/promotions/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(promotion),
      });

      const data = await response.json();
      console.log('Apply promotion response:', data);
      
      if (data.success) {
        setApplySuccess(`Promotion "${promotion.type}" applied successfully!`);
        await fetchAppliedPromotions();
        // Clear success message after 3 seconds
        setTimeout(() => setApplySuccess(null), 3000);
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

  // Toggle promotion status
  const togglePromotionStatus = async (id: string, newStatus: 'active' | 'paused' | 'completed') => {
    try {
      console.log('Toggling promotion status:', id, newStatus);
      const response = await fetch(`/api/promotions/toggle/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      console.log('Toggle promotion response:', data);
      
      if (data.success) {
        await fetchAppliedPromotions();
      }
    } catch (error) {
      console.error("Error toggling promotion status:", error);
    }
  };

  // Refresh all data
  const refreshData = async () => {
    await Promise.all([
      fetchSalesOverview(),
      fetchTopProducts(),
      fetchRushHourData(),
      fetchFeedback(),
      fetchAppliedPromotions()
    ]);
  };

  // Export report
  const exportReport = () => {
    const currentData = getCurrentData();
    const csvData = currentData.map(item => {
      const key = reportPeriod === 'daily' ? 'date' : reportPeriod === 'monthly' ? 'month_name' : 'year';
      return `${item[key]},${item.sales},${item.orders},${item.avgOrder}`;
    }).join('\n');
    
    const blob = new Blob([`Period,Sales,Orders,Avg Order\n${csvData}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${reportPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchSalesOverview();
    fetchAppliedPromotions();
    fetchRushHourData();
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [ratingFilter, timeFilter]);

  useEffect(() => {
    fetchTopProducts();
  }, []);

  // Auto refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(refreshData, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

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
      growthRate: 0,
      customerLifetimeValue: 0,
      marketPenetration: 0,
      seasonalityIndex: 0,
      revenuePerCustomer: 0
    };

    if (!salesOverview?.summary) {
      return defaultSummary;
    }

    const summary = salesOverview.summary;
    
    return {
      totalSales: Number(summary.totalSales) || 0,
      totalOrders: Number(summary.totalOrders) || 0,
      avgOrderValue: Number(summary.avgOrderValue) || 0,
      growthRate: Number(summary.growthRate) || 0,
      customerLifetimeValue: Number(summary.customerLifetimeValue) || 0,
      marketPenetration: Number(summary.marketPenetration) || 0,
      seasonalityIndex: Number(summary.seasonalityIndex) || 0,
      revenuePerCustomer: Number(summary.revenuePerCustomer) || 0
    };
  };

  const summaryData = getSummaryData();

  // Prepare chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <DashboardLayout title="Sales Report">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Sales Report</h2>
            <p className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={refreshData} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
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
              <div className="flex items-center space-x-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading sales data...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summaryData.totalSales)}</div>
              <p className="text-xs text-muted-foreground">
                {formatPercentage(summaryData.growthRate)} from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryData.totalOrders.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Orders processed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summaryData.avgOrderValue)}</div>
              <p className="text-xs text-muted-foreground">
                Per order average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPercentage(summaryData.growthRate)}
              </div>
              <p className="text-xs text-muted-foreground">
                Growth trend
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        {(summaryData.customerLifetimeValue > 0 || summaryData.marketPenetration > 0) && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customer Lifetime Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summaryData.customerLifetimeValue)}</div>
                <p className="text-xs text-muted-foreground">
                  Average customer value
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Market Penetration</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{safeToFixed(summaryData.marketPenetration)}%</div>
                <p className="text-xs text-muted-foreground">
                  Market share
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Seasonality Index</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{safeToFixed(summaryData.seasonalityIndex)}</div>
                <p className="text-xs text-muted-foreground">
                  Seasonal performance
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue per Customer</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summaryData.revenuePerCustomer)}</div>
                <p className="text-xs text-muted-foreground">
                  Per customer revenue
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
            <CardDescription>
              {reportPeriod.charAt(0).toUpperCase() + reportPeriod.slice(1)} sales performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={currentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={dataKey} />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'sales' ? formatCurrency(value) : value.toLocaleString(),
                    name === 'sales' ? 'Sales' : name === 'orders' ? 'Orders' : 'Avg Order'
                  ]}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6}
                  name="Sales"
                />
                <Area 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                  fillOpacity={0.6}
                  name="Orders"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Rush Hour Analysis */}
        {rushHourData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Rush Hour Analysis</CardTitle>
              <CardDescription>
                Order patterns throughout the day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={rushHourData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'revenue' ? formatCurrency(value) : value.toLocaleString(),
                      name === 'revenue' ? 'Revenue' : name === 'orders' ? 'Orders' : 'Avg Order Value'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="orders" fill="#8884d8" name="Orders" />
                  <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Tabs for additional information */}
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="products">Top Products</TabsTrigger>
            <TabsTrigger value="feedback">Customer Feedback</TabsTrigger>
            <TabsTrigger value="predictions">AI Predictions</TabsTrigger>
            <TabsTrigger value="promotions">Promotions</TabsTrigger>
          </TabsList>

          {/* Top Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Products</CardTitle>
                <CardDescription>Best selling menu items with comprehensive analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topProducts.length > 0 ? (
                    <div className="grid gap-4">
                      {topProducts.slice(0, 10).map((product, index) => (
                        <div key={product.id_menu} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex-shrink-0">
                            <Badge variant={index < 3 ? "default" : "secondary"}>
                              #{index + 1}
                            </Badge>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium truncate">{product.nama_menu}</p>
                              <Badge variant="outline" className="text-xs">
                                {product.category}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4 mt-1">
                              <p className="text-sm text-gray-500">
                                {product.total_quantity} sold
                              </p>
                              <p className="text-sm text-gray-500">
                                Avg: {formatCurrency(product.avg_price)}
                              </p>
                              {product.growth_rate && (
                                <p className="text-sm text-green-600">
                                  {formatPercentage(product.growth_rate)} growth
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <div className="text-sm font-medium">
                              {formatCurrency(product.total_revenue)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {product.total_sales} orders
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No product data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Product Performance Chart */}
            {topProducts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Product Performance Distribution</CardTitle>
                  <CardDescription>Revenue distribution among top products</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={topProducts.slice(0, 5).map((product, index) => ({
                          name: product.nama_menu,
                          value: product.total_revenue,
                          fill: COLORS[index % COLORS.length]
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {topProducts.slice(0, 5).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Customer Feedback Tab */}
          <TabsContent value="feedback" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Customer Feedback</CardTitle>
                <CardDescription>Latest customer reviews and ratings analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Rating Filter */}
                  <div className="flex space-x-2">
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

                  {/* Feedback Summary */}
                  {feedbackSummary && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                      <Card>
                        <CardContent className="pt-4">
                          <div className="text-2xl font-bold text-yellow-600">
                            {safeToFixed(feedbackSummary.avg_rating, 1)}
                          </div>
                          <div className="text-sm text-gray-500">Average Rating</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <div className="text-2xl font-bold">{feedbackSummary.total_feedback}</div>
                          <div className="text-sm text-gray-500">Total Reviews</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <div className="text-2xl font-bold text-green-600">
                            {feedbackSummary.five_star}
                          </div>
                          <div className="text-sm text-gray-500">5 Star Reviews</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <div className="text-2xl font-bold text-blue-600">
                            {feedbackSummary.recent_feedback}
                          </div>
                          <div className="text-sm text-gray-500">Recent Reviews</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <div className="text-2xl font-bold text-orange-600">
                            {feedbackSummary.pending_feedback}
                          </div>
                          <div className="text-sm text-gray-500">Pending Reviews</div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Rating Distribution */}
                  {feedbackSummary && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Rating Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {[5, 4, 3, 2, 1].map((rating) => {
                            const count = feedbackSummary[`${rating === 1 ? 'one' : rating === 2 ? 'two' : rating === 3 ? 'three' : rating === 4 ? 'four' : 'five'}_star` as keyof FeedbackSummary] as number || 0;
                            const percentage = feedbackSummary.total_feedback > 0 ? (count / feedbackSummary.total_feedback) * 100 : 0;
                            
                            return (
                              <div key={rating} className="flex items-center space-x-2">
                                <div className="flex items-center space-x-1 w-16">
                                  <span className="text-sm">{rating}</span>
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                </div>
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <div className="text-sm text-gray-500 w-12">
                                  {count}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Feedback List */}
                  <div className="space-y-4">
                    {feedback.length > 0 ? (
                      feedback.map((fb) => (
                        <div key={fb.id_feedback} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{fb.customer_name}</span>
                              <Badge variant="outline">{fb.restaurant_name}</Badge>
                              <Badge 
                                variant={fb.status === 'approved' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {fb.status}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-1">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < fb.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{fb.comment}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-400">
                              {new Date(fb.feedback_date).toLocaleDateString('id-ID', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                            {fb.sentiment_score && (
                              <Badge 
                                variant={fb.sentiment_score > 0.5 ? 'default' : fb.sentiment_score > 0 ? 'secondary' : 'destructive'}
                                className="text-xs"
                              >
                                {fb.sentiment_score > 0.5 ? 'Positive' : fb.sentiment_score > 0 ? 'Neutral' : 'Negative'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No feedback available for the selected filters
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Predictions Tab */}
          <TabsContent value="predictions" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Sales Predictions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Sparkles className="h-5 w-5" />
                    <span>Sales Predictions</span>
                  </CardTitle>
                  <CardDescription>AI-powered sales forecasting based on historical data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button 
                      onClick={generatePredictions} 
                      disabled={isGeneratingPrediction}
                      className="w-full"
                    >
                      {isGeneratingPrediction ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Generating Predictions...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate Sales Predictions
                        </>
                      )}
                    </Button>

                    {predictionError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                        <AlertTriangle className="h-4 w-4 inline mr-2" />
                        {predictionError}
                      </div>
                    )}

                    {predictions && (
                      <div className="space-y-3">
                        {predictions.nextDay && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">Next Day Prediction</span>
                              <Badge variant="outline">{predictions.nextDay.confidence}% confidence</Badge>
                            </div>
                            <div className="text-lg font-semibold text-blue-700">
                              {formatCurrency(predictions.nextDay.sales)}
                            </div>
                            <div className="text-xs text-blue-600 mt-1">
                              Based on recent daily trends
                            </div>
                          </div>
                        )}

                        {predictions.nextMonth && (
                          <div className="p-3 bg-green-50 border border-green-200 rounded">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">Next Month Prediction</span>
                              <Badge variant="outline">{predictions.nextMonth.confidence}% confidence</Badge>
                            </div>
                            <div className="text-lg font-semibold text-green-700">
                              {formatCurrency(predictions.nextMonth.sales)}
                            </div>
                            <div className="text-xs text-green-600 mt-1">
                              Based on monthly patterns
                            </div>
                          </div>
                        )}

                        {predictions.nextYear && (
                          <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">Next Year Prediction</span>
                              <Badge variant="outline">{predictions.nextYear.confidence}% confidence</Badge>
                            </div>
                            <div className="text-lg font-semibold text-purple-700">
                              {formatCurrency(predictions.nextYear.sales)}
                            </div>
                            <div className="text-xs text-purple-600 mt-1">
                              Based on yearly trends and seasonality
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Top Menu Predictions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Top Menu Predictions</span>
                  </CardTitle>
                  <CardDescription>Predict next trending menu items with AI analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button 
                      onClick={generateTopMenuPredictions} 
                      disabled={isPredictingTopMenu}
                      className="w-full"
                    >
                      {isPredictingTopMenu ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Analyzing Menu Trends...
                        </>
                      ) : (
                        <>
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Predict Top Menu Items
                        </>
                      )}
                    </Button>

                    {topMenuPrediction && (
                      <div className="space-y-3">
                        {topMenuPrediction.map((item: TopMenuPrediction, index: number) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium">{item.menu_name}</span>
                              <div className="flex items-center space-x-2">
                                <Badge 
                                  variant={item.trend === 'rising' ? 'default' : item.trend === 'declining' ? 'destructive' : 'secondary'}
                                >
                                  {item.trend}
                                </Badge>
                                <Badge variant="outline">
                                  {item.confidence}%
                                </Badge>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              Predicted Sales: {formatCurrency(item.predicted_sales)}
                            </div>
                            <div className="text-xs text-gray-500 mb-2">
                              {item.reasoning}
                            </div>
                            <div className="text-xs text-blue-600 font-medium">
                              💡 {item.recommendation}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Promotions Tab */}
          <TabsContent value="promotions" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Generate Promotions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Sparkles className="h-5 w-5" />
                    <span>AI Promotion Ideas</span>
                  </CardTitle>
                  <CardDescription>Generate smart promotion recommendations based on sales data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button 
                      onClick={generatePromoRecommendations} 
                      disabled={isGeneratingPromos}
                      className="w-full"
                    >
                      {isGeneratingPromos ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Generating Ideas...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate Promotion Ideas
                        </>
                      )}
                    </Button>

                    {promoError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                        <AlertTriangle className="h-4 w-4 inline mr-2" />
                        {promoError}
                      </div>
                    )}

                    {applySuccess && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
                        <CheckCircle className="h-4 w-4 inline mr-2" />
                        {applySuccess}
                      </div>
                    )}

                    {promoRecommendations && (
                      <div className="space-y-3">
                        {promoRecommendations.map((promo: Promotion, index: number) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium">{promo.type}</span>
                              <Badge variant="outline">{promo.estimatedImpact}</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{promo.description}</p>
                            <p className="text-xs text-gray-500 mb-3">
                              💡 {promo.reasoning}
                            </p>
                            {promo.details && (
                              <p className="text-xs text-blue-600 mb-3">
                                ℹ️ {promo.details}
                              </p>
                            )}
                            <Button 
                              onClick={() => applyPromotion(promo)}
                              disabled={isApplyingPromo === promo.type}
                              size="sm"
                              className="w-full"
                            >
                              {isApplyingPromo === promo.type ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                  Applying...
                                </>
                              ) : (
                                'Apply Promotion'
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Applied Promotions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>Active Promotions</span>
                  </CardTitle>
                  <CardDescription>Currently running promotions and their performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {appliedPromotions.length > 0 ? (
                      appliedPromotions.map((promo: AppliedPromotion) => (
                        <div key={promo.id} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium">{promo.type}</span>
                            <div className="flex items-center space-x-2">
                              <Badge 
                                variant={promo.status === 'active' ? 'default' : promo.status === 'paused' ? 'secondary' : 'outline'}
                              >
                                {promo.status}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => togglePromotionStatus(
                                  promo.id, 
                                  promo.status === 'active' ? 'paused' : 'active'
                                )}
                                className="h-6 w-6 p-0"
                              >
                                {promo.status === 'active' ? 
                                  <Pause className="h-3 w-3" /> : 
                                  <Play className="h-3 w-3" />
                                }
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{promo.description}</p>
                          <div className="text-xs text-gray-500 space-y-1">
                            <div className="flex justify-between">
                              <span>Applied:</span>
                              <span>{new Date(promo.appliedAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Start Date:</span>
                              <span>{new Date(promo.startDate).toLocaleDateString()}</span>
                            </div>
                            {promo.endDate && (
                              <div className="flex justify-between">
                                <span>End Date:</span>
                                <span>{new Date(promo.endDate).toLocaleDateString()}</span>
                              </div>
                            )}
                            {promo.performance && (
                              <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                                <div className="font-medium mb-1">Performance:</div>
                                <div className="flex justify-between">
                                  <span>Orders:</span>
                                  <span>{promo.performance.orders}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Revenue:</span>
                                  <span>{formatCurrency(promo.performance.revenue)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Conversion:</span>
                                  <span>{promo.performance.conversionRate}%</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No active promotions</p>
                        <p className="text-sm">Generate new promotion ideas to get started</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}