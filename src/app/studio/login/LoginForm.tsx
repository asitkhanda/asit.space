"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setMessage("");

    const admin = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase();
    // Client-side hint only; real gate is callback + middleware
    if (
      admin &&
      email.toLowerCase() !== admin &&
      email.toLowerCase() !== "asitkhanda@gmail.com"
    ) {
      setStatus("error");
      setMessage("This studio is private.");
      return;
    }

    const supabase = createClient();
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=/studio`,
        shouldCreateUser: true,
      },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("sent");
    setMessage("Check your email for the magic link.");
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 w-full max-w-sm">
      <label className="flex flex-col gap-2 text-sm text-chrome/80">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="metal-pill rounded-2xl px-4 py-3 text-ink outline-none focus:ring-2 focus:ring-accent"
          placeholder="you@email.com"
          autoComplete="email"
        />
      </label>
      <button
        type="submit"
        disabled={status === "sending"}
        className="accent-dial relative rounded-full px-6 py-3 text-ink font-semibold disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Send magic link"}
      </button>
      {message ? (
        <p
          className={`text-sm ${
            status === "error" ? "text-red-400" : "text-chrome/70"
          }`}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
