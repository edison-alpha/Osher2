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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          ip_address: string | null
          new_value: Json | null
          old_value: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      banks: {
        Row: {
          code: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
        }
        Relationships: []
      }
      buyer_profiles: {
        Row: {
          bank_account_name: string | null
          bank_account_number: string | null
          bank_id: string | null
          commission_balance: number
          commission_pending: number
          created_at: string
          domicile_id: string | null
          full_name: string
          id: string
          is_verified: boolean
          nik: string
          phone: string | null
          referral_code: string | null
          referrer_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_id?: string | null
          commission_balance?: number
          commission_pending?: number
          created_at?: string
          domicile_id?: string | null
          full_name: string
          id?: string
          is_verified?: boolean
          nik: string
          phone?: string | null
          referral_code?: string | null
          referrer_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_id?: string | null
          commission_balance?: number
          commission_pending?: number
          created_at?: string
          domicile_id?: string | null
          full_name?: string
          id?: string
          is_verified?: boolean
          nik?: string
          phone?: string | null
          referral_code?: string | null
          referrer_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buyer_profiles_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "banks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_profiles_domicile_id_fkey"
            columns: ["domicile_id"]
            isOneToOne: false
            referencedRelation: "domiciles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_profiles_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "buyer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      courier_profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          phone: string
          total_deliveries: number
          updated_at: string
          user_id: string
          vehicle_plate: string | null
          vehicle_type: string | null
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          is_active?: boolean
          phone: string
          total_deliveries?: number
          updated_at?: string
          user_id: string
          vehicle_plate?: string | null
          vehicle_type?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string
          total_deliveries?: number
          updated_at?: string
          user_id?: string
          vehicle_plate?: string | null
          vehicle_type?: string | null
        }
        Relationships: []
      }
      delivery_proofs: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          order_id: string
          photo_url: string
          recipient_signature: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          order_id: string
          photo_url: string
          recipient_signature?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          photo_url?: string
          recipient_signature?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_proofs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      domiciles: {
        Row: {
          city: string | null
          created_at: string
          district: string | null
          id: string
          is_active: boolean
          name: string
          province: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          district?: string | null
          id?: string
          is_active?: boolean
          name: string
          province?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          district?: string | null
          id?: string
          is_active?: boolean
          name?: string
          province?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          created_at: string
          id: string
          min_stock: number
          product_id: string
          quantity: number
          reserved_quantity: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          min_stock?: number
          product_id: string
          quantity?: number
          reserved_quantity?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          min_stock?: number
          product_id?: string
          quantity?: number
          reserved_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          movement_type: Database["public"]["Enums"]["inventory_movement_type"]
          product_id: string
          quantity: number
          quantity_after: number
          quantity_before: number
          reason: string
          reference_id: string | null
          reference_type: string | null
          unit_cost: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type: Database["public"]["Enums"]["inventory_movement_type"]
          product_id: string
          quantity: number
          quantity_after: number
          quantity_before: number
          reason: string
          reference_id?: string | null
          reference_type?: string | null
          unit_cost?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type?: Database["public"]["Enums"]["inventory_movement_type"]
          product_id?: string
          quantity?: number
          quantity_after?: number
          quantity_before?: number
          reason?: string
          reference_id?: string | null
          reference_type?: string | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_addresses: {
        Row: {
          address: string
          created_at: string
          domicile_id: string | null
          id: string
          landmark: string | null
          notes: string | null
          order_id: string
          phone: string
          recipient_name: string
        }
        Insert: {
          address: string
          created_at?: string
          domicile_id?: string | null
          id?: string
          landmark?: string | null
          notes?: string | null
          order_id: string
          phone: string
          recipient_name: string
        }
        Update: {
          address?: string
          created_at?: string
          domicile_id?: string | null
          id?: string
          landmark?: string | null
          notes?: string | null
          order_id?: string
          phone?: string
          recipient_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_addresses_domicile_id_fkey"
            columns: ["domicile_id"]
            isOneToOne: false
            referencedRelation: "domiciles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_addresses_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          hpp_at_order: number
          id: string
          order_id: string
          price_at_order: number
          product_id: string
          product_name: string
          quantity: number
          subtotal: number
        }
        Insert: {
          created_at?: string
          hpp_at_order?: number
          id?: string
          order_id: string
          price_at_order: number
          product_id: string
          product_name: string
          quantity: number
          subtotal: number
        }
        Update: {
          created_at?: string
          hpp_at_order?: number
          id?: string
          order_id?: string
          price_at_order?: number
          product_id?: string
          product_name?: string
          quantity?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          notes: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          admin_fee: number
          assigned_at: string | null
          buyer_id: string
          cancelled_at: string | null
          courier_id: string | null
          created_at: string
          delivered_at: string | null
          id: string
          notes: string | null
          order_number: string
          picked_up_at: string | null
          shipping_cost: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          total_hpp: number
          updated_at: string
        }
        Insert: {
          admin_fee?: number
          assigned_at?: string | null
          buyer_id: string
          cancelled_at?: string | null
          courier_id?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          notes?: string | null
          order_number: string
          picked_up_at?: string | null
          shipping_cost?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          total_hpp?: number
          updated_at?: string
        }
        Update: {
          admin_fee?: number
          assigned_at?: string | null
          buyer_id?: string
          cancelled_at?: string | null
          courier_id?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          picked_up_at?: string | null
          shipping_cost?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          total_hpp?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "buyer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_courier_id_fkey"
            columns: ["courier_id"]
            isOneToOne: false
            referencedRelation: "courier_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_confirmations: {
        Row: {
          account_number: string | null
          amount: number
          bank_name: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          id: string
          is_confirmed: boolean
          notes: string | null
          order_id: string
          proof_image_url: string
          transfer_date: string | null
        }
        Insert: {
          account_number?: string | null
          amount: number
          bank_name?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          is_confirmed?: boolean
          notes?: string | null
          order_id: string
          proof_image_url: string
          transfer_date?: string | null
        }
        Update: {
          account_number?: string | null
          amount?: number
          bank_name?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          is_confirmed?: boolean
          notes?: string | null
          order_id?: string
          proof_image_url?: string
          transfer_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_confirmations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_requests: {
        Row: {
          account_name: string
          account_number: string
          amount: number
          approved_at: string | null
          approved_by: string | null
          bank_name: string
          buyer_id: string
          completed_at: string | null
          created_at: string
          id: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["payout_status"]
          updated_at: string
        }
        Insert: {
          account_name: string
          account_number: string
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          bank_name: string
          buyer_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_number?: string
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          bank_name?: string
          buyer_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_requests_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "buyer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_prices: {
        Row: {
          created_at: string
          created_by: string | null
          effective_date: string
          het: number | null
          hpp_average: number
          id: string
          product_id: string
          selling_price: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          effective_date?: string
          het?: number | null
          hpp_average?: number
          id?: string
          product_id: string
          selling_price: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          effective_date?: string
          het?: number | null
          hpp_average?: number
          id?: string
          product_id?: string
          selling_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand_id: string | null
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          sku: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          sku: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          sku?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_commissions: {
        Row: {
          amount: number
          buyer_id: string
          commission_type: Database["public"]["Enums"]["commission_type"]
          created_at: string
          id: string
          notes: string | null
          order_id: string | null
          order_subtotal: number | null
          percentage: number | null
          referrer_id: string
        }
        Insert: {
          amount: number
          buyer_id: string
          commission_type: Database["public"]["Enums"]["commission_type"]
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          order_subtotal?: number | null
          percentage?: number | null
          referrer_id: string
        }
        Update: {
          amount?: number
          buyer_id?: string
          commission_type?: Database["public"]["Enums"]["commission_type"]
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          order_subtotal?: number | null
          percentage?: number | null
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_commissions_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "buyer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_commissions_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "buyer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      units: {
        Row: {
          abbreviation: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          abbreviation: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          abbreviation?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      deduct_inventory_for_order: {
        Args: { p_order_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      release_inventory_for_order: {
        Args: { p_order_id: string }
        Returns: boolean
      }
      reserve_inventory_for_order: {
        Args: { p_order_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin_gudang"
        | "admin_keuangan"
        | "courier"
        | "buyer"
      commission_type: "accrual" | "reversal" | "payout"
      inventory_movement_type: "in" | "out" | "adjustment"
      order_status:
        | "new"
        | "waiting_payment"
        | "paid"
        | "assigned"
        | "picked_up"
        | "on_delivery"
        | "delivered"
        | "cancelled"
        | "refunded"
        | "failed"
        | "returned"
      payout_status: "pending" | "approved" | "rejected" | "completed"
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
      app_role: [
        "super_admin",
        "admin_gudang",
        "admin_keuangan",
        "courier",
        "buyer",
      ],
      commission_type: ["accrual", "reversal", "payout"],
      inventory_movement_type: ["in", "out", "adjustment"],
      order_status: [
        "new",
        "waiting_payment",
        "paid",
        "assigned",
        "picked_up",
        "on_delivery",
        "delivered",
        "cancelled",
        "refunded",
        "failed",
        "returned",
      ],
      payout_status: ["pending", "approved", "rejected", "completed"],
    },
  },
} as const
