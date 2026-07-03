"use client";
import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import type { PendingItem } from "@/types";
import { Loading, Empty, Thread } from "./Bits";

export default function PendingView() {
  const [items, setItems] = useState<PendingItem[] | null>(null);

  useEffect(() => {
    apiGet<{ pending: PendingItem[] }>("?action=pending").then((r) =>
      setItems(r.ok ? r.body.pending : []),
    );
  }, []);

  if (items === null) return <Loading />;
  if (!items.length) return <Empty text="Nenhuma mensagem aguardando aprovação." />;

  return (
    <div className="space-y-3">
      {items.map((d) => (
        <PendingCard key={d.id} item={d} onDone={() => setItems((xs) => (xs ?? []).filter((x) => x.id !== d.id))} />
      ))}
    </div>
  );
}

function PendingCard({ item, onDone }: { item: PendingItem; onDone: () => void }) {
  const [text, setText] = useState(item.draft_text);
  const [busy, setBusy] = useState<"" | "approve" | "reject">("");
  const [err, setErr] = useState("");

  async function act(action: "approve" | "reject") {
    setBusy(action);
    setErr("");
    const r = await apiPost({ action, draftId: item.id, editedText: text });
    if (r.ok) onDone();
    else {
      setErr(r.body.error || `erro ${r.status}`);
      setBusy("");
    }
  }

  return (
    <div className="card">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-semibold">{item.who}</span>
        <span className="pill bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">{item.category}</span>
      </div>
      {item.reason && <p className="mb-2 text-sm text-neutral-500">{item.reason}</p>}

      <div className="lbl">Conversa</div>
      <Thread messages={item.messages} />

      <div className="lbl">Resposta sugerida (edite se quiser)</div>
      <textarea className="field min-h-[90px]" value={text} onChange={(e) => setText(e.target.value)} />

      <div className="mt-2 flex gap-2">
        <button className="btn-approve flex-1" onClick={() => act("approve")} disabled={!!busy}>
          {busy === "approve" ? "..." : "Aprovar e enviar"}
        </button>
        <button className="btn-ghost flex-1" onClick={() => act("reject")} disabled={!!busy}>
          {busy === "reject" ? "..." : "Rejeitar"}
        </button>
      </div>
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
    </div>
  );
}
