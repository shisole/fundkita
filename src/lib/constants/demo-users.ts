import { type UserRole } from "@/lib/supabase/types";

export interface DemoUser {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

export const DEMO_USERS: readonly DemoUser[] = [
  { id: "demo-maria", name: "Maria Santos", role: "organizer", email: "maria@demo.fundkita.ph" },
  { id: "demo-juan", name: "Juan Cruz", role: "donor", email: "juan@demo.fundkita.ph" },
  { id: "demo-ana", name: "Ana Reyes", role: "donor", email: "ana@demo.fundkita.ph" },
  { id: "demo-admin", name: "Admin User", role: "admin", email: "admin@demo.fundkita.ph" },
] as const;

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}
