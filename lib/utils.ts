// lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// AI function for generating predictions using Groq with updated model
export async function callGroqLLM(
  prompt: string, 
  maxTokens: number = 1024, 
  temperature: number = 0.3
): Promise<string> {
  try {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    
    if (!GROQ_API_KEY) {
      console.warn('GROQ_API_KEY not found, returning fallback response');
      return JSON.stringify({
        predictions: {
          nextDay: { sales: 85000, confidence: 75 },
          nextMonth: { sales: 2500000, confidence: 70 },
          nextYear: { sales: 32000000, confidence: 65 }
        }
      });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192', // Updated model
        messages: [
          {
            role: 'system',
            content: 'You are an AI expert in restaurant business analytics and sales predictions. Always respond in valid JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: temperature,
        stream: false
      })
    });

    if (!response.ok) {
      console.error('Groq API error:', response.status, response.statusText);
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    } else {
      throw new Error('Invalid response format from Groq API');
    }
    
  } catch (error) {
    console.error('Error calling Groq LLM:', error);
    
    // Return fallback response based on prompt type
    if (prompt.includes('predictions')) {
      return JSON.stringify({
        predictions: {
          nextDay: { sales: 85000, confidence: 75 },
          nextMonth: { sales: 2500000, confidence: 70 },
          nextYear: { sales: 32000000, confidence: 65 }
        }
      });
    } else if (prompt.includes('topItems')) {
      return JSON.stringify({
        topItems: [
          { name: "Nasi Gudeg", predictedSales: 150, reason: "Menu paling populer berdasarkan data historis", confidence: 85 },
          { name: "Ayam Goreng Kremes", predictedSales: 120, reason: "Konsisten tinggi demand", confidence: 80 }
        ]
      });
    } else if (prompt.includes('promos')) {
      return JSON.stringify({
        promos: [
          {
            type: "Bundle Deal",
            description: "Paket hemat menu utama + minuman",
            reasoning: "Meningkatkan average order value",
            estimatedImpact: "+25%",
            details: "Diskon 15% untuk paket lengkap"
          }
        ]
      });
    }
    
    throw error;
  }
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

// Format datetime
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

// Calculate percentage change
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// Generate safe ID
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}${timestamp}_${random}`;
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Safe number conversion
export function safeNumber(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined || value === '') return defaultValue;
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? defaultValue : num;
}

// Safe string conversion
export function safeString(value: any, defaultValue: string = ''): string {
  if (value === null || value === undefined) return defaultValue;
  return String(value);
}

// Array chunk utility
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Deep clone utility
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const cloned = {} as { [key: string]: any };
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone((obj as { [key: string]: any })[key]);
    });
    return cloned as T;
  }
  return obj;
}

// Generate random color
export function generateRandomColor(): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength - 3) + '...';
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Get time ago string
export function getTimeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Baru saja';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} bulan yang lalu`;
  return `${Math.floor(diffInSeconds / 31536000)} tahun yang lalu`;
}

// Calculate business metrics
export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function calculateMargin(revenue: number, cost: number): number {
  if (revenue === 0) return 0;
  return ((revenue - cost) / revenue) * 100;
}

export function calculateROI(gain: number, cost: number): number {
  if (cost === 0) return 0;
  return ((gain - cost) / cost) * 100;
}