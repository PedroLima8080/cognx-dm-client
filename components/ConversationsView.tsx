"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import type { ConvItem } from "@/types";
import { Loading, Empty } from "./Bits";

export default function ConversationsView() {
  const [items, setItems] = useState<ConvItem[] | null>(null);

  useEffect(() => {
    apiGet<{ conversations: ConvItem[] }>("?action=conversations").then((r) =>
      setItems(r.ok ? r.body.conversations : []),
    );
  }, []);

  if (items === null) return <Loading />;
  if (!items.length) return <Empty text="Nenhuma conversa ainda." />;

  return (
    <div className="space-y-3">
      {items.map((c) => {
        const snip = c.last ? (c.last.direction === "in" ? "↩ " : "↪ ") + c.last.content : "";
        // Last message came from the customer → still waiting on our reply.
        const awaiting = c.last?.direction === "in";
        return (
          <Link
            key={c.id}
            href={`/conversa/?id=${encodeURIComponent(c.id)}`}
            className={`card flex w-full items-center justify-between gap-3 text-left ${
              awaiting ? "border-l-4 border-amber-400 bg-amber-50/60 dark:bg-amber-950/20" : ""
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {awaiting && <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />}
                <span className={`font-semibold ${awaiting ? "text-amber-900 dark:text-amber-200" : ""}`}>{c.who}</span>
              </div>
              <div className="truncate text-sm text-neutral-500">{snip}</div>
            </div>
            <div className="flex shrink-0 gap-1">
              {awaiting && (
                <span className="pill bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">aguardando</span>
              )}
              {c.blocked ? (
                <span className="pill bg-neutral-800 text-white">bloqueado</span>
              ) : !c.auto_reply ? (
                <span className="pill bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">auto off</span>
              ) : null}
              {c.has_pending && (
                <span className="pill bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">pendente</span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
