"use client";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, PUBLISHABLE_KEY } from "./config";

export const supabase = createClient(SUPABASE_URL, PUBLISHABLE_KEY);
