"use client"

import type React from "react"

import { useState } from "react"
import { BarChart3, Home, LogOut, Menu, Package, Settings, ShoppingBag, Users } from "lucide-react"
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar for larger screens */}
      <aside className="hidden md:flex flex-col w-64 bg-navy-blue text-white">
        <div className="p-4 border-b border-navy-blue-700">
          <h2 className="text-xl font-bold">Bistro Manager</h2>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <a
                href="/dashboard"
                className={`flex items-center p-2 rounded-lg ${title === "Dashboard" ? "bg-navy-blue-700" : "hover:bg-navy-blue-700"}`}
              >
                <Home className="mr-3 h-5 w-5" />
                Dashboard
              </a>
            </li>
            <li>
              <a
                href="/dashboard/stock"
                className={`flex items-center p-2 rounded-lg ${title === "Stock Management" ? "bg-navy-blue-700" : "hover:bg-navy-blue-700"}`}
              >
                <Package className="mr-3 h-5 w-5" />
                Stock Management
              </a>
            </li>
            <li>
              <a
                href="/dashboard/menu"
                className={`flex items-center p-2 rounded-lg ${title === "Menu Management" ? "bg-navy-blue-700" : "hover:bg-navy-blue-700"}`}
              >
                <ShoppingBag className="mr-3 h-5 w-5" />
                Menu Management
              </a>
            </li>
            <li>
              <a
                href="/dashboard/accounts"
                className={`flex items-center p-2 rounded-lg ${title === "Account Management" ? "bg-navy-blue-700" : "hover:bg-navy-blue-700"}`}
              >
                <Users className="mr-3 h-5 w-5" />
                Account Management
              </a>
            </li>
          </ul>
        </nav>
        <div className="p-4 border-t border-navy-blue-700">
          <button className="flex items-center w-full p-2 rounded-lg hover:bg-navy-blue-700">
            <LogOut className="mr-3 h-5 w-5" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-navy-blue text-white">
          <div className="p-4 border-b border-navy-blue-700">
            <h2 className="text-xl font-bold">Bistro Manager</h2>
          </div>
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              <li>
                <a
                  href="/dashboard"
                  className={`flex items-center p-2 rounded-lg ${title === "Dashboard" ? "bg-navy-blue-700" : "hover:bg-navy-blue-700"}`}
                >
                  <Home className="mr-3 h-5 w-5" />
                  Dashboard
                </a>
              </li>
              <li>
                <a
                  href="/dashboard/stock"
                  className={`flex items-center p-2 rounded-lg ${title === "Stock Management" ? "bg-navy-blue-700" : "hover:bg-navy-blue-700"}`}
                >
                  <Package className="mr-3 h-5 w-5" />
                  Stock Management
                </a>
              </li>
              <li>
                <a
                  href="/dashboard/menu"
                  className={`flex items-center p-2 rounded-lg ${title === "Menu Management" ? "bg-navy-blue-700" : "hover:bg-navy-blue-700"}`}
                >
                  <ShoppingBag className="mr-3 h-5 w-5" />
                  Menu Management
                </a>
              </li>
              <li>
                <a
                  href="/dashboard/accounts"
                  className={`flex items-center p-2 rounded-lg ${title === "Account Management" ? "bg-navy-blue-700" : "hover:bg-navy-blue-700"}`}
                >
                  <Users className="mr-3 h-5 w-5" />
                  Account Management
                </a>
              </li>
            </ul>
          </nav>
          <div className="p-4 border-t border-navy-blue-700">
            <button className="flex items-center w-full p-2 rounded-lg hover:bg-navy-blue-700">
              <LogOut className="mr-3 h-5 w-5" />
              Log Out
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white shadow-sm">
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
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
