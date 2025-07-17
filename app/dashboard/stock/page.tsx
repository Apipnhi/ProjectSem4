// app/dashboard/stock/page.tsx - Fixed with proper null checking
"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Sparkles, TrendingUp, Package, Clock, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";

interface StockPrediction {
  ingredient: string;
  currentStock: number;
  predictedConsumption: number;
  reorderPoint: number;
  optimalPurchaseQty: number;
  reorderTiming: "immediate" | "within_week" | "within_month";
  riskLevel: "high" | "medium" | "low";
  costOptimization: string;
  expectedROI: number;
  reasoning: string;
  urgencyScore?: number;
  efficiency?: string;
}

interface StockPredictionSummary {
  totalItems: number;
  highRiskItems: number;
  immediateActionRequired: number;
  avgExpectedROI: number;
  totalPredictedCost?: number;
  totalCurrentValue?: number;
}

interface StockPredictionResponse {
  success: boolean;
  message: string;
  data: {
    predictions: StockPrediction[];
    summary: StockPredictionSummary;
    analytics: {
      method: string;
      dataScope: string;
      stockItemsAnalyzed: number;
      salesRecordsAnalyzed: number;
      predictionPeriod: string;
      restaurantId: number;
      timestamp: string;
      confidence: string;
      algorithm: string;
    };
  };
}

