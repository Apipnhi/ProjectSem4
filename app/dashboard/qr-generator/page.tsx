"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Copy, Download, Eye, Plus, QrCode, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

export default function QRGeneratorPage() {
  const [selectedConfig, setSelectedConfig] = useState("")
  const [customUrl, setCustomUrl] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  // Sample restaurant configurations
  const restaurantConfigs = [
    {
      id: "rest_001",
      name: "Bistro Milano",
      slug: "bistro-milano",
      primaryColor: "#0f2b5b",
      secondaryColor: "#ffffff",
      description: "Authentic Italian cuisine in the heart of the city",
      phone: "+1 (555) 123-4567",
      address: "123 Main St, Downtown",
      qrCodes: [
        {
          id: 1,
          name: "Table QR Codes",
          url: "https://yourapp.com/menu/bistro-milano",
          scans: 245,
          created: "2024-01-15",
        },
        {
          id: 2,
          name: "Takeout Menu",
          url: "https://yourapp.com/takeout/bistro-milano",
          scans: 89,
          created: "2024-01-20",
        },
      ],
    },
    {
      id: "rest_002",
      name: "Sakura Sushi",
      slug: "sakura-sushi",
      primaryColor: "#dc2626",
      secondaryColor: "#ffffff",
      description: "Fresh sushi and Japanese delicacies",
      phone: "+1 (555) 987-6543",
      address: "456 Oak Ave, Midtown",
      qrCodes: [
        {
          id: 3,
          name: "Dine-in Menu",
          url: "https://yourapp.com/menu/sakura-sushi",
          scans: 156,
          created: "2024-01-18",
        },
      ],
    },
    {
      id: "rest_003",
      name: "Green Garden Cafe",
      slug: "green-garden-cafe",
      primaryColor: "#16a34a",
      secondaryColor: "#ffffff",
      description: "Organic and healthy food options",
      phone: "+1 (555) 456-7890",
      address: "789 Pine St, Uptown",
      qrCodes: [],
    },
  ]

  const [configs, setConfigs] = useState(restaurantConfigs)
  const [newConfig, setNewConfig] = useState({
    name: "",
    slug: "",
    primaryColor: "#0f2b5b",
    secondaryColor: "#ffffff",
    description: "",
    phone: "",
    address: "",
  })

  const generateQRCode = async () => {
    setIsGenerating(true)

    // Simulate QR code generation
    setTimeout(() => {
      const selectedRestaurant = configs.find((config) => config.id === selectedConfig)
      const baseUrl = customUrl || `https://yourapp.com/menu/${selectedRestaurant?.slug}`

      // Add new QR code to the selected restaurant
      const updatedConfigs = configs.map((config) => {
        if (config.id === selectedConfig) {
          return {
            ...config,
            qrCodes: [
              ...config.qrCodes,
              {
                id: Date.now(),
                name: `QR Code ${config.qrCodes.length + 1}`,
                url: baseUrl,
                scans: 0,
                created: new Date().toISOString().split("T")[0],
              },
            ],
          }
        }
        return config
      })

      setConfigs(updatedConfigs)
      setIsGenerating(false)
      setCustomUrl("")
    }, 2000)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const addNewRestaurant = () => {
    if (newConfig.name && newConfig.slug) {
      const newRestaurant = {
        id: `rest_${Date.now()}`,
        ...newConfig,
        qrCodes: [],
      }

      setConfigs([...configs, newRestaurant])
      setNewConfig({
        name: "",
        slug: "",
        primaryColor: "#0f2b5b",
        secondaryColor: "#ffffff",
        description: "",
        phone: "",
        address: "",
      })
    }
  }

  return (
    <DashboardLayout title="QR Code Generator">
      <div className="grid gap-6 md:grid-cols-2">
        {/* QR Code Generator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Generate QR Code
            </CardTitle>
            <CardDescription>Create QR codes for different restaurant configurations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="restaurant-select">Select Restaurant Configuration</Label>
              <Select value={selectedConfig} onValueChange={setSelectedConfig}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a restaurant configuration" />
                </SelectTrigger>
                <SelectContent>
                  {configs.map((config) => (
                    <SelectItem key={config.id} value={config.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.primaryColor }} />
                        {config.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedConfig && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Configuration Preview</h4>
                {(() => {
                  const config = configs.find((c) => c.id === selectedConfig)
                  return config ? (
                    <div className="text-sm space-y-1">
                      <p>
                        <strong>Name:</strong> {config.name}
                      </p>
                      <p>
                        <strong>Slug:</strong> {config.slug}
                      </p>
                      <p>
                        <strong>Colors:</strong>
                        <span className="inline-flex items-center gap-1 ml-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: config.primaryColor }} />
                          <div className="w-4 h-4 rounded border" style={{ backgroundColor: config.secondaryColor }} />
                        </span>
                      </p>
                      <p>
                        <strong>Description:</strong> {config.description}
                      </p>
                    </div>
                  ) : null
                })()}
              </div>
            )}

            <div>
              <Label htmlFor="custom-url">Custom URL (Optional)</Label>
              <Input
                id="custom-url"
                placeholder="https://yourapp.com/custom-path"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to use default: https://yourapp.com/menu/
                {selectedConfig ? configs.find((c) => c.id === selectedConfig)?.slug : "restaurant-slug"}
              </p>
            </div>

            <Button onClick={generateQRCode} disabled={!selectedConfig || isGenerating} className="w-full">
              {isGenerating ? "Generating..." : "Generate QR Code"}
            </Button>
          </CardContent>
        </Card>

        {/* Add New Restaurant Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Restaurant Configuration
            </CardTitle>
            <CardDescription>Create a new restaurant configuration for multi-tenant support</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="restaurant-name">Restaurant Name</Label>
              <Input
                id="restaurant-name"
                placeholder="e.g., Bistro Milano"
                value={newConfig.name}
                onChange={(e) => setNewConfig({ ...newConfig, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="restaurant-slug">URL Slug</Label>
              <Input
                id="restaurant-slug"
                placeholder="e.g., bistro-milano"
                value={newConfig.slug}
                onChange={(e) =>
                  setNewConfig({ ...newConfig, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary-color"
                    type="color"
                    value={newConfig.primaryColor}
                    onChange={(e) => setNewConfig({ ...newConfig, primaryColor: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={newConfig.primaryColor}
                    onChange={(e) => setNewConfig({ ...newConfig, primaryColor: e.target.value })}
                    placeholder="#0f2b5b"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="secondary-color">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondary-color"
                    type="color"
                    value={newConfig.secondaryColor}
                    onChange={(e) => setNewConfig({ ...newConfig, secondaryColor: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={newConfig.secondaryColor}
                    onChange={(e) => setNewConfig({ ...newConfig, secondaryColor: e.target.value })}
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the restaurant"
                value={newConfig.description}
                onChange={(e) => setNewConfig({ ...newConfig, description: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+1 (555) 123-4567"
                value={newConfig.phone}
                onChange={(e) => setNewConfig({ ...newConfig, phone: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="123 Main St, City"
                value={newConfig.address}
                onChange={(e) => setNewConfig({ ...newConfig, address: e.target.value })}
              />
            </div>

            <Button onClick={addNewRestaurant} className="w-full">
              Add Restaurant Configuration
            </Button>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-6" />

      {/* Existing QR Codes */}
      <Card>
        <CardHeader>
          <CardTitle>Generated QR Codes</CardTitle>
          <CardDescription>Manage your existing QR codes and track their usage</CardDescription>
        </CardHeader>
        <CardContent>
          {configs.map(
            (config) =>
              config.qrCodes.length > 0 && (
                <div key={config.id} className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: config.primaryColor }} />
                    <h3 className="font-semibold">{config.name}</h3>
                    <Badge variant="outline">{config.qrCodes.length} QR codes</Badge>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>URL</TableHead>
                        <TableHead>Scans</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {config.qrCodes.map((qr) => (
                        <TableRow key={qr.id}>
                          <TableCell className="font-medium">{qr.name}</TableCell>
                          <TableCell className="max-w-xs truncate">{qr.url}</TableCell>
                          <TableCell>{qr.scans}</TableCell>
                          <TableCell>{qr.created}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => copyToClipboard(qr.url)}>
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ),
          )}

          {configs.every((config) => config.qrCodes.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <QrCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No QR codes generated yet. Create your first QR code above!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
