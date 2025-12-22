import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          first_name: string | null
          last_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name?: string | null
          last_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string | null
          last_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      boards: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      bookmarks: {
        Row: {
          id: string
          user_id: string
          board_id: string
          title: string
          summary: string
          url: string | null
          type: 'link' | 'image' | 'text' | 'todo' | 'document' | 'video' | 'other'
          created_at: string
          updated_at: string
          is_favorite: boolean
          categories: string[]
          tags: string[]
          image_url: string | null
          meta_description: string | null
          show_meta_description: boolean
        }
        Insert: {
          id?: string
          user_id: string
          board_id: string
          title: string
          summary?: string
          url?: string | null
          type: 'link' | 'image' | 'text' | 'todo' | 'document' | 'video' | 'other'
          created_at?: string
          updated_at?: string
          is_favorite?: boolean
          categories?: string[]
          tags?: string[]
          image_url?: string | null
          meta_description?: string | null
          show_meta_description?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          board_id?: string
          title?: string
          summary?: string
          url?: string | null
          type?: 'link' | 'image' | 'text' | 'todo' | 'document' | 'video' | 'other'
          created_at?: string
          updated_at?: string
          is_favorite?: boolean
          categories?: string[]
          tags?: string[]
          image_url?: string | null
          meta_description?: string | null
          show_meta_description?: boolean
        }
      }
      notes: {
        Row: {
          id: string
          bookmark_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          bookmark_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          bookmark_id?: string
          content?: string
          created_at?: string
        }
      }
      todo_items: {
        Row: {
          id: string
          bookmark_id: string
          text: string
          completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          bookmark_id: string
          text: string
          completed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          bookmark_id?: string
          text?: string
          completed?: boolean
          created_at?: string
        }
      }
    }
  }
}
