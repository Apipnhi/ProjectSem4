import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind classes conditionally.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Call Groq LLM API to generate completion from a prompt.
 *
 * @param prompt - The prompt to send to Groq LLM.
 * @returns The generated completion text.
 */
export async function callGroqLLM(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY not set in environment");
  }

  console.log("Making request to Groq API...");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama3-70b-8192",
      messages: [
        {
          role: "system",
          content: "You are a helpful restaurant analytics assistant.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 512,
      temperature: 0.7,
    }),
  });

  console.log("Groq API response status:", response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Groq API error response:", errorText);
    throw new Error("Groq API error");
  }

  const data = await response.json();
  console.log("Groq API success response received");

  return data.choices?.[0]?.message?.content || "";
}


