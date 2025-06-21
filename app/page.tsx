"use client"

import { useEffect } from "react"

export default function HomePage() {
  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem("user")
    const token = localStorage.getItem("token")

    if (user && token) {
      // User is logged in, redirect to dashboard
      window.location.href = "/dashboard"
    } else {
      // User is not logged in, redirect to login
      window.location.href = "/login"
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-navy-blue mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading Restomate...</p>
      </div>
    </div>
  )
}