function StockManagementPage() {
  const [stockPredictions, setStockPredictions] = useState<StockPrediction[] | null>(null);
  const [predictionSummary, setPredictionSummary] = useState<StockPredictionSummary | null>(null);
  const [analytics, setAnalytics] = useState<StockPredictionResponse['data']['analytics'] | null>(null);
  const [isGeneratingPredictions, setIsGeneratingPredictions] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [predictionPeriod, setPredictionPeriod] = useState<string>("week");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const generateStockPredictions = async () => {
    setIsGeneratingPredictions(true);
    setPredictionError(null);

    try {
      console.log("🚀 Starting prediction generation for period:", predictionPeriod);
      
      const generateResponse = await fetch("/api/generate-stock-predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          period: predictionPeriod,
          restaurantId: 1 
        }),
      });

      console.log("📊 Generate response status:", generateResponse.status);

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        throw new Error(errorData.message || errorData.error || "Failed to generate predictions");
      }

      const generateData: StockPredictionResponse = await generateResponse.json();
      console.log("✅ Predictions generated successfully:", generateData);

      if (generateData.success && generateData.data) {
        setStockPredictions(generateData.data.predictions || []);
        setPredictionSummary(generateData.data.summary || {
          totalItems: 0,
          highRiskItems: 0,
          immediateActionRequired: 0,
          avgExpectedROI: 0,
          totalPredictedCost: 0,
          totalCurrentValue: 0
        });
        setAnalytics(generateData.data.analytics);
        setLastUpdated(new Date().toLocaleString());
      } else {
        throw new Error(generateData.message || "Invalid response format");
      }

    } catch (error) {
      console.error("❌ Error generating predictions:", error);
      setPredictionError(error instanceof Error ? error.message : "Unknown error occurred");
    } finally {
      setIsGeneratingPredictions(false);
    }
  };

  // Auto-load predictions on component mount
  useEffect(() => {
    generateStockPredictions();
  }, []);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "bg-red-500 text-white";
      case "medium":
        return "bg-yellow-500 text-white";
      case "low":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "high":
        return "bg-red-100 border-red-200 text-red-800";
      case "medium":
        return "bg-yellow-100 border-yellow-200 text-yellow-800";
      case "low":
        return "bg-green-100 border-green-200 text-green-800";
      default:
        return "bg-gray-100 border-gray-200 text-gray-800";
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <DashboardLayout>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-purple-600" />
                AI Stock Predictions
              </CardTitle>
              <CardDescription>
                AI-powered stock requirement forecasting based on sales data
                {lastUpdated && (
                  <span className="block text-xs text-gray-500 mt-1">
                    Last updated: {lastUpdated}
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Select value={predictionPeriod} onValueChange={setPredictionPeriod}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Next Week</SelectItem>
                  <SelectItem value="month">Next Month</SelectItem>
                  <SelectItem value="quarter">Next Quarter</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={generateStockPredictions} 
                disabled={isGeneratingPredictions}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isGeneratingPredictions ? 'animate-spin' : ''}`} />
                {isGeneratingPredictions ? "Generating..." : "Refresh"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isGeneratingPredictions && (
            <div className="text-center py-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
                <span className="text-blue-600 font-medium">
                  Generating AI stock predictions...
                </span>
              </div>
              <div className="text-sm text-gray-500">
                Analyzing sales patterns, consumption trends, and inventory levels
              </div>
              {analytics && (
                <div className="text-xs text-gray-400 mt-2">
                  Method: {analytics.method}
                </div>
              )}
            </div>
          )}

          {predictionError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="text-red-800 font-medium">Prediction Error</span>
              </div>
              <p className="text-red-700 mt-1">{predictionError}</p>
              <Button 
                onClick={generateStockPredictions} 
                className="mt-3"
                size="sm"
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          )}

          {stockPredictions && predictionSummary && (
            <div className="space-y-6">
              {/* Prediction Summary */}
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center p-4 border rounded-lg bg-blue-50">
                  <Package className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-lg text-blue-800">
                    Total Items
                  </h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {predictionSummary.totalItems || 0}
                  </p>
                  <p className="text-xs text-blue-600">Analyzed ingredients</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg bg-red-50">
                  <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-lg text-red-800">
                    High Risk
                  </h3>
                  <p className="text-2xl font-bold text-red-600">
                    {predictionSummary.highRiskItems || 0}
                  </p>
                  <p className="text-xs text-red-600">Critical items</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg bg-yellow-50">
                  <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-lg text-yellow-800">
                    Immediate Action
                  </h3>
                  <p className="text-2xl font-bold text-yellow-600">
                    {predictionSummary.immediateActionRequired || 0}
                  </p>
                  <p className="text-xs text-yellow-600">Urgent orders needed</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg bg-green-50">
                  <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-lg text-green-800">
                    Predicted Cost
                  </h3>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(predictionSummary.totalPredictedCost || 0)}
                  </p>
                  <p className="text-xs text-green-600">Total investment needed</p>
                </div>
              </div>

              {/* Analytics Information */}
              {analytics && (
                <div className="bg-gray-50 border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Analysis Details</h3>
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4 text-sm">
                    <div>
                      <span className="text-gray-600">Method:</span>
                      <p className="font-medium">{analytics.method}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Confidence:</span>
                      <p className="font-medium">{analytics.confidence}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Data Points:</span>
                      <p className="font-medium">{analytics.stockItemsAnalyzed} stock + {analytics.salesRecordsAnalyzed} sales</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Period:</span>
                      <p className="font-medium capitalize">{analytics.predictionPeriod}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Stock Predictions List */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">
                  Recommended Stock Orders ({stockPredictions.length} items)
                </h3>
                
                {stockPredictions.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No stock predictions available</p>
                    <p className="text-sm text-gray-400">Try generating predictions for a different period</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {stockPredictions.map((prediction, idx) => (
                      <div key={idx} className={`border rounded-lg p-4 ${getRiskColor(prediction.riskLevel)}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-base">
                              {prediction.ingredient}
                            </h4>
                            <p className="text-sm opacity-75">
                              Stock: {prediction.currentStock} | Need: {prediction.predictedConsumption}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className={`${getUrgencyColor(prediction.riskLevel)} mb-1`}>
                              {prediction.riskLevel}
                            </Badge>
                            <p className="text-xs opacity-75">{prediction.reorderTiming}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="opacity-75">Recommended Order:</span>
                            <span className="font-semibold">
                              {prediction.optimalPurchaseQty} units
                            </span>
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <span className="opacity-75">Expected ROI:</span>
                            <span className="font-semibold">
                              {prediction.expectedROI}%
                            </span>
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <span className="opacity-75">Reorder Point:</span>
                            <span className="font-semibold">
                              {prediction.reorderPoint} units
                            </span>
                          </div>
                          
                          {prediction.efficiency && (
                            <div className="flex justify-between text-sm">
                              <span className="opacity-75">Efficiency:</span>
                              <span className="font-semibold capitalize">
                                {prediction.efficiency}
                              </span>
                            </div>
                          )}
                          
                          <div className="text-xs opacity-60 mt-3 p-2 bg-white bg-opacity-50 rounded">
                            <strong>Analysis:</strong> {prediction.reasoning}
                          </div>
                          
                          {prediction.costOptimization && (
                            <div className="text-xs opacity-60 p-2 bg-white bg-opacity-50 rounded">
                              <strong>Cost Optimization:</strong> {prediction.costOptimization}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary Stats */}
              {predictionSummary && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">Summary Overview</h3>
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4 text-sm">
                    <div>
                      <span className="text-blue-600">Average ROI:</span>
                      <p className="font-bold text-blue-800">{predictionSummary.avgExpectedROI || 0}%</p>
                    </div>
                    {predictionSummary.totalCurrentValue && (
                      <div>
                        <span className="text-blue-600">Current Value:</span>
                        <p className="font-bold text-blue-800">{formatCurrency(predictionSummary.totalCurrentValue)}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-blue-600">High Risk Rate:</span>
                      <p className="font-bold text-blue-800">
                        {predictionSummary.totalItems > 0 ? 
                          Math.round((predictionSummary.highRiskItems / predictionSummary.totalItems) * 100) : 0}%
                      </p>
                    </div>
                    <div>
                      <span className="text-blue-600">Action Required:</span>
                      <p className="font-bold text-blue-800">
                        {predictionSummary.immediateActionRequired} / {predictionSummary.totalItems} items
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

// Default export untuk Next.js
export default StockManagementPage;