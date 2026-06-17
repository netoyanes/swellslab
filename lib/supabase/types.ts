export type Role = 'master' | 'staff' | 'admin' | 'client'
export type BrandAssetKind = 'logo' | 'photo' | 'file'
export type DesignRefKind = 'color' | 'font' | 'figma' | 'drive' | 'link'
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
  brand_id: string | null
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
  brand_id: string | null
  quote_id: string | null
  number: string | null
  title: string
  notes: string | null
  amount: number
  subtotal: number
  tax_rate: number
  tax_amount: number
  currency: string
  status: InvoiceStatus
  due_date: string | null
  issued_at: string | null
  paid_at: string | null
  stripe_invoice_id: string | null
  stripe_payment_url: string | null
  created_at: string
  updated_at: string | null
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

export interface Brand {
  id: string
  client_id: string
  name: string
  slug: string
  tagline: string | null
  logo_url: string | null
  accent_color: string | null
  active: boolean
  client_visible: boolean
  display_order: number
  created_at: string
}

export interface BrandAsset {
  id: string
  brand_id: string
  client_id: string
  kind: BrandAssetKind
  label: string | null
  bucket: string
  storage_path: string
  mime_type: string | null
  size_bytes: number | null
  category: string | null
  downloadable: boolean
  client_visible: boolean
  display_order: number
  created_at: string
}

export interface DesignRef {
  id: string
  brand_id: string
  kind: DesignRefKind
  label: string
  description: string | null
  url: string | null
  value: string | null
  category: string | null
  client_visible: boolean
  display_order: number
  created_at: string
}

export type GalleryWithAssets = Gallery & { assets: Asset[] }

// ---- Fase 3: Facturación -----------------------------------
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'

export interface LineItem {
  id: string
  description: string
  qty: number
  unit_price: number
  amount: number
  display_order: number
}

export type QuoteItem = LineItem & { quote_id: string }
export type InvoiceItem = LineItem & { invoice_id: string }

export interface Quote {
  id: string
  client_id: string | null
  brand_id: string | null
  number: string | null
  title: string
  status: QuoteStatus
  currency: string
  notes: string | null
  valid_until: string | null
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  share_token: string | null
  accepted_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Receipt {
  id: string
  invoice_id: string
  client_id: string | null
  number: string | null
  amount: number
  currency: string
  method: string | null
  paid_at: string
  stripe_payment_intent: string | null
  created_at: string
}

export type QuoteWithItems = Quote & { quote_items: QuoteItem[] }
export type InvoiceWithItems = Invoice & { invoice_items: InvoiceItem[] }

// ---- Fase 4: Agente IA Diseñador ---------------------------
export interface AiConversation {
  id: string
  brand_id: string | null
  title: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface AiMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Task {
  id: string
  client_id: string | null
  brand_id: string | null
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  created_by: string | null
  display_order: number
  created_at: string
  updated_at: string
}

export interface TaskComment {
  id: string
  task_id: string
  author_id: string | null
  body: string
  created_at: string
}

export interface AppNotification {
  id: string
  user_id: string
  type: string
  title: string
  body: string | null
  link: string | null
  read_at: string | null
  created_at: string
}

export interface StudioUser {
  id: string
  email: string | null
  full_name: string | null
  role: Role
}

// Minimal Database shape kept loose; we cast query results explicitly.
export type Database = Record<string, never>
