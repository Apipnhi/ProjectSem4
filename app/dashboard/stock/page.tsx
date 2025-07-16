// app/dashboard/stock/page.tsx
"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Sparkles, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";

interface StockPrediction {
  ingredient: string;
  currentStock: number;
  predictedNeed: number;
  recommendedOrder: number;
  urgency: "low" | "medium" | "high";
  reasoning: string;
  estimatedCost: number;
}

interface StockPredictionSummary {
  totalIngredients: number;
  highUrgency: number;
  estimatedTotalCost: number;
}

function StockManagementPage() {
  const [stockPredictions, setStockPredictions] = useState<StockPrediction[] | null>(null);
  const [predictionSummary, setPredictionSummary] = useState<StockPredictionSummary | null>(null);
  const [isGeneratingPredictions, setIsGeneratingPredictions] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [predictionPeriod, setPredictionPeriod] = useState<string>("week");

  const generateStockPredictions = async () => {
    setIsGeneratingPredictions(true);
    setPredictionError(null);

    try {
      console.log("Starting prediction generation...");
      
      const generateResponse = await fetch("/api/generate-stock-predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: predictionPeriod }),
      });

      console.log("Generate response status:", generateResponse.status);

      const generateData = await generateResponse.json();
      if (!generateResponse.ok) {
        throw new Error(generateData.error || "Failed to generate predictions");
      }

      console.log("Predictions generated successfully:", generateData);

      // Optional delay to show loading state
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Try to fetch the predictions file
      const response = await fetch("/predictions.json");
      console.log("Predictions file response status:", response.status);
      
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        console.log("Predictions data:", data);
        
        if (data.predictions) {
          setStockPredictions(data.predictions);
          setPredictionSummary(data.summary);
        } else {
          throw new Error("Missing predictions in JSON.");
        }
      } else {
        const text = await response.text();
        console.error("Invalid predictions.json response:", text);
        throw new Error("Predictions file not found or invalid format.");
      }
    } catch (error: any) {
      console.error("Error generating predictions:", error);
      setPredictionError(error.message || "Failed to generate stock predictions");
      setStockPredictions(null);
      setPredictionSummary(null);
    }

    setIsGeneratingPredictions(false);
  };

  useEffect(() => {
    generateStockPredictions();
  }, [predictionPeriod]);

  return (
    <DashboardLayout title="Stock Management">
      {/* AI Stock Predictions */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                AI Stock Predictions
              </CardTitle>
              <CardDescription>
                AI-powered stock requirement forecasting based on sales data
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={predictionPeriod} onValueChange={setPredictionPeriod}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
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
                variant="outline"
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                {isGeneratingPredictions ? "Generating..." : "Refresh"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isGeneratingPredictions && (
            <div className="text-center py-8">
              <div className="text-blue-600 mb-2">
                Generating AI stock predictions...
              </div>
              <div className="text-sm text-gray-500">
                Analyzing sales patterns and inventory levels
              </div>
            </div>
          )}

          {predictionError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="text-red-800">{predictionError}</span>
              </div>
            </div>
          )}

          {stockPredictions && predictionSummary && (
            <div className="space-y-6">
              {/* Prediction Summary */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg bg-blue-50">
                  <h3 className="font-semibold text-lg text-blue-800">
                    Total Ingredients
                  </h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {predictionSummary.totalIngredients}
                  </p>
                  <p className="text-xs text-blue-600">Need attention</p>
                </div>
                <div className="text-center p-4 border rounded-lg bg-yellow-50">
                  <h3 className="font-semibold text-lg text-yellow-800">
                    High Urgency
                  </h3>
                  <p className="text-2xl font-bold text-yellow-600">
                    {predictionSummary.highUrgency}
                  </p>
                  <p className="text-xs text-yellow-600">Critical items</p>
                </div>
                <div className="text-center p-4 border rounded-lg bg-green-50">
                  <h3 className="font-semibold text-lg text-green-800">
                    Estimated Cost
                  </h3>
                  <p className="text-2xl font-bold text-green-600">
                    Rp{predictionSummary.estimatedTotalCost.toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600">Total order value</p>
                </div>
              </div>

              {/* Stock Predictions List */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">
                  Recommended Stock Orders
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {stockPredictions.map((prediction, idx) => (
                    <div key={idx} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-navy-blue">
                            {prediction.ingredient}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Current: {prediction.currentStock} | Need:{" "}
                            {prediction.predictedNeed}
                          </p>
                        </div>
                        <Badge
                          className={
                            prediction.urgency === "high"
                              ? "bg-red-500"
                              : prediction.urgency === "medium"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }
                        >
                          {prediction.urgency} urgency
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            Recommended Order:
                          </span>
                          <span className="font-semibold">
                            {prediction.recommendedOrder} units
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            Estimated Cost:
                          </span>
                          <span className="font-semibold">
                            Rp{prediction.estimatedCost.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          <strong>Reasoning:</strong>{" "}
                          {prediction.reasoning}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

// Default export untuk Next.js
export default StockManagementPage;