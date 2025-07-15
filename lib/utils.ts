// lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// AI function for generating predictions using Groq
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
        model: 'llama3-8b-8192', // or another available model
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
  return ((current - previous) / previous) * 100;
}

// Generate random ID
export function generateId(length: number = 8): string {
  return Math.random().toString(36).substring(2, length + 2);
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