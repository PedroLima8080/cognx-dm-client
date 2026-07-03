// Public config. These values are safe in the client bundle — the real security
// is the Supabase login token plus the operator-email check in dashboard-api.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ontekwcuuckzvuoittrc.supabase.co";

export const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_l7x7znw_BPIF5ORswwt96Q_wT_Jia14";

export const API = `${SUPABASE_URL}/functions/v1/dashboard-api`;
