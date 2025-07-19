// app/dashboard/stock/page.tsx - Fixed Stock Management Frontend
"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, TrendingUp, Package, RefreshCw, Brain, Zap } from "lucide-react";
import { useState } from "react";

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
  inventoryHealthScore?: number;
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
      llmUsed: boolean;
      predictionMethod?: string;
      dataQuality?: string;
      confidenceLevel?: number;
      marketFactors?: string;
      seasonalImpact?: string;
      recommendedReviewDate?: string;
    };
    insights?: string[];
  };
}

function StockManagementPage() {
  const [stockPredictions, setStockPredictions] = useState<StockPrediction[] | null>(null);
  const [predictionSummary, setPredictionSummary] = useState<StockPredictionSummary | null>(null);
  const [analytics, setAnalytics] = useState<StockPredictionResponse['data']['analytics'] | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [isGeneratingPredictions, setIsGeneratingPredictions] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [predictionPeriod, setPredictionPeriod] = useState<string>("week");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const generateStockPredictions = async () => {
    setIsGeneratingPredictions(true);
    setPredictionError(null);

    try {
      console.log("🚀 Starting LLM prediction generation for period:", predictionPeriod);
      
      const generateResponse = await fetch("/api/generate-stock-predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          period: predictionPeriod
        }),
      });

      console.log("📊 Generate response status:", generateResponse.status);

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        throw new Error(errorData.message || errorData.error || "Failed to generate predictions");
      }

      const generateData: StockPredictionResponse = await generateResponse.json();
      console.log("✅ LLM Predictions generated successfully:", generateData);

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
        setInsights(generateData.data.insights || []);
        setLastUpdated(new Date().toLocaleString());
      } else {
        throw new Error(generateData.message || "Invalid response format");
      }

    } catch (error) {
      console.error("❌ Error generating LLM predictions:", error);
      setPredictionError(error instanceof Error ? error.message : "Failed to generate predictions");
    } finally {
      setIsGeneratingPredictions(false);
    }
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimingBadgeColor = (timing: string) => {
    switch (timing) {
      case 'immediate': return 'bg-red-100 text-red-800';
      case 'within_week': return 'bg-orange-100 text-orange-800';
      case 'within_month': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  return (
    <DashboardLayout title="Stock Management">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                AI-Powered Stock Predictions
              </CardTitle>
              <CardDescription>
                Pure LLM-based intelligent stock management for Restaurant ID: 1
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Period Selection */}
              <Select value={predictionPeriod} onValueChange={setPredictionPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="quarter">Quarter</SelectItem>
                </SelectContent>
              </Select>

              {/* Generate Button */}
              <Button 
                onClick={generateStockPredictions} 
                disabled={isGeneratingPredictions}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isGeneratingPredictions ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    AI Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Generate AI Predictions
                  </>
                )}
              </Button>
            </div>
          </div>

          {lastUpdated && (
            <div className="text-sm text-gray-500 flex items-center gap-2">
              Last updated: {lastUpdated} • Method: {analytics?.method || 'Pure LLM Analysis'}
              <Badge className="bg-purple-100 text-purple-800 text-xs">AI-Powered</Badge>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {predictionError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="text-red-800">{predictionError}</span>
              </div>
              <div className="mt-2 text-sm text-red-700">
                Make sure your GROQ_API_KEY is configured correctly in your environment variables.
              </div>
              <Button 
                onClick={generateStockPredictions} 
                className="mt-4 bg-red-600 hover:bg-red-700"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry AI Analysis
              </Button>
            </div>
          )}

          {isGeneratingPredictions && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3">
                <div className="animate-spin">
                  <Brain className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    AI is analyzing your stock data...
                  </p>
                  <p className="text-sm text-gray-600">
                    Using advanced machine learning to generate intelligent inventory recommendations
                  </p>
                </div>
              </div>
            </div>
          )}

          {stockPredictions && stockPredictions.length > 0 && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Total Items</h3>
                  <p className="text-2xl font-bold text-gray-900">{predictionSummary?.totalItems || 0}</p>
                  <p className="text-xs text-gray-500">AI analyzed</p>
                </div>
                
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-600 mb-1">High Risk</h3>
                  <p className="text-2xl font-bold text-red-600">{predictionSummary?.highRiskItems || 0}</p>
                  <p className="text-xs text-red-600">AI flagged urgent</p>
                </div>
                
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Avg ROI</h3>
                  <p className="text-2xl font-bold text-green-600">{predictionSummary?.avgExpectedROI || 0}%</p>
                  <p className="text-xs text-green-600">AI predicted</p>
                </div>
                
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Investment</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(predictionSummary?.totalPredictedCost || 0)}
                  </p>
                  <p className="text-xs text-blue-600">AI estimated</p>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Health Score</h3>
                  <p className={`text-2xl font-bold ${
                    (predictionSummary?.inventoryHealthScore || 0) >= 80 ? 'text-green-600' :
                    (predictionSummary?.inventoryHealthScore || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {predictionSummary?.inventoryHealthScore || 'N/A'}
                    {predictionSummary?.inventoryHealthScore ? '/100' : ''}
                  </p>
                  <p className="text-xs text-gray-500">AI health score</p>
                </div>
              </div>

              {/* Enhanced Analytics Information */}
              {analytics && (
                <div className="bg-gray-50 border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    AI Analysis Details
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 text-sm">
                    <div>
                      <span className="text-gray-600 block">Method:</span>
                      <p className="font-medium text-purple-700">
                        {analytics.predictionMethod || analytics.method}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 block">AI Confidence:</span>
                      <p className="font-medium text-gray-800">
                        {analytics.confidenceLevel ? `${analytics.confidenceLevel}%` : analytics.confidence}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 block">Data Quality:</span>
                      <p className={`font-medium ${
                        analytics.dataQuality === 'High' ? 'text-green-600' : 
                        analytics.dataQuality === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {analytics.dataQuality || 'High'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 block">Data Points:</span>
                      <p className="font-medium text-gray-800">
                        {analytics.stockItemsAnalyzed} stock + {analytics.salesRecordsAnalyzed} sales
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 block">Period:</span>
                      <p className="font-medium text-gray-800 capitalize">{analytics.predictionPeriod}</p>
                    </div>
                    {predictionSummary?.inventoryHealthScore && (
                      <div>
                        <span className="text-gray-600 block">AI Health Score:</span>
                        <p className={`font-medium ${
                          predictionSummary.inventoryHealthScore >= 80 ? 'text-green-600' :
                          predictionSummary.inventoryHealthScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {predictionSummary.inventoryHealthScore}/100
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Additional LLM Analytics */}
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                    {analytics.marketFactors && (
                      <div>
                        <span className="text-gray-600 text-sm block">Market Factors:</span>
                        <p className="text-sm text-gray-700">{analytics.marketFactors}</p>
                      </div>
                    )}
                    {analytics.seasonalImpact && (
                      <div>
                        <span className="text-gray-600 text-sm block">Seasonal Impact:</span>
                        <p className="text-sm text-gray-700">{analytics.seasonalImpact}</p>
                      </div>
                    )}
                    {analytics.recommendedReviewDate && (
                      <div>
                        <span className="text-gray-600 text-sm block">Next AI Review:</span>
                        <p className="text-sm text-gray-700">
                          {new Date(analytics.recommendedReviewDate).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AI Insights Section */}
              {insights.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 border rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-purple-800">
                    <Zap className="h-5 w-5" />
                    AI Strategic Insights
                  </h3>
                  <div className="grid gap-3">
                    {insights.map((insight, index) => (
                      <div key={index} className="flex items-start gap-3 text-sm">
                        <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          {index + 1}
                        </div>
                        <span className="text-purple-700">
                          {insight}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock Predictions List */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  AI Stock Recommendations ({stockPredictions.length} items)
                </h3>
                
                {stockPredictions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No AI predictions available. Generate predictions to see recommendations.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stockPredictions.map((prediction, index) => (
                      <div 
                        key={index} 
                        className={`border rounded-lg p-4 ${
                          prediction.riskLevel === 'high' 
                            ? 'border-red-200 bg-red-50' 
                            : prediction.riskLevel === 'medium'
                            ? 'border-yellow-200 bg-yellow-50'
                            : 'border-green-200 bg-green-50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-lg text-gray-800">{prediction.ingredient}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={getRiskBadgeColor(prediction.riskLevel)}>
                                {prediction.riskLevel.toUpperCase()}
                              </Badge>
                              <Badge className={getTimingBadgeColor(prediction.reorderTiming)}>
                                {prediction.reorderTiming.replace('_', ' ').toUpperCase()}
                              </Badge>
                              {prediction.urgencyScore && (
                                <Badge variant="outline">
                                  AI Urgency: {prediction.urgencyScore}/100
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              {prediction.expectedROI}% ROI
                            </div>
                            {prediction.efficiency && (
                              <div className="text-sm text-gray-600">
                                {prediction.efficiency}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-5 text-sm mb-3">
                          <div>
                            <span className="text-gray-600 block">Current:</span>
                            <span className="font-medium">{prediction.currentStock} units</span>
                          </div>
                          <div>
                            <span className="text-gray-600 block">AI Predicted:</span>
                            <span className="font-medium">{prediction.predictedConsumption} units</span>
                          </div>
                          <div>
                            <span className="text-gray-600 block">AI Reorder:</span>
                            <span className="font-medium">{prediction.reorderPoint} units</span>
                          </div>
                          <div>
                            <span className="text-gray-600 block">AI Optimal:</span>
                            <span className="font-medium">{prediction.optimalPurchaseQty} units</span>
                          </div>
                          <div>
                            <span className="text-gray-600 block">AI ROI:</span>
                            <span className="font-medium text-green-600">{prediction.expectedROI}%</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="bg-white bg-opacity-60 rounded p-2">
                            <h5 className="font-medium text-gray-800 text-sm flex items-center gap-1">
                              <Brain className="h-4 w-4 text-purple-600" />
                              AI Analysis:
                            </h5>
                            <p className="text-sm text-gray-700">{prediction.reasoning}</p>
                          </div>
                          
                          {prediction.costOptimization && (
                            <div className="bg-white bg-opacity-60 rounded p-2">
                              <h5 className="font-medium text-gray-800 text-sm flex items-center gap-1">
                                💰 AI Cost Optimization:
                              </h5>
                              <p className="text-sm text-gray-700">{prediction.costOptimization}</p>
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
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    AI Summary Overview
                    <Badge className="bg-purple-100 text-purple-800 text-xs">AI-Generated</Badge>
                  </h3>
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4 text-sm">
                    <div>
                      <span className="text-purple-600">Average ROI:</span>
                      <p className="font-bold text-purple-800">{predictionSummary.avgExpectedROI || 0}%</p>
                    </div>
                    {predictionSummary.totalCurrentValue && (
                      <div>
                        <span className="text-purple-600">Current Value:</span>
                        <p className="font-bold text-purple-800">{formatCurrency(predictionSummary.totalCurrentValue)}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-purple-600">High Risk Rate:</span>
                      <p className="font-bold text-purple-800">
                        {predictionSummary.totalItems > 0 ? 
                          Math.round((predictionSummary.highRiskItems / predictionSummary.totalItems) * 100) : 0}%
                      </p>
                    </div>
                    <div>
                      <span className="text-purple-600">Action Required:</span>
                      <p className="font-bold text-purple-800">
                        {predictionSummary.immediateActionRequired} / {predictionSummary.totalItems} items
                      </p>
                    </div>
                  </div>
                  
                  {/* Additional LLM-specific summary */}
                  {predictionSummary.inventoryHealthScore && (
                    <div className="mt-3 pt-3 border-t border-purple-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-purple-600">AI Inventory Health:</span>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            predictionSummary.inventoryHealthScore >= 80 ? 'bg-green-400' :
                            predictionSummary.inventoryHealthScore >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                          }`}></div>
                          <span className="font-bold text-purple-800">
                            {predictionSummary.inventoryHealthScore}/100 
                            {predictionSummary.inventoryHealthScore >= 80 ? ' (Excellent)' :
                             predictionSummary.inventoryHealthScore >= 60 ? ' (Good)' : ' (Needs Attention)'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!stockPredictions && !isGeneratingPredictions && !predictionError && (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Brain className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                AI Stock Analysis Ready
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Generate intelligent stock predictions using advanced AI analysis of your inventory and sales patterns.
                Powered by machine learning for optimal inventory management.
              </p>
              <Button 
                onClick={generateStockPredictions}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Brain className="h-4 w-4 mr-2" />
                Start AI Analysis
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

export default StockManagementPage;