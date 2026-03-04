import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

import { DEMO_USERS } from "@/lib/constants/demo-users";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
    return NextResponse.json({ error: "Demo mode is not enabled" }, { status: 403 });
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const body: { email?: string } = await request.json();
  const { email } = body;

  // ── Sign out (Guest mode) ───────────────────────────────────────────────────
  if (!email || email === "guest") {
    const response = NextResponse.json({ success: true, user: null });
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return [...new Headers(request.headers).entries()]
              .filter(([key]) => key === "cookie")
              .flatMap(([, value]) =>
                value.split(";").map((c) => {
                  const [name, ...rest] = c.trim().split("=");
                  return { name, value: rest.join("=") };
                }),
              );
          },
          setAll(cookiesToSet) {
            for (const { name, value, options } of cookiesToSet) {
              response.cookies.set(name, value, options);
            }
          },
        },
      },
    );
    await supabase.auth.signOut();
    return response;
  }

  // ── Validate demo user ──────────────────────────────────────────────────────
  const demoUser = DEMO_USERS.find((u) => u.email === email);
  if (!demoUser) {
    return NextResponse.json({ error: "Invalid demo user" }, { status: 400 });
  }

  // ── Generate magic link via service client ──────────────────────────────────
  const serviceClient = createServiceClient();
  const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
    type: "magiclink",
    email: demoUser.email,
  });

  if (linkError || !linkData.properties.hashed_token) {
    return NextResponse.json(
      { error: linkError?.message ?? "Failed to generate link" },
      { status: 500 },
    );
  }

  // ── Exchange token for session and set cookies ──────────────────────────────
  const response = NextResponse.json({
    success: true,
    user: { name: demoUser.name, role: demoUser.role, email: demoUser.email },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return [...new Headers(request.headers).entries()]
            .filter(([key]) => key === "cookie")
            .flatMap(([, value]) =>
              value.split(";").map((c) => {
                const [name, ...rest] = c.trim().split("=");
                return { name, value: rest.join("=") };
              }),
            );
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: linkData.properties.hashed_token,
  });

  if (verifyError) {
    return NextResponse.json({ error: verifyError.message }, { status: 500 });
  }

  return response;
}
