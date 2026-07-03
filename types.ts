export type Tab = "pending" | "convs" | "config";

export interface Settings {
  auto_reply_enabled: boolean;
  daily_auto_cap: number;
  per_user_hourly_cap: number;
  debounce_seconds: number;
  approval_categories: string[];
  custom_rule_enabled: boolean;
  custom_rule: string;
}

export interface Msg {
  direction: "in" | "out";
  sender?: string;
  content: string;
}

export interface PendingItem {
  id: string;
  conversation_id: string;
  category: string;
  reason: string;
  draft_text: string;
  who: string;
  messages: Msg[];
}

export interface ConvItem {
  id: string;
  who: string;
  blocked: boolean;
  auto_reply: boolean;
  has_pending: boolean;
  last: { direction: string; content: string } | null;
}

export interface PendingDraft {
  id: string;
  category: string;
  draft_text: string;
}

export interface ThreadResp {
  messages: Msg[];
  pending_draft: PendingDraft | null;
  blocked: boolean;
  auto_reply: boolean;
  first_name: string | null;
}

export interface DisabledItem {
  ig_user_id: string;
  who: string;
  auto_reply: boolean;
  blocked: boolean;
  conversationId: string | null;
}
