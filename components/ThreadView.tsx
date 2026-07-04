"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGet, apiPost } from "@/lib/api";
import type { ThreadResp } from "@/types";
import { Loading, Thread } from "./Bits";

export default function ThreadView({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const [data, setData] = useState<ThreadResp | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [syncMsg, setSyncMsg] = useState("");

  const load = useCallback(async () => {
    const r = await apiGet<ThreadResp>("?action=thread&id=" + encodeURIComponent(conversationId));
    if (r.ok) {
      setData(r.body);
      setText(r.body.pending_draft?.draft_text ?? "");
    }
  }, [conversationId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!data) return <Loading />;

  async function run(label: string, body: unknown, reload = true) {
    setBusy(label);
    setErr("");
    const r = await apiPost(body);
    setBusy("");
    if (!r.ok) {
      setErr(r.body.error || `erro ${r.status}`);
      return false;
    }
    if (reload) await load();
    return true;
  }

  async function suggest() {
    setBusy("suggest");
    setErr("");
    const r = await apiPost<{ suggestion?: string; error?: string }>({ action: "suggest", conversationId });
    setBusy("");
    if (r.ok) setText(r.body.suggestion ?? "");
    else setErr(r.body.error || `erro ${r.status}`);
  }

  async function sync() {
    setBusy("sync");
    setErr("");
    setSyncMsg("");
    const r = await apiPost<{ added?: number; error?: string }>({ action: "sync_conversation", conversationId });
    setBusy("");
    if (!r.ok) {
      setErr(r.body.error || `erro ${r.status}`);
      return;
    }
    setSyncMsg(r.body.added ? `${r.body.added} mensagem(ns) trazida(s) do Instagram.` : "Já estava tudo sincronizado.");
    await load();
  }

  async function del() {
    if (!window.confirm("Excluir esta conversa e todo o histórico? Isso não pode ser desfeito.")) return;
    setBusy("delete");
    setErr("");
    const r = await apiPost({ action: "delete_conversation", conversationId });
    setBusy("");
    if (r.ok) router.push("/conversas/");
    else setErr(r.body.error || `erro ${r.status}`);
  }

  return (
    <div>
      <Link href="/conversas/" className="mb-2 inline-block text-sm font-medium text-blue-600">
        ← voltar
      </Link>

      {data.blocked ? (
        <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          Perfil BLOQUEADO: mensagens dele não são respondidas.
        </p>
      ) : !data.auto_reply ? (
        <p className="mb-2 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
          Auto-resposta DESLIGADA para este cliente: as respostas sempre vão para aprovação.
        </p>
      ) : null}

      {data.pending_draft && (
        <p className="mb-2 text-sm text-neutral-500">
          Há um rascunho pendente ({data.pending_draft.category}). Edite abaixo e envie.
        </p>
      )}

      <div className="card">
        <Thread messages={data.messages} />
      </div>

      <div className="card mt-3">
        <div className="lbl">Mensagem</div>
        <textarea className="field min-h-[90px]" value={text} onChange={(e) => setText(e.target.value)} />

        <div className="mt-2 flex gap-2">
          {data.pending_draft && (
            <button
              className="btn-approve flex-1"
              disabled={!!busy}
              onClick={() => run("approve", { action: "approve", draftId: data.pending_draft!.id, editedText: text })}
            >
              {busy === "approve" ? "..." : "Aprovar rascunho"}
            </button>
          )}
          <button
            className="btn-primary flex-1"
            disabled={!!busy}
            onClick={() => run("send", { action: "send", conversationId, text })}
          >
            {busy === "send" ? "..." : "Enviar"}
          </button>
        </div>

        <div className="mt-2">
          <button className="btn-suggest w-full" disabled={!!busy} onClick={suggest}>
            {busy === "suggest" ? "Pensando..." : "✨ Sugerir próxima msg"}
          </button>
        </div>

        <div className="mt-2 flex gap-2">
          <button className="btn-ghost flex-1" disabled={!!busy} onClick={sync}>
            {busy === "sync" ? "Sincronizando..." : "🔄 Sincronizar"}
          </button>
          <Link
            href={`/treinar/?id=${encodeURIComponent(conversationId)}`}
            className="btn-ghost flex-1 text-center"
          >
            🎓 Treinar
          </Link>
        </div>
        {syncMsg && <p className="mt-1 text-sm text-neutral-500">{syncMsg}</p>}

        <div className="mt-2 flex gap-2">
          <button
            className="btn-ghost flex-1"
            disabled={!!busy}
            onClick={() => run("auto", { action: "set_auto", conversationId, auto_reply: !data.auto_reply })}
          >
            Auto p/ cliente: {data.auto_reply ? "ON" : "OFF"}
          </button>
          <button
            className="btn-danger flex-1"
            disabled={!!busy}
            onClick={() => run("block", { action: "block", conversationId, blocked: !data.blocked })}
          >
            {data.blocked ? "Desbloquear" : "Bloquear"}
          </button>
        </div>

        <div className="mt-2">
          <button className="btn-ghost w-full text-red-600 dark:text-red-400" disabled={!!busy} onClick={del}>
            {busy === "delete" ? "..." : "Excluir conversa"}
          </button>
        </div>

        {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
      </div>
    </div>
  );
}
