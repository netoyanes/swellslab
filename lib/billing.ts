import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

export interface RawItem {
  description: string
  qty: number
  unit_price: number
}

export interface Totals {
  subtotal: number
  tax_amount: number
  total: number
  items: (RawItem & { amount: number; display_order: number })[]
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

// Computes line amounts + subtotal/tax/total from raw items and a tax rate (%).
export function computeTotals(items: RawItem[], taxRate: number): Totals {
  const lines = items
    .filter((i) => i.description.trim() !== '')
    .map((i, idx) => ({
      description: i.description.trim(),
      qty: Number(i.qty) || 0,
      unit_price: Number(i.unit_price) || 0,
      amount: round2((Number(i.qty) || 0) * (Number(i.unit_price) || 0)),
      display_order: idx,
    }))
  const subtotal = round2(lines.reduce((s, l) => s + l.amount, 0))
  const tax_amount = round2(subtotal * ((Number(taxRate) || 0) / 100))
  const total = round2(subtotal + tax_amount)
  return { subtotal, tax_amount, total, items: lines }
}

// Sequential document numbers: COT-2026-001 / FAC-2026-001 / REC-2026-001.
// Counts existing rows for the year and increments. Good enough for a
// single-studio volume; not concurrency-hardened.
export async function nextNumber(
  table: 'quotes' | 'invoices' | 'receipts',
  prefix: 'COT' | 'FAC' | 'REC',
): Promise<string> {
  const admin = createAdminClient()
  const year = new Date().getFullYear()
  const { count } = await admin
    .from(table)
    .select('id', { count: 'exact', head: true })
    .like('number', `${prefix}-${year}-%`)
  const seq = String((count ?? 0) + 1).padStart(3, '0')
  return `${prefix}-${year}-${seq}`
}
