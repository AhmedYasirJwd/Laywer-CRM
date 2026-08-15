"use client";

import { useActionState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Scale } from "lucide-react";
import { signIn } from "@/app/actions/auth";

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [state, formAction, pending] = useActionState(signIn, null);

  return (
    <form action={formAction} className="card space-y-4 p-5">
      <input type="hidden" name="next" value={next} />
      {state?.error && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{state.error}</p>}

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-muted">Email</span>
        <input required type="email" name="email" autoComplete="email" className={inputClass} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-muted">Password</span>
        <input required type="password" name="password" autoComplete="current-password" className={inputClass} />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
            <Scale size={20} />
          </div>
          <h1 className="text-xl font-bold text-ink">Sign in to LexCase</h1>
          <p className="text-sm text-muted">Case, hearing, and task management</p>
        </div>

        <Suspense fallback={<div className="card h-64 animate-pulse p-5" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
