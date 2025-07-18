// lib/types.ts - Comprehensive TypeScript interfaces for backend
export interface DatabaseCustomer {
  Invoice_Id: number;
  Tanggal_Order: string | Date;
  Harga_Total: number;
  id_restaurant: number;
}

export interface DatabaseMenu {
  Id_Menu: number;
  Nama_Menu: string;
  Deskripsi: string;
  Kategori: string;
  Harga: number;
  Status: boolean | number;
  id_restaurant: number;
}

export interface DatabaseOrderItem {
  id_pemesanan: number;
  id_menu: number;
  kuantitas: number;
  id_customer: number;
}

export interface DatabaseRestaurant {
  id_restaurant: number;
  nama_restaurant?: string;
  email: string;
  password: string;
}

// API Request/Response Types
export interface OrderRequest {
  customer_data: {
    Invoice_Id: string | number;
    id_restaurant: number;
    Harga_Total: number;
  };
  items: OrderItemRequest[];
  customer_name?: string;
  order_type?: 'dine-in' | 'takeout' | 'delivery';
  payment_method?: 'cash' | 'card' | 'digital';
  notes?: string;
}

export interface OrderItemRequest {
  id_menu: number;
  kuantitas: number;
}

export interface OrderResponse {
  success: boolean;
  data?: {
    orders?: OrderData[];
    order?: OrderData;
    pagination?: PaginationData;
  };
  error?: string;
  message?: string;
}

export interface OrderData {
  id: string;
  invoice_id: number | string;
  customer: string;
  date: string | Date;
  total: number;
  restaurant_id: number;
  restaurant_name: string;
  total_items: number;
  total_quantity: number;
  menu_items: string;
  status: 'pending' | 'in-progress' | 'ready' | 'completed' | 'cancelled';
  items: OrderItemData[];
  type?: 'dine-in' | 'takeout' | 'delivery';
  time?: string;
  order_hour?: number;
  order_day?: number;
  vs_restaurant_avg?: number;
  daily_restaurant_revenue?: number;
  order_size?: 'small' | 'medium' | 'large';
  order_time_period?: 'morning' | 'afternoon' | 'evening';
  previous_orders?: number;
}

export interface OrderItemData {
  id_menu?: number;
  name: string;
  quantity?: number;
  kuantitas?: number;
  price: number;
}

export interface TransactionRequest {
  order_id: string;
  customer_id: string | number;
  amount: number;
  payment_method: 'cash' | 'card' | 'digital';
  restaurant_id: number;
  notes?: string;
}

export interface TransactionResponse {
  success: boolean;
  data?: {
    transactions?: TransactionData[];
    transaction?: TransactionData;
    summary?: TransactionSummary;
    pagination?: PaginationData;
  };
  error?: string;
  message?: string;
}

export interface TransactionData {
  id: string;
  orderId: string;
  customer: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'digital';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  timestamp: string | Date;
  restaurant_id: number;
  restaurant_name: string;
  items: string[];
  total_items: number;
  total_quantity: number;
  vs_restaurant_avg?: number;
  daily_transaction_count?: number;
  transaction_hour?: number;
  transaction_day?: number;
  amount_category?: 'low' | 'medium' | 'high';
  time_period?: 'morning' | 'afternoon' | 'evening';
}

export interface TransactionSummary {
  total_transactions: number;
  total_revenue: number;
  avg_transaction_value: number;
  payment_methods: {
    cash: number;
    card: number;
    digital: number;
  };
  status_distribution: {
    completed: number;
    failed: number;
    pending: number;
  };
  today_revenue: number;
  today_transactions: number;
  revenue_growth: number;
}

export interface OrderStatusRequest {
  invoice_id: string | number;
  status: 'pending' | 'in-progress' | 'ready' | 'completed' | 'cancelled';
  notes?: string;
  estimated_completion?: string;
}

export interface OrderStatusData {
  id: string;
  invoice_id: number | string;
  customer: string;
  date: string | Date;
  total: number;
  restaurant_id: number;
  restaurant_name: string;
  status: 'pending' | 'in-progress' | 'ready' | 'completed' | 'cancelled';
  notes: string;
  estimated_completion?: string | Date;
  status_created?: string | Date;
  status_updated?: string | Date;
  updated_by: string;
  total_items: number;
  total_quantity: number;
  menu_items: string;
  items: string[];
  minutes_since_order: number;
  estimated_prep_time?: number;
  is_overdue: boolean;
  time_remaining?: number;
  priority: 'normal' | 'high' | 'urgent';
}

