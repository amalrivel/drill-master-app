"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "@/lib/firebase-client";
import { signInWithPopup } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const onLogin = async () => {
    setLoading(true);
    setErr(null);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const idToken = await cred.user.getIdToken();

      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? "login_failed");
      }

      router.replace("/practice");
    } catch (e: any) {
      setErr(e?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border p-6 space-y-4">
        <div className="space-y-1">
          <div className="text-2xl font-semibold">Login</div>
          <div className="text-sm text-muted-foreground">
            Hanya akun yang diizinkan yang bisa masuk.
          </div>
        </div>

        {err ? <div className="text-sm text-red-600">{err}</div> : null}

        <button
          className="w-full rounded-xl border px-4 py-3 hover:bg-muted disabled:opacity-50"
          onClick={onLogin}
          disabled={loading}
        >
          {loading ? "Signing in…" : "Sign in with Google"}
        </button>
      </div>
    </div>
  );
}
