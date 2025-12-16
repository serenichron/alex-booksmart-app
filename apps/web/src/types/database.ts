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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      workspaces: {
        Row: {
          id: string
          name: string
          mode: string
          owner_id: string
          is_collaborative: boolean
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          mode?: string
          owner_id: string
          is_collaborative?: boolean
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          mode?: string
          owner_id?: string
          is_collaborative?: boolean
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string
          workspace_id: string | null
          name: string
          description: string | null
          parent_id: string | null
          color: string | null
          icon: string | null
          mode: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workspace_id?: string | null
          name: string
          description?: string | null
          parent_id?: string | null
          color?: string | null
          icon?: string | null
          mode?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workspace_id?: string | null
          name?: string
          description?: string | null
          parent_id?: string | null
          color?: string | null
          icon?: string | null
          mode?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          user_id: string
          workspace_id: string | null
          color: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          user_id: string
          workspace_id?: string | null
          color?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          user_id?: string
          workspace_id?: string | null
          color?: string | null
          created_at?: string
        }
      }
      bookmarks: {
        Row: {
          id: string
          user_id: string
          workspace_id: string | null
          type: string
          title: string
          content: string | null
          url: string | null
          file_url: string | null
          thumbnail_url: string | null
          summary: string | null
          embedding: number[] | null
          source_url: string | null
          created_at: string
          last_accessed_at: string | null
          access_count: number
          is_favorite: boolean
          mode: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workspace_id?: string | null
          type: string
          title: string
          content?: string | null
          url?: string | null
          file_url?: string | null
          thumbnail_url?: string | null
          summary?: string | null
          embedding?: number[] | null
          source_url?: string | null
          created_at?: string
          last_accessed_at?: string | null
          access_count?: number
          is_favorite?: boolean
          mode?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workspace_id?: string | null
          type?: string
          title?: string
          content?: string | null
          url?: string | null
          file_url?: string | null
          thumbnail_url?: string | null
          summary?: string | null
          embedding?: number[] | null
          source_url?: string | null
          created_at?: string
          last_accessed_at?: string | null
          access_count?: number
          is_favorite?: boolean
          mode?: string | null
          updated_at?: string
        }
      }
      bookmark_categories: {
        Row: {
          bookmark_id: string
          category_id: string
          ai_suggested: boolean
          confidence_score: number | null
          created_at: string
        }
        Insert: {
          bookmark_id: string
          category_id: string
          ai_suggested?: boolean
          confidence_score?: number | null
          created_at?: string
        }
        Update: {
          bookmark_id?: string
          category_id?: string
          ai_suggested?: boolean
          confidence_score?: number | null
          created_at?: string
        }
      }
      bookmark_tags: {
        Row: {
          bookmark_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          bookmark_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          bookmark_id?: string
          tag_id?: string
          created_at?: string
        }
      }
      connections: {
        Row: {
          id: string
          bookmark_id_1: string
          bookmark_id_2: string
          connection_type: string
          strength: number
          ai_explanation: string | null
          created_at: string
        }
        Insert: {
          id?: string
          bookmark_id_1: string
          bookmark_id_2: string
          connection_type: string
          strength: number
          ai_explanation?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          bookmark_id_1?: string
          bookmark_id_2?: string
          connection_type?: string
          strength?: number
          ai_explanation?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
