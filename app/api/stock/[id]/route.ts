import { updateStockItem } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PUT(request, { params }) {
  const id = Number(params.id)
  const data = await request.json()
  const result = await updateStockItem(id, data)
  return NextResponse.json(result)
} 