Need to install the following packages:
supabase@2.74.5
Ok to proceed? (y) 
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
      admin_audit: {
        Row: {
          action: string
          actor_user_id: string
          created_at: string
          id: string
          payload: Json | null
          target_org_id: string | null
          target_user_id: string
        }
        Insert: {
          action: string
          actor_user_id: string
          created_at?: string
          id?: string
          payload?: Json | null
          target_org_id?: string | null
          target_user_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string
          created_at?: string
          id?: string
          payload?: Json | null
          target_org_id?: string | null
          target_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_target_org_id_fkey"
            columns: ["target_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      anonymous_parable_usage: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string
          parable_count: number
          updated_at: string | null
          usage_date: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address: string
          parable_count?: number
          updated_at?: string | null
          usage_date?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string
          parable_count?: number
          updated_at?: string | null
          usage_date?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      beta_feedback: {
        Row: {
          allow_followup: boolean | null
          category: string | null
          feedback_source: string | null
          feedback_text: string | null
          id: string
          lesson_id: string | null
          rating: number | null
          submitted_at: string | null
          user_id: string | null
        }
        Insert: {
          allow_followup?: boolean | null
          category?: string | null
          feedback_source?: string | null
          feedback_text?: string | null
          id?: string
          lesson_id?: string | null
          rating?: number | null
          submitted_at?: string | null
          user_id?: string | null
        }
        Update: {
          allow_followup?: boolean | null
          category?: string | null
          feedback_source?: string | null
          feedback_text?: string | null
          id?: string
          lesson_id?: string | null
          rating?: number | null
          submitted_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      beta_testers: {
        Row: {
          age_group_taught: string | null
          church_name: string | null
          email: string
          id: string
          invited_by: string | null
          last_lesson_at: string | null
          lessons_generated: number | null
          name: string
          signed_up_at: string | null
          status: string | null
          teaching_experience: string | null
          user_id: string | null
        }
        Insert: {
          age_group_taught?: string | null
          church_name?: string | null
          email: string
          id?: string
          invited_by?: string | null
          last_lesson_at?: string | null
          lessons_generated?: number | null
          name: string
          signed_up_at?: string | null
          status?: string | null
          teaching_experience?: string | null
          user_id?: string | null
        }
        Update: {
          age_group_taught?: string | null
          church_name?: string | null
          email?: string
          id?: string
          invited_by?: string | null
          last_lesson_at?: string | null
          lessons_generated?: number | null
          name?: string
          signed_up_at?: string | null
          status?: string | null
          teaching_experience?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bible_versions: {
        Row: {
          abbreviation: string
          copyright_holder: string | null
          copyright_status: string
          created_at: string | null
          display_order: number
          id: string
          name: string
          quote_type: string
          updated_at: string | null
        }
        Insert: {
          abbreviation: string
          copyright_holder?: string | null
          copyright_status: string
          created_at?: string | null
          display_order?: number
          id: string
          name: string
          quote_type: string
          updated_at?: string | null
        }
        Update: {
          abbreviation?: string
          copyright_holder?: string | null
          copyright_status?: string
          created_at?: string | null
          display_order?: number
          id?: string
          name?: string
          quote_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      branding_config: {
        Row: {
          config: Json
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          organization_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          config: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branding_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      credits_ledger: {
        Row: {
          amount: number
          created_at: string
          id: string
          idempotency_key: string | null
          reference_id: string | null
          reference_type: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          idempotency_key?: string | null
          reference_id?: string | null
          reference_type?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          idempotency_key?: string | null
          reference_id?: string | null
          reference_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      devotional_usage: {
        Row: {
          created_at: string
          devotionals_generated: number
          id: string
          period_end: string
          period_start: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          devotionals_generated?: number
          id?: string
          period_end?: string
          period_start?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          devotionals_generated?: number
          id?: string
          period_end?: string
          period_start?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      devotionals: {
        Row: {
          age_group_id: string | null
          anthropic_model: string | null
          bible_passage: string
          bible_version_id: string
          content: string | null
          created_at: string
          detected_valence: string | null
          error_message: string | null
          generation_duration_ms: number | null
          id: string
          length_id: string
          section_contemporary_connection: string | null
          section_prayer_prompt: string | null
          section_reflection_questions: string | null
          section_scripture_in_context: string | null
          section_theological_insights: string | null
          source_lesson_id: string | null
          status: string
          target_id: string
          theology_profile_id: string
          title: string | null
          tokens_input: number | null
          tokens_output: number | null
          updated_at: string
          user_id: string
          word_count: number | null
        }
        Insert: {
          age_group_id?: string | null
          anthropic_model?: string | null
          bible_passage: string
          bible_version_id?: string
          content?: string | null
          created_at?: string
          detected_valence?: string | null
          error_message?: string | null
          generation_duration_ms?: number | null
          id?: string
          length_id?: string
          section_contemporary_connection?: string | null
          section_prayer_prompt?: string | null
          section_reflection_questions?: string | null
          section_scripture_in_context?: string | null
          section_theological_insights?: string | null
          source_lesson_id?: string | null
          status?: string
          target_id?: string
          theology_profile_id?: string
          title?: string | null
          tokens_input?: number | null
          tokens_output?: number | null
          updated_at?: string
          user_id: string
          word_count?: number | null
        }
        Update: {
          age_group_id?: string | null
          anthropic_model?: string | null
          bible_passage?: string
          bible_version_id?: string
          content?: string | null
          created_at?: string
          detected_valence?: string | null
          error_message?: string | null
          generation_duration_ms?: number | null
          id?: string
          length_id?: string
          section_contemporary_connection?: string | null
          section_prayer_prompt?: string | null
          section_reflection_questions?: string | null
          section_scripture_in_context?: string | null
          section_theological_insights?: string | null
          source_lesson_id?: string | null
          status?: string
          target_id?: string
          theology_profile_id?: string
          title?: string | null
          tokens_input?: number | null
          tokens_output?: number | null
          updated_at?: string
          user_id?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "devotionals_source_lesson_id_fkey"
            columns: ["source_lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequence_templates: {
        Row: {
          body: string
          created_at: string | null
          id: string
          is_active: boolean | null
          is_html: boolean | null
          send_day: number
          sequence_order: number
          subject: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_html?: boolean | null
          send_day: number
          sequence_order: number
          subject: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_html?: boolean | null
          send_day?: number
          sequence_order?: number
          subject?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_sequence_tracking: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          last_email_sent: number | null
          last_email_sent_at: string | null
          sequence_started_at: string | null
          unsubscribed: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          last_email_sent?: number | null
          last_email_sent_at?: string | null
          sequence_started_at?: string | null
          unsubscribed?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          last_email_sent?: number | null
          last_email_sent_at?: string | null
          sequence_started_at?: string | null
          unsubscribed?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          event: string
          id: string
          lesson_id: string | null
          meta: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          lesson_id?: string | null
          meta?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
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
          age_appropriateness: boolean | null
          comments: string | null
          created_at: string
          ease_of_use: string | null
          engagement_improved: boolean | null
          has_issue: boolean | null
          id: string
          improvement_suggestions: string | null
          is_beta_feedback: boolean | null
          issue_details: string | null
          lesson_id: string | null
          lesson_quality: string | null
          minutes_saved: number | null
          nps_score: number | null
          positive_comments: string | null
          rating: number | null
          submitted_at: string | null
          theological_accuracy: string | null
          ui_issues: string | null
          used_in_class: boolean | null
          user_id: string
          would_pay_for: string | null
          would_recommend: boolean | null
        }
        Insert: {
          age_appropriateness?: boolean | null
          comments?: string | null
          created_at?: string
          ease_of_use?: string | null
          engagement_improved?: boolean | null
          has_issue?: boolean | null
          id?: string
          improvement_suggestions?: string | null
          is_beta_feedback?: boolean | null
          issue_details?: string | null
          lesson_id?: string | null
          lesson_quality?: string | null
          minutes_saved?: number | null
          nps_score?: number | null
          positive_comments?: string | null
          rating?: number | null
          submitted_at?: string | null
          theological_accuracy?: string | null
          ui_issues?: string | null
          used_in_class?: boolean | null
          user_id: string
          would_pay_for?: string | null
          would_recommend?: boolean | null
        }
        Update: {
          age_appropriateness?: boolean | null
          comments?: string | null
          created_at?: string
          ease_of_use?: string | null
          engagement_improved?: boolean | null
          has_issue?: boolean | null
          id?: string
          improvement_suggestions?: string | null
          is_beta_feedback?: boolean | null
          issue_details?: string | null
          lesson_id?: string | null
          lesson_quality?: string | null
          minutes_saved?: number | null
          nps_score?: number | null
          positive_comments?: string | null
          rating?: number | null
          submitted_at?: string | null
          theological_accuracy?: string | null
          ui_issues?: string | null
          used_in_class?: boolean | null
          user_id?: string
          would_pay_for?: string | null
          would_recommend?: boolean | null
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
      feedback_questions: {
        Row: {
          column_name: string
          created_at: string | null
          description: string | null
          display_order: number
          feedback_mode: string
          id: string
          is_active: boolean | null
          is_required: boolean | null
          label: string
          max_length: number | null
          max_value: number | null
          min_value: number | null
          options: Json | null
          placeholder: string | null
          question_key: string
          question_type: string
          updated_at: string | null
        }
        Insert: {
          column_name: string
          created_at?: string | null
          description?: string | null
          display_order?: number
          feedback_mode?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          label: string
          max_length?: number | null
          max_value?: number | null
          min_value?: number | null
          options?: Json | null
          placeholder?: string | null
          question_key: string
          question_type: string
          updated_at?: string | null
        }
        Update: {
          column_name?: string
          created_at?: string | null
          description?: string | null
          display_order?: number
          feedback_mode?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          label?: string
          max_length?: number | null
          max_value?: number | null
          min_value?: number | null
          options?: Json | null
          placeholder?: string | null
          question_key?: string
          question_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      generation_metrics: {
        Row: {
          anthropic_model: string | null
          browser: string | null
          connection_type: string | null
          created_at: string | null
          device_type: string
          error_message: string | null
          generation_duration_ms: number | null
          generation_end: string | null
          generation_start: string
          id: string
          lesson_id: string | null
          organization_id: string | null
          os: string | null
          rate_limited: boolean | null
          sections_generated: number | null
          sections_requested: number
          status: string
          tier_requested: string
          tokens_input: number | null
          tokens_output: number | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          anthropic_model?: string | null
          browser?: string | null
          connection_type?: string | null
          created_at?: string | null
          device_type: string
          error_message?: string | null
          generation_duration_ms?: number | null
          generation_end?: string | null
          generation_start: string
          id?: string
          lesson_id?: string | null
          organization_id?: string | null
          os?: string | null
          rate_limited?: boolean | null
          sections_generated?: number | null
          sections_requested: number
          status: string
          tier_requested: string
          tokens_input?: number | null
          tokens_output?: number | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          anthropic_model?: string | null
          browser?: string | null
          connection_type?: string | null
          created_at?: string | null
          device_type?: string
          error_message?: string | null
          generation_duration_ms?: number | null
          generation_end?: string | null
          generation_start?: string
          id?: string
          lesson_id?: string | null
          organization_id?: string | null
          os?: string | null
          rate_limited?: boolean | null
          sections_generated?: number | null
          sections_requested?: number
          status?: string
          tier_requested?: string
          tokens_input?: number | null
          tokens_output?: number | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_metrics_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      guardrail_violations: {
        Row: {
          age_group: string | null
          bible_passage: string | null
          created_at: string | null
          id: string
          lesson_id: string | null
          lesson_title: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          theology_profile_id: string
          theology_profile_name: string
          user_id: string | null
          violated_terms: string[]
          violation_contexts: Json | null
          violation_count: number
          was_reviewed: boolean | null
        }
        Insert: {
          age_group?: string | null
          bible_passage?: string | null
          created_at?: string | null
          id?: string
          lesson_id?: string | null
          lesson_title?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          theology_profile_id: string
          theology_profile_name: string
          user_id?: string | null
          violated_terms?: string[]
          violation_contexts?: Json | null
          violation_count?: number
          was_reviewed?: boolean | null
        }
        Update: {
          age_group?: string | null
          bible_passage?: string | null
          created_at?: string | null
          id?: string
          lesson_id?: string | null
          lesson_title?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          theology_profile_id?: string
          theology_profile_name?: string
          user_id?: string | null
          violated_terms?: string[]
          violation_contexts?: Json | null
          violation_count?: number
          was_reviewed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "guardrail_violations_lesson_id_fkey"
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
          created_at: string
          created_by: string
          email: string
          expires_at: string
          id: string
          inviter_name: string | null
          organization_id: string | null
          organization_name: string | null
          token: string
        }
        Insert: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          created_by: string
          email: string
          expires_at?: string
          id?: string
          inviter_name?: string | null
          organization_id?: string | null
          organization_name?: string | null
          token?: string
        }
        Update: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          created_by?: string
          email?: string
          expires_at?: string
          id?: string
          inviter_name?: string | null
          organization_id?: string | null
          organization_name?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_pack_config: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          display_order: number | null
          is_active: boolean | null
          lessons_included: number
          pack_type: string
          price: number
          stripe_price_id: string
          stripe_product_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          display_order?: number | null
          is_active?: boolean | null
          lessons_included: number
          pack_type: string
          price: number
          stripe_price_id: string
          stripe_product_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          display_order?: number | null
          is_active?: boolean | null
          lessons_included?: number
          pack_type?: string
          price?: number
          stripe_price_id?: string
          stripe_product_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      lesson_series: {
        Row: {
          age_group: string | null
          bible_passage: string | null
          created_at: string | null
          focused_topic: string | null
          id: string
          lesson_summaries: Json | null
          org_id: string | null
          series_name: string
          status: string | null
          style_metadata: Json | null
          theology_profile_id: string | null
          total_lessons: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          age_group?: string | null
          bible_passage?: string | null
          created_at?: string | null
          focused_topic?: string | null
          id?: string
          lesson_summaries?: Json | null
          org_id?: string | null
          series_name: string
          status?: string | null
          style_metadata?: Json | null
          theology_profile_id?: string | null
          total_lessons: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          age_group?: string | null
          bible_passage?: string | null
          created_at?: string | null
          focused_topic?: string | null
          id?: string
          lesson_summaries?: Json | null
          org_id?: string | null
          series_name?: string
          status?: string | null
          style_metadata?: Json | null
          theology_profile_id?: string | null
          total_lessons?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_series_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          filters: Json | null
          id: string
          metadata: Json | null
          org_pool_consumed: boolean | null
          organization_id: string | null
          original_text: string | null
          series_id: string | null
          series_lesson_number: number | null
          series_style_metadata: Json | null
          source_type: string | null
          title: string
          updated_at: string | null
          upload_path: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json | null
          id?: string
          metadata?: Json | null
          org_pool_consumed?: boolean | null
          organization_id?: string | null
          original_text?: string | null
          series_id?: string | null
          series_lesson_number?: number | null
          series_style_metadata?: Json | null
          source_type?: string | null
          title: string
          updated_at?: string | null
          upload_path?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json | null
          id?: string
          metadata?: Json | null
          org_pool_consumed?: boolean | null
          organization_id?: string | null
          original_text?: string | null
          series_id?: string | null
          series_lesson_number?: number | null
          series_style_metadata?: Json | null
          source_type?: string | null
          title?: string
          updated_at?: string | null
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
          {
            foreignKeyName: "lessons_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "lesson_series"
            referencedColumns: ["id"]
          },
        ]
      }
      modern_parables: {
        Row: {
          age_group: string | null
          audience_lens: string
          bible_passage: string
          bible_version: string | null
          created_at: string
          focus_point: string | null
          generation_time_ms: number | null
          id: string
          lesson_id: string | null
          modern_setting: string
          news_date: string | null
          news_headline: string | null
          news_location: string | null
          news_source: string | null
          news_summary: string | null
          news_url: string | null
          parable_text: string
          theology_profile: string | null
          updated_at: string
          user_id: string
          word_count: number | null
          word_count_target: string
        }
        Insert: {
          age_group?: string | null
          audience_lens?: string
          bible_passage: string
          bible_version?: string | null
          created_at?: string
          focus_point?: string | null
          generation_time_ms?: number | null
          id?: string
          lesson_id?: string | null
          modern_setting?: string
          news_date?: string | null
          news_headline?: string | null
          news_location?: string | null
          news_source?: string | null
          news_summary?: string | null
          news_url?: string | null
          parable_text: string
          theology_profile?: string | null
          updated_at?: string
          user_id: string
          word_count?: number | null
          word_count_target?: string
        }
        Update: {
          age_group?: string | null
          audience_lens?: string
          bible_passage?: string
          bible_version?: string | null
          created_at?: string
          focus_point?: string | null
          generation_time_ms?: number | null
          id?: string
          lesson_id?: string | null
          modern_setting?: string
          news_date?: string | null
          news_headline?: string | null
          news_location?: string | null
          news_source?: string | null
          news_summary?: string | null
          news_url?: string | null
          parable_text?: string
          theology_profile?: string | null
          updated_at?: string
          user_id?: string
          word_count?: number | null
          word_count_target?: string
        }
        Relationships: [
          {
            foreignKeyName: "modern_parables_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modern_parables_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_config: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          display_order: number | null
          features: string[] | null
          is_active: boolean | null
          onboarding_type: string
          price: number
          stripe_price_id: string
          stripe_product_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          display_order?: number | null
          features?: string[] | null
          is_active?: boolean | null
          onboarding_type: string
          price: number
          stripe_price_id: string
          stripe_product_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          display_order?: number | null
          features?: string[] | null
          is_active?: boolean | null
          onboarding_type?: string
          price?: number
          stripe_price_id?: string
          stripe_product_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      org_lesson_pack_purchases: {
        Row: {
          amount_paid: number
          created_at: string | null
          id: string
          lessons_added: number
          organization_id: string
          pack_type: string
          purchased_by: string | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount_paid: number
          created_at?: string | null
          id?: string
          lessons_added: number
          organization_id: string
          pack_type: string
          purchased_by?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount_paid?: number
          created_at?: string | null
          id?: string
          lessons_added?: number
          organization_id?: string
          pack_type?: string
          purchased_by?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_lesson_pack_purchases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_onboarding_purchases: {
        Row: {
          amount_paid: number
          completed_date: string | null
          created_at: string | null
          id: string
          notes: string | null
          onboarding_type: string
          organization_id: string
          purchased_by: string | null
          scheduled_date: string | null
          status: string | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount_paid: number
          completed_date?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          onboarding_type: string
          organization_id: string
          purchased_by?: string | null
          scheduled_date?: string | null
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_paid?: number
          completed_date?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          onboarding_type?: string
          organization_id?: string
          purchased_by?: string | null
          scheduled_date?: string | null
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_onboarding_purchases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_shared_focus: {
        Row: {
          adopted_from_focus_id: string | null
          created_at: string | null
          created_by: string
          end_date: string
          focus_type: string
          id: string
          notes: string | null
          organization_id: string
          passage: string | null
          start_date: string
          theme: string | null
          updated_at: string | null
        }
        Insert: {
          adopted_from_focus_id?: string | null
          created_at?: string | null
          created_by: string
          end_date: string
          focus_type: string
          id?: string
          notes?: string | null
          organization_id: string
          passage?: string | null
          start_date: string
          theme?: string | null
          updated_at?: string | null
        }
        Update: {
          adopted_from_focus_id?: string | null
          created_at?: string | null
          created_by?: string
          end_date?: string
          focus_type?: string
          id?: string
          notes?: string | null
          organization_id?: string
          passage?: string | null
          start_date?: string
          theme?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_shared_focus_adopted_from_focus_id_fkey"
            columns: ["adopted_from_focus_id"]
            isOneToOne: false
            referencedRelation: "org_shared_focus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_shared_focus_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_tier_config: {
        Row: {
          best_for: string | null
          created_at: string | null
          description: string | null
          display_name: string
          display_order: number | null
          is_active: boolean | null
          lessons_limit: number
          price_annual: number
          price_monthly: number
          stripe_price_id_annual: string
          stripe_price_id_monthly: string
          stripe_product_id: string
          tier: string
          updated_at: string | null
        }
        Insert: {
          best_for?: string | null
          created_at?: string | null
          description?: string | null
          display_name: string
          display_order?: number | null
          is_active?: boolean | null
          lessons_limit: number
          price_annual: number
          price_monthly: number
          stripe_price_id_annual: string
          stripe_price_id_monthly: string
          stripe_product_id: string
          tier: string
          updated_at?: string | null
        }
        Update: {
          best_for?: string | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          display_order?: number | null
          is_active?: boolean | null
          lessons_limit?: number
          price_annual?: number
          price_monthly?: number
          stripe_price_id_annual?: string
          stripe_price_id_monthly?: string
          stripe_product_id?: string
          tier?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      organization_contacts: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          organization_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          organization_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          organization_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_focus: {
        Row: {
          created_at: string | null
          created_by: string | null
          focus_date: string
          id: string
          notes: string | null
          organization_id: string
          passage: string | null
          theme: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          focus_date: string
          id?: string
          notes?: string | null
          organization_id: string
          passage?: string | null
          theme?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          focus_date?: string
          id?: string
          notes?: string | null
          organization_id?: string
          passage?: string | null
          theme?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_focus_organization_id_fkey"
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
          role: string
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
          approved_at: string | null
          approved_by: string | null
          beta_access_level: string | null
          beta_activated_by: string | null
          beta_end_date: string | null
          beta_mode: boolean | null
          beta_start_date: string | null
          billing_interval: string | null
          bonus_lessons: number | null
          created_at: string
          created_by: string
          current_period_end: string | null
          current_period_start: string | null
          default_bible_version: string | null
          default_doctrine: string | null
          denomination: string | null
          description: string | null
          email: string | null
          id: string
          lessons_limit: number | null
          lessons_used_this_period: number | null
          name: string
          org_level: number | null
          org_type: string | null
          organization_type: string | null
          parent_org_id: string | null
          phone: string | null
          requested_by: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          subscription_tier: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          beta_access_level?: string | null
          beta_activated_by?: string | null
          beta_end_date?: string | null
          beta_mode?: boolean | null
          beta_start_date?: string | null
          billing_interval?: string | null
          bonus_lessons?: number | null
          created_at?: string
          created_by: string
          current_period_end?: string | null
          current_period_start?: string | null
          default_bible_version?: string | null
          default_doctrine?: string | null
          denomination?: string | null
          description?: string | null
          email?: string | null
          id?: string
          lessons_limit?: number | null
          lessons_used_this_period?: number | null
          name: string
          org_level?: number | null
          org_type?: string | null
          organization_type?: string | null
          parent_org_id?: string | null
          phone?: string | null
          requested_by?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          beta_access_level?: string | null
          beta_activated_by?: string | null
          beta_end_date?: string | null
          beta_mode?: boolean | null
          beta_start_date?: string | null
          billing_interval?: string | null
          bonus_lessons?: number | null
          created_at?: string
          created_by?: string
          current_period_end?: string | null
          current_period_start?: string | null
          default_bible_version?: string | null
          default_doctrine?: string | null
          denomination?: string | null
          description?: string | null
          email?: string | null
          id?: string
          lessons_limit?: number | null
          lessons_used_this_period?: number | null
          name?: string
          org_level?: number | null
          org_type?: string | null
          organization_type?: string | null
          parent_org_id?: string | null
          phone?: string | null
          requested_by?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_beta_activated_by_fkey"
            columns: ["beta_activated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      outputs: {
        Row: {
          content: Json
          created_at: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          lesson_id?: string
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
      parable_usage: {
        Row: {
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pricing_plans: {
        Row: {
          best_for: string | null
          created_at: string | null
          display_order: number | null
          features: Json | null
          id: string
          includes_modern_parables: boolean | null
          includes_teaser: boolean | null
          is_active: boolean | null
          lessons_per_month: number
          plan_name: string
          price_annual: number | null
          price_monthly: number | null
          sections_included: string[]
          stripe_price_id_annual: string | null
          stripe_price_id_monthly: string | null
          stripe_product_id: string
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string | null
        }
        Insert: {
          best_for?: string | null
          created_at?: string | null
          display_order?: number | null
          features?: Json | null
          id?: string
          includes_modern_parables?: boolean | null
          includes_teaser?: boolean | null
          is_active?: boolean | null
          lessons_per_month?: number
          plan_name: string
          price_annual?: number | null
          price_monthly?: number | null
          sections_included?: string[]
          stripe_price_id_annual?: string | null
          stripe_price_id_monthly?: string | null
          stripe_product_id: string
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
        }
        Update: {
          best_for?: string | null
          created_at?: string | null
          display_order?: number | null
          features?: Json | null
          id?: string
          includes_modern_parables?: boolean | null
          includes_teaser?: boolean | null
          is_active?: boolean | null
          lessons_per_month?: number
          plan_name?: string
          price_annual?: number | null
          price_monthly?: number | null
          sections_included?: string[]
          stripe_price_id_annual?: string | null
          stripe_price_id_monthly?: string | null
          stripe_product_id?: string
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          beta_participant: boolean | null
          church_name: string | null
          created_at: string
          credits_balance: number | null
          default_bible_version: string | null
          default_export_format: string | null
          default_lesson_duration: number | null
          email: string | null
          email_notifications: boolean | null
          founder_status: string | null
          full_name: string | null
          id: string
          joined_during_beta: boolean | null
          lessons_used_this_period: number | null
          organization_id: string | null
          organization_role: string | null
          period_start_date: string | null
          preferred_age_group: string | null
          preferred_language: string
          referral_source: string | null
          role: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_id: string | null
          subscription_status: string | null
          subscription_tier: string | null
          teaching_environment: string | null
          theology_choice: string | null
          theology_family: string
          theology_profile_id: string | null
          trial_full_lesson_granted_until: string | null
          trial_full_lesson_last_used: string | null
          typical_class_size: string | null
          updated_at: string
        }
        Insert: {
          beta_participant?: boolean | null
          church_name?: string | null
          created_at?: string
          credits_balance?: number | null
          default_bible_version?: string | null
          default_export_format?: string | null
          default_lesson_duration?: number | null
          email?: string | null
          email_notifications?: boolean | null
          founder_status?: string | null
          full_name?: string | null
          id: string
          joined_during_beta?: boolean | null
          lessons_used_this_period?: number | null
          organization_id?: string | null
          organization_role?: string | null
          period_start_date?: string | null
          preferred_age_group?: string | null
          preferred_language?: string
          referral_source?: string | null
          role?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          teaching_environment?: string | null
          theology_choice?: string | null
          theology_family?: string
          theology_profile_id?: string | null
          trial_full_lesson_granted_until?: string | null
          trial_full_lesson_last_used?: string | null
          typical_class_size?: string | null
          updated_at?: string
        }
        Update: {
          beta_participant?: boolean | null
          church_name?: string | null
          created_at?: string
          credits_balance?: number | null
          default_bible_version?: string | null
          default_export_format?: string | null
          default_lesson_duration?: number | null
          email?: string | null
          email_notifications?: boolean | null
          founder_status?: string | null
          full_name?: string | null
          id?: string
          joined_during_beta?: boolean | null
          lessons_used_this_period?: number | null
          organization_id?: string | null
          organization_role?: string | null
          period_start_date?: string | null
          preferred_age_group?: string | null
          preferred_language?: string
          referral_source?: string | null
          role?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          teaching_environment?: string | null
          theology_choice?: string | null
          theology_family?: string
          theology_profile_id?: string | null
          trial_full_lesson_granted_until?: string | null
          trial_full_lesson_last_used?: string | null
          typical_class_size?: string | null
          updated_at?: string
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
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          identifier: string
          request_count: number
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          identifier: string
          request_count?: number
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      refinements: {
        Row: {
          content: Json
          created_at: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
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
      setup_progress: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          step_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          step_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          step_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stripe_events: {
        Row: {
          event_id: string
          event_type: string
          id: string
          processed_at: string
        }
        Insert: {
          event_id: string
          event_type: string
          id?: string
          processed_at?: string
        }
        Update: {
          event_id?: string
          event_type?: string
          id?: string
          processed_at?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          credits_monthly: number | null
          currency: string
          id: string
          lookup_key: string
          name: string
          price_monthly_cents: number
          price_yearly_cents: number
          stripe_price_id_monthly: string
          stripe_price_id_yearly: string
          stripe_product_id: string
          tier: string
          updated_at: string | null
        }
        Insert: {
          credits_monthly?: number | null
          currency?: string
          id?: string
          lookup_key: string
          name: string
          price_monthly_cents: number
          price_yearly_cents: number
          stripe_price_id_monthly: string
          stripe_price_id_yearly: string
          stripe_product_id: string
          tier: string
          updated_at?: string | null
        }
        Update: {
          credits_monthly?: number | null
          currency?: string
          id?: string
          lookup_key?: string
          name?: string
          price_monthly_cents?: number
          price_yearly_cents?: number
          stripe_price_id_monthly?: string
          stripe_price_id_yearly?: string
          stripe_product_id?: string
          tier?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      teacher_preference_profiles: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          preferences: Json
          profile_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          preferences?: Json
          profile_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          preferences?: Json
          profile_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tenant_config: {
        Row: {
          app_title: string
          beta_dashboard_button: string | null
          beta_dashboard_description: string | null
          beta_dashboard_dismiss_button: string | null
          beta_dashboard_title: string | null
          beta_form_already_have_account: string | null
          beta_form_church_name_label: string | null
          beta_form_church_name_placeholder: string | null
          beta_form_email_label: string | null
          beta_form_email_placeholder: string | null
          beta_form_full_name_label: string | null
          beta_form_full_name_placeholder: string | null
          beta_form_password_label: string | null
          beta_form_password_placeholder: string | null
          beta_form_privacy_link: string | null
          beta_form_referral_source_label: string | null
          beta_form_referral_source_placeholder: string | null
          beta_form_sign_in_link: string | null
          beta_form_submit_button: string | null
          beta_form_submitting_button: string | null
          beta_form_subtitle: string | null
          beta_form_terms_link: string | null
          beta_form_terms_text: string | null
          beta_form_title: string | null
          beta_landing_badge_text: string | null
          beta_landing_cta_button: string | null
          beta_landing_cta_subtitle: string | null
          beta_landing_cta_title: string | null
          beta_landing_trust_text: string | null
          beta_msg_already_enrolled_desc: string | null
          beta_msg_already_enrolled_title: string | null
          beta_msg_enrollment_error_desc: string | null
          beta_msg_enrollment_error_title: string | null
          beta_msg_enrollment_success_desc: string | null
          beta_msg_enrollment_success_title: string | null
          beta_msg_verification_sent_desc: string | null
          beta_msg_verification_sent_title: string | null
          beta_val_email_invalid: string | null
          beta_val_email_required: string | null
          beta_val_full_name_min_length: string | null
          beta_val_full_name_required: string | null
          beta_val_password_min_length: string | null
          beta_val_password_required: string | null
          brand_name: string
          contact_from_email: string | null
          contact_from_name: string | null
          contact_support_email: string | null
          created_at: string
          feature_devotionals: boolean
          feature_pdf_export: boolean
          feature_white_label: boolean
          feedback_modal_title: string | null
          font_family: string
          id: string
          logo_url: string | null
          primary_color: string
          primary_cta: string
          prod_landing_badge_text: string | null
          prod_landing_cta_button: string | null
          prod_landing_trust_text: string | null
          secondary_color: string
          tagline: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          app_title: string
          beta_dashboard_button?: string | null
          beta_dashboard_description?: string | null
          beta_dashboard_dismiss_button?: string | null
          beta_dashboard_title?: string | null
          beta_form_already_have_account?: string | null
          beta_form_church_name_label?: string | null
          beta_form_church_name_placeholder?: string | null
          beta_form_email_label?: string | null
          beta_form_email_placeholder?: string | null
          beta_form_full_name_label?: string | null
          beta_form_full_name_placeholder?: string | null
          beta_form_password_label?: string | null
          beta_form_password_placeholder?: string | null
          beta_form_privacy_link?: string | null
          beta_form_referral_source_label?: string | null
          beta_form_referral_source_placeholder?: string | null
          beta_form_sign_in_link?: string | null
          beta_form_submit_button?: string | null
          beta_form_submitting_button?: string | null
          beta_form_subtitle?: string | null
          beta_form_terms_link?: string | null
          beta_form_terms_text?: string | null
          beta_form_title?: string | null
          beta_landing_badge_text?: string | null
          beta_landing_cta_button?: string | null
          beta_landing_cta_subtitle?: string | null
          beta_landing_cta_title?: string | null
          beta_landing_trust_text?: string | null
          beta_msg_already_enrolled_desc?: string | null
          beta_msg_already_enrolled_title?: string | null
          beta_msg_enrollment_error_desc?: string | null
          beta_msg_enrollment_error_title?: string | null
          beta_msg_enrollment_success_desc?: string | null
          beta_msg_enrollment_success_title?: string | null
          beta_msg_verification_sent_desc?: string | null
          beta_msg_verification_sent_title?: string | null
          beta_val_email_invalid?: string | null
          beta_val_email_required?: string | null
          beta_val_full_name_min_length?: string | null
          beta_val_full_name_required?: string | null
          beta_val_password_min_length?: string | null
          beta_val_password_required?: string | null
          brand_name: string
          contact_from_email?: string | null
          contact_from_name?: string | null
          contact_support_email?: string | null
          created_at?: string
          feature_devotionals?: boolean
          feature_pdf_export?: boolean
          feature_white_label?: boolean
          feedback_modal_title?: string | null
          font_family: string
          id?: string
          logo_url?: string | null
          primary_color: string
          primary_cta: string
          prod_landing_badge_text?: string | null
          prod_landing_cta_button?: string | null
          prod_landing_trust_text?: string | null
          secondary_color: string
          tagline: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          app_title?: string
          beta_dashboard_button?: string | null
          beta_dashboard_description?: string | null
          beta_dashboard_dismiss_button?: string | null
          beta_dashboard_title?: string | null
          beta_form_already_have_account?: string | null
          beta_form_church_name_label?: string | null
          beta_form_church_name_placeholder?: string | null
          beta_form_email_label?: string | null
          beta_form_email_placeholder?: string | null
          beta_form_full_name_label?: string | null
          beta_form_full_name_placeholder?: string | null
          beta_form_password_label?: string | null
          beta_form_password_placeholder?: string | null
          beta_form_privacy_link?: string | null
          beta_form_referral_source_label?: string | null
          beta_form_referral_source_placeholder?: string | null
          beta_form_sign_in_link?: string | null
          beta_form_submit_button?: string | null
          beta_form_submitting_button?: string | null
          beta_form_subtitle?: string | null
          beta_form_terms_link?: string | null
          beta_form_terms_text?: string | null
          beta_form_title?: string | null
          beta_landing_badge_text?: string | null
          beta_landing_cta_button?: string | null
          beta_landing_cta_subtitle?: string | null
          beta_landing_cta_title?: string | null
          beta_landing_trust_text?: string | null
          beta_msg_already_enrolled_desc?: string | null
          beta_msg_already_enrolled_title?: string | null
          beta_msg_enrollment_error_desc?: string | null
          beta_msg_enrollment_error_title?: string | null
          beta_msg_enrollment_success_desc?: string | null
          beta_msg_enrollment_success_title?: string | null
          beta_msg_verification_sent_desc?: string | null
          beta_msg_verification_sent_title?: string | null
          beta_val_email_invalid?: string | null
          beta_val_email_required?: string | null
          beta_val_full_name_min_length?: string | null
          beta_val_full_name_required?: string | null
          beta_val_password_min_length?: string | null
          beta_val_password_required?: string | null
          brand_name?: string
          contact_from_email?: string | null
          contact_from_name?: string | null
          contact_support_email?: string | null
          created_at?: string
          feature_devotionals?: boolean
          feature_pdf_export?: boolean
          feature_white_label?: boolean
          feedback_modal_title?: string | null
          font_family?: string
          id?: string
          logo_url?: string | null
          primary_color?: string
          primary_cta?: string
          prod_landing_badge_text?: string | null
          prod_landing_cta_button?: string | null
          prod_landing_trust_text?: string | null
          secondary_color?: string
          tagline?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tier_config: {
        Row: {
          includes_teaser: boolean | null
          lessons_limit: number
          reset_interval: unknown
          sections_allowed: number[]
          tier: string
        }
        Insert: {
          includes_teaser?: boolean | null
          lessons_limit: number
          reset_interval?: unknown
          sections_allowed: number[]
          tier: string
        }
        Update: {
          includes_teaser?: boolean | null
          lessons_limit?: number
          reset_interval?: unknown
          sections_allowed?: number[]
          tier?: string
        }
        Relationships: []
      }
      toolbelt_email_captures: {
        Row: {
          created_at: string | null
          email: string
          id: string
          reflection_sent: boolean | null
          reflection_text: string | null
          tool_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          reflection_sent?: boolean | null
          reflection_text?: string | null
          tool_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          reflection_sent?: boolean | null
          reflection_text?: string | null
          tool_id?: string
        }
        Relationships: []
      }
      toolbelt_email_templates: {
        Row: {
          body: string
          created_at: string | null
          id: string
          is_active: boolean | null
          is_html: boolean | null
          send_day: number
          sequence_order: number
          subject: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_html?: boolean | null
          send_day: number
          sequence_order: number
          subject: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_html?: boolean | null
          send_day?: number
          sequence_order?: number
          subject?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      toolbelt_email_tracking: {
        Row: {
          created_at: string | null
          email_capture_id: string
          id: string
          last_email_sent: number | null
          last_email_sent_at: string | null
          unsubscribed: boolean | null
        }
        Insert: {
          created_at?: string | null
          email_capture_id: string
          id?: string
          last_email_sent?: number | null
          last_email_sent_at?: string | null
          unsubscribed?: boolean | null
        }
        Update: {
          created_at?: string | null
          email_capture_id?: string
          id?: string
          last_email_sent?: number | null
          last_email_sent_at?: string | null
          unsubscribed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "toolbelt_email_tracking_email_capture_id_fkey"
            columns: ["email_capture_id"]
            isOneToOne: true
            referencedRelation: "toolbelt_email_captures"
            referencedColumns: ["id"]
          },
        ]
      }
      toolbelt_usage: {
        Row: {
          created_at: string | null
          id: string
          session_id: string
          tokens_used: number | null
          tool_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          session_id: string
          tokens_used?: number | null
          tool_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          session_id?: string
          tokens_used?: number | null
          tool_id?: string
        }
        Relationships: []
      }
      transfer_requests: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          from_organization_id: string
          id: string
          initiated_by: string
          processed_at: string | null
          processed_by: string | null
          reason: string
          requested_by: string
          responded_at: string | null
          response_note: string | null
          status: string
          teacher_agreement_confirmed: boolean
          teacher_agreement_date: string | null
          to_organization_id: string | null
          transfer_type: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          from_organization_id: string
          id?: string
          initiated_by?: string
          processed_at?: string | null
          processed_by?: string | null
          reason: string
          requested_by: string
          responded_at?: string | null
          response_note?: string | null
          status?: string
          teacher_agreement_confirmed?: boolean
          teacher_agreement_date?: string | null
          to_organization_id?: string | null
          transfer_type: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          from_organization_id?: string
          id?: string
          initiated_by?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string
          requested_by?: string
          responded_at?: string | null
          response_note?: string | null
          status?: string
          teacher_agreement_confirmed?: boolean
          teacher_agreement_date?: string | null
          to_organization_id?: string | null
          transfer_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_requests_from_organization_id_fkey"
            columns: ["from_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_requests_to_organization_id_fkey"
            columns: ["to_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          billing_interval: string | null
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          lessons_limit: number | null
          lessons_used: number | null
          plan_id: string | null
          reset_date: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          stripe_subscription_id: string | null
          tier: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_interval?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          lessons_limit?: number | null
          lessons_used?: number | null
          plan_id?: string | null
          reset_date?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_interval?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          lessons_limit?: number | null
          lessons_used?: number | null
          plan_id?: string | null
          reset_date?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      beta_feedback_view: {
        Row: {
          ease_of_use: string | null
          id: string | null
          improvement_suggestions: string | null
          lesson_id: string | null
          lesson_quality: string | null
          minutes_saved: number | null
          nps_score: number | null
          positive_comments: string | null
          rating: number | null
          submitted_at: string | null
          ui_issues: string | null
          user_email: string | null
          user_id: string | null
          would_pay_for: string | null
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
      guardrail_violation_summary: {
        Row: {
          latest_violation: string | null
          theology_profile_id: string | null
          theology_profile_name: string | null
          total_terms_violated: number | null
          total_violations: number | null
          unreviewed_count: number | null
        }
        Relationships: []
      }
      production_feedback_view: {
        Row: {
          age_appropriateness: boolean | null
          comments: string | null
          has_issue: boolean | null
          id: string | null
          issue_details: string | null
          lesson_id: string | null
          lesson_quality: string | null
          rating: number | null
          submitted_at: string | null
          theological_accuracy: string | null
          used_in_class: boolean | null
          user_email: string | null
          user_id: string | null
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
      user_parable_usage: {
        Row: {
          last_used: string | null
          usage_count: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      adopt_parent_focus: {
        Args: { p_child_org_id: string; p_parent_focus_id: string }
        Returns: string
      }
      allocate_monthly_credits: { Args: never; Returns: undefined }
      bulk_extend_trials: {
        Args: { p_extend_mode?: string; p_new_expiration: string }
        Returns: {
          affected_count: number
          new_expiration: string
        }[]
      }
      bulk_revoke_trials: {
        Args: never
        Returns: {
          affected_count: number
        }[]
      }
      check_devotional_limit: {
        Args: { p_user_id: string }
        Returns: {
          can_generate: boolean
          devotionals_limit: number
          devotionals_used: number
          period_end: string
          period_start: string
        }[]
      }
      check_lesson_limit: {
        Args: { p_user_id: string }
        Returns: {
          billing_interval: string
          can_generate: boolean
          includes_teaser: boolean
          lessons_limit: number
          lessons_used: number
          reset_date: string
          sections_allowed: number[]
          tier: string
          upgrade_needed: boolean
        }[]
      }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      debug_admin_check: {
        Args: never
        Returns: {
          result: string
          step: string
        }[]
      }
      deduct_credits: {
        Args: {
          p_amount: number
          p_reference_id?: string
          p_reference_type?: string
          p_user_id: string
        }
        Returns: boolean
      }
      disconnect_org_from_network: { Args: { p_org_id: string }; Returns: Json }
      get_all_feedback_questions: { Args: { p_mode?: string }; Returns: Json }
      get_all_users_for_admin: {
        Args: never
        Returns: {
          created_at: string
          founder_status: string
          full_name: string
          id: string
          trial_full_lesson_granted_until: string
          user_role: string
        }[]
      }
      get_all_users_with_stats: {
        Args: never
        Returns: {
          beta_participant: boolean
          created_at: string
          email: string
          full_name: string
          id: string
          last_lesson_date: string
          lesson_count: number
        }[]
      }
      get_beta_feedback_analytics: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: Json
      }
      get_branding_config: {
        Args: { p_organization_id?: string }
        Returns: Json
      }
      get_child_org_summaries: {
        Args: { p_parent_org_id: string }
        Returns: {
          health_color: string
          health_status: string
          lessons_this_month: number
          manager_email: string
          member_count: number
          org_id: string
          org_name: string
          org_type: string
          pool_percentage: number
          pool_total: number
          pool_used: number
          subscription_status: string
          subscription_tier: string
        }[]
      }
      get_credits_balance: { Args: { p_user_id: string }; Returns: number }
      get_feedback_analytics: {
        Args: { p_end_date?: string; p_mode?: string; p_start_date?: string }
        Returns: Json
      }
      get_feedback_questions: {
        Args: { p_mode?: string }
        Returns: {
          columnName: string
          description: string
          displayOrder: number
          id: string
          label: string
          maxLength: number
          maxValue: number
          minValue: number
          options: Json
          placeholder: string
          questionKey: string
          required: boolean
          type: string
        }[]
      }
      get_focus_adoption_map: {
        Args: { p_parent_org_id: string }
        Returns: {
          child_org_id: string
          has_adopted: boolean
        }[]
      }
      get_managed_org_ids: { Args: never; Returns: string[] }
      get_parent_active_focus: {
        Args: { p_child_org_id: string }
        Returns: {
          already_adopted: boolean
          end_date: string
          focus_id: string
          focus_type: string
          notes: string
          parent_org_id: string
          parent_org_name: string
          passage: string
          start_date: string
          theme: string
        }[]
      }
      get_production_feedback_analytics: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: Json
      }
      get_trial_stats: {
        Args: never
        Returns: {
          active_trials: number
          expiring_soon: number
          no_trial: number
          total_users: number
        }[]
      }
      get_user_lessons_admin: {
        Args: { _user_id: string }
        Returns: {
          age_group: string
          bible_version: string
          created_at: string
          id: string
          original_text: string
          scripture_passage: string
          theology_profile_id: string
          title: string
          updated_at: string
        }[]
      }
      get_user_org_id: { Args: never; Returns: string }
      get_user_organization: {
        Args: { check_user_id: string }
        Returns: string
      }
      get_user_organization_id: {
        Args: { check_user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_devotional_usage: {
        Args: { p_user_id: string }
        Returns: number
      }
      increment_lesson_usage: { Args: { p_user_id: string }; Returns: boolean }
      increment_parable_usage: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      is_admin:
        | { Args: never; Returns: boolean }
        | { Args: { check_user_id: string }; Returns: boolean }
      is_ancestor_org_manager: { Args: { p_org_id: string }; Returns: boolean }
      is_org_leader: { Args: { check_org_id: string }; Returns: boolean }
      is_org_manager: { Args: { p_org_id: string }; Returns: boolean }
      is_org_member: { Args: { check_org_id: string }; Returns: boolean }
      log_security_event: {
        Args: { event_type: string; metadata?: Json; user_id?: string }
        Returns: undefined
      }
      record_anonymous_parable_usage: {
        Args: { p_parable_id: string; p_session_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "teacher" | "moderator"
      billing_interval: "month" | "year"
      subscription_status:
        | "active"
        | "canceled"
        | "past_due"
        | "trialing"
        | "incomplete"
      subscription_tier: "free" | "personal"
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
      billing_interval: ["month", "year"],
      subscription_status: [
        "active",
        "canceled",
        "past_due",
        "trialing",
        "incomplete",
      ],
      subscription_tier: ["free", "personal"],
    },
  },
} as const
