export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          slug: string
          name: string
          logo_url: string | null
          accent_color: string | null
          onboarded_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['clients']['Insert']>
      }
      client_users: {
        Row: {
          id: string
          client_id: string
          user_id: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['client_users']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['client_users']['Insert']>
      }
      galleries: {
        Row: {
          id: string
          client_id: string
          title: string
          slug: string
          shoot_date: string | null
          location: string | null
          lens: string | null
          description: string | null
          cover_photo_id: string | null
          published: boolean
          display_order: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['galleries']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['galleries']['Insert']>
      }
      photos: {
        Row: {
          id: string
          gallery_id: string
          client_id: string
          storage_path: string
          width: number
          height: number
          caption: string | null
          display_order: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['photos']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['photos']['Insert']>
      }
      documents: {
        Row: {
          id: string
          client_id: string
          title: string
          storage_path: string
          document_type: 'contract' | 'proposal' | 'report' | 'other'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['documents']['Insert']>
      }
      invoices: {
        Row: {
          id: string
          client_id: string
          title: string
          amount: number
          currency: string
          status: 'draft' | 'sent' | 'paid' | 'overdue'
          due_date: string | null
          paid_at: string | null
          stripe_invoice_id: string | null
          stripe_payment_url: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['invoices']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>
      }
    }
  }
}

export type Client = Database['public']['Tables']['clients']['Row']
export type ClientUser = Database['public']['Tables']['client_users']['Row']
export type Gallery = Database['public']['Tables']['galleries']['Row']
export type Photo = Database['public']['Tables']['photos']['Row']
export type Document = Database['public']['Tables']['documents']['Row']
export type Invoice = Database['public']['Tables']['invoices']['Row']

export type GalleryWithPhotos = Gallery & { photos: Photo[] }
