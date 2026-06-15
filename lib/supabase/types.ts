export type Role = 'admin' | 'client'
export type AssetType = 'image' | 'video' | 'pdf' | 'doc'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  role: Role
  client_id: string | null
  created_at: string
}

export interface Client {
  id: string
  slug: string
  name: string
  logo_url: string | null
  accent_color: string | null
  onboarded_at: string | null
  created_at: string
}

export interface Project {
  id: string
  client_id: string
  title: string
  slug: string
  description: string | null
  status: 'active' | 'archived'
  created_at: string
}

export interface Gallery {
  id: string
  client_id: string
  project_id: string | null
  title: string
  slug: string
  shoot_date: string | null
  location: string | null
  lens: string | null
  description: string | null
  cover_asset_id: string | null
  published: boolean
  display_order: number
  share_token: string | null
  created_at: string
}

export interface Asset {
  id: string
  gallery_id: string | null
  client_id: string
  type: AssetType
  bucket: string
  storage_path: string
  width: number | null
  height: number | null
  duration: number | null
  caption: string | null
  downloadable: boolean
  display_order: number
  created_at: string
}

export interface Invoice {
  id: string
  client_id: string
  project_id: string | null
  title: string
  amount: number
  currency: string
  status: InvoiceStatus
  due_date: string | null
  paid_at: string | null
  stripe_invoice_id: string | null
  stripe_payment_url: string | null
  created_at: string
}

export interface Thread {
  id: string
  client_id: string
  project_id: string | null
  gallery_id: string | null
  asset_id: string | null
  kind: 'project' | 'gallery' | 'asset'
  created_at: string
}

export interface Message {
  id: string
  thread_id: string
  client_id: string
  author_id: string
  author_role: Role
  body: string
  read_at: string | null
  created_at: string
}

export type GalleryWithAssets = Gallery & { assets: Asset[] }

// Minimal Database shape kept loose; we cast query results explicitly.
export type Database = Record<string, never>
