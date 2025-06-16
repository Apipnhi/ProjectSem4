'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Home() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (username === 'admin' && password === '1234') {
      router.push('/dashboard')
    } else {
      alert('Invalid credentials')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700">
      <div className="bg-white shadow-xl rounded-xl p-10 w-full max-w-md">
        <h1 className="text-3xl font-bold text-blue-900 text-center mb-6">Restaurant Dashboard Login</h1>
        <form onSubmit={handleLogin} className="flex flex-col space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="border border-blue-300 focus:border-blue-500 focus:ring focus:ring-blue-200 p-3 rounded-lg outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="border border-blue-300 focus:border-blue-500 focus:ring focus:ring-blue-200 p-3 rounded-lg outline-none"
          />
          <button
            type="submit"
            className="bg-blue-900 text-white font-semibold py-3 rounded-lg hover:bg-blue-800 transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  )
}
