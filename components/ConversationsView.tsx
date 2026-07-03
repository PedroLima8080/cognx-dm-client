"use client";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import type { ConvItem } from "@/types";
import { Loading, Empty } from "./Bits";
import ThreadView from "./ThreadView";

export default function ConversationsView() {
  const [items, setItems] = useState<ConvItem[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (selected) return;
    apiGet<{ conversations: ConvItem[] }>("?action=conversations").then((r) =>
      setItems(r.ok ? r.body.conversations : []),
    );
  }, [selected]);

  if (selected) return <ThreadView conversationId={selected} onBack={() => setSelected(null)} />;
  if (items === null) return <Loading />;
  if (!items.length) return <Empty text="Nenhuma conversa ainda." />;

  return (
    <div className="space-y-3">
      {items.map((c) => {
        const snip = c.last ? (c.last.direction === "in" ? "↩ " : "↪ ") + c.last.content : "";
        return (
          <button
            key={c.id}
            onClick={() => setSelected(c.id)}
            className="card flex w-full items-center justify-between gap-3 text-left"
          >
            <div className="min-w-0">
              <div className="font-semibold">{c.who}</div>
              <div className="truncate text-sm text-neutral-500">{snip}</div>
            </div>
            <div className="flex shrink-0 gap-1">
              {c.blocked ? (
                <span className="pill bg-neutral-800 text-white">bloqueado</span>
              ) : !c.auto_reply ? (
                <span className="pill bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">auto off</span>
              ) : null}
              {c.has_pending && (
                <span className="pill bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">pendente</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
