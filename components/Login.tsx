"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function go() {
    setLoading(true);
    setErr("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass });
    setLoading(false);
    if (error) setErr(error.message);
    // On success, the parent's onAuthStateChange swaps the view.
  }

  return (
    <div className="mx-auto mt-24 max-w-sm px-4">
      <div className="card">
        <h1 className="mb-1 text-lg font-semibold">CognX · Operador</h1>
        <p className="mb-4 text-sm text-neutral-500">Entre para gerenciar as conversas.</p>
        <input
          className="field mb-2"
          type="email"
          placeholder="E-mail"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="field mb-3"
          type="password"
          placeholder="Senha"
          autoComplete="current-password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
        />
        <button className="btn-approve w-full" onClick={go} disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
        {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
      </div>
    </div>
  );
}
