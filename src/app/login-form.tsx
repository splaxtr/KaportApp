/* eslint-disable @next/next/no-async-client-component */
"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

import { loginAction, type LoginResult } from "./actions/login";

type FormState = { error?: string };

export default function LoginForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [state, formAction] = useActionState<FormState, FormData>(
    async (_prevState, formData) => {
      const res: LoginResult = await loginAction(formData);
      if (res.success) {
        startTransition(() => router.push("/dashboard"));
        return {};
      }
      return { error: res.error };
    },
    {},
  );

  useEffect(() => {
    if (!pending && state.error) {
      // No-op, kept to align with potential toast integration later.
    }
  }, [pending, state.error]);

  return (
    <form className="space-y-5" action={formAction}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-100" htmlFor="email">
          E-posta
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-lime-400 focus:ring-2 focus:ring-lime-400/40"
          placeholder="ornek@firma.com"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-100" htmlFor="password">
          Şifre
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-lime-400 focus:ring-2 focus:ring-lime-400/40"
          placeholder="••••••••"
        />
      </div>
      <div className="flex items-center justify-between text-sm text-slate-200">
        <label className="flex items-center gap-2">
          <input
            id="remember"
            name="remember"
            type="checkbox"
            className="h-4 w-4 rounded border-white/40 bg-white/10 text-lime-400 focus:ring-lime-400/60"
          />
          Beni hatırla
        </label>
        <button
          type="button"
          className="text-sm font-medium text-lime-300 underline-offset-4 hover:text-lime-200 hover:underline"
        >
          Şifremi unuttum
        </button>
      </div>
      {state.error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {state.error}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="relative inline-flex w-full items-center justify-center overflow-hidden rounded-lg bg-lime-400 px-4 py-3 text-sm font-semibold text-slate-950 transition focus:outline-none focus:ring-2 focus:ring-lime-300 focus:ring-offset-2 focus:ring-offset-slate-900 hover:scale-[1.01] hover:shadow-[0_10px_40px_rgba(190,242,100,0.35)] disabled:cursor-not-allowed disabled:opacity-80"
      >
        {pending ? "Giriş yapılıyor..." : "Giriş yap"}
      </button>
    </form>
  );
}
