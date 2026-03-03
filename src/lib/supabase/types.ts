export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// ── Enum-like union types ──────────────────────────────────────────────────────

export type UserRole = "donor" | "organizer" | "admin";
export type KycStatus = "pending" | "approved" | "rejected";
export type CampaignStatus =
  | "draft"
  | "pending_review"
  | "active"
  | "paused"
  | "completed"
  | "closed";
export type CampaignCategory =
  | "medical"
  | "disaster_relief"
  | "education"
  | "community"
  | "emergency"
  | "personal"
  | "other";
export type PaymentStatus = "pending" | "confirmed" | "failed" | "refunded";
export type PaymentMethod = "gcash" | "maya" | "card" | "bank_transfer" | "gotyme";
export type Currency = "PHP" | "USD";
export type FraudFlagStatus = "open" | "resolved" | "dismissed";
export type WithdrawalStatus = "pending" | "approved" | "rejected" | "processed";
export type PayoutMethod = "gcash" | "maya" | "bank_transfer";
export type KycIdType = "national_id" | "passport" | "drivers_license" | "philsys";

// ── Database interface ─────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          username: string | null;
          avatar_url: string | null;
          role: UserRole;
          is_verified: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          is_verified?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          is_verified?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };

      kyc_submissions: {
        Row: {
          id: string;
          user_id: string;
          id_type: KycIdType;
          id_front_url: string;
          id_back_url: string;
          selfie_url: string;
          status: KycStatus;
          rejection_reason: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          id_type: KycIdType;
          id_front_url: string;
          id_back_url: string;
          selfie_url: string;
          status?: KycStatus;
          rejection_reason?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          id_type?: KycIdType;
          id_front_url?: string;
          id_back_url?: string;
          selfie_url?: string;
          status?: KycStatus;
          rejection_reason?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "kyc_submissions_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "kyc_submissions_reviewed_by_fkey";
            columns: ["reviewed_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      campaigns: {
        Row: {
          id: string;
          organizer_id: string;
          title: string;
          slug: string;
          description: string;
          category: CampaignCategory;
          location: string;
          goal_amount: number;
          amount_raised: number;
          donor_count: number;
          status: CampaignStatus;
          is_verified: boolean;
          featured_image_url: string | null;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organizer_id: string;
          title: string;
          slug?: string;
          description: string;
          category: CampaignCategory;
          location: string;
          goal_amount: number;
          amount_raised?: number;
          donor_count?: number;
          status?: CampaignStatus;
          is_verified?: boolean;
          featured_image_url?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organizer_id?: string;
          title?: string;
          slug?: string;
          description?: string;
          category?: CampaignCategory;
          location?: string;
          goal_amount?: number;
          amount_raised?: number;
          donor_count?: number;
          status?: CampaignStatus;
          is_verified?: boolean;
          featured_image_url?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "campaigns_organizer_id_fkey";
            columns: ["organizer_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      campaign_images: {
        Row: {
          id: string;
          campaign_id: string;
          image_url: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          image_url: string;
          sort_order?: number;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          image_url?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "campaign_images_campaign_id_fkey";
            columns: ["campaign_id"];
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
        ];
      };

      campaign_updates: {
        Row: {
          id: string;
          campaign_id: string;
          title: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          title: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          title?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "campaign_updates_campaign_id_fkey";
            columns: ["campaign_id"];
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
        ];
      };

      donations: {
        Row: {
          id: string;
          campaign_id: string;
          donor_id: string | null;
          donor_name: string;
          donor_email: string;
          amount_php: number;
          original_amount: number;
          original_currency: Currency;
          exchange_rate: number;
          platform_tip: number;
          processing_fee: number;
          fee_covered_by_donor: boolean;
          payment_method: PaymentMethod;
          payment_status: PaymentStatus;
          is_anonymous: boolean;
          dragonpay_txn_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          donor_id?: string | null;
          donor_name: string;
          donor_email: string;
          amount_php: number;
          original_amount: number;
          original_currency?: Currency;
          exchange_rate?: number;
          platform_tip?: number;
          processing_fee?: number;
          fee_covered_by_donor?: boolean;
          payment_method: PaymentMethod;
          payment_status?: PaymentStatus;
          is_anonymous?: boolean;
          dragonpay_txn_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          donor_id?: string | null;
          donor_name?: string;
          donor_email?: string;
          amount_php?: number;
          original_amount?: number;
          original_currency?: Currency;
          exchange_rate?: number;
          platform_tip?: number;
          processing_fee?: number;
          fee_covered_by_donor?: boolean;
          payment_method?: PaymentMethod;
          payment_status?: PaymentStatus;
          is_anonymous?: boolean;
          dragonpay_txn_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "donations_campaign_id_fkey";
            columns: ["campaign_id"];
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "donations_donor_id_fkey";
            columns: ["donor_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      donor_stats: {
        Row: {
          user_id: string;
          lifetime_donations_php: number;
          donation_count: number;
          current_tier: number;
        };
        Insert: {
          user_id: string;
          lifetime_donations_php?: number;
          donation_count?: number;
          current_tier?: number;
        };
        Update: {
          user_id?: string;
          lifetime_donations_php?: number;
          donation_count?: number;
          current_tier?: number;
        };
        Relationships: [
          {
            foreignKeyName: "donor_stats_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      donor_badges: {
        Row: {
          id: string;
          user_id: string;
          badge_tier: number;
          badge_name: string;
          awarded_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          badge_tier: number;
          badge_name: string;
          awarded_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          badge_tier?: number;
          badge_name?: string;
          awarded_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "donor_badges_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      fraud_flags: {
        Row: {
          id: string;
          campaign_id: string;
          reason: string;
          flagged_by: string;
          status: FraudFlagStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          reason: string;
          flagged_by: string;
          status?: FraudFlagStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          reason?: string;
          flagged_by?: string;
          status?: FraudFlagStatus;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fraud_flags_campaign_id_fkey";
            columns: ["campaign_id"];
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fraud_flags_flagged_by_fkey";
            columns: ["flagged_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      withdrawal_requests: {
        Row: {
          id: string;
          campaign_id: string;
          organizer_id: string;
          amount: number;
          status: WithdrawalStatus;
          payout_method: PayoutMethod;
          payout_details: Json;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          organizer_id: string;
          amount: number;
          status?: WithdrawalStatus;
          payout_method: PayoutMethod;
          payout_details: Json;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          organizer_id?: string;
          amount?: number;
          status?: WithdrawalStatus;
          payout_method?: PayoutMethod;
          payout_details?: Json;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_campaign_id_fkey";
            columns: ["campaign_id"];
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "withdrawal_requests_organizer_id_fkey";
            columns: ["organizer_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "withdrawal_requests_reviewed_by_fkey";
            columns: ["reviewed_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      exchange_rates: {
        Row: {
          id: string;
          from_currency: string;
          to_currency: string;
          rate: number;
          fetched_at: string;
        };
        Insert: {
          id?: string;
          from_currency: string;
          to_currency: string;
          rate: number;
          fetched_at?: string;
        };
        Update: {
          id?: string;
          from_currency?: string;
          to_currency?: string;
          rate?: number;
          fetched_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// ── Convenience type helpers ───────────────────────────────────────────────────

type Tables = Database["public"]["Tables"];
export type TableRow<T extends keyof Tables> = Tables[T]["Row"];
export type TableInsert<T extends keyof Tables> = Tables[T]["Insert"];
export type TableUpdate<T extends keyof Tables> = Tables[T]["Update"];
