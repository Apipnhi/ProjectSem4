"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Calendar, Download, Sparkles } from "lucide-react"
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

export default function SalesReportPage() {
  const [reportPeriod, setReportPeriod] = useState("daily")
  const [isGeneratingPrediction, setIsGeneratingPrediction] = useState(false)
  const [predictions, setPredictions] = useState(null)

  // Sample sales data
  const dailySalesData = [
    { date: "2024-01-01", sales: 1200, orders: 45, avgOrder: 26.67 },
    { date: "2024-01-02", sales: 1350, orders: 52, avgOrder: 25.96 },
    { date: "2024-01-03", sales: 980, orders: 38, avgOrder: 25.79 },
    { date: "2024-01-04", sales: 1450, orders: 58, avgOrder: 25.0 },
    { date: "2024-01-05", sales: 1680, orders: 62, avgOrder: 27.1 },
    { date: "2024-01-06", sales: 1820, orders: 68, avgOrder: 26.76 },
    { date: "2024-01-07", sales: 1950, orders: 72, avgOrder: 27.08 },
  ]

  const monthlySalesData = [
    { month: "Jan", sales: 35000, orders: 1200, avgOrder: 29.17 },
    { month: "Feb", sales: 32000, orders: 1100, avgOrder: 29.09 },
    { month: "Mar", sales: 38000, orders: 1350, avgOrder: 28.15 },
    { month: "Apr", sales: 42000, orders: 1500, avgOrder: 28.0 },
    { month: "May", sales: 45000, orders: 1600, avgOrder: 28.13 },
    { month: "Jun", sales: 48000, orders: 1700, avgOrder: 28.24 },
  ]

  const yearlySalesData = [
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
      setPredictions(data.predictions)
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

  const getCurrentData = () => {
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

  const getDataKey = () => {
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

  return (
    <DashboardLayout title="Sales Report">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-navy-blue">Sales Report</h2>
            <p className="text-gray-600">Analyze your restaurant's sales performance and trends</p>
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
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topItems.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-navy-blue text-white flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-sm text-gray-600">{item.sales} orders</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${item.revenue.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">Revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
