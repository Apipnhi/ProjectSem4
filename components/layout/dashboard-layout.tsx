"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { BarChart3, ClipboardList, Home, LogOut, Menu, Settings, ShoppingBag, Users, TrendingUp, Package, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check authentication on component mount
  useEffect(() => {
    const user = localStorage.getItem("user")
    const token = localStorage.getItem("token")

    if (!user || !token) {
      window.location.href = "/login"
      return
    }

    setIsAuthenticated(true)
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-navy-blue mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const handleLogout = () => {
    // Clear any stored authentication data
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    // Redirect to login page
    window.location.href = "/login"
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar for larger screens */}
      <aside className="hidden md:flex flex-col w-64 bg-navy-blue text-white h-screen">
        <div className="p-4 border-b border-navy-blue-700">
          <h2 className="text-xl font-bold">Restomate</h2>
          <p className="text-xs text-navy-blue-200">Restaurant Management</p>
        </div>
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            <li>
              <Link
                href="/dashboard"
                className={`flex items-center p-2 rounded-lg ${title === "Dashboard" ? "bg-navy-blue-700" : "hover:bg-navy-blue-700"}`}
              >
                <Home className="mr-3 h-5 w-5" />
                Dashboard
              </Link>
            </li>
            {/* <li>
              <Link
                href="/dashboard/orders"
                className={`flex items-center p-2 rounded-lg ${title === "Orders Management" ? "bg-navy-blue-700" : "hover:bg-navy-blue-700"}`}
              >
                <ClipboardList className="mr-3 h-5 w-5" />
                Orders
              </Link>
            </li> */}
            <li>
              <Link
                href="/dashboard/menu"
                className={`flex items-center p-2 rounded-lg ${title === "Menu Management" ? "bg-navy-blue-700" : "hover:bg-navy-blue-700"}`}
              >
                <ShoppingBag className="mr-3 h-5 w-5" />
                Menu Management
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/stock"
                className={`flex items-center p-2 rounded-lg ${title === "Stock Management" ? "bg-navy-blue-700" : "hover:bg-navy-blue-700"}`}
              >
                <Package className="mr-3 h-5 w-5" />
                Stock Management
              </Link>
            </li>
            <li>
              {/* <Link
                href="/dashboard/transactions"
                className={`flex items-center p-2 rounded-lg ${title === "Transactions" ? "bg-navy-blue-700" : "hover:bg-navy-blue-700"}`}
              >
                <BarChart3 className="mr-3 h-5 w-5" />
                Transactions
              </Link>
            </li>
            <li> */}
              <Link
                href="/dashboard/sales-report"
                className={`flex items-center p-2 rounded-lg ${title === "Reports" ? "bg-navy-blue-700" : "hover:bg-navy-blue-700"}`}
              >
                <TrendingUp className="mr-3 h-5 w-5" />
                Sales Reports
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/account-edit"
                className={`flex items-center p-2 rounded-lg ${title === "Account Management" ? "bg-navy-blue-700" : "hover:bg-navy-blue-700"}`}
              >
                <Users className="mr-3 h-5 w-5" />
                Account Management
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/qr-generator"
                className={`flex items-center p-2 rounded-lg ${title === "QR Generator" ? "bg-navy-blue-700" : "hover:bg-navy-blue-700"}`}
              >
                <QrCode className="mr-3 h-5 w-5" />
                QR Generator
              </Link>
            </li>
          </ul>
        </nav>
        <div className="p-4 border-t border-navy-blue-700 mt-auto">
          <button onClick={handleLogout} className="flex items-center w-full p-2 rounded-lg hover:bg-navy-blue-700 text-red-200 hover:text-red-100 font-medium">
            <LogOut className="mr-3 h-5 w-5" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-navy-blue text-white h-full">
          <div className="p-4 border-b border-navy-blue-700">
            <h2 className="text-xl font-bold">Restomate</h2>
            <p className="text-xs text-navy-blue-200">Restaurant Management</p>
          </div>
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-2">
              <li>
                <Link
                  href="/dashboard"
                  className={`flex items-center p-2 rounded-lg ${title === "Dashboard" ? "bg-navy-blue-700" : "hover:bg-navy-blue-700"}`}
                >
                  <Home className="mr-3 h-5 w-5" />
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/orders"
                  className={`flex items-center p-2 rounded-lg ${title === "Orders Management" ? "bg-navy-blue-700" : "hover:bg-navy-blue-700"}`}
                >
                  <ClipboardList className="mr-3 h-5 w-5" />
                  Orders
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/menu"
                  className={`flex items-center p-2 rounded-lg ${title === "Menu Management" ? "bg-navy-blue-700" : "hover:bg-navy-blue-700"}`}
                >
                  <ShoppingBag className="mr-3 h-5 w-5" />
                  Menu Management
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/stock"
                  className={`flex items-center p-2 rounded-lg ${title === "Stock Management" ? "bg-navy-blue-700" : "hover:bg-navy-blue-700"}`}
                >
                  <Package className="mr-3 h-5 w-5" />
                  Stock Management
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/transactions"
                  className={`flex items-center p-2 rounded-lg ${title === "Transactions" ? "bg-navy-blue-700" : "hover:bg-navy-blue-700"}`}
                >
                  <BarChart3 className="mr-3 h-5 w-5" />
                  Transactions
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/sales-report"
                  className={`flex items-center p-2 rounded-lg ${title === "Reports" ? "bg-navy-blue-700" : "hover:bg-navy-blue-700"}`}
                >
                  <TrendingUp className="mr-3 h-5 w-5" />
                  Reports
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/account-edit"
                  className={`flex items-center p-2 rounded-lg ${title === "Account Management" ? "bg-navy-blue-700" : "hover:bg-navy-blue-700"}`}
                >
                  <Users className="mr-3 h-5 w-5" />
                  Account Management
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/qr-generator"
                  className={`flex items-center p-2 rounded-lg ${title === "QR Generator" ? "bg-navy-blue-700" : "hover:bg-navy-blue-700"}`}
                >
                  <QrCode className="mr-3 h-5 w-5" />
                  QR Generator
                </Link>
              </li>
            </ul>
          </nav>
          <div className="p-4 border-t border-navy-blue-700 mt-auto">
            <button onClick={handleLogout} className="flex items-center w-full p-2 rounded-lg hover:bg-navy-blue-700 text-red-200 hover:text-red-100 font-medium">
              <LogOut className="mr-3 h-5 w-5" />
              Log Out
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm flex-shrink-0">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={() => setIsSidebarOpen(true)}>
                <Menu className="h-6 w-6" />
              </Button>
              <h1 className="text-xl font-bold text-navy-blue">{title}</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <BarChart3 className="mr-2 h-4 w-4" />
                Reports
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="md:hidden"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Avatar" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>John Doe</DropdownMenuLabel>
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    Restaurant Manager
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <a href="/dashboard/account-edit" className="flex items-center w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Account Settings</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
