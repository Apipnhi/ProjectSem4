import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-navy-blue mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
        <div className="space-x-4">
          <Link
            href="/login"
            className="bg-navy-blue text-white px-6 py-2 rounded-lg hover:bg-navy-blue-700 transition-colors"
          >
            Go to Login
          </Link>
          <Link
            href="/customer"
            className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Customer Menu
          </Link>
        </div>
      </div>
    </div>
  )
}
