"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

export default function DashboardPage() {
  // Sample data for the dashboard
  const stats = [
    { title: "Total Revenue", value: "$12,543.21", change: "+12.5%" },
    { title: "Orders Today", value: "145", change: "+5.2%" },
    { title: "Average Order", value: "$32.50", change: "+2.4%" },
    { title: "Active Tables", value: "12/20", change: "60%" },
  ]

  const soldOutItems = [
    { id: 1, name: "Grilled Salmon", category: "Main Course", lastSold: "Today, 2:30 PM" },
    { id: 2, name: "Chocolate Soufflé", category: "Dessert", lastSold: "Today, 3:15 PM" },
    { id: 3, name: "Truffle Fries", category: "Sides", lastSold: "Today, 1:45 PM" },
    { id: 4, name: "Lobster Bisque", category: "Soup", lastSold: "Today, 12:30 PM" },
  ]

  const salesData = [
    { month: "Jan", sales: 4000 },
    { month: "Feb", sales: 3000 },
    { month: "Mar", sales: 5000 },
    { month: "Apr", sales: 4500 },
    { month: "May", sales: 6000 },
    { month: "Jun", sales: 5500 },
    { month: "Jul", sales: 7000 },
    { month: "Aug", sales: 8000 },
    { month: "Sep", sales: 7500 },
    { month: "Oct", sales: 9000 },
    { month: "Nov", sales: 8500 },
    { month: "Dec", sales: 10000 },
  ]

  // Get the last 3 months of data
  const lastThreeMonths = salesData.slice(-3)

  return (
    <DashboardLayout title="Dashboard">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={stat.change.startsWith("+") ? "text-green-500" : "text-red-500"}>{stat.change}</span>{" "}
                from last period
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
        {/* Sales Chart */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
            <CardDescription>Sales data for the past 3 months</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lastThreeMonths} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f2b5b" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0f2b5b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" />
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

        {/* Sold Out Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Sold Out Items</CardTitle>
              <CardDescription>Items currently unavailable</CardDescription>
            </div>
            <Badge variant="destructive" className="ml-auto">
              {soldOutItems.length} Items
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {soldOutItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                  <div className="text-xs text-right">
                    <p>Last sold</p>
                    <p className="font-medium">{item.lastSold}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Latest orders from customers</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">#1234</TableCell>
                <TableCell>Table 5</TableCell>
                <TableCell>4</TableCell>
                <TableCell>$65.20</TableCell>
                <TableCell>
                  <Badge className="bg-green-500">Completed</Badge>
                </TableCell>
                <TableCell>10 min ago</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">#1233</TableCell>
                <TableCell>Table 12</TableCell>
                <TableCell>2</TableCell>
                <TableCell>$28.50</TableCell>
                <TableCell>
                  <Badge className="bg-yellow-500">In Progress</Badge>
                </TableCell>
                <TableCell>15 min ago</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">#1232</TableCell>
                <TableCell>Takeout</TableCell>
                <TableCell>3</TableCell>
                <TableCell>$42.75</TableCell>
                <TableCell>
                  <Badge className="bg-blue-500">Ready</Badge>
                </TableCell>
                <TableCell>20 min ago</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">#1231</TableCell>
                <TableCell>Table 8</TableCell>
                <TableCell>5</TableCell>
                <TableCell>$87.30</TableCell>
                <TableCell>
                  <Badge className="bg-green-500">Completed</Badge>
                </TableCell>
                <TableCell>25 min ago</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
