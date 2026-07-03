"use client";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { apiGet, apiPost } from "@/lib/api";
import type { Settings, Tab } from "@/types";
import Login from "@/components/Login";
import TopBar from "@/components/TopBar";
import PendingView from "@/components/PendingView";
import ConversationsView from "@/components/ConversationsView";
import ConfigView from "@/components/ConfigView";

export default function Home() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [tab, setTab] = useState<Tab>("pending");
  const [settings, setSettings] = useState<Settings>({
    auto_reply_enabled: true,
    daily_auto_cap: 200,
    per_user_hourly_cap: 8,
    debounce_seconds: 25,
    approval_categories: ["price", "objection", "health_claim", "closing", "payment", "other"],
    custom_rule_enabled: false,
    custom_rule: "",
  });

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
      if (r.ok) setSettings(r.body.settings);
    });
  }, [session]);

  async function toggleAuto() {
    const r = await apiPost<{ settings: Settings }>({
      action: "setting",
      key: "auto_reply_enabled",
      value: !settings.auto_reply_enabled,
    });
    if (r.ok) setSettings(r.body.settings);
  }

  if (!ready) return <div className="py-16 text-center text-sm text-neutral-500">Carregando...</div>;
  if (!session) return <Login />;

  return (
    <main className="mx-auto max-w-2xl p-4">
      <TopBar
        autoOn={settings.auto_reply_enabled}
        onToggle={toggleAuto}
        tab={tab}
        setTab={setTab}
        onLogout={() => supabase.auth.signOut()}
      />
      <div className="mt-3">
        {tab === "pending" && <PendingView />}
        {tab === "convs" && <ConversationsView />}
        {tab === "config" && <ConfigView />}
      </div>
    </main>
  );
}
