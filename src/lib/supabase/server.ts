import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Creates a Supabase client for use in Server Components, Route Handlers, and
// Server Actions. It reads the visitor's session from cookies, so every query
// made with it runs as that authenticated user — Postgres Row Level Security
// then does the actual data-isolation work.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component render (not a Route Handler/Server
            // Action) — cookies can't be set here. Fine as long as middleware
            // is also refreshing the session, which it is.
          }
        },
      },
    }
  );
}

// Returns the current user's id, or throws. Every db.ts write goes through
// this so a row can never be inserted without an owner — middleware already
// keeps signed-out visitors away from any page that would reach this code,
// so this should only ever fail if that invariant is somehow broken.
//
// Uses getClaims() rather than getUser(): it verifies the JWT locally (no
// network round-trip to the Auth server on the happy path), which is the
// same signature-verified guarantee getUser() provides — Postgres RLS is
// still what actually enforces access, this just resolves the id faster.
export async function requireUserId(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) throw new Error("Not authenticated");
  return userId;
}
