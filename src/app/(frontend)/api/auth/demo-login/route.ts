import { NextResponse } from "next/server";

import { DEMO_USERS } from "@/lib/constants/demo-users";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
    return NextResponse.json({ error: "Demo mode is not enabled" }, { status: 403 });
  }

  const body = (await request.json()) as { userId?: string };
  const { userId } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const demoUser = DEMO_USERS.find((u) => u.id === userId);
  if (!demoUser) {
    return NextResponse.json({ error: "Invalid demo user" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Generate a magic link for the demo user (auto-signs in)
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: demoUser.email,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    token: data.properties.hashed_token,
    email: demoUser.email,
  });
}
