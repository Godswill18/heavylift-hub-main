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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bank_accounts: {
        Row: {
          account_name: string
          account_number: string
          bank_name: string
          created_at: string
          id: string
          is_primary: boolean | null
          user_id: string
        }
        Insert: {
          account_name: string
          account_number: string
          bank_name: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          user_id: string
        }
        Update: {
          account_name?: string
          account_number?: string
          bank_name?: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      booking_status_logs: {
        Row: {
          action_type: string
          booking_id: string
          created_at: string
          id: string
          new_status: string
          notes: string | null
          performed_by: string
          performed_by_role: string
          previous_status: string | null
        }
        Insert: {
          action_type: string
          booking_id: string
          created_at?: string
          id?: string
          new_status: string
          notes?: string | null
          performed_by: string
          performed_by_role: string
          previous_status?: string | null
        }
        Update: {
          action_type?: string
          booking_id?: string
          created_at?: string
          id?: string
          new_status?: string
          notes?: string | null
          performed_by?: string
          performed_by_role?: string
          previous_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_status_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_number: string
          cancellation_reason: string | null
          cancelled_by: string | null
          contractor_id: string | null
          contractor_notes: string | null
          created_at: string
          delivery_photos: string[] | null
          deposit_amount: number | null
          end_date: string
          equipment_id: string | null
          escrow_status: string | null
          id: string
          owner_id: string | null
          owner_notes: string | null
          owner_payout: number | null
          payment_status: string | null
          platform_fee: number
          rental_amount: number
          return_photos: string[] | null
          site_address: string | null
          site_location: string
          special_requirements: string | null
          start_date: string
          status: Database["public"]["Enums"]["booking_status"] | null
          total_amount: number
          updated_at: string
          usage_hours_per_day: number | null
          vat_amount: number
        }
        Insert: {
          booking_number: string
          cancellation_reason?: string | null
          cancelled_by?: string | null
          contractor_id?: string | null
          contractor_notes?: string | null
          created_at?: string
          delivery_photos?: string[] | null
          deposit_amount?: number | null
          end_date: string
          equipment_id?: string | null
          escrow_status?: string | null
          id?: string
          owner_id?: string | null
          owner_notes?: string | null
          owner_payout?: number | null
          payment_status?: string | null
          platform_fee: number
          rental_amount: number
          return_photos?: string[] | null
          site_address?: string | null
          site_location: string
          special_requirements?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          total_amount: number
          updated_at?: string
          usage_hours_per_day?: number | null
          vat_amount: number
        }
        Update: {
          booking_number?: string
          cancellation_reason?: string | null
          cancelled_by?: string | null
          contractor_id?: string | null
          contractor_notes?: string | null
          created_at?: string
          delivery_photos?: string[] | null
          deposit_amount?: number | null
          end_date?: string
          equipment_id?: string | null
          escrow_status?: string | null
          id?: string
          owner_id?: string | null
          owner_notes?: string | null
          owner_payout?: number | null
          payment_status?: string | null
          platform_fee?: number
          rental_amount?: number
          return_photos?: string[] | null
          site_address?: string | null
          site_location?: string
          special_requirements?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          total_amount?: number
          updated_at?: string
          usage_hours_per_day?: number | null
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "bookings_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          booking_id: string
          contractor_evidence: string[] | null
          contractor_response: string | null
          contractor_response_at: string | null
          created_at: string
          description: string | null
          evidence: string[] | null
          id: string
          raised_by: string
          raised_by_role: string
          reason: string
          refund_amount: number | null
          resolution: string | null
          resolution_notes: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["dispute_status"] | null
          updated_at: string
        }
        Insert: {
          booking_id: string
          contractor_evidence?: string[] | null
          contractor_response?: string | null
          contractor_response_at?: string | null
          created_at?: string
          description?: string | null
          evidence?: string[] | null
          id?: string
          raised_by: string
          raised_by_role: string
          reason: string
          refund_amount?: number | null
          resolution?: string | null
          resolution_notes?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["dispute_status"] | null
          updated_at?: string
        }
        Update: {
          booking_id?: string
          contractor_evidence?: string[] | null
          contractor_response?: string | null
          contractor_response_at?: string | null
          created_at?: string
          description?: string | null
          evidence?: string[] | null
          id?: string
          raised_by?: string
          raised_by_role?: string
          reason?: string
          refund_amount?: number | null
          resolution?: string | null
          resolution_notes?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["dispute_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          admin_notes: string | null
          created_at: string
          document_type: string
          file_url: string
          id: string
          status: Database["public"]["Enums"]["verification_status"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          document_type: string
          file_url: string
          id?: string
          status?: Database["public"]["Enums"]["verification_status"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          document_type?: string
          file_url?: string
          id?: string
          status?: Database["public"]["Enums"]["verification_status"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      equipment: {
        Row: {
          capacity: string | null
          category: Database["public"]["Enums"]["equipment_category"]
          city: string | null
          condition: Database["public"]["Enums"]["equipment_condition"] | null
          created_at: string
          daily_rate: number
          delivery_available: boolean | null
          delivery_fee: number | null
          delivery_radius: number | null
          deposit_amount: number | null
          description: string | null
          id: string
          images: string[] | null
          insurance_details: string | null
          is_active: boolean | null
          is_featured: boolean | null
          location: string
          maintenance_history: string | null
          make: string
          minimum_days: number | null
          model: string
          owner_id: string
          rating: number | null
          specifications: Json | null
          title: string
          total_bookings: number | null
          total_reviews: number | null
          updated_at: string
          year: number | null
        }
        Insert: {
          capacity?: string | null
          category: Database["public"]["Enums"]["equipment_category"]
          city?: string | null
          condition?: Database["public"]["Enums"]["equipment_condition"] | null
          created_at?: string
          daily_rate: number
          delivery_available?: boolean | null
          delivery_fee?: number | null
          delivery_radius?: number | null
          deposit_amount?: number | null
          description?: string | null
          id?: string
          images?: string[] | null
          insurance_details?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          location: string
          maintenance_history?: string | null
          make: string
          minimum_days?: number | null
          model: string
          owner_id: string
          rating?: number | null
          specifications?: Json | null
          title: string
          total_bookings?: number | null
          total_reviews?: number | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          capacity?: string | null
          category?: Database["public"]["Enums"]["equipment_category"]
          city?: string | null
          condition?: Database["public"]["Enums"]["equipment_condition"] | null
          created_at?: string
          daily_rate?: number
          delivery_available?: boolean | null
          delivery_fee?: number | null
          delivery_radius?: number | null
          deposit_amount?: number | null
          description?: string | null
          id?: string
          images?: string[] | null
          insurance_details?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          location?: string
          maintenance_history?: string | null
          make?: string
          minimum_days?: number | null
          model?: string
          owner_id?: string
          rating?: number | null
          specifications?: Json | null
          title?: string
          total_bookings?: number | null
          total_reviews?: number | null
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      equipment_availability: {
        Row: {
          blocked_date: string
          created_at: string
          equipment_id: string
          id: string
          reason: string | null
        }
        Insert: {
          blocked_date: string
          created_at?: string
          equipment_id: string
          id?: string
          reason?: string | null
        }
        Update: {
          blocked_date?: string
          created_at?: string
          equipment_id?: string
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_availability_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          booking_id: string
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          sender_id: string
        }
        Insert: {
          booking_id: string
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_id: string
        }
        Update: {
          booking_id?: string
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          company_name: string | null
          company_registration: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_company: boolean | null
          phone: string | null
          rating: number | null
          total_reviews: number | null
          updated_at: string
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          company_name?: string | null
          company_registration?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_company?: boolean | null
          phone?: string | null
          rating?: number | null
          total_reviews?: number | null
          updated_at?: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          company_name?: string | null
          company_registration?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_company?: boolean | null
          phone?: string | null
          rating?: number | null
          total_reviews?: number | null
          updated_at?: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          equipment_id: string | null
          helpful_count: number | null
          id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          equipment_id?: string | null
          helpful_count?: number | null
          id?: string
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          equipment_id?: string | null
          helpful_count?: number | null
          id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_equipment: {
        Row: {
          created_at: string
          equipment_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          equipment_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          equipment_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_equipment_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          description: string | null
          fee: number | null
          id: string
          net_amount: number | null
          payment_method: string | null
          payment_reference: string | null
          status: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          description?: string | null
          fee?: number | null
          id?: string
          net_amount?: number | null
          payment_method?: string | null
          payment_reference?: string | null
          status?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          description?: string | null
          fee?: number | null
          id?: string
          net_amount?: number | null
          payment_method?: string | null
          payment_reference?: string | null
          status?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
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
          role?: Database["public"]["Enums"]["app_role"]
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
      wallets: {
        Row: {
          balance: number | null
          created_at: string
          id: string
          pending_balance: number | null
          total_earned: number | null
          total_spent: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string
          id?: string
          pending_balance?: number | null
          total_earned?: number | null
          total_spent?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string
          id?: string
          pending_balance?: number | null
          total_earned?: number | null
          total_spent?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_mark_return_due: { Args: never; Returns: undefined }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "contractor" | "owner"
      booking_status:
        | "requested"
        | "accepted"
        | "rejected"
        | "pending_payment"
        | "confirmed"
        | "delivering"
        | "on_hire"
        | "return_due"
        | "returned"
        | "completed"
        | "cancelled"
        | "disputed"
      dispute_status: "open" | "under_review" | "resolved" | "closed"
      equipment_category:
        | "excavator"
        | "backhoe"
        | "tipper"
        | "crane"
        | "bulldozer"
        | "loader"
        | "compactor"
        | "grader"
        | "forklift"
        | "generator"
        | "other"
      equipment_condition: "excellent" | "good" | "fair" | "needs_repair"
      transaction_type: "payment" | "refund" | "payout" | "deposit" | "fee"
      verification_status: "pending" | "verified" | "rejected"
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
      app_role: ["admin", "contractor", "owner"],
      booking_status: [
        "requested",
        "accepted",
        "rejected",
        "pending_payment",
        "confirmed",
        "delivering",
        "on_hire",
        "return_due",
        "returned",
        "completed",
        "cancelled",
        "disputed",
      ],
      dispute_status: ["open", "under_review", "resolved", "closed"],
      equipment_category: [
        "excavator",
        "backhoe",
        "tipper",
        "crane",
        "bulldozer",
        "loader",
        "compactor",
        "grader",
        "forklift",
        "generator",
        "other",
      ],
      equipment_condition: ["excellent", "good", "fair", "needs_repair"],
      transaction_type: ["payment", "refund", "payout", "deposit", "fee"],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const
