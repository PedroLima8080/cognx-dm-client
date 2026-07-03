"use client";
import { supabase } from "./supabase";
import { API, PUBLISHABLE_KEY } from "./config";

export interface ApiResult<T = any> {
  ok: boolean;
  status: number;
  body: T;
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  return {
    apikey: PUBLISHABLE_KEY,
    Authorization: `Bearer ${data.session?.access_token ?? ""}`,
    "Content-Type": "application/json",
  };
}

export async function apiGet<T = any>(qs: string): Promise<ApiResult<T>> {
  const r = await fetch(API + qs, { headers: await authHeaders() });
  return { ok: r.ok, status: r.status, body: await r.json().catch(() => ({} as T)) };
}

export async function apiPost<T = any>(obj: unknown): Promise<ApiResult<T>> {
  const r = await fetch(API, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(obj),
  });
  return { ok: r.ok, status: r.status, body: await r.json().catch(() => ({} as T)) };
}
