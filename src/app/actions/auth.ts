"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signIn(_prevState: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  redirect(next.startsWith("/") ? next : "/");
}

export async function signUp(_prevState: unknown, formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!fullName) return { error: "Enter your full name." };
  if (!email || !password) return { error: "Enter your email and password." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "Passwords don't match." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/auth/callback`,
      // Powers the avatar initials and dashboard greeting (Sidebar,
      // DashboardClient, PageHeader — see src/hooks/useCurrentUser.ts) —
      // stored on the Supabase auth user itself, no separate table needed.
      data: { full_name: fullName },
    },
  });
  if (error) return { error: error.message };

  // If email confirmation is off in the Supabase project, signUp already
  // returns a live session — take the person straight in.
  if (data.session) redirect("/");

  return {
    success:
      "Account created. Check your email to confirm your address, then sign in.",
  };
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