export interface PaginationData {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface AnalyticsRequest {
  filters?: {
    restaurant_id?: number;
    date_range?: {
      start_date: string;
      end_date: string;
    };
    min_order_value?: number;
    max_order_value?: number;
  };
  metrics?: string[];
  groupBy?: 'hour' | 'day' | 'week' | 'month' | 'restaurant' | 'category';
  includeComparisons?: boolean;
  includeForecasting?: boolean;
}

export interface AnalyticsResponse {
  success: boolean;
  data?: {
    summary?: AnalyticsSummary;
    time_series?: TimeSeriesData[];
    restaurant_performance?: RestaurantPerformance[];
    patterns?: AnalyticsPatterns;
    top_menu_items?: TopMenuItem[];
    analytics?: CustomAnalyticsData[];
    comparison?: ComparisonData;
    metadata: AnalyticsMetadata;
  };
  error?: string;
  message?: string;
}

export interface AnalyticsSummary {
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  min_order_value: number;
  max_order_value: number;
  active_days: number;
  active_restaurants: number;
  growth_rate: number;
  orders_per_day: number;
}

export interface TimeSeriesData {
  period: string;
  orders: number;
  revenue: number;
  avg_order_value: number;
  restaurants_served: number;
}

export interface RestaurantPerformance {
  id: number;
  name: string;
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  first_order: string | Date;
  latest_order: string | Date;
  revenue_per_order: number;
  active_days: number;
  orders_per_day: number;
  market_share: number;
}

export interface AnalyticsPatterns {
  hourly: HourlyData[];
  daily: DailyData[];
  order_sizes: OrderSizeData[];
}

export interface HourlyData {
  hour: number;
  orders: number;
  revenue: number;
  avg_order_value: number;
}

export interface DailyData {
  day: number;
  day_name: string;
  orders: number;
  revenue: number;
}

export interface OrderSizeData {
  category: string;
  orders: number;
  revenue: number;
  avg_value: number;
  percentage: number;
}

export interface TopMenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
  times_ordered: number;
  total_quantity: number;
  total_revenue: number;
  avg_quantity_per_order: number;
  unique_customers: number;
  revenue_contribution: number;
}

export interface CustomAnalyticsData {
  group: string;
  [key: string]: string | number; // Dynamic metrics
  data_points: number;
}

export interface ComparisonData {
  previous_period: {
    [key: string]: number; // Dynamic metrics
  };
  growth_rates: {
    [key: string]: number; // Dynamic growth rates
  };
}

export interface AnalyticsMetadata {
  generated_at: string;
  period?: string;
  filters: {
    restaurant_id?: number;
    start_date?: string;
    end_date?: string;
  };
  data_points: {
    orders_analyzed: number;
    time_periods: number;
    restaurants: number;
    menu_items: number;
  };
}

// Database Query Result Types
export interface QueryResult {
  [key: string]: any;
}

export interface OrderQueryResult {
  Invoice_Id: number;
  Tanggal_Order: string;
  Harga_Total: number;
  id_restaurant: number;
  nama_restaurant?: string;
  total_items: number;
  menu_items: string;
  total_quantity: number;
  previous_orders: number;
  order_value_vs_restaurant_avg: number;
  order_hour: number;
  order_day_of_week: number;
  daily_restaurant_revenue: number;
  detailed_items?: string;
  calculated_status: string;
}

export interface TransactionQueryResult {
  transaction_id: string;
  order_id: string;
  customer_name: string;
  Harga_Total: number;
  simulated_payment_method: string;
  transaction_status: string;
  id_restaurant: number;
  nama_restaurant?: string;
  items_list: string;
  total_items: number;
  total_quantity: number;
  restaurant_avg_transaction: number;
  daily_transaction_count: number;
  transaction_hour: number;
  transaction_day: number;
}

// Error Types
export interface APIError {
  success: false;
  error: string;
  message?: string;
  code?: string;
  details?: any;
}

// Utility Types
export type APIResponse<T> = T | APIError;

export interface BulkOperation<T> {
  successful_updates: T[];
  errors: Array<{
    [key: string]: any;
    error: string;
  }>;
  summary: {
    total_updates: number;
    successful: number;
    failed: number;
  };
}

// Type Guards
export const isAPIError = (response: any): response is APIError => {
  return response && response.success === false;
}

export const isOrderResponse = (response: any): response is OrderResponse => {
  return response && typeof response.success === 'boolean';
}

export const isTransactionResponse = (response: any): response is TransactionResponse => {
  return response && typeof response.success === 'boolean';
}