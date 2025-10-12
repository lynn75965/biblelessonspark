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
      events: {
        Row: {
          created_at: string | null
          event: string
          id: number
          lesson_id: string | null
          meta: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event: string
          id?: number
          lesson_id?: string | null
          meta?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event?: string
          id?: number
          lesson_id?: string | null
          meta?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          comments: string | null
          created_at: string | null
          engagement_improved: boolean | null
          id: string
          lesson_id: string
          minutes_saved: number | null
          rating: number | null
          user_id: string
        }
        Insert: {
          comments?: string | null
          created_at?: string | null
          engagement_improved?: boolean | null
          id?: string
          lesson_id: string
          minutes_saved?: number | null
          rating?: number | null
          user_id: string
        }
        Update: {
          comments?: string | null
          created_at?: string | null
          engagement_improved?: boolean | null
          id?: string
          lesson_id?: string
          minutes_saved?: number | null
          rating?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          claimed_at: string | null
          claimed_by: string | null
          created_at: string | null
          created_by: string
          email: string
          token: string
        }
        Insert: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string | null
          created_by: string
          email: string
          token?: string
        }
        Update: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string | null
          created_by?: string
          email?: string
          token?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          created_at: string | null
          filters: Json
          id: string
          organization_id: string | null
          original_text: string | null
          source_type: string
          title: string | null
          upload_path: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          filters?: Json
          id?: string
          organization_id?: string | null
          original_text?: string | null
          source_type: string
          title?: string | null
          upload_path?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          filters?: Json
          id?: string
          organization_id?: string | null
          original_text?: string | null
          source_type?: string
          title?: string | null
          upload_path?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          created_at: string
          created_by: string
          default_doctrine: string
          denomination: string
          description: string | null
          email: string | null
          id: string
          name: string
          organization_type: string
          phone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by: string
          default_doctrine?: string
          denomination?: string
          description?: string | null
          email?: string | null
          id?: string
          name: string
          organization_type?: string
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string
          default_doctrine?: string
          denomination?: string
          description?: string | null
          email?: string | null
          id?: string
          name?: string
          organization_type?: string
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      outputs: {
        Row: {
          created_at: string | null
          id: string
          lesson_id: string
          model: string
          student_sheet: Json
          teacher_plan: Json
          tokens_completion: number | null
          tokens_prompt: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lesson_id: string
          model: string
          student_sheet: Json
          teacher_plan: Json
          tokens_completion?: number | null
          tokens_prompt?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lesson_id?: string
          model?: string
          student_sheet?: Json
          teacher_plan?: Json
          tokens_completion?: number | null
          tokens_prompt?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outputs_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          founder_plan: string | null
          founder_reserved_at: string | null
          founder_status: string | null
          full_name: string | null
          id: string
          organization_id: string | null
          organization_role: string | null
          preferred_age_group: string | null
          role: string | null
        }
        Insert: {
          created_at?: string | null
          founder_plan?: string | null
          founder_reserved_at?: string | null
          founder_status?: string | null
          full_name?: string | null
          id: string
          organization_id?: string | null
          organization_role?: string | null
          preferred_age_group?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string | null
          founder_plan?: string | null
          founder_reserved_at?: string | null
          founder_status?: string | null
          full_name?: string | null
          id?: string
          organization_id?: string | null
          organization_role?: string | null
          preferred_age_group?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      refinements: {
        Row: {
          created_at: string | null
          id: string
          instruction: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          instruction: string
          lesson_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          instruction?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refinements_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
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
      check_organization_admin: {
        Args: { org_id: string }
        Returns: boolean
      }
      get_user_organization: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: { user_id?: string }
        Returns: boolean
      }
      is_organization_admin_safe: {
        Args: { org_id: string; user_id?: string }
        Returns: boolean
      }
      is_organization_member: {
        Args: { org_id: string; user_id?: string }
        Returns: boolean
      }
      log_security_event: {
        Args: { event_type: string; metadata?: Json; user_id?: string }
        Returns: undefined
      }
      verify_admin_access: {
        Args: { user_id?: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "teacher" | "moderator"
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
      app_role: ["admin", "teacher", "moderator"],
    },
  },
} as const
