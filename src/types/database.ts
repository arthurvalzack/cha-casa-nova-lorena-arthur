export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      site_settings: {
        Row: {
          id: string
          couple_name: string
          event_name: string
          event_date: string
          event_time_text: string | null
          hero_image_url: string | null
          couple_photo_url: string | null
          main_message: string | null
          pix_email: string | null
          pix_qr_code_url: string | null
          thank_you_message: string | null
          address_message: string | null
          theme_primary_color: string | null
          theme_secondary_color: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          couple_name?: string
          event_name?: string
          event_date?: string
          event_time_text?: string | null
          hero_image_url?: string | null
          couple_photo_url?: string | null
          main_message?: string | null
          pix_email?: string | null
          pix_qr_code_url?: string | null
          thank_you_message?: string | null
          address_message?: string | null
          theme_primary_color?: string | null
          theme_secondary_color?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          couple_name?: string
          event_name?: string
          event_date?: string
          event_time_text?: string | null
          hero_image_url?: string | null
          couple_photo_url?: string | null
          main_message?: string | null
          pix_email?: string | null
          pix_qr_code_url?: string | null
          thank_you_message?: string | null
          address_message?: string | null
          theme_primary_color?: string | null
          theme_secondary_color?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      gift_categories: {
        Row: {
          id: string
          name: string
          slug: string
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      gifts: {
        Row: {
          id: string
          slug: string | null
          category_id: string | null
          name: string
          description: string | null
          image_url: string | null
          desired_quantity: number
          available_quantity: number
          suggested_pix_value: number | null
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug?: string | null
          category_id?: string | null
          name: string
          description?: string | null
          image_url?: string | null
          desired_quantity?: number
          available_quantity?: number
          suggested_pix_value?: number | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string | null
          category_id?: string | null
          name?: string
          description?: string | null
          image_url?: string | null
          desired_quantity?: number
          available_quantity?: number
          suggested_pix_value?: number | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'gifts_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'gift_categories'
            referencedColumns: ['id']
          }
        ]
      }
      gift_reservations: {
        Row: {
          id: string
          reservation_group_id: string | null
          gift_id: string
          guest_whatsapp: string | null
          reservation_type: 'bring_gift' | 'pix'
          quantity: number
          status: 'reserved' | 'address_sent' | 'pix_received' | 'delivered' | 'cancelled'
          is_hidden: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reservation_group_id?: string | null
          gift_id: string
          guest_whatsapp?: string | null
          reservation_type: 'bring_gift' | 'pix'
          quantity?: number
          status?: 'reserved' | 'address_sent' | 'pix_received' | 'delivered' | 'cancelled'
          is_hidden?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reservation_group_id?: string | null
          gift_id?: string
          guest_whatsapp?: string | null
          reservation_type?: 'bring_gift' | 'pix'
          quantity?: number
          status?: 'reserved' | 'address_sent' | 'pix_received' | 'delivered' | 'cancelled'
          is_hidden?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'gift_reservations_gift_id_fkey'
            columns: ['gift_id']
            isOneToOne: false
            referencedRelation: 'gifts'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      reserve_gift: {
        Args: {
          p_gift_id: string
          p_guest_whatsapp: string | null
          p_reservation_type: string
        }
        Returns: Json
      }
      cancel_reservation: {
        Args: {
          p_reservation_id: string
          p_delete?: boolean
        }
        Returns: Json
      }
      reserve_gift_batch: {
        Args: { p_items: Json; p_reservation_type: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type SiteSettings = Database['public']['Tables']['site_settings']['Row']
export type GiftCategory = Database['public']['Tables']['gift_categories']['Row']
export type Gift = Database['public']['Tables']['gifts']['Row']
export type GiftReservation = Database['public']['Tables']['gift_reservations']['Row']

export type GiftWithCategory = Gift & {
  gift_categories: GiftCategory | null
}

export type ReservationWithGift = GiftReservation & {
  gifts: Gift | null
}
