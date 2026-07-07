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

export interface Campaign {
  id: string | null;
  label: string;
  media_id: string | null;
  keyword: string | null;
  match_type: "contains" | "exact";
  dm_message: string;
  public_reply: string | null;
  enabled: boolean;
  sent_count?: number;
}

export interface CampaignLogItem {
  comment_id: string;
  username: string | null;
  text: string;
  media_id: string | null;
  status: "sent" | "skipped" | "error";
  detail: string | null;
  created_at: string;
  campaign: string | null;
}

export interface IgMedia {
  id: string;
  caption?: string;
  media_type?: string;
  permalink?: string;
  timestamp?: string;
}

export interface DisabledItem {
  ig_user_id: string;
  who: string;
  auto_reply: boolean;
  blocked: boolean;
  conversationId: string | null;
}
