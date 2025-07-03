import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"

interface Feedback {
  name: string
  rating: number
  comment: string
}

export default function CustomerFeedback() {
  const [form, setForm] = useState<Feedback>({ name: "", rating: 0, comment: "" })
  const [submitted, setSubmitted] = useState(false)

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-2 text-navy-blue">We Value Your Feedback</h1>
      <p className="mb-6 text-gray-600">Let us know how your experience was. Your feedback helps us improve!</p>
      {submitted ? (
        <div className="text-center">
          <p className="text-green-600 font-semibold mb-4">Thank you for your feedback!</p>
          <Button onClick={() => setSubmitted(false)}>Submit Another</Button>
        </div>
      ) : (
        <form
          onSubmit={e => {
            e.preventDefault()
            // Here you would send feedback to backend
            setSubmitted(true)
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1">Your Name</label>
            <Input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Enter your name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setForm(f => ({ ...f, rating: star }))}
                  className={star <= form.rating ? "text-yellow-400" : "text-gray-300"}
                  aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                >
                  <Star className="h-6 w-6" fill={star <= form.rating ? "#facc15" : "none"} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Comment</label>
            <Textarea
              value={form.comment}
              onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
              placeholder="Share your thoughts..."
              required
            />
          </div>
          <Button type="submit" className="w-full bg-navy-blue hover:bg-navy-blue-700">Submit Feedback</Button>
        </form>
      )}
    </div>
  )
} 