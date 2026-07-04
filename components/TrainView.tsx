"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, apiPost } from "@/lib/api";
import type { ThreadResp } from "@/types";
import { Loading, Thread } from "./Bits";

interface Proposal {
  summary: string;
  proposed_prompt: string;
  current_prompt: string;
}

export default function TrainView({ conversationId }: { conversationId: string }) {
  const [thread, setThread] = useState<ThreadResp | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState<"" | "gen" | "apply" | "round">("");
  const [err, setErr] = useState("");
  const [prop, setProp] = useState<Proposal | null>(null);
  const [edited, setEdited] = useState(""); // editable "depois"
  const [showRefine, setShowRefine] = useState(false);
  const [refinement, setRefinement] = useState("");
  const [done, setDone] = useState("");

  useEffect(() => {
    apiGet<ThreadResp>("?action=thread&id=" + encodeURIComponent(conversationId)).then((r) => {
      if (r.ok) setThread(r.body);
    });
  }, [conversationId]);

  async function generate(round: boolean) {
    setBusy(round ? "round" : "gen");
    setErr("");
    setDone("");
    const payload: { action: string; conversationId: string; notes: string; prior?: string; refinement?: string } = {
      action: "train",
      conversationId,
      notes,
    };
    if (round && prop) {
      payload.prior = edited;
      payload.refinement = refinement;
    }
    const r = await apiPost<Proposal & { error?: string }>(payload);
    setBusy("");
    if (!r.ok) {
      setErr(r.body.error || `erro ${r.status}`);
      return;
    }
    setProp({ summary: r.body.summary, proposed_prompt: r.body.proposed_prompt, current_prompt: r.body.current_prompt });
    setEdited(r.body.proposed_prompt);
    setShowRefine(false);
    setRefinement("");
  }

  async function apply() {
    setBusy("apply");
    setErr("");
    setDone("");
    const r = await apiPost({ action: "prompt", text: edited });
    setBusy("");
    if (!r.ok) {
      setErr(r.body.error || `erro ${r.status}`);
      return;
    }
    setDone("Prompt do sistema atualizado! O agente já usa a nova versão.");
    setProp(null);
  }

  function reject() {
    setProp(null);
    setEdited("");
    setShowRefine(false);
    setRefinement("");
  }

  if (!thread) return <Loading />;

  return (
    <div>
      <Link
        href={`/conversa/?id=${encodeURIComponent(conversationId)}`}
        className="mb-2 inline-block text-sm font-medium text-blue-600"
      >
        ← voltar para a conversa
      </Link>

      <div className="card">
        <h3 className="font-semibold">Treinar com esta conversa</h3>
        <p className="mb-2 mt-0.5 text-sm text-neutral-500">
          A IA analisa a conversa e o seu feedback e sugere uma melhoria no prompt do sistema. Nada é
          aplicado sem a sua aprovação.
        </p>
        <div className="lbl">Conversa</div>
        <Thread messages={thread.messages} />
      </div>

      <div className="card mt-3">
        <div className="lbl">Seu feedback (opcional, mas ajuda muito)</div>
        <textarea
          className="field min-h-[110px]"
          placeholder={
            'Ex.: "A IA falou X que não é verdade, o certo é Y." / "Faltou mencionar Z." / "Essa conversa funcionou, use como bom exemplo."'
          }
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        {!prop && (
          <button className="btn-approve mt-2 w-full" disabled={!!busy} onClick={() => generate(false)}>
            {busy === "gen" ? "Analisando..." : "Gerar sugestão de melhoria"}
          </button>
        )}
        {err && !prop && <p className="mt-2 text-sm text-red-600">{err}</p>}
        {done && <p className="mt-2 text-sm text-emerald-600">{done}</p>}
      </div>

      {prop && (
        <div className="card mt-3">
          <h3 className="font-semibold">Sugestão da IA</h3>
          <div className="lbl">O que mudou e por quê</div>
          <div className="whitespace-pre-wrap rounded-lg bg-neutral-50 p-3 text-sm dark:bg-neutral-800/50">
            {prop.summary}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <div className="lbl">Antes (atual)</div>
              <textarea className="field min-h-[220px] font-mono text-xs" value={prop.current_prompt} readOnly />
            </div>
            <div>
              <div className="lbl">Depois (proposto, editável)</div>
              <textarea
                className="field min-h-[220px] font-mono text-xs"
                value={edited}
                onChange={(e) => setEdited(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn-approve flex-1" disabled={!!busy} onClick={apply}>
              {busy === "apply" ? "Aplicando..." : "Aceitar e aplicar"}
            </button>
            <button className="btn-ghost flex-1" disabled={!!busy} onClick={reject}>
              Rejeitar
            </button>
            <button className="btn-suggest flex-1" disabled={!!busy} onClick={() => setShowRefine((s) => !s)}>
              Outra
            </button>
          </div>

          {showRefine && (
            <div className="mt-2">
              <div className="lbl">O que ajustar nesta proposta</div>
              <textarea
                className="field min-h-[80px]"
                placeholder={'Ex.: "Deixe o tom mais direto." / "Inclua uma regra sobre frete grátis."'}
                value={refinement}
                onChange={(e) => setRefinement(e.target.value)}
              />
              <button className="btn-approve mt-2 w-full" disabled={!!busy} onClick={() => generate(true)}>
                {busy === "round" ? "Refinando..." : "Gerar nova rodada"}
              </button>
            </div>
          )}
          {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
        </div>
      )}
    </div>
  );
}
