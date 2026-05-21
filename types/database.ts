export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1';
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      artist_payment_settings: {
        Row: {
          artist_id: string;
          cancellation_hours: number | null;
          cancellation_policy_enabled: boolean | null;
          created_at: string | null;
          deposit_fixed_amount: number | null;
          deposit_percentage: number | null;
          deposit_type: string;
          id: string;
          is_deposit_non_refundable: boolean | null;
          stripe_account_id: string | null;
          stripe_connected_at: string | null;
          tax_enabled: boolean | null;
          tax_rate: number | null;
          updated_at: string | null;
        };
        Insert: {
          artist_id: string;
          cancellation_hours?: number | null;
          cancellation_policy_enabled?: boolean | null;
          created_at?: string | null;
          deposit_fixed_amount?: number | null;
          deposit_percentage?: number | null;
          deposit_type?: string;
          id?: string;
          is_deposit_non_refundable?: boolean | null;
          stripe_account_id?: string | null;
          stripe_connected_at?: string | null;
          tax_enabled?: boolean | null;
          tax_rate?: number | null;
          updated_at?: string | null;
        };
        Update: {
          artist_id?: string;
          cancellation_hours?: number | null;
          cancellation_policy_enabled?: boolean | null;
          created_at?: string | null;
          deposit_fixed_amount?: number | null;
          deposit_percentage?: number | null;
          deposit_type?: string;
          id?: string;
          is_deposit_non_refundable?: boolean | null;
          stripe_account_id?: string | null;
          stripe_connected_at?: string | null;
          tax_enabled?: boolean | null;
          tax_rate?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      artists: {
        Row: {
          accent_color: string | null;
          avatar_url: string | null;
          bio_instagram: string | null;
          created_at: string | null;
          deposit_percentage: number | null;
          email: string;
          id: string;
          nom_studio: string;
          pre_tattoo_instructions: string | null;
          slug_profil: string;
          stripe_account_id: string | null;
          stripe_connected: boolean | null;
          stripe_onboarding_complete: boolean | null;
          theme_accent_hex: string | null;
          theme_color: string | null;
          theme_secondary_hex: string | null;
          updated_at: string | null;
        };
        Insert: {
          accent_color?: string | null;
          avatar_url?: string | null;
          bio_instagram?: string | null;
          created_at?: string | null;
          deposit_percentage?: number | null;
          email: string;
          id?: string;
          nom_studio: string;
          pre_tattoo_instructions?: string | null;
          slug_profil: string;
          stripe_account_id?: string | null;
          stripe_connected?: boolean | null;
          stripe_onboarding_complete?: boolean | null;
          theme_accent_hex?: string | null;
          theme_color?: string | null;
          theme_secondary_hex?: string | null;
          updated_at?: string | null;
        };
        Update: {
          accent_color?: string | null;
          avatar_url?: string | null;
          bio_instagram?: string | null;
          created_at?: string | null;
          deposit_percentage?: number | null;
          email?: string;
          id?: string;
          nom_studio?: string;
          pre_tattoo_instructions?: string | null;
          slug_profil?: string;
          stripe_account_id?: string | null;
          stripe_connected?: boolean | null;
          stripe_onboarding_complete?: boolean | null;
          theme_accent_hex?: string | null;
          theme_color?: string | null;
          theme_secondary_hex?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          artist_id: string;
          client_email: string;
          client_name: string | null;
          client_phone: string | null;
          created_at: string | null;
          date_debut: string;
          date_fin: string;
          deposit_amount: number;
          deposit_percentage: number;
          duree_minutes: number;
          flash_id: string | null;
          id: string;
          prix_total: number;
          project_id: string | null;
          reminder_sent_at: string | null;
          reminder_sms_sent: boolean | null;
          statut_booking: string | null;
          statut_paiement: string | null;
          stripe_deposit_intent_id: string | null;
          stripe_payment_intent_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          artist_id: string;
          client_email: string;
          client_name?: string | null;
          client_phone?: string | null;
          created_at?: string | null;
          date_debut: string;
          date_fin: string;
          deposit_amount: number;
          deposit_percentage: number;
          duree_minutes: number;
          flash_id?: string | null;
          id?: string;
          prix_total: number;
          project_id?: string | null;
          reminder_sent_at?: string | null;
          reminder_sms_sent?: boolean | null;
          statut_booking?: string | null;
          statut_paiement?: string | null;
          stripe_deposit_intent_id?: string | null;
          stripe_payment_intent_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          artist_id?: string;
          client_email?: string;
          client_name?: string | null;
          client_phone?: string | null;
          created_at?: string | null;
          date_debut?: string;
          date_fin?: string;
          deposit_amount?: number;
          deposit_percentage?: number;
          duree_minutes?: number;
          flash_id?: string | null;
          id?: string;
          prix_total?: number;
          project_id?: string | null;
          reminder_sent_at?: string | null;
          reminder_sms_sent?: boolean | null;
          statut_booking?: string | null;
          statut_paiement?: string | null;
          stripe_deposit_intent_id?: string | null;
          stripe_payment_intent_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'bookings_artist_id_fkey';
            columns: ['artist_id'];
            isOneToOne: false;
            referencedRelation: 'artists';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_flash_id_fkey';
            columns: ['flash_id'];
            isOneToOne: false;
            referencedRelation: 'flashs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      care_templates: {
        Row: {
          artist_id: string;
          content: string;
          created_at: string | null;
          id: string;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          artist_id: string;
          content: string;
          created_at?: string | null;
          id?: string;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          artist_id?: string;
          content?: string;
          created_at?: string | null;
          id?: string;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'care_templates_artist_id_fkey';
            columns: ['artist_id'];
            isOneToOne: false;
            referencedRelation: 'artists';
            referencedColumns: ['id'];
          },
        ];
      };
      customers: {
        Row: {
          created_at: string | null;
          email: string;
          id: string;
          name: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          id?: string;
          name?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          id?: string;
          name?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      daily_briefs: {
        Row: {
          alerts: Json;
          bookings: number;
          created_at: string;
          date: string;
          ig_profile_views: number | null;
          ig_reach: number | null;
          new_studios: number;
          pending_projects: number;
          revenue: number;
          unpaid_deposits: number;
          updated_at: string;
        };
        Insert: {
          alerts?: Json;
          bookings?: number;
          created_at?: string;
          date: string;
          ig_profile_views?: number | null;
          ig_reach?: number | null;
          new_studios?: number;
          pending_projects?: number;
          revenue?: number;
          unpaid_deposits?: number;
          updated_at?: string;
        };
        Update: {
          alerts?: Json;
          bookings?: number;
          created_at?: string;
          date?: string;
          ig_profile_views?: number | null;
          ig_reach?: number | null;
          new_studios?: number;
          pending_projects?: number;
          revenue?: number;
          unpaid_deposits?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      email_suppressions: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          reason: string | null;
          source: string | null;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          reason?: string | null;
          source?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          reason?: string | null;
          source?: string | null;
        };
        Relationships: [];
      };
      flashs: {
        Row: {
          artist_id: string;
          created_at: string | null;
          deposit_amount: number | null;
          duree_minutes: number;
          id: string;
          image_url: string;
          prix: number;
          statut: string | null;
          stock_current: number | null;
          stock_limit: number | null;
          style: string | null;
          taille_cm: string | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          artist_id: string;
          created_at?: string | null;
          deposit_amount?: number | null;
          duree_minutes: number;
          id?: string;
          image_url: string;
          prix: number;
          statut?: string | null;
          stock_current?: number | null;
          stock_limit?: number | null;
          style?: string | null;
          taille_cm?: string | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          artist_id?: string;
          created_at?: string | null;
          deposit_amount?: number | null;
          duree_minutes?: number;
          id?: string;
          image_url?: string;
          prix?: number;
          statut?: string | null;
          stock_current?: number | null;
          stock_limit?: number | null;
          style?: string | null;
          taille_cm?: string | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'flashs_artist_id_fkey';
            columns: ['artist_id'];
            isOneToOne: false;
            referencedRelation: 'artists';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_appointment_costs: {
        Row: {
          amount_cents: number;
          appointment_id: string | null;
          created_at: string;
          id: string;
          label: string;
          studio_id: string;
        };
        Insert: {
          amount_cents: number;
          appointment_id?: string | null;
          created_at?: string;
          id?: string;
          label?: string;
          studio_id: string;
        };
        Update: {
          amount_cents?: number;
          appointment_id?: string | null;
          created_at?: string;
          id?: string;
          label?: string;
          studio_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_appointment_costs_appointment_id_fkey';
            columns: ['appointment_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_appointments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inkflow_appointment_costs_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_appointment_costs_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_appointments: {
        Row: {
          apple_event_uid: string | null;
          balance_paid_at: string | null;
          balance_reminder_sent_at: string | null;
          calendar_synced_at: string | null;
          client_email: string;
          client_id: string | null;
          client_name: string;
          client_phone: string | null;
          closeout_push_sent_at: string | null;
          consent_form_signed: boolean | null;
          created_at: string | null;
          date: string;
          deposit: number | null;
          deposit_paid: boolean | null;
          duration: number | null;
          feedback_email_sent_at: string | null;
          flash_id: string | null;
          google_event_id: string | null;
          id: string;
          location: string | null;
          loyalty_j1_sent_at: string | null;
          loyalty_j30_sent_at: string | null;
          loyalty_j7_sent_at: string | null;
          post_slot_nudge_sent_at: string | null;
          price: number | null;
          project_request_id: string | null;
          reminder_sent_at: string | null;
          deposit_reminder_followup_sent_at: string | null;
          service: string;
          size: string | null;
          status: string | null;
          studio_id: string;
          tattoo_type: string | null;
          time: string;
          updated_at: string | null;
        };
        Insert: {
          apple_event_uid?: string | null;
          balance_paid_at?: string | null;
          balance_reminder_sent_at?: string | null;
          calendar_synced_at?: string | null;
          client_email: string;
          client_id?: string | null;
          client_name: string;
          client_phone?: string | null;
          closeout_push_sent_at?: string | null;
          consent_form_signed?: boolean | null;
          created_at?: string | null;
          date: string;
          deposit?: number | null;
          deposit_paid?: boolean | null;
          duration?: number | null;
          feedback_email_sent_at?: string | null;
          flash_id?: string | null;
          google_event_id?: string | null;
          id: string;
          location?: string | null;
          loyalty_j1_sent_at?: string | null;
          loyalty_j30_sent_at?: string | null;
          loyalty_j7_sent_at?: string | null;
          post_slot_nudge_sent_at?: string | null;
          price?: number | null;
          project_request_id?: string | null;
          reminder_sent_at?: string | null;
          deposit_reminder_followup_sent_at?: string | null;
          service: string;
          size?: string | null;
          status?: string | null;
          studio_id: string;
          tattoo_type?: string | null;
          time: string;
          updated_at?: string | null;
        };
        Update: {
          apple_event_uid?: string | null;
          balance_paid_at?: string | null;
          balance_reminder_sent_at?: string | null;
          calendar_synced_at?: string | null;
          client_email?: string;
          client_id?: string | null;
          client_name?: string;
          client_phone?: string | null;
          closeout_push_sent_at?: string | null;
          consent_form_signed?: boolean | null;
          created_at?: string | null;
          date?: string;
          deposit?: number | null;
          deposit_paid?: boolean | null;
          duration?: number | null;
          feedback_email_sent_at?: string | null;
          flash_id?: string | null;
          google_event_id?: string | null;
          id?: string;
          location?: string | null;
          loyalty_j1_sent_at?: string | null;
          loyalty_j30_sent_at?: string | null;
          loyalty_j7_sent_at?: string | null;
          post_slot_nudge_sent_at?: string | null;
          price?: number | null;
          project_request_id?: string | null;
          reminder_sent_at?: string | null;
          deposit_reminder_followup_sent_at?: string | null;
          service?: string;
          size?: string | null;
          status?: string | null;
          studio_id?: string;
          tattoo_type?: string | null;
          time?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_appointments_client_id_fkey';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_clients';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inkflow_appointments_project_request_id_fkey';
            columns: ['project_request_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_project_requests';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inkflow_appointments_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_appointments_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_artist_accounts: {
        Row: {
          active: boolean | null;
          auth_user_id: string | null;
          avatar: string | null;
          created_at: string | null;
          email: string;
          id: string;
          name: string;
          permissions: Json | null;
          role: string | null;
          specialties: Json | null;
          studio_id: string;
          updated_at: string | null;
        };
        Insert: {
          active?: boolean | null;
          auth_user_id?: string | null;
          avatar?: string | null;
          created_at?: string | null;
          email: string;
          id: string;
          name: string;
          permissions?: Json | null;
          role?: string | null;
          specialties?: Json | null;
          studio_id: string;
          updated_at?: string | null;
        };
        Update: {
          active?: boolean | null;
          auth_user_id?: string | null;
          avatar?: string | null;
          created_at?: string | null;
          email?: string;
          id?: string;
          name?: string;
          permissions?: Json | null;
          role?: string | null;
          specialties?: Json | null;
          studio_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_artist_accounts_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_artist_accounts_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_artists: {
        Row: {
          available_now: boolean;
          avatar_url: string | null;
          bio: string | null;
          created_at: string | null;
          id: string;
          instagram_url: string | null;
          is_active: boolean | null;
          location_lat: number | null;
          location_lng: number | null;
          name: string;
          rating: number | null;
          service_radius_km: number;
          slug: string;
          studio_id: string;
          styles: string[] | null;
          tattoos_count: number | null;
          updated_at: string | null;
          years_exp: number | null;
        };
        Insert: {
          available_now?: boolean;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
          id?: string;
          instagram_url?: string | null;
          is_active?: boolean | null;
          location_lat?: number | null;
          location_lng?: number | null;
          name: string;
          rating?: number | null;
          service_radius_km?: number;
          slug: string;
          studio_id: string;
          styles?: string[] | null;
          tattoos_count?: number | null;
          updated_at?: string | null;
          years_exp?: number | null;
        };
        Update: {
          available_now?: boolean;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
          id?: string;
          instagram_url?: string | null;
          is_active?: boolean | null;
          location_lat?: number | null;
          location_lng?: number | null;
          name?: string;
          rating?: number | null;
          service_radius_km?: number;
          slug?: string;
          studio_id?: string;
          styles?: string[] | null;
          tattoos_count?: number | null;
          updated_at?: string | null;
          years_exp?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_artists_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_artists_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_bookings: {
        Row: {
          client_avatar_url: string | null;
          client_email: string;
          client_name: string;
          client_phone: string | null;
          client_recap_token: string | null;
          created_at: string | null;
          description: string;
          id: string;
          recap_appointment_id: string | null;
          reference_images: Json | null;
          requested_date: string;
          requested_time: string | null;
          sms_confirmation_opt_in: boolean;
          status: string;
          studio_id: string;
          updated_at: string | null;
        };
        Insert: {
          client_avatar_url?: string | null;
          client_email: string;
          client_name: string;
          client_phone?: string | null;
          client_recap_token?: string | null;
          created_at?: string | null;
          description: string;
          id: string;
          recap_appointment_id?: string | null;
          reference_images?: Json | null;
          requested_date: string;
          requested_time?: string | null;
          sms_confirmation_opt_in?: boolean;
          status?: string;
          studio_id: string;
          updated_at?: string | null;
        };
        Update: {
          client_avatar_url?: string | null;
          client_email?: string;
          client_name?: string;
          client_phone?: string | null;
          client_recap_token?: string | null;
          created_at?: string | null;
          description?: string;
          id?: string;
          recap_appointment_id?: string | null;
          reference_images?: Json | null;
          requested_date?: string;
          requested_time?: string | null;
          sms_confirmation_opt_in?: boolean;
          status?: string;
          studio_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_bookings_recap_appointment_id_fkey';
            columns: ['recap_appointment_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_appointments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inkflow_bookings_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_bookings_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_calendar_integrations: {
        Row: {
          access_token: string | null;
          app_password: string | null;
          apple_id: string | null;
          auto_sync: boolean | null;
          calendar_url: string | null;
          channel_id: string | null;
          created_at: string | null;
          expiry_date: number | null;
          id: string;
          last_synced_at: string | null;
          provider: string;
          refresh_token: string | null;
          send_invites: boolean | null;
          studio_id: string;
          sync_direction: string | null;
          updated_at: string | null;
        };
        Insert: {
          access_token?: string | null;
          app_password?: string | null;
          apple_id?: string | null;
          auto_sync?: boolean | null;
          calendar_url?: string | null;
          channel_id?: string | null;
          created_at?: string | null;
          expiry_date?: number | null;
          id?: string;
          last_synced_at?: string | null;
          provider: string;
          refresh_token?: string | null;
          send_invites?: boolean | null;
          studio_id: string;
          sync_direction?: string | null;
          updated_at?: string | null;
        };
        Update: {
          access_token?: string | null;
          app_password?: string | null;
          apple_id?: string | null;
          auto_sync?: boolean | null;
          calendar_url?: string | null;
          channel_id?: string | null;
          created_at?: string | null;
          expiry_date?: number | null;
          id?: string;
          last_synced_at?: string | null;
          provider?: string;
          refresh_token?: string | null;
          send_invites?: boolean | null;
          studio_id?: string;
          sync_direction?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      inkflow_care_templates: {
        Row: {
          studio_id: string;
          templates: Json;
          updated_at: string | null;
        };
        Insert: {
          studio_id: string;
          templates?: Json;
          updated_at?: string | null;
        };
        Update: {
          studio_id?: string;
          templates?: Json;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_care_templates_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: true;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_care_templates_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: true;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_city_pages: {
        Row: {
          artist_count: number | null;
          created_at: string | null;
          department: string | null;
          hero_image_url: string | null;
          is_active: boolean | null;
          lat: number | null;
          lng: number | null;
          meta_description: string | null;
          name: string;
          region: string | null;
          slug: string;
        };
        Insert: {
          artist_count?: number | null;
          created_at?: string | null;
          department?: string | null;
          hero_image_url?: string | null;
          is_active?: boolean | null;
          lat?: number | null;
          lng?: number | null;
          meta_description?: string | null;
          name: string;
          region?: string | null;
          slug: string;
        };
        Update: {
          artist_count?: number | null;
          created_at?: string | null;
          department?: string | null;
          hero_image_url?: string | null;
          is_active?: boolean | null;
          lat?: number | null;
          lng?: number | null;
          meta_description?: string | null;
          name?: string;
          region?: string | null;
          slug?: string;
        };
        Relationships: [];
      };
      inkflow_client_artist_follows: {
        Row: {
          artist_id: string;
          client_email: string;
          created_at: string | null;
          id: string;
        };
        Insert: {
          artist_id: string;
          client_email: string;
          created_at?: string | null;
          id?: string;
        };
        Update: {
          artist_id?: string;
          client_email?: string;
          created_at?: string | null;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_client_artist_follows_artist_id_fkey';
            columns: ['artist_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_artists';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_client_codes: {
        Row: {
          code: string;
          created_at: string | null;
          email: string;
        };
        Insert: {
          code: string;
          created_at?: string | null;
          email: string;
        };
        Update: {
          code?: string;
          created_at?: string | null;
          email?: string;
        };
        Relationships: [];
      };
      inkflow_client_favorites: {
        Row: {
          client_email: string;
          created_at: string | null;
          flash_id: string;
          id: string;
        };
        Insert: {
          client_email: string;
          created_at?: string | null;
          flash_id: string;
          id?: string;
        };
        Update: {
          client_email?: string;
          created_at?: string | null;
          flash_id?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_client_favorites_flash_id_fkey';
            columns: ['flash_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_flash_designs';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_client_notes: {
        Row: {
          client_id: string;
          notes: string | null;
          updated_at: string | null;
        };
        Insert: {
          client_id: string;
          notes?: string | null;
          updated_at?: string | null;
        };
        Update: {
          client_id?: string;
          notes?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_client_notes_client_id_fkey';
            columns: ['client_id'];
            isOneToOne: true;
            referencedRelation: 'inkflow_clients';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_client_portal_profiles: {
        Row: {
          health_profile: Json | null;
          health_profile_updated_at: string | null;
          portal_avatar_url: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          health_profile?: Json | null;
          health_profile_updated_at?: string | null;
          portal_avatar_url?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          health_profile?: Json | null;
          health_profile_updated_at?: string | null;
          portal_avatar_url?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      inkflow_client_referrals: {
        Row: {
          completed_at: string | null;
          created_at: string | null;
          discount_applied: boolean | null;
          id: string;
          referee_email: string;
          referrer_credited: boolean | null;
          referrer_email: string;
          status: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          discount_applied?: boolean | null;
          id?: string;
          referee_email: string;
          referrer_credited?: boolean | null;
          referrer_email: string;
          status?: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          discount_applied?: boolean | null;
          id?: string;
          referee_email?: string;
          referrer_credited?: boolean | null;
          referrer_email?: string;
          status?: string;
        };
        Relationships: [];
      };
      inkflow_client_stamp_state: {
        Row: {
          client_id: string;
          id: string;
          stamps_in_cycle: number;
          studio_id: string;
          total_completed_tattoos: number;
          updated_at: string;
        };
        Insert: {
          client_id: string;
          id?: string;
          stamps_in_cycle?: number;
          studio_id: string;
          total_completed_tattoos?: number;
          updated_at?: string;
        };
        Update: {
          client_id?: string;
          id?: string;
          stamps_in_cycle?: number;
          studio_id?: string;
          total_completed_tattoos?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_client_stamp_state_client_id_fkey';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_clients';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inkflow_client_stamp_state_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_client_stamp_state_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_client_studio_favorites: {
        Row: {
          client_email: string;
          created_at: string | null;
          id: string;
          studio_id: string;
        };
        Insert: {
          client_email: string;
          created_at?: string | null;
          id?: string;
          studio_id: string;
        };
        Update: {
          client_email?: string;
          created_at?: string | null;
          id?: string;
          studio_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_client_studio_favorites_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_client_studio_favorites_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_client_wallets: {
        Row: {
          balance_cents: number;
          email: string;
          updated_at: string | null;
        };
        Insert: {
          balance_cents?: number;
          email: string;
          updated_at?: string | null;
        };
        Update: {
          balance_cents?: number;
          email?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      inkflow_clients: {
        Row: {
          appointments_count: number | null;
          avatar_url: string | null;
          created_at: string | null;
          email: string;
          first_visit: string;
          health_profile_snapshot: Json | null;
          id: string;
          last_visit: string | null;
          name: string;
          notes: string | null;
          phone: string | null;
          portal_user_id: string | null;
          status: string | null;
          studio_id: string;
          tags: Json | null;
          tattoos: Json | null;
          total_spent: number | null;
          updated_at: string | null;
        };
        Insert: {
          appointments_count?: number | null;
          avatar_url?: string | null;
          created_at?: string | null;
          email: string;
          first_visit: string;
          health_profile_snapshot?: Json | null;
          id: string;
          last_visit?: string | null;
          name: string;
          notes?: string | null;
          phone?: string | null;
          portal_user_id?: string | null;
          status?: string | null;
          studio_id: string;
          tags?: Json | null;
          tattoos?: Json | null;
          total_spent?: number | null;
          updated_at?: string | null;
        };
        Update: {
          appointments_count?: number | null;
          avatar_url?: string | null;
          created_at?: string | null;
          email?: string;
          first_visit?: string;
          health_profile_snapshot?: Json | null;
          id?: string;
          last_visit?: string | null;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          portal_user_id?: string | null;
          status?: string | null;
          studio_id?: string;
          tags?: Json | null;
          tattoos?: Json | null;
          total_spent?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_clients_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_clients_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_consent_forms: {
        Row: {
          appointment_id: string | null;
          client_email: string;
          client_ip: string | null;
          client_name: string;
          consent_outreach_channel: string | null;
          consent_outreach_sent_at: string | null;
          created_at: string | null;
          filled_template_text: string | null;
          id: string;
          signature_data: string | null;
          signed_at: string | null;
          studio_id: string;
          template: string;
        };
        Insert: {
          appointment_id?: string | null;
          client_email: string;
          client_ip?: string | null;
          client_name: string;
          consent_outreach_channel?: string | null;
          consent_outreach_sent_at?: string | null;
          created_at?: string | null;
          filled_template_text?: string | null;
          id: string;
          signature_data?: string | null;
          signed_at?: string | null;
          studio_id: string;
          template: string;
        };
        Update: {
          appointment_id?: string | null;
          client_email?: string;
          client_ip?: string | null;
          client_name?: string;
          consent_outreach_channel?: string | null;
          consent_outreach_sent_at?: string | null;
          created_at?: string | null;
          filled_template_text?: string | null;
          id?: string;
          signature_data?: string | null;
          signed_at?: string | null;
          studio_id?: string;
          template?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_consent_forms_appointment_id_fkey';
            columns: ['appointment_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_appointments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inkflow_consent_forms_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_consent_forms_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_consumable_lots: {
        Row: {
          appointment_id: string | null;
          client_id: string | null;
          created_at: string;
          expiry_date: string | null;
          id: string;
          lot_number: string;
          product_label: string | null;
          raw_barcode: string | null;
          studio_id: string;
          supplier_name: string | null;
        };
        Insert: {
          appointment_id?: string | null;
          client_id?: string | null;
          created_at?: string;
          expiry_date?: string | null;
          id?: string;
          lot_number: string;
          product_label?: string | null;
          raw_barcode?: string | null;
          studio_id: string;
          supplier_name?: string | null;
        };
        Update: {
          appointment_id?: string | null;
          client_id?: string | null;
          created_at?: string;
          expiry_date?: string | null;
          id?: string;
          lot_number?: string;
          product_label?: string | null;
          raw_barcode?: string | null;
          studio_id?: string;
          supplier_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_consumable_lots_appointment_id_fkey';
            columns: ['appointment_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_appointments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inkflow_consumable_lots_client_id_fkey';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_clients';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inkflow_consumable_lots_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_consumable_lots_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_consumable_prices: {
        Row: {
          created_at: string;
          id: string;
          notes: string | null;
          pack_size: number;
          price_cents: number;
          product_id: string;
          studio_id: string;
          supplier_id: string;
          valid_from: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          notes?: string | null;
          pack_size?: number;
          price_cents: number;
          product_id: string;
          studio_id: string;
          supplier_id: string;
          valid_from?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          notes?: string | null;
          pack_size?: number;
          price_cents?: number;
          product_id?: string;
          studio_id?: string;
          supplier_id?: string;
          valid_from?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_consumable_prices_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_consumable_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inkflow_consumable_prices_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_consumable_prices_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inkflow_consumable_prices_supplier_id_fkey';
            columns: ['supplier_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_consumable_suppliers';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_consumable_products: {
        Row: {
          brand: string | null;
          category: string;
          created_at: string;
          id: string;
          name: string;
          qty_on_hand: number;
          sku: string | null;
          studio_id: string;
          unit: string;
          updated_at: string;
        };
        Insert: {
          brand?: string | null;
          category?: string;
          created_at?: string;
          id?: string;
          name: string;
          qty_on_hand?: number;
          sku?: string | null;
          studio_id: string;
          unit?: string;
          updated_at?: string;
        };
        Update: {
          brand?: string | null;
          category?: string;
          created_at?: string;
          id?: string;
          name?: string;
          qty_on_hand?: number;
          sku?: string | null;
          studio_id?: string;
          unit?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_consumable_products_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_consumable_products_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_consumable_suppliers: {
        Row: {
          created_at: string;
          default_shipping_fee_cents: number;
          free_shipping_threshold_cents: number | null;
          id: string;
          name: string;
          studio_id: string;
          website: string | null;
        };
        Insert: {
          created_at?: string;
          default_shipping_fee_cents?: number;
          free_shipping_threshold_cents?: number | null;
          id?: string;
          name: string;
          studio_id: string;
          website?: string | null;
        };
        Update: {
          created_at?: string;
          default_shipping_fee_cents?: number;
          free_shipping_threshold_cents?: number | null;
          id?: string;
          name?: string;
          studio_id?: string;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_consumable_suppliers_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_consumable_suppliers_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_fiscal_checklist: {
        Row: {
          checked: boolean;
          checked_at: string | null;
          created_at: string;
          id: string;
          item_key: string;
          month: string;
          studio_id: string;
        };
        Insert: {
          checked?: boolean;
          checked_at?: string | null;
          created_at?: string;
          id?: string;
          item_key: string;
          month: string;
          studio_id: string;
        };
        Update: {
          checked?: boolean;
          checked_at?: string | null;
          created_at?: string;
          id?: string;
          item_key?: string;
          month?: string;
          studio_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_fiscal_checklist_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_fiscal_checklist_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_flash_designs: {
        Row: {
          artist_id: string | null;
          available: boolean | null;
          category: string | null;
          created_at: string | null;
          deposit_amount: number | null;
          description: string | null;
          display_order: number;
          estimated_duration: number | null;
          featured: boolean;
          id: string;
          image_url: string | null;
          placement: Json | null;
          price: number | null;
          reserved: boolean | null;
          size: string | null;
          slug: string | null;
          stock_current: number;
          studio_id: string;
          tags: Json | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          artist_id?: string | null;
          available?: boolean | null;
          category?: string | null;
          created_at?: string | null;
          deposit_amount?: number | null;
          description?: string | null;
          display_order?: number;
          estimated_duration?: number | null;
          featured?: boolean;
          id: string;
          image_url?: string | null;
          placement?: Json | null;
          price?: number | null;
          reserved?: boolean | null;
          size?: string | null;
          slug?: string | null;
          stock_current?: number;
          studio_id: string;
          tags?: Json | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          artist_id?: string | null;
          available?: boolean | null;
          category?: string | null;
          created_at?: string | null;
          deposit_amount?: number | null;
          description?: string | null;
          display_order?: number;
          estimated_duration?: number | null;
          featured?: boolean;
          id?: string;
          image_url?: string | null;
          placement?: Json | null;
          price?: number | null;
          reserved?: boolean | null;
          size?: string | null;
          slug?: string | null;
          stock_current?: number;
          studio_id?: string;
          tags?: Json | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_flash_designs_artist_id_fkey';
            columns: ['artist_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_artists';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inkflow_flash_designs_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_flash_designs_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_followups: {
        Row: {
          appointment_id: string;
          client_email: string;
          id: string;
          sent_at: string;
          studio_id: string;
          wave: string;
        };
        Insert: {
          appointment_id: string;
          client_email: string;
          id?: string;
          sent_at?: string;
          studio_id: string;
          wave: string;
        };
        Update: {
          appointment_id?: string;
          client_email?: string;
          id?: string;
          sent_at?: string;
          studio_id?: string;
          wave?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_followups_appointment_id_fkey';
            columns: ['appointment_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_appointments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inkflow_followups_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_followups_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_health_forms: {
        Row: {
          appointment_id: string | null;
          booking_id: string | null;
          certified_accurate: boolean;
          certified_at: string | null;
          client_birthdate: string | null;
          client_email: string;
          client_instagram: string | null;
          client_name: string;
          created_at: string;
          health_data: Json;
          id: string;
          ip_address: string | null;
          signature_text: string | null;
          studio_id: string;
          updated_at: string;
          user_agent: string | null;
        };
        Insert: {
          appointment_id?: string | null;
          booking_id?: string | null;
          certified_accurate?: boolean;
          certified_at?: string | null;
          client_birthdate?: string | null;
          client_email: string;
          client_instagram?: string | null;
          client_name: string;
          created_at?: string;
          health_data?: Json;
          id?: string;
          ip_address?: string | null;
          signature_text?: string | null;
          studio_id: string;
          updated_at?: string;
          user_agent?: string | null;
        };
        Update: {
          appointment_id?: string | null;
          booking_id?: string | null;
          certified_accurate?: boolean;
          certified_at?: string | null;
          client_birthdate?: string | null;
          client_email?: string;
          client_instagram?: string | null;
          client_name?: string;
          created_at?: string;
          health_data?: Json;
          id?: string;
          ip_address?: string | null;
          signature_text?: string | null;
          studio_id?: string;
          updated_at?: string;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_health_forms_appointment_id_fkey';
            columns: ['appointment_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_appointments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inkflow_health_forms_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_bookings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inkflow_health_forms_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_health_forms_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_loyalty: {
        Row: {
          client_id: string;
          created_at: string | null;
          id: string;
          points: number | null;
          referral_code: string | null;
          studio_id: string;
          tier: string | null;
          total_earned: number | null;
          total_redeemed: number | null;
          updated_at: string | null;
        };
        Insert: {
          client_id: string;
          created_at?: string | null;
          id: string;
          points?: number | null;
          referral_code?: string | null;
          studio_id: string;
          tier?: string | null;
          total_earned?: number | null;
          total_redeemed?: number | null;
          updated_at?: string | null;
        };
        Update: {
          client_id?: string;
          created_at?: string | null;
          id?: string;
          points?: number | null;
          referral_code?: string | null;
          studio_id?: string;
          tier?: string | null;
          total_earned?: number | null;
          total_redeemed?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_loyalty_client_id_fkey';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_clients';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inkflow_loyalty_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_loyalty_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_messages: {
        Row: {
          content: string;
          created_at: string | null;
          id: string;
          read: boolean | null;
          sender_name: string;
          sender_type: string;
          studio_id: string;
          thread_id: string;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          id: string;
          read?: boolean | null;
          sender_name: string;
          sender_type?: string;
          studio_id: string;
          thread_id: string;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          id?: string;
          read?: boolean | null;
          sender_name?: string;
          sender_type?: string;
          studio_id?: string;
          thread_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_messages_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_messages_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_native_device_tokens: {
        Row: {
          platform: string;
          studio_id: string | null;
          token: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          platform?: string;
          studio_id?: string | null;
          token: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          platform?: string;
          studio_id?: string | null;
          token?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_native_device_tokens_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_native_device_tokens_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_notifications: {
        Row: {
          action_url: string | null;
          created_at: string | null;
          id: string;
          message: string;
          read: boolean | null;
          studio_id: string;
          title: string;
          type: string;
        };
        Insert: {
          action_url?: string | null;
          created_at?: string | null;
          id: string;
          message: string;
          read?: boolean | null;
          studio_id: string;
          title: string;
          type: string;
        };
        Update: {
          action_url?: string | null;
          created_at?: string | null;
          id?: string;
          message?: string;
          read?: boolean | null;
          studio_id?: string;
          title?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_notifications_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_notifications_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_payment_settings: {
        Row: {
          settings: Json;
          studio_id: string;
          updated_at: string | null;
        };
        Insert: {
          settings?: Json;
          studio_id: string;
          updated_at?: string | null;
        };
        Update: {
          settings?: Json;
          studio_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_payment_settings_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: true;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_payment_settings_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: true;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_payments: {
        Row: {
          amount: number;
          appointment_id: string | null;
          client_email: string | null;
          client_name: string | null;
          created_at: string | null;
          currency: string | null;
          id: string;
          project_request_id: string | null;
          status: string;
          stripe_payment_intent: string | null;
          stripe_session_id: string | null;
          studio_id: string;
          type: string;
          updated_at: string | null;
        };
        Insert: {
          amount?: number;
          appointment_id?: string | null;
          client_email?: string | null;
          client_name?: string | null;
          created_at?: string | null;
          currency?: string | null;
          id: string;
          project_request_id?: string | null;
          status?: string;
          stripe_payment_intent?: string | null;
          stripe_session_id?: string | null;
          studio_id: string;
          type?: string;
          updated_at?: string | null;
        };
        Update: {
          amount?: number;
          appointment_id?: string | null;
          client_email?: string | null;
          client_name?: string | null;
          created_at?: string | null;
          currency?: string | null;
          id?: string;
          project_request_id?: string | null;
          status?: string;
          stripe_payment_intent?: string | null;
          stripe_session_id?: string | null;
          studio_id?: string;
          type?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_payments_appointment_id_fkey';
            columns: ['appointment_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_appointments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inkflow_payments_project_request_id_fkey';
            columns: ['project_request_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_project_requests';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inkflow_payments_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_payments_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_payment_invoices: {
        Row: {
          amount_paid_eur: number;
          appointment_id: string;
          client_id: string | null;
          created_at: string;
          deposit_eur: number | null;
          document_number: string;
          id: string;
          payment_kind: string;
          payment_reference: string | null;
          public_url: string | null;
          storage_path: string | null;
          studio_id: string;
          total_eur: number | null;
        };
        Insert: {
          amount_paid_eur?: number;
          appointment_id: string;
          client_id?: string | null;
          created_at?: string;
          deposit_eur?: number | null;
          document_number: string;
          id?: string;
          payment_kind: string;
          payment_reference?: string | null;
          public_url?: string | null;
          storage_path?: string | null;
          studio_id: string;
          total_eur?: number | null;
        };
        Update: {
          amount_paid_eur?: number;
          appointment_id?: string;
          client_id?: string | null;
          created_at?: string;
          deposit_eur?: number | null;
          document_number?: string;
          id?: string;
          payment_kind?: string;
          payment_reference?: string | null;
          public_url?: string | null;
          storage_path?: string | null;
          studio_id?: string;
          total_eur?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_payment_invoices_client_id_fkey';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_clients';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inkflow_payment_invoices_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_price_contributions: {
        Row: {
          category_slug: string;
          contributed_at: string;
          id: string;
          label_normalized: string;
          pack_size: number;
          price_cents: number;
          studio_id: string;
          supplier_label: string | null;
        };
        Insert: {
          category_slug: string;
          contributed_at?: string;
          id?: string;
          label_normalized: string;
          pack_size?: number;
          price_cents: number;
          studio_id: string;
          supplier_label?: string | null;
        };
        Update: {
          category_slug?: string;
          contributed_at?: string;
          id?: string;
          label_normalized?: string;
          pack_size?: number;
          price_cents?: number;
          studio_id?: string;
          supplier_label?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_price_contributions_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_price_contributions_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_project_requests: {
        Row: {
          artist_message: string | null;
          budget: string | null;
          client_email: string;
          client_instagram: string | null;
          client_name: string;
          created_at: string | null;
          description: string;
          estimated_size: string | null;
          id: string;
          placement: string | null;
          project_type: string;
          proposed_slot: string | null;
          reference_image_url: string | null;
          reference_images: Json | null;
          slot_expires_at: string | null;
          status: string;
          studio_id: string;
        };
        Insert: {
          artist_message?: string | null;
          budget?: string | null;
          client_email: string;
          client_instagram?: string | null;
          client_name: string;
          created_at?: string | null;
          description: string;
          estimated_size?: string | null;
          id: string;
          placement?: string | null;
          project_type?: string;
          proposed_slot?: string | null;
          reference_image_url?: string | null;
          reference_images?: Json | null;
          slot_expires_at?: string | null;
          status?: string;
          studio_id: string;
        };
        Update: {
          artist_message?: string | null;
          budget?: string | null;
          client_email?: string;
          client_instagram?: string | null;
          client_name?: string;
          created_at?: string | null;
          description?: string;
          estimated_size?: string | null;
          id?: string;
          placement?: string | null;
          project_type?: string;
          proposed_slot?: string | null;
          reference_image_url?: string | null;
          reference_images?: Json | null;
          slot_expires_at?: string | null;
          status?: string;
          studio_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_project_requests_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_project_requests_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_push_subscriptions: {
        Row: {
          created_at: string | null;
          id: string;
          studio_id: string;
          subscription: Json;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          studio_id: string;
          subscription: Json;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          studio_id?: string;
          subscription?: Json;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_push_subscriptions_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_push_subscriptions_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_referrals: {
        Row: {
          completed_at: string | null;
          created_at: string | null;
          id: string;
          referee_id: string;
          referrer_id: string;
          status: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          id?: string;
          referee_id: string;
          referrer_id: string;
          status?: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          id?: string;
          referee_id?: string;
          referrer_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_referrals_referee_id_fkey';
            columns: ['referee_id'];
            isOneToOne: false;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_referrals_referee_id_fkey';
            columns: ['referee_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inkflow_referrals_referrer_id_fkey';
            columns: ['referrer_id'];
            isOneToOne: false;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_referrals_referrer_id_fkey';
            columns: ['referrer_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_reminder_logs: {
        Row: {
          appointment_id: string;
          id: string;
          sent_at: string | null;
          type: string;
        };
        Insert: {
          appointment_id: string;
          id: string;
          sent_at?: string | null;
          type: string;
        };
        Update: {
          appointment_id?: string;
          id?: string;
          sent_at?: string | null;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_reminder_logs_appointment_id_fkey';
            columns: ['appointment_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_appointments';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_review_votes: {
        Row: {
          created_at: string | null;
          id: string;
          review_id: string;
          vote: string;
          voter_fingerprint: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          review_id: string;
          vote: string;
          voter_fingerprint: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          review_id?: string;
          vote?: string;
          voter_fingerprint?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_review_votes_review_id_fkey';
            columns: ['review_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_reviews';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_reviews: {
        Row: {
          appointment_id: string | null;
          body: string | null;
          client_email: string;
          client_email_hash: string;
          client_name: string;
          created_at: string | null;
          helpful_count: number | null;
          id: string;
          is_verified: boolean | null;
          moderated_at: string | null;
          moderation_reason: string | null;
          not_helpful_count: number | null;
          rating: number;
          reply_at: string | null;
          reply_body: string | null;
          status: string | null;
          studio_id: string;
          tattoo_photo_url: string | null;
          tattoo_style: string | null;
          updated_at: string | null;
        };
        Insert: {
          appointment_id?: string | null;
          body?: string | null;
          client_email: string;
          client_email_hash: string;
          client_name: string;
          created_at?: string | null;
          helpful_count?: number | null;
          id?: string;
          is_verified?: boolean | null;
          moderated_at?: string | null;
          moderation_reason?: string | null;
          not_helpful_count?: number | null;
          rating: number;
          reply_at?: string | null;
          reply_body?: string | null;
          status?: string | null;
          studio_id: string;
          tattoo_photo_url?: string | null;
          tattoo_style?: string | null;
          updated_at?: string | null;
        };
        Update: {
          appointment_id?: string | null;
          body?: string | null;
          client_email?: string;
          client_email_hash?: string;
          client_name?: string;
          created_at?: string | null;
          helpful_count?: number | null;
          id?: string;
          is_verified?: boolean | null;
          moderated_at?: string | null;
          moderation_reason?: string | null;
          not_helpful_count?: number | null;
          rating?: number;
          reply_at?: string | null;
          reply_body?: string | null;
          status?: string | null;
          studio_id?: string;
          tattoo_photo_url?: string | null;
          tattoo_style?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_reviews_appointment_id_fkey';
            columns: ['appointment_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_appointments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inkflow_reviews_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_reviews_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_stamp_appointment_credits: {
        Row: {
          appointment_id: string;
          client_id: string;
          credited_at: string;
          studio_id: string;
        };
        Insert: {
          appointment_id: string;
          client_id: string;
          credited_at?: string;
          studio_id: string;
        };
        Update: {
          appointment_id?: string;
          client_id?: string;
          credited_at?: string;
          studio_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_stamp_appointment_credits_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_stamp_appointment_credits_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_stamp_rewards: {
        Row: {
          amount_euros: number;
          client_email: string;
          client_id: string;
          created_at: string;
          id: string;
          notes: string | null;
          promo_code: string;
          redeemed_at: string | null;
          source_appointment_id: string | null;
          status: string;
          studio_id: string;
        };
        Insert: {
          amount_euros: number;
          client_email: string;
          client_id: string;
          created_at?: string;
          id?: string;
          notes?: string | null;
          promo_code: string;
          redeemed_at?: string | null;
          source_appointment_id?: string | null;
          status?: string;
          studio_id: string;
        };
        Update: {
          amount_euros?: number;
          client_email?: string;
          client_id?: string;
          created_at?: string;
          id?: string;
          notes?: string | null;
          promo_code?: string;
          redeemed_at?: string | null;
          source_appointment_id?: string | null;
          status?: string;
          studio_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_stamp_rewards_client_id_fkey';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_clients';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inkflow_stamp_rewards_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_stamp_rewards_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_stock_movements: {
        Row: {
          appointment_id: string | null;
          created_at: string;
          delta_qty: number;
          id: string;
          meta: Json;
          product_id: string;
          reason: string | null;
          source: string;
          studio_id: string;
        };
        Insert: {
          appointment_id?: string | null;
          created_at?: string;
          delta_qty: number;
          id?: string;
          meta?: Json;
          product_id: string;
          reason?: string | null;
          source?: string;
          studio_id: string;
        };
        Update: {
          appointment_id?: string | null;
          created_at?: string;
          delta_qty?: number;
          id?: string;
          meta?: Json;
          product_id?: string;
          reason?: string | null;
          source?: string;
          studio_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_stock_movements_appointment_id_fkey';
            columns: ['appointment_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_appointments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inkflow_stock_movements_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_consumable_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inkflow_stock_movements_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_stock_movements_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_stripe_processed_events: {
        Row: {
          event_type: string | null;
          id: string;
          processed_at: string;
        };
        Insert: {
          event_type?: string | null;
          id: string;
          processed_at?: string;
        };
        Update: {
          event_type?: string | null;
          id?: string;
          processed_at?: string;
        };
        Relationships: [];
      };
      inkflow_studio_finance_prefs: {
        Row: {
          settings: Json;
          studio_id: string;
          updated_at: string;
        };
        Insert: {
          settings?: Json;
          studio_id: string;
          updated_at?: string;
        };
        Update: {
          settings?: Json;
          studio_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_studio_finance_prefs_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: true;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_studio_finance_prefs_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: true;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_studio_public_metrics: {
        Row: {
          discover_profile_views: number;
          studio_id: string;
          updated_at: string;
          vitrine_views: number;
        };
        Insert: {
          discover_profile_views?: number;
          studio_id: string;
          updated_at?: string;
          vitrine_views?: number;
        };
        Update: {
          discover_profile_views?: number;
          studio_id?: string;
          updated_at?: string;
          vitrine_views?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_studio_public_metrics_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: true;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_studio_public_metrics_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: true;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_studios: {
        Row: {
          availability_settings: Json | null;
          avatar_url: string | null;
          bio: string | null;
          city: string | null;
          city_slug: string | null;
          country: string | null;
          created_at: string | null;
          csv_import_slots_remaining: number | null;
          dashboard_preferences: Json;
          discover_rank: number | null;
          email: string;
          google_access_token: string | null;
          google_business_access_token: string | null;
          google_business_location_name: string | null;
          google_business_locations_cache: Json | null;
          google_business_locations_cached_at: string | null;
          google_business_refresh_token: string | null;
          google_business_token_expiry: number | null;
          google_calendar_id: string | null;
          google_place_id: string | null;
          google_refresh_token: string | null;
          google_reviews_cache: Json | null;
          google_token_expiry: number | null;
          id: string;
          instagram: string | null;
          is_discoverable: boolean | null;
          last_active_at: string | null;
          lat: number | null;
          latitude: number | null;
          lng: number | null;
          location_visible: boolean;
          longitude: number | null;
          name: string;
          plan_type: string;
          points_loyalty_settings: Json | null;
          portfolio_cover_url: string | null;
          portfolio_preview: Json | null;
          price_max: number | null;
          price_min: number | null;
          rating_avg: number | null;
          rating_count: number | null;
          referral_code: string | null;
          referred_by: string | null;
          siret: string | null;
          slug: string;
          stamp_loyalty_settings: Json | null;
          stripe_connect_account_id: string | null;
          stripe_connect_charges_enabled: boolean | null;
          stripe_connect_details_submitted: boolean | null;
          studio_name: string;
          styles: string[] | null;
          subscription_billing_failures: number;
          subscription_status: string | null;
          trial_ends_at: string | null;
          unlocked_themes: string[] | null;
          updated_at: string | null;
          vitrine_theme: string | null;
        };
        Insert: {
          availability_settings?: Json | null;
          avatar_url?: string | null;
          bio?: string | null;
          city?: string | null;
          city_slug?: string | null;
          country?: string | null;
          created_at?: string | null;
          csv_import_slots_remaining?: number | null;
          dashboard_preferences?: Json;
          discover_rank?: number | null;
          email: string;
          google_access_token?: string | null;
          google_business_access_token?: string | null;
          google_business_location_name?: string | null;
          google_business_locations_cache?: Json | null;
          google_business_locations_cached_at?: string | null;
          google_business_refresh_token?: string | null;
          google_business_token_expiry?: number | null;
          google_calendar_id?: string | null;
          google_place_id?: string | null;
          google_refresh_token?: string | null;
          google_reviews_cache?: Json | null;
          google_token_expiry?: number | null;
          id: string;
          instagram?: string | null;
          is_discoverable?: boolean | null;
          last_active_at?: string | null;
          lat?: number | null;
          latitude?: number | null;
          lng?: number | null;
          location_visible?: boolean;
          longitude?: number | null;
          name: string;
          plan_type?: string;
          points_loyalty_settings?: Json | null;
          portfolio_cover_url?: string | null;
          portfolio_preview?: Json | null;
          price_max?: number | null;
          price_min?: number | null;
          rating_avg?: number | null;
          rating_count?: number | null;
          referral_code?: string | null;
          referred_by?: string | null;
          siret?: string | null;
          slug: string;
          stamp_loyalty_settings?: Json | null;
          stripe_connect_account_id?: string | null;
          stripe_connect_charges_enabled?: boolean | null;
          stripe_connect_details_submitted?: boolean | null;
          studio_name: string;
          styles?: string[] | null;
          subscription_billing_failures?: number;
          subscription_status?: string | null;
          trial_ends_at?: string | null;
          unlocked_themes?: string[] | null;
          updated_at?: string | null;
          vitrine_theme?: string | null;
        };
        Update: {
          availability_settings?: Json | null;
          avatar_url?: string | null;
          bio?: string | null;
          city?: string | null;
          city_slug?: string | null;
          country?: string | null;
          created_at?: string | null;
          csv_import_slots_remaining?: number | null;
          dashboard_preferences?: Json;
          discover_rank?: number | null;
          email?: string;
          google_access_token?: string | null;
          google_business_access_token?: string | null;
          google_business_location_name?: string | null;
          google_business_locations_cache?: Json | null;
          google_business_locations_cached_at?: string | null;
          google_business_refresh_token?: string | null;
          google_business_token_expiry?: number | null;
          google_calendar_id?: string | null;
          google_place_id?: string | null;
          google_refresh_token?: string | null;
          google_reviews_cache?: Json | null;
          google_token_expiry?: number | null;
          id?: string;
          instagram?: string | null;
          is_discoverable?: boolean | null;
          last_active_at?: string | null;
          lat?: number | null;
          latitude?: number | null;
          lng?: number | null;
          location_visible?: boolean;
          longitude?: number | null;
          name?: string;
          plan_type?: string;
          points_loyalty_settings?: Json | null;
          portfolio_cover_url?: string | null;
          portfolio_preview?: Json | null;
          price_max?: number | null;
          price_min?: number | null;
          rating_avg?: number | null;
          rating_count?: number | null;
          referral_code?: string | null;
          referred_by?: string | null;
          siret?: string | null;
          slug?: string;
          stamp_loyalty_settings?: Json | null;
          stripe_connect_account_id?: string | null;
          stripe_connect_charges_enabled?: boolean | null;
          stripe_connect_details_submitted?: boolean | null;
          studio_name?: string;
          styles?: string[] | null;
          subscription_billing_failures?: number;
          subscription_status?: string | null;
          trial_ends_at?: string | null;
          unlocked_themes?: string[] | null;
          updated_at?: string | null;
          vitrine_theme?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_studios_referred_by_fkey';
            columns: ['referred_by'];
            isOneToOne: false;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_studios_referred_by_fkey';
            columns: ['referred_by'];
            isOneToOne: false;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null;
          created_at: string | null;
          current_period_end: string | null;
          current_period_start: string | null;
          id: string;
          plan: string;
          status: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          studio_id: string;
          updated_at: string | null;
        };
        Insert: {
          cancel_at_period_end?: boolean | null;
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id: string;
          plan?: string;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          studio_id: string;
          updated_at?: string | null;
        };
        Update: {
          cancel_at_period_end?: boolean | null;
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          plan?: string;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          studio_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_subscriptions_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_subscriptions_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_supplier_catalog_items: {
        Row: {
          brand: string | null;
          category: string;
          created_at: string;
          ean: string | null;
          id: string;
          is_active: boolean;
          linked_product_id: string | null;
          list_price_cents: number | null;
          name: string;
          notes: string | null;
          pack_size: number;
          price_cents: number;
          product_url: string | null;
          promo_ends_at: string | null;
          promo_label: string | null;
          promo_price_cents: number | null;
          promo_starts_at: string | null;
          sku: string | null;
          studio_id: string;
          supplier_id: string;
          updated_at: string;
        };
        Insert: {
          brand?: string | null;
          category?: string;
          created_at?: string;
          ean?: string | null;
          id?: string;
          is_active?: boolean;
          linked_product_id?: string | null;
          list_price_cents?: number | null;
          name: string;
          notes?: string | null;
          pack_size?: number;
          price_cents: number;
          product_url?: string | null;
          promo_ends_at?: string | null;
          promo_label?: string | null;
          promo_price_cents?: number | null;
          promo_starts_at?: string | null;
          sku?: string | null;
          studio_id: string;
          supplier_id: string;
          updated_at?: string;
        };
        Update: {
          brand?: string | null;
          category?: string;
          created_at?: string;
          ean?: string | null;
          id?: string;
          is_active?: boolean;
          linked_product_id?: string | null;
          list_price_cents?: number | null;
          name?: string;
          notes?: string | null;
          pack_size?: number;
          price_cents?: number;
          product_url?: string | null;
          promo_ends_at?: string | null;
          promo_label?: string | null;
          promo_price_cents?: number | null;
          promo_starts_at?: string | null;
          sku?: string | null;
          studio_id?: string;
          supplier_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_supplier_catalog_items_linked_product_id_fkey';
            columns: ['linked_product_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_consumable_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inkflow_supplier_catalog_items_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_supplier_catalog_items_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inkflow_supplier_catalog_items_supplier_id_fkey';
            columns: ['supplier_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_consumable_suppliers';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_user_settings: {
        Row: {
          onboarding_dismissed: boolean;
          onboarding_first_booking_celebration_sent_at: string | null;
          onboarding_reactivation_sent_at: string | null;
          onboarding_reminder_flash_sent_at: string | null;
          onboarding_reminder_profile_sent_at: string | null;
          onboarding_reminder_stripe_sent_at: string | null;
          onboarding_step: number;
          onboarding_welcome_sent_at: string | null;
          onboarding_vitrine_link_shared_at: string | null;
          pending_inbox_digest_sent_at: string | null;
          studio_id: string;
          updated_at: string | null;
        };
        Insert: {
          onboarding_dismissed?: boolean;
          onboarding_first_booking_celebration_sent_at?: string | null;
          onboarding_reactivation_sent_at?: string | null;
          onboarding_reminder_flash_sent_at?: string | null;
          onboarding_reminder_profile_sent_at?: string | null;
          onboarding_reminder_stripe_sent_at?: string | null;
          onboarding_step?: number;
          onboarding_welcome_sent_at?: string | null;
          onboarding_vitrine_link_shared_at?: string | null;
          pending_inbox_digest_sent_at?: string | null;
          studio_id: string;
          updated_at?: string | null;
        };
        Update: {
          onboarding_dismissed?: boolean;
          onboarding_first_booking_celebration_sent_at?: string | null;
          onboarding_reactivation_sent_at?: string | null;
          onboarding_reminder_flash_sent_at?: string | null;
          onboarding_reminder_profile_sent_at?: string | null;
          onboarding_reminder_stripe_sent_at?: string | null;
          onboarding_vitrine_link_shared_at?: string | null;
          pending_inbox_digest_sent_at?: string | null;
          onboarding_step?: number;
          onboarding_welcome_sent_at?: string | null;
          studio_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_user_settings_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: true;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_user_settings_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: true;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_vitrine_data: {
        Row: {
          data: Json;
          studio_id: string;
          updated_at: string | null;
        };
        Insert: {
          data?: Json;
          studio_id: string;
          updated_at?: string | null;
        };
        Update: {
          data?: Json;
          studio_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_vitrine_data_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: true;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_vitrine_data_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: true;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_vitrine_link_settings: {
        Row: {
          settings: Json;
          studio_id: string;
          updated_at: string | null;
        };
        Insert: {
          settings?: Json;
          studio_id: string;
          updated_at?: string | null;
        };
        Update: {
          settings?: Json;
          studio_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_vitrine_link_settings_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: true;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_vitrine_link_settings_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: true;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_waitlist: {
        Row: {
          client_email: string;
          client_name: string;
          created_at: string | null;
          desired_service: string | null;
          id: string;
          notes: string | null;
          notified_at: string | null;
          preferred_dates: string | null;
          status: string | null;
          studio_id: string;
        };
        Insert: {
          client_email: string;
          client_name: string;
          created_at?: string | null;
          desired_service?: string | null;
          id: string;
          notes?: string | null;
          notified_at?: string | null;
          preferred_dates?: string | null;
          status?: string | null;
          studio_id: string;
        };
        Update: {
          client_email?: string;
          client_name?: string;
          created_at?: string | null;
          desired_service?: string | null;
          id?: string;
          notes?: string | null;
          notified_at?: string | null;
          preferred_dates?: string | null;
          status?: string | null;
          studio_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_waitlist_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_waitlist_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      inkflow_widgets: {
        Row: {
          studio_id: string;
          updated_at: string | null;
          widgets: Json;
        };
        Insert: {
          studio_id: string;
          updated_at?: string | null;
          widgets?: Json;
        };
        Update: {
          studio_id?: string;
          updated_at?: string | null;
          widgets?: Json;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_widgets_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: true;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_widgets_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: true;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      instagram_connections: {
        Row: {
          connected_at: string | null;
          id: string;
          ig_account_id: string;
          page_access_token: string;
          studio_id: string;
          username: string | null;
        };
        Insert: {
          connected_at?: string | null;
          id?: string;
          ig_account_id: string;
          page_access_token: string;
          studio_id: string;
          username?: string | null;
        };
        Update: {
          connected_at?: string | null;
          id?: string;
          ig_account_id?: string;
          page_access_token?: string;
          studio_id?: string;
          username?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'instagram_connections_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: true;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'instagram_connections_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: true;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      instagram_messages: {
        Row: {
          created_at: string | null;
          direction: string | null;
          from_id: string | null;
          id: string;
          ig_account_id: string;
          message_id: string | null;
          studio_id: string;
          text: string | null;
          timestamp: string | null;
          to_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          direction?: string | null;
          from_id?: string | null;
          id?: string;
          ig_account_id: string;
          message_id?: string | null;
          studio_id: string;
          text?: string | null;
          timestamp?: string | null;
          to_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          direction?: string | null;
          from_id?: string | null;
          id?: string;
          ig_account_id?: string;
          message_id?: string | null;
          studio_id?: string;
          text?: string | null;
          timestamp?: string | null;
          to_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'instagram_messages_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'instagram_messages_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
      payment_logs: {
        Row: {
          amount: number;
          amount_received: number | null;
          artist_id: string;
          booking_id: string | null;
          card_brand: string | null;
          card_last4: string | null;
          charge_id: string | null;
          client_email: string | null;
          client_name: string | null;
          created_at: string | null;
          currency: string | null;
          error_code: string | null;
          error_message: string | null;
          failed_at: string | null;
          fee_amount: number | null;
          id: string;
          net_amount: number | null;
          payment_intent_id: string;
          payment_method_type: string | null;
          payment_type: string;
          refund_amount: number | null;
          refund_id: string | null;
          refund_reason: string | null;
          refunded_at: string | null;
          status: string;
          succeeded_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          amount: number;
          amount_received?: number | null;
          artist_id: string;
          booking_id?: string | null;
          card_brand?: string | null;
          card_last4?: string | null;
          charge_id?: string | null;
          client_email?: string | null;
          client_name?: string | null;
          created_at?: string | null;
          currency?: string | null;
          error_code?: string | null;
          error_message?: string | null;
          failed_at?: string | null;
          fee_amount?: number | null;
          id?: string;
          net_amount?: number | null;
          payment_intent_id: string;
          payment_method_type?: string | null;
          payment_type: string;
          refund_amount?: number | null;
          refund_id?: string | null;
          refund_reason?: string | null;
          refunded_at?: string | null;
          status: string;
          succeeded_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          amount?: number;
          amount_received?: number | null;
          artist_id?: string;
          booking_id?: string | null;
          card_brand?: string | null;
          card_last4?: string | null;
          charge_id?: string | null;
          client_email?: string | null;
          client_name?: string | null;
          created_at?: string | null;
          currency?: string | null;
          error_code?: string | null;
          error_message?: string | null;
          failed_at?: string | null;
          fee_amount?: number | null;
          id?: string;
          net_amount?: number | null;
          payment_intent_id?: string;
          payment_method_type?: string | null;
          payment_type?: string;
          refund_amount?: number | null;
          refund_id?: string | null;
          refund_reason?: string | null;
          refunded_at?: string | null;
          status?: string;
          succeeded_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'payment_logs_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: false;
            referencedRelation: 'bookings';
            referencedColumns: ['id'];
          },
        ];
      };
      projects: {
        Row: {
          ai_complexity_score: number | null;
          ai_estimated_hours: number | null;
          ai_price_range: string | null;
          ai_technical_notes: string | null;
          artist_id: string;
          artist_notes: string | null;
          artist_quoted_price: number | null;
          artist_response_at: string | null;
          availability: string[] | null;
          body_part: string;
          budget_max: number | null;
          care_sent_at: string | null;
          care_template_id: string | null;
          client_email: string;
          client_name: string | null;
          created_at: string | null;
          custom_care_instructions: string | null;
          customer_id: string | null;
          deposit_paid: boolean | null;
          description: string;
          id: string;
          is_cover_up: boolean | null;
          is_first_tattoo: boolean | null;
          reference_images: string[] | null;
          size_cm: number;
          statut: string | null;
          style: string;
          updated_at: string | null;
        };
        Insert: {
          ai_complexity_score?: number | null;
          ai_estimated_hours?: number | null;
          ai_price_range?: string | null;
          ai_technical_notes?: string | null;
          artist_id: string;
          artist_notes?: string | null;
          artist_quoted_price?: number | null;
          artist_response_at?: string | null;
          availability?: string[] | null;
          body_part: string;
          budget_max?: number | null;
          care_sent_at?: string | null;
          care_template_id?: string | null;
          client_email: string;
          client_name?: string | null;
          created_at?: string | null;
          custom_care_instructions?: string | null;
          customer_id?: string | null;
          deposit_paid?: boolean | null;
          description: string;
          id?: string;
          is_cover_up?: boolean | null;
          is_first_tattoo?: boolean | null;
          reference_images?: string[] | null;
          size_cm: number;
          statut?: string | null;
          style: string;
          updated_at?: string | null;
        };
        Update: {
          ai_complexity_score?: number | null;
          ai_estimated_hours?: number | null;
          ai_price_range?: string | null;
          ai_technical_notes?: string | null;
          artist_id?: string;
          artist_notes?: string | null;
          artist_quoted_price?: number | null;
          artist_response_at?: string | null;
          availability?: string[] | null;
          body_part?: string;
          budget_max?: number | null;
          care_sent_at?: string | null;
          care_template_id?: string | null;
          client_email?: string;
          client_name?: string | null;
          created_at?: string | null;
          custom_care_instructions?: string | null;
          customer_id?: string | null;
          deposit_paid?: boolean | null;
          description?: string;
          id?: string;
          is_cover_up?: boolean | null;
          is_first_tattoo?: boolean | null;
          reference_images?: string[] | null;
          size_cm?: number;
          statut?: string | null;
          style?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'projects_artist_id_fkey';
            columns: ['artist_id'];
            isOneToOne: false;
            referencedRelation: 'artists';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'projects_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
        ];
      };
      stripe_transactions: {
        Row: {
          amount: number;
          artist_id: string;
          booking_id: string | null;
          created_at: string | null;
          currency: string | null;
          id: string;
          payment_type: string;
          status: string;
          stripe_payment_intent_id: string;
        };
        Insert: {
          amount: number;
          artist_id: string;
          booking_id?: string | null;
          created_at?: string | null;
          currency?: string | null;
          id?: string;
          payment_type: string;
          status: string;
          stripe_payment_intent_id: string;
        };
        Update: {
          amount?: number;
          artist_id?: string;
          booking_id?: string | null;
          created_at?: string | null;
          currency?: string | null;
          id?: string;
          payment_type?: string;
          status?: string;
          stripe_payment_intent_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'stripe_transactions_artist_id_fkey';
            columns: ['artist_id'];
            isOneToOne: false;
            referencedRelation: 'artists';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'stripe_transactions_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: false;
            referencedRelation: 'bookings';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      artist_payment_stats: {
        Row: {
          completed_revenue: number | null;
          pending_payments: number | null;
          studio_id: string | null;
          studio_name: string | null;
          total_payments: number | null;
          total_revenue: number | null;
        };
        Relationships: [];
      };
      recent_payments: {
        Row: {
          amount: number | null;
          appointment_client_name: string | null;
          appointment_date: string | null;
          appointment_id: string | null;
          client_email: string | null;
          client_name: string | null;
          created_at: string | null;
          currency: string | null;
          id: string | null;
          service: string | null;
          status: string | null;
          stripe_payment_intent: string | null;
          stripe_session_id: string | null;
          studio_id: string | null;
          type: string | null;
          updated_at: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'inkflow_payments_appointment_id_fkey';
            columns: ['appointment_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_appointments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inkflow_payments_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'artist_payment_stats';
            referencedColumns: ['studio_id'];
          },
          {
            foreignKeyName: 'inkflow_payments_studio_id_fkey';
            columns: ['studio_id'];
            isOneToOne: false;
            referencedRelation: 'inkflow_studios';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Functions: {
      abandon_public_checkout_appointment: {
        Args: { p_client_email: string; p_id: string };
        Returns: number;
      };
      generate_referral_code: { Args: never; Returns: string };
      generate_unique_slug: {
        Args: { base_text: string; column_name?: string; table_name: string };
        Returns: string;
      };
      get_available_slots: {
        Args: { p_artist_id: string; p_date_debut: string; p_date_fin: string };
        Returns: {
          date_debut: string;
          date_fin: string;
          is_available: boolean;
        }[];
      };
      get_booking_client_recap: { Args: { p_token: string }; Returns: Json };
      get_client_unread_message_count: {
        Args: { p_client_email: string };
        Returns: number;
      };
      get_consent_form_for_public_portal: {
        Args: { p_id: string };
        Returns: {
          appointment_id: string | null;
          client_email: string | null;
          client_name: string | null;
          id: string;
          signed_at: string | null;
          template: string | null;
        }[];
      };
      get_discovery_studios_for_client: {
        Args: {
          limit_count?: number;
          radius_km?: number;
          user_lat?: number;
          user_lng?: number;
        };
        Returns: {
          avatar_url: string;
          city: string;
          distance_km: number;
          id: string;
          latitude: number;
          longitude: number;
          slug: string;
          studio_name: string;
        }[];
      };
      get_monthly_revenue: {
        Args: {
          p_artist_id: string;
          p_end_date?: string;
          p_start_date?: string;
        };
        Returns: {
          month: string;
          net_revenue: number;
          payment_count: number;
          total_fees: number;
          total_revenue: number;
        }[];
      };
      get_nearby_studios: {
        Args: {
          limit_count?: number;
          radius_km?: number;
          user_lat: number;
          user_lng: number;
        };
        Returns: {
          avatar_url: string;
          city: string;
          distance_km: number;
          id: string;
          latitude: number;
          longitude: number;
          slug: string;
          studio_name: string;
        }[];
      };
      get_public_message_studio_header: {
        Args: { p_thread_id: string };
        Returns: {
          avatar_url: string;
          id: string;
          name: string;
          portfolio_cover_url: string;
          slug: string;
          studio_name: string;
        }[];
      };
      get_public_studio_info: {
        Args: { slug_input: string };
        Returns: {
          availability_settings: Json;
          avatar_url: string | null;
          id: string;
          name: string;
          payments_online: boolean;
          portfolio_cover_url: string | null;
          slug: string;
          studio_name: string;
          vitrine_theme: string;
        }[];
      };
      get_public_thread_messages: {
        Args: { p_thread_id: string };
        Returns: {
          content: string;
          created_at: string | null;
          id: string;
          read: boolean | null;
          sender_name: string;
          sender_type: string;
          studio_id: string;
          thread_id: string;
        }[];
        SetofOptions: {
          from: '*';
          to: 'inkflow_messages';
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      get_studio_by_email_with_data: {
        Args: { p_email: string };
        Returns: {
          csv_import_slots_remaining: number;
          id: string;
          plan_type: string;
          siret: string;
          slug: string;
          subscription_status: string;
          trial_ends_at: string;
        }[];
      };
      get_studio_public_by_slug: {
        Args: { p_slug: string };
        Returns: {
          availability_settings: Json;
          avatar_url: string | null;
          id: string;
          name: string;
          payments_online: boolean;
          portfolio_cover_url: string | null;
          siret: string | null;
          slug: string;
          studio_name: string;
          vitrine_theme: string;
        }[];
      };
      get_studio_public_metrics_for_dashboard: {
        Args: { p_studio_id: string };
        Returns: Json;
      };
      get_trending_public_discover_studios: {
        Args: { p_limit?: number };
        Returns: {
          bio: string | null;
          city: string | null;
          city_slug: string | null;
          discover_rank: number | null;
          id: string;
          instagram: string | null;
          last_active_at: string | null;
          lat: number | null;
          lng: number | null;
          name: string;
          portfolio_cover_url: string | null;
          portfolio_preview: Json;
          price_max: number | null;
          price_min: number | null;
          rating_avg: number | null;
          rating_count: number | null;
          slug: string;
          studio_name: string;
          styles: string[];
        }[];
      };
      increment_studio_channel_view: {
        Args: { p_channel: string; p_studio_id: string };
        Returns: undefined;
      };
      inkflow_apply_flash_checkout_reserve: {
        Args: { p_flash_id: string };
        Returns: undefined;
      };
      inkflow_jwt_email_norm: { Args: never; Returns: string };
      inkflow_list_slot_end_nudges: {
        Args: never;
        Returns: {
          client_id: string;
          client_name: string;
          id: string;
          studio_id: string;
        }[];
      };
      inkflow_studio_ids_for_jwt: { Args: never; Returns: string[] };
      process_referral_reward: { Args: { p_referee_id: string }; Returns: Json };
      search_public_discover_studios: {
        Args: {
          p_city_slug?: string | null;
          p_page?: number | null;
          p_per_page?: number | null;
          p_price_max?: number | null;
          p_price_min?: number | null;
          p_q?: string | null;
          p_sort?: string | null;
          p_style?: string | null;
        };
        Returns: {
          bio: string | null;
          city: string | null;
          city_slug: string | null;
          discover_rank: number | null;
          id: string;
          instagram: string | null;
          last_active_at: string | null;
          lat: number | null;
          lng: number | null;
          name: string;
          out_total: number;
          portfolio_cover_url: string | null;
          portfolio_preview: Json;
          price_max: number | null;
          price_min: number | null;
          rating_avg: number | null;
          rating_count: number | null;
          slug: string;
          studio_name: string;
          styles: string[];
        }[];
      };
      studio_exists: { Args: { sid: string }; Returns: boolean };
      submit_consent_form_signature: {
        Args: {
          p_filled_template_text: string;
          p_id: string;
          p_signature_data: string;
        };
        Returns: boolean;
      };
      sync_client_crm_from_portal: {
        Args: { p_avatar_url: string; p_display_name: string };
        Returns: undefined;
      };
    };
    Enums: {
      BookingStatus: 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
      BookingType: 'CONSULTATION' | 'SESSION' | 'RETOUCHE';
      PaymentMethod: 'STRIPE' | 'ESPECES' | 'VIREMENT';
      PaymentStatus: 'EN_ATTENTE' | 'REGLE' | 'REMBOURSE';
      PaymentType: 'ACOMPTE' | 'SOLDE' | 'TOTAL';
      SubscriptionPlan: 'STARTER' | 'PRO' | 'STUDIO';
      SubscriptionStatus:
        | 'active'
        | 'trialing'
        | 'past_due'
        | 'canceled'
        | 'incomplete'
        | 'incomplete_expired'
        | 'unpaid'
        | 'expired';
      UserRole: 'CLIENT' | 'ARTIST' | 'ADMIN';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      BookingStatus: ['PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'COMPLETED'],
      BookingType: ['CONSULTATION', 'SESSION', 'RETOUCHE'],
      PaymentMethod: ['STRIPE', 'ESPECES', 'VIREMENT'],
      PaymentStatus: ['EN_ATTENTE', 'REGLE', 'REMBOURSE'],
      PaymentType: ['ACOMPTE', 'SOLDE', 'TOTAL'],
      SubscriptionPlan: ['STARTER', 'PRO', 'STUDIO'],
      SubscriptionStatus: [
        'active',
        'trialing',
        'past_due',
        'canceled',
        'incomplete',
        'incomplete_expired',
        'unpaid',
        'expired',
      ],
      UserRole: ['CLIENT', 'ARTIST', 'ADMIN'],
    },
  },
} as const;
