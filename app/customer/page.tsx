// app/customer/page.tsx

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Popup } from "@/components/ui/popup"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ShoppingCart, Plus, Minus, Search, Star, Clock, MapPin, CreditCard, Banknote, Smartphone } from "lucide-react"

export default function CustomerPage() {
  const [cart, setCart] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [orderType, setOrderType] = useState("dine-in")
  const [tableNumber, setTableNumber] = useState("")
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
  })
  const [paymentMethod, setPaymentMethod] = useState("cash")

  // Sample menu items with categories
  const menuItems = [
    {
      id: 1,
      name: "Grilled Salmon",
      description: "Fresh Atlantic salmon grilled to perfection with herbs and lemon",
      price: 24.99,
      category: "Main Course",
      image: "/placeholder.svg?height=200&width=200",
      rating: 4.8,
      prepTime: "15-20 min",
      popular: true,
    },
    {
      id: 2,
      name: "Caesar Salad",
      description: "Crisp romaine lettuce with parmesan cheese, croutons, and Caesar dressing",
      price: 12.99,
      category: "Salad",
      image: "/placeholder.svg?height=200&width=200",
      rating: 4.6,
      prepTime: "5-10 min",
      popular: false,
    },
    {
      id: 3,
      name: "Margherita Pizza",
      description: "Classic pizza with fresh mozzarella, tomatoes, and basil",
      price: 16.99,
      category: "Main Course",
      image: "/placeholder.svg?height=200&width=200",
      rating: 4.7,
      prepTime: "12-15 min",
      popular: true,
    },
    {
      id: 4,
      name: "Chocolate Cake",
      description: "Rich chocolate cake with vanilla ice cream and berry compote",
      price: 8.99,
      category: "Dessert",
      image: "/placeholder.svg?height=200&width=200",
      rating: 4.9,
      prepTime: "5 min",
      popular: false,
    },
    {
      id: 5,
      name: "Coca Cola",
      description: "Refreshing cola drink served chilled",
      price: 2.99,
      category: "Beverage",
      image: "/placeholder.svg?height=200&width=200",
      rating: 4.5,
      prepTime: "1 min",
      popular: false,
    },
    {
      id: 6,
      name: "Chicken Wings",
      description: "Crispy chicken wings with your choice of sauce",
      price: 11.99,
      category: "Appetizer",
      image: "/placeholder.svg?height=200&width=200",
      rating: 4.4,
      prepTime: "10-12 min",
      popular: true,
    },
  ]

  // Sample food packs
  const foodPacks = [
    {
      id: 101,
      name: "Lunch Special",
      description: "Grilled Salmon + Coca Cola",
      items: ["Grilled Salmon", "Coca Cola"],
      originalPrice: 27.98,
      price: 24.99,
      category: "Pack",
      image: "/placeholder.svg?height=200&width=200",
      rating: 4.7,
      prepTime: "15-20 min",
      popular: true,
    },
    {
      id: 102,
      name: "Family Pack",
      description: "Margherita Pizza + Caesar Salad + Coca Cola",
      items: ["Margherita Pizza", "Caesar Salad", "Coca Cola"],
      originalPrice: 32.97,
      price: 28.99,
      category: "Pack",
      image: "/placeholder.svg?height=200&width=200",
      rating: 4.6,
      prepTime: "15-20 min",
      popular: false,
    },
  ]

  const allItems = [...menuItems, ...foodPacks]
  const categories = ["all", "Main Course", "Appetizer", "Salad", "Dessert", "Beverage", "Pack"]

  const addToCart = (item) => {
    const existingItem = cart.find((cartItem) => cartItem.id === item.id)
    if (existingItem) {
      setCart(
        cart.map((cartItem) => (cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem)),
      )
    } else {
      setCart([...cart, { ...item, quantity: 1 }])
    }
  }

  const removeFromCart = (itemId) => {
    setCart(cart.filter((item) => item.id !== itemId))
  }

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(itemId)
    } else {
      setCart(cart.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item)))
    }
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const filteredItems = allItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleCheckout = () => {
    // Simulate order processing
    alert(`Order placed successfully! 
    Order Type: ${orderType}
    ${orderType === "dine-in" ? `Table: ${tableNumber}` : ""}
    Total: $${getTotalPrice().toFixed(2)}
    Payment: ${paymentMethod}`)

    // Clear cart and close modals
    setCart([])
    setIsCheckoutOpen(false)
    setIsCartOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-navy-blue">Restomate</h1>
              <p className="text-sm text-gray-600">Delicious food, delivered fresh</p>
            </div>
            <Button onClick={() => setIsCartOpen(true)} className="relative bg-navy-blue hover:bg-navy-blue-700">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Cart ({getTotalItems()})
              {getTotalItems() > 0 && <Badge className="absolute -top-2 -right-2 bg-red-500">{getTotalItems()}</Badge>}
            </Button>
          </div>
        </div>
      </header>

      {/* Restaurant Info */}
      <div className="bg-navy-blue text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5" />
              <div>
                <p className="font-semibold">Location</p>
                <p className="text-sm opacity-90">123 Restaurant St, Food City</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5" />
              <div>
                <p className="font-semibold">Hours</p>
                <p className="text-sm opacity-90">Mon-Sun: 10:00 AM - 10:00 PM</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Star className="h-5 w-5" />
              <div>
                <p className="font-semibold">Rating</p>
                <p className="text-sm opacity-90">4.8/5 (1,234 reviews)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <img src={item.image || "/placeholder.svg"} alt={item.name} className="w-full h-48 object-cover" />
                {item.popular && <Badge className="absolute top-2 left-2 bg-orange-500">Popular</Badge>}
                {item.originalPrice && (
                  <Badge className="absolute top-2 right-2 bg-green-500">
                    Save ${(item.originalPrice - item.price).toFixed(2)}
                  </Badge>
                )}
              </div>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <div className="text-right">
                    <p className="text-lg font-bold">${item.price.toFixed(2)}</p>
                    {item.originalPrice && (
                      <p className="text-sm text-gray-500 line-through">${item.originalPrice.toFixed(2)}</p>
                    )}
                  </div>
                </div>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{item.rating}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{item.prepTime}</span>
                    </div>
                  </div>
                  <Badge variant="outline">{item.category}</Badge>
                </div>
                <Button onClick={() => addToCart(item)} className="w-full bg-navy-blue hover:bg-navy-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* Cart Popup */}
      <Popup
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        title="Your Cart"
        description={`${getTotalItems()} items in your cart`}
        size="lg"
      >
        <div className="space-y-4">
          {cart.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Your cart is empty</p>
          ) : (
            <>
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button variant="outline" size="icon" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                    <p className="ml-4 font-semibold w-20 text-right">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span>${getTotalPrice().toFixed(2)}</span>
                </div>
                <Button
                  onClick={() => {
                    setIsCartOpen(false)
                    setIsCheckoutOpen(true)
                  }}
                  className="w-full mt-4 bg-navy-blue hover:bg-navy-blue-700"
                  disabled={cart.length === 0}
                >
                  Proceed to Checkout
                </Button>
              </div>
            </>
          )}
        </div>
      </Popup>

      {/* Checkout Popup */}
      <Popup
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        title="Checkout"
        description="Complete your order"
        size="xl"
      >
        <div className="space-y-6">
          {/* Order Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Order Type</label>
            <Select value={orderType} onValueChange={setOrderType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dine-in">Dine In</SelectItem>
                <SelectItem value="takeout">Takeout</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table Number for Dine In */}
          {orderType === "dine-in" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Table Number</label>
              <Input
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Enter table number"
                required
              />
            </div>
          )}

          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                placeholder="Your name"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                placeholder="Your phone number"
                required
              />
            </div>
          </div>

          {/* Address for Delivery */}
          {orderType === "delivery" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Delivery Address</label>
              <Textarea
                value={customerInfo.address}
                onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                placeholder="Enter your delivery address"
                required
              />
            </div>
          )}

          {/* Special Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Special Notes (Optional)</label>
            <Textarea
              value={customerInfo.notes}
              onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
              placeholder="Any special requests or dietary requirements"
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={paymentMethod === "cash" ? "default" : "outline"}
                onClick={() => setPaymentMethod("cash")}
                className="flex items-center gap-2"
              >
                <Banknote className="h-4 w-4" />
                Cash
              </Button>
              <Button
                variant={paymentMethod === "card" ? "default" : "outline"}
                onClick={() => setPaymentMethod("card")}
                className="flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Card
              </Button>
              <Button
                variant={paymentMethod === "digital" ? "default" : "outline"}
                onClick={() => setPaymentMethod("digital")}
                className="flex items-center gap-2"
              >
                <Smartphone className="h-4 w-4" />
                Digital
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Order Summary</h3>
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.name} x{item.quantity}
                  </span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Total:</span>
                <span>${getTotalPrice().toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Place Order Button */}
          <Button
            onClick={handleCheckout}
            className="w-full bg-navy-blue hover:bg-navy-blue-700"
            disabled={!customerInfo.name || !customerInfo.phone || (orderType === "dine-in" && !tableNumber)}
          >
            Place Order - ${getTotalPrice().toFixed(2)}
          </Button>
        </div>
      </Popup>
    </div>
  )
}
