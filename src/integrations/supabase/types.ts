export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string
          data: Json | null
          details: string | null
          id: string
          resolved: boolean
          resolved_at: string | null
          shop_id: string
          title: string
          type: string
          urgency: Database["public"]["Enums"]["alert_urgency"]
        }
        Insert: {
          created_at?: string
          data?: Json | null
          details?: string | null
          id?: string
          resolved?: boolean
          resolved_at?: string | null
          shop_id: string
          title: string
          type: string
          urgency?: Database["public"]["Enums"]["alert_urgency"]
        }
        Update: {
          created_at?: string
          data?: Json | null
          details?: string | null
          id?: string
          resolved?: boolean
          resolved_at?: string | null
          shop_id?: string
          title?: string
          type?: string
          urgency?: Database["public"]["Enums"]["alert_urgency"]
        }
        Relationships: [
          {
            foreignKeyName: "alerts_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          after: Json | null
          before: Json | null
          created_at: string
          id: string
          upload_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          upload_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          upload_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      document_drafts: {
        Row: {
          content: string
          created_at: string
          doc_type: string
          generated_by_ai: boolean
          id: string
          meta: Json | null
          shop_id: string
          title: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          doc_type: string
          generated_by_ai?: boolean
          id?: string
          meta?: Json | null
          shop_id: string
          title?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          doc_type?: string
          generated_by_ai?: boolean
          id?: string
          meta?: Json | null
          shop_id?: string
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_drafts_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_verifications: {
        Row: {
          attempts: number
          created_at: string
          id: string
          last_attempt_at: string | null
          match_score: number | null
          nid_path: string | null
          reason: string | null
          selfie_path: string | null
          status: string
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: string
          last_attempt_at?: string | null
          match_score?: number | null
          nid_path?: string | null
          reason?: string | null
          selfie_path?: string | null
          status?: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: string
          last_attempt_at?: string | null
          match_score?: number | null
          nid_path?: string | null
          reason?: string | null
          selfie_path?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      investor_profiles: {
        Row: {
          contact_email: string | null
          created_at: string
          display_name: string
          id: string
          max_monthly_revenue: number | null
          min_monthly_revenue: number | null
          notes: string | null
          preferred_location: string | null
          risk_tolerance: string | null
          sectors: string[] | null
          ticket_size_max: number | null
          ticket_size_min: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          display_name: string
          id?: string
          max_monthly_revenue?: number | null
          min_monthly_revenue?: number | null
          notes?: string | null
          preferred_location?: string | null
          risk_tolerance?: string | null
          sectors?: string[] | null
          ticket_size_max?: number | null
          ticket_size_min?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          display_name?: string
          id?: string
          max_monthly_revenue?: number | null
          min_monthly_revenue?: number | null
          notes?: string | null
          preferred_location?: string | null
          risk_tolerance?: string | null
          sectors?: string[] | null
          ticket_size_max?: number | null
          ticket_size_min?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          language_pref: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          language_pref?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          language_pref?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      shops: {
        Row: {
          address: string | null
          business_age_years: number | null
          category: string | null
          contact_email: string | null
          contact_phone: string | null
          cover_path: string | null
          created_at: string
          current_funding: number
          description: string | null
          founded_year: number | null
          funding_goal: number | null
          geo_lat: number | null
          geo_lng: number | null
          id: string
          logo_path: string | null
          monthly_revenue: number | null
          name: string
          owner_display_name: string | null
          owner_id: string
          owner_nid: string | null
          risk_level: string | null
          roi_expectation: number | null
          social_links: Json
          tags: string[]
          team_size: number | null
          trade_license_no: string | null
          updated_at: string
          verified: boolean
          website: string | null
        }
        Insert: {
          address?: string | null
          business_age_years?: number | null
          category?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          cover_path?: string | null
          created_at?: string
          current_funding?: number
          description?: string | null
          founded_year?: number | null
          funding_goal?: number | null
          geo_lat?: number | null
          geo_lng?: number | null
          id?: string
          logo_path?: string | null
          monthly_revenue?: number | null
          name: string
          owner_display_name?: string | null
          owner_id: string
          owner_nid?: string | null
          risk_level?: string | null
          roi_expectation?: number | null
          social_links?: Json
          tags?: string[]
          team_size?: number | null
          trade_license_no?: string | null
          updated_at?: string
          verified?: boolean
          website?: string | null
        }
        Update: {
          address?: string | null
          business_age_years?: number | null
          category?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          cover_path?: string | null
          created_at?: string
          current_funding?: number
          description?: string | null
          founded_year?: number | null
          funding_goal?: number | null
          geo_lat?: number | null
          geo_lng?: number | null
          id?: string
          logo_path?: string | null
          monthly_revenue?: number | null
          name?: string
          owner_display_name?: string | null
          owner_id?: string
          owner_nid?: string | null
          risk_level?: string | null
          roi_expectation?: number | null
          social_links?: Json
          tags?: string[]
          team_size?: number | null
          trade_license_no?: string | null
          updated_at?: string
          verified?: boolean
          website?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          confidence_scores: Json | null
          counterparty: string | null
          created_at: string
          description: string | null
          id: string
          items: Json | null
          payment_type: Database["public"]["Enums"]["payment_type"]
          shop_id: string
          tags: string[] | null
          total_amount: number
          txn_date: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          upload_id: string | null
          user_id: string
          validated: boolean
        }
        Insert: {
          confidence_scores?: Json | null
          counterparty?: string | null
          created_at?: string
          description?: string | null
          id?: string
          items?: Json | null
          payment_type?: Database["public"]["Enums"]["payment_type"]
          shop_id: string
          tags?: string[] | null
          total_amount?: number
          txn_date?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          upload_id?: string | null
          user_id: string
          validated?: boolean
        }
        Update: {
          confidence_scores?: Json | null
          counterparty?: string | null
          created_at?: string
          description?: string | null
          id?: string
          items?: Json | null
          payment_type?: Database["public"]["Enums"]["payment_type"]
          shop_id?: string
          tags?: string[] | null
          total_amount?: number
          txn_date?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          upload_id?: string | null
          user_id?: string
          validated?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "transactions_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      uploads: {
        Row: {
          confidence_map: Json | null
          created_at: string
          error_message: string | null
          id: string
          image_path: string
          model_version: string | null
          ocr_language: string | null
          raw_ocr: string | null
          shop_id: string
          status: Database["public"]["Enums"]["upload_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_map?: Json | null
          created_at?: string
          error_message?: string | null
          id?: string
          image_path: string
          model_version?: string | null
          ocr_language?: string | null
          raw_ocr?: string | null
          shop_id: string
          status?: Database["public"]["Enums"]["upload_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_map?: Json | null
          created_at?: string
          error_message?: string | null
          id?: string
          image_path?: string
          model_version?: string | null
          ocr_language?: string | null
          raw_ocr?: string | null
          shop_id?: string
          status?: Database["public"]["Enums"]["upload_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploads_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_results: {
        Row: {
          created_at: string
          evidence: Json | null
          id: string
          score: number | null
          shop_id: string
          status: Database["public"]["Enums"]["verification_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          evidence?: Json | null
          id?: string
          score?: number | null
          shop_id: string
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          evidence?: Json | null
          id?: string
          score?: number | null
          shop_id?: string
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_results_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      alert_urgency: "low" | "medium" | "high"
      app_role: "sme" | "investor" | "admin"
      payment_type: "cash" | "credit" | "baki"
      transaction_type: "sale" | "expense" | "return"
      upload_status:
        | "pending"
        | "processing"
        | "extracted"
        | "validated"
        | "failed"
      verification_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      alert_urgency: ["low", "medium", "high"],
      app_role: ["sme", "investor", "admin"],
      payment_type: ["cash", "credit", "baki"],
      transaction_type: ["sale", "expense", "return"],
      upload_status: [
        "pending",
        "processing",
        "extracted",
        "validated",
        "failed",
      ],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
