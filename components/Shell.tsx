"use client";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { apiGet, apiPost } from "@/lib/api";
import type { Settings } from "@/types";
import Login from "./Login";
import TopBar from "./TopBar";

// Wraps every page: guards auth, renders the top bar once, and keeps the
// "Auto: ON/OFF" kill-switch state. Lives in the root layout so the session
// isn't re-fetched on each client-side navigation.
export default function Shell({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [autoOn, setAutoOn] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    apiGet<{ settings: Settings }>("?action=settings").then((r) => {
      if (r.ok) setAutoOn(r.body.settings.auto_reply_enabled);
    });
  }, [session]);

  async function toggleAuto() {
    const r = await apiPost<{ settings: Settings }>({
      action: "setting",
      key: "auto_reply_enabled",
      value: !autoOn,
    });
    if (r.ok) setAutoOn(r.body.settings.auto_reply_enabled);
  }

  if (!ready) return <div className="py-16 text-center text-sm text-neutral-500">Carregando...</div>;
  if (!session) return <Login />;

  return (
    <main className="mx-auto max-w-2xl p-4">
      <TopBar autoOn={autoOn} onToggle={toggleAuto} onLogout={() => supabase.auth.signOut()} />
      <div className="mt-3">{children}</div>
    </main>
  );
}
