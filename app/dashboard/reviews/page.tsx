// app/dashboard/reviews/page.tsx
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star } from "lucide-react"

interface Feedback {
  name: string
  rating: number
  comment: string
  date: string // ISO string
}

const mockFeedback: Feedback[] = [
  { name: "Alice", rating: 5, comment: "Amazing food and service!", date: "2024-06-01T14:30:00" },
  { name: "Bob", rating: 3, comment: "It was okay, but the wait was long.", date: "2024-06-02T12:10:00" },
  { name: "Charlie", rating: 4, comment: "Great atmosphere and tasty menu.", date: "2024-06-03T18:45:00" },
  { name: "Dana", rating: 2, comment: "Food was cold when served.", date: "2024-06-04T09:20:00" },
  { name: "Eve", rating: 5, comment: "Best restaurant in town!", date: "2024-06-05T20:00:00" },
]

export default function ReviewsPage() {
  const [ratingFilter, setRatingFilter] = useState<string>("all")
  const [timeFilter, setTimeFilter] = useState<string>("latest")

  const filtered = mockFeedback
    .filter(fb => ratingFilter === "all" || fb.rating === Number(ratingFilter))
    .sort((a, b) =>
      timeFilter === "latest"
        ? new Date(b.date).getTime() - new Date(a.date).getTime()
        : new Date(a.date).getTime() - new Date(b.date).getTime()
    )

  return (
    <div className="max-w-3xl mx-auto mt-10 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Customer Feedback & Reviews</CardTitle>
          <div className="flex gap-4 mt-4">
            <div>
              <label className="block text-xs font-medium mb-1">Filter by Rating</label>
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="All Ratings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {[5, 4, 3, 2, 1].map(r => (
                    <SelectItem key={r} value={String(r)}>{r} Star{r > 1 ? "s" : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Sort by</label>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No feedback found for this filter.</div>
          ) : (
            <ul className="space-y-4">
              {filtered.map((fb, idx) => (
                <li key={idx} className="border rounded p-4 bg-white shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-navy-blue">{fb.name}</span>
                    <span className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} className="h-4 w-4" fill={star <= fb.rating ? "#facc15" : "none"} stroke="#facc15" />
                      ))}
                    </span>
                    <span className="ml-auto text-xs text-gray-400">{new Date(fb.date).toLocaleString()}</span>
                  </div>
                  <div className="text-gray-700">{fb.comment}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 