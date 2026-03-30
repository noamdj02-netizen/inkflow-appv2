/**
 * Types Database Supabase - InkFlow
 * Alignés avec le schéma SQL (tables inkflow_*).
 * Utilisables pour un client typé : createClient<Database>(...)
 */
export interface Database {
  public: {
    /** Index + intersection : satisfait `Record<string, GenericTable>` pour @supabase/supabase-js ≥ 2.95 */
    Tables: {
      [key: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
    } & {
      inkflow_studios: {
        Row: {
          id: string;
          email: string;
          name: string;
          studio_name: string;
          slug: string;
          created_at: string;
          updated_at: string;
          trial_ends_at: string | null;
          subscription_status: 'trialing' | 'active' | 'restricted' | 'canceled';
          plan_type: 'solo' | 'pro' | 'studio' | 'enterprise';
          /** Quota import CSV sync webhook ; null = illimité (plans sans plafond CRM) */
          csv_import_slots_remaining: number | null;
          /** Google Place ID — avis vitrine (Places API côté serveur uniquement) */
          google_place_id?: string | null;
          /** Google Business Profile OAuth — jamais exposé côté client */
          google_business_access_token?: string | null;
          google_business_refresh_token?: string | null;
          google_business_token_expiry?: number | null;
          google_business_location_name?: string | null;
        };
        Insert: Omit<Database['public']['Tables']['inkflow_studios']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
          trial_ends_at?: string | null;
          subscription_status?: 'trialing' | 'active' | 'restricted' | 'canceled';
          plan_type?: 'solo' | 'pro' | 'studio' | 'enterprise';
          csv_import_slots_remaining?: number | null;
        };
        Update: Partial<Database['public']['Tables']['inkflow_studios']['Insert']>;
        Relationships: [];
      };
      inkflow_appointments: {
        Row: {
          id: string;
          studio_id: string;
          client_id: string | null;
          client_name: string;
          client_email: string;
          client_phone: string | null;
          date: string;
          time: string;
          service: string;
          duration: number;
          price: number;
          deposit: number;
          deposit_paid: boolean;
          status: string;
          tattoo_type: string;
          flash_id: string | null;
          location: string | null;
          size: string | null;
          consent_form_signed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['inkflow_appointments']['Row'], 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['inkflow_appointments']['Insert']>;
        Relationships: [];
      };
      inkflow_clients: {
        Row: {
          id: string;
          studio_id: string;
          name: string;
          email: string;
          phone: string | null;
          total_spent: number;
          appointments_count: number;
          last_visit: string | null;
          first_visit: string;
          status: string;
          tags: string[];
          tattoos: unknown[];
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['inkflow_clients']['Row'], 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['inkflow_clients']['Insert']>;
        Relationships: [];
      };
      /** Avatar portail client — persiste hors user_metadata (OAuth Google ne peut pas l’écraser) */
      inkflow_client_portal_profiles: {
        Row: {
          user_id: string;
          portal_avatar_url: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          portal_avatar_url?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['inkflow_client_portal_profiles']['Insert']>;
        Relationships: [];
      };
      inkflow_flash_designs: {
        Row: {
          id: string;
          studio_id: string;
          title: string;
          description: string | null;
          image_url: string | null;
          price: number;
          deposit_amount: number;
          available: boolean;
          reserved: boolean;
          category: string | null;
          size: string;
          placement: string[];
          estimated_duration: number;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['inkflow_flash_designs']['Row'], 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['inkflow_flash_designs']['Insert']>;
        Relationships: [];
      };
      inkflow_notifications: {
        Row: {
          id: string;
          studio_id: string;
          type: string;
          title: string;
          message: string;
          read: boolean;
          action_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['inkflow_notifications']['Row'], 'created_at'> & { created_at?: string };
        Update: Partial<Database['public']['Tables']['inkflow_notifications']['Insert']>;
        Relationships: [];
      };
      inkflow_vitrine_data: {
        Row: {
          studio_id: string;
          data: Record<string, unknown>;
          updated_at: string;
        };
        Insert: { studio_id: string; data: Record<string, unknown>; updated_at?: string };
        Update: Partial<Database['public']['Tables']['inkflow_vitrine_data']['Insert']>;
        Relationships: [];
      };
      inkflow_widgets: {
        Row: {
          studio_id: string;
          widgets: unknown[];
          widget_order: string[];
          updated_at: string;
        };
        Insert: { studio_id: string; widgets: unknown[]; widget_order?: string[]; updated_at?: string };
        Update: Partial<Database['public']['Tables']['inkflow_widgets']['Insert']>;
        Relationships: [];
      };
      inkflow_bookings: {
        Row: {
          id: string;
          studio_id: string;
          client_name: string;
          client_email: string;
          description: string;
          requested_date: string;
          requested_time: string | null;
          status: string;
          reference_images: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['inkflow_bookings']['Row'], 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string; reference_images?: string[] };
        Update: Partial<Database['public']['Tables']['inkflow_bookings']['Insert']>;
        Relationships: [];
      };
      inkflow_user_settings: {
        Row: {
          studio_id: string;
          onboarding_step: number;
          onboarding_dismissed: boolean;
          updated_at: string | null;
        };
        Insert: { studio_id: string; onboarding_step?: number; onboarding_dismissed?: boolean; updated_at?: string };
        Update: Partial<Database['public']['Tables']['inkflow_user_settings']['Insert']>;
        Relationships: [];
      };
      inkflow_push_subscriptions: {
        Row: {
          id: string;
          studio_id: string;
          endpoint: string;
          keys_p256dh: string;
          keys_auth: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['inkflow_push_subscriptions']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['inkflow_push_subscriptions']['Insert']>;
        Relationships: [];
      };
      inkflow_followups: {
        Row: {
          id: string;
          studio_id: string;
          appointment_id: string;
          wave: 'j1' | 'j7' | 'j30';
          client_email: string;
          sent_at: string;
        };
        Insert: Omit<Database['public']['Tables']['inkflow_followups']['Row'], 'id' | 'sent_at'> & {
          id?: string;
          sent_at?: string;
        };
        Update: Partial<Database['public']['Tables']['inkflow_followups']['Insert']>;
        Relationships: [];
      };
      inkflow_health_forms: {
        Row: {
          id: string;
          studio_id: string;
          booking_id: string | null;
          appointment_id: string | null;
          client_name: string;
          client_email: string;
          client_birthdate: string | null;
          client_instagram: string | null;
          health_data: {
            allergies?: boolean;
            allergiesDetails?: string | null;
            grossesse?: boolean;
            allaitement?: boolean;
            maladiesInfectieuses?: boolean;
            infectionsVirales?: boolean;
            troubleCicatriciel?: boolean;
            diabete?: boolean;
            antibiotiques?: boolean;
            antiInflammatoires?: boolean;
            steroides?: boolean;
          };
          signature_text: string | null;
          certified_accurate: boolean;
          certified_at: string | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['inkflow_health_forms']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['inkflow_health_forms']['Insert']>;
      };
      inkflow_messages: {
        Row: {
          id: string;
          studio_id: string;
          thread_id: string;
          sender_type: string;
          sender_name: string;
          content: string;
          read: boolean;
          created_at: string;
        };
        /** Pas de self-référence Database[...] ici (sinon résolution circulaire → never) */
        Insert: {
          id: string;
          studio_id: string;
          thread_id: string;
          sender_type?: string;
          sender_name: string;
          content: string;
          read?: boolean;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          studio_id: string;
          thread_id: string;
          sender_type: string;
          sender_name: string;
          content: string;
          read: boolean;
          created_at: string;
        }>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      get_studio_public_by_slug: {
        Args: { p_slug: string };
        Returns: { id: string; name: string; studio_name: string; slug: string }[];
      };
    };
  };
}
