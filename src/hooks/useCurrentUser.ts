"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function deriveName(user: User | null | undefined): string {
  if (!user) return "";
  const fullName = user.user_metadata?.full_name;
  if (typeof fullName === "string" && fullName.trim()) return fullName.trim();
  // Accounts created before the "full name" signup field existed won't have
  // full_name set — fall back to the part of the email before the @ rather
  // than showing nothing.
  return user.email?.split("@")[0] ?? "";
}

// getSession() (unlike getUser()) reads the session already cached on-device
// rather than round-tripping to Supabase, so this resolves instantly even
// offline — consistent with the rest of the app's offline-first dashboard
// (see DashboardClient's comment on why it avoids server data fetching).
export function useCurrentUser(): { name: string; email: string } {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setName(deriveName(data.session?.user));
      setEmail(data.session?.user?.email ?? "");
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setName(deriveName(session?.user));
      setEmail(session?.user?.email ?? "");
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return { name, email };
}
