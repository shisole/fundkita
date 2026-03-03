export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      // TODO: Define your database tables here
      // Example:
      // users: {
      //   Row: {
      //     id: string;
      //     email: string;
      //     full_name: string | null;
      //     avatar_url: string | null;
      //     role: "admin" | "user";
      //     created_at: string;
      //   };
      //   Insert: {
      //     id?: string;
      //     email: string;
      //     full_name?: string | null;
      //     avatar_url?: string | null;
      //     role?: "admin" | "user";
      //     created_at?: string;
      //   };
      //   Update: {
      //     id?: string;
      //     email?: string;
      //     full_name?: string | null;
      //     avatar_url?: string | null;
      //     role?: "admin" | "user";
      //     created_at?: string;
      //   };
      //   Relationships: [];
      // };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
