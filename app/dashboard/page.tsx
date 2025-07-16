// app/dashboard/page.tsx
"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package, 
  AlertTriangle, 
  Clock,
  Eye,
  RefreshCw
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

// Types
interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  avgOrderValue: number;
  salesGrowth: number;
  ordersGrowth: number;
  customersGrowth: number;
  avgOrderGrowth: number;
}

interface SalesData {
  date: string;
  sales: number;
  orders: number;
}

interface TopProduct {
  name: string;
  sales: number;
  quantity: number;
  revenue: number;
}

interface RecentOrder {
  id: number;
  date: string;
  total: number;
  status: string;
}

interface StockAlert {
  id: number;
  name: string;
  quantity: number;
  status: string;
  daysUntilExpiry: number;
}

interface DashboardData {
  stats: DashboardStats;
  salesData: SalesData[];
  topProducts: TopProduct[];
  recentOrders: RecentOrder[];
  stockAlerts: StockAlert[];
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/dashboard')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        setDashboardData(result.data)
        setLastUpdated(new Date())
      } else {
        throw new Error(result.error || 'Failed to fetch dashboard data')
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError(error instanceof Error ? error.message : 'Unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Auto refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short'
    })
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'expired':
        return <Badge className="bg-red-500">Expired</Badge>
      case 'critical':
        return <Badge className="bg-orange-500">Critical</Badge>
      case 'warning':
        return <Badge className="bg-yellow-500">Warning</Badge>
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>
      default:
        return <Badge className="bg-gray-500">Unknown</Badge>
    }
  }

  // Get growth indicator
  const getGrowthIndicator = (growth: number) => {
    if (growth > 0) {
      return (
        <div className="flex items-center text-green-600">
          <TrendingUp className="h-4 w-4 mr-1" />
          <span className="text-sm">+{growth}%</span>
        </div>
      )
    } else if (growth < 0) {
      return (
        <div className="flex items-center text-red-600">
          <TrendingDown className="h-4 w-4 mr-1" />
          <span className="text-sm">{growth}%</span>
        </div>
      )
    } else {
      return (
        <div className="flex items-center text-gray-600">
          <span className="text-sm">0%</span>
        </div>
      )
    }
  }

  if (isLoading && !dashboardData) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-blue mx-auto mb-4"></div>
            <div className="text-gray-600">Loading dashboard...</div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
          <Button 
            onClick={fetchDashboardData} 
            className="mt-4 bg-red-600 hover:bg-red-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-navy-blue">Dashboard Overview</h1>
            <p className="text-gray-600">
              Last updated: {lastUpdated.toLocaleTimeString('id-ID')}
            </p>
          </div>
          <Button 
            onClick={fetchDashboardData} 
            disabled={isLoading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Key Metrics */}
        {dashboardData?.stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(dashboardData.stats.totalSales)}
                </div>
                {getGrowthIndicator(dashboardData.stats.salesGrowth)}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.stats.totalOrders.toLocaleString()}
                </div>
                {getGrowthIndicator(dashboardData.stats.ordersGrowth)}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.stats.totalCustomers.toLocaleString()}
                </div>
                {getGrowthIndicator(dashboardData.stats.customersGrowth)}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(dashboardData.stats.avgOrderValue)}
                </div>
                {getGrowthIndicator(dashboardData.stats.avgOrderGrowth)}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sales Chart */}
        {dashboardData?.salesData && (
          <Card>
            <CardHeader>
              <CardTitle>Sales Trend (7 Days)</CardTitle>
              <CardDescription>Daily sales and orders for the past week</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardData.salesData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f2b5b" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#0f2b5b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                  />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip 
                    labelFormatter={(value) => formatDate(value)}
                    formatter={(value: any, name: string) => [
                      name === 'sales' ? formatCurrency(value) : value,
                      name === 'sales' ? 'Sales' : 'Orders'
                    ]}
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
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Top Products */}
          {dashboardData?.topProducts && (
            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>Best selling items this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-navy-blue text-white flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">
                            {product.quantity} sold
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-navy-blue">
                          {formatCurrency(product.revenue)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.sales} orders
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Orders */}
          {dashboardData?.recentOrders && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest customer orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <ShoppingCart className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">Order #{order.id}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(order.date).toLocaleDateString('id-ID')}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-navy-blue">
                          {formatCurrency(order.total)}
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Stock Alerts */}
        {dashboardData?.stockAlerts && dashboardData.stockAlerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Stock Alerts
              </CardTitle>
              <CardDescription>Items that need attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.stockAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-gray-500" />
                      <div>
                        <div className="font-medium">{alert.name}</div>
                        <div className="text-sm text-gray-500">
                          Quantity: {alert.quantity}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(alert.status)}
                      <div className="text-sm text-gray-500 mt-1">
                        {alert.daysUntilExpiry >= 0 ? 
                          `${alert.daysUntilExpiry} days left` : 
                          `Expired ${Math.abs(alert.daysUntilExpiry)} days ago`
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}