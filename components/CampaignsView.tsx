"use client";
import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import type { Campaign, CampaignLogItem, IgMedia } from "@/types";
import { Loading } from "./Bits";

const BLANK: Campaign = {
  id: null,
  label: "",
  media_id: null,
  keyword: "",
  match_type: "contains",
  dm_message: "",
  public_reply: null,
  enabled: true,
};

export default function CampaignsView() {
  const [items, setItems] = useState<Campaign[] | null>(null);
  const [log, setLog] = useState<CampaignLogItem[]>([]);
  const [media, setMedia] = useState<IgMedia[] | null>(null);
  const [mediaErr, setMediaErr] = useState("");

  async function load() {
    const r = await apiGet<{ campaigns: Campaign[] }>("?action=campaigns");
    if (r.ok) setItems(r.body.campaigns);
    const l = await apiGet<{ log: CampaignLogItem[] }>("?action=campaign_log");
    if (l.ok) setLog(l.body.log);
  }

  useEffect(() => {
    load();
  }, []);

  async function loadMedia() {
    setMediaErr("");
    const r = await apiGet<{ media: IgMedia[]; error?: string }>("?action=media");
    if (r.ok) setMedia(r.body.media);
    else setMediaErr(r.body.error || "não foi possível listar os vídeos; cole o ID manualmente.");
  }

  function addNew() {
    setItems((prev) => [{ ...BLANK }, ...(prev ?? [])]);
  }

  function removeLocal(idx: number) {
    setItems((prev) => (prev ?? []).filter((_, i) => i !== idx));
  }

  if (items === null) return <Loading />;

  return (
    <div className="space-y-3">
      <div className="card">
        <h3 className="font-semibold">Comentou → DM automático</h3>
        <p className="mb-2 mt-0.5 text-sm text-neutral-500">
          Quando alguém comenta a palavra-chave em um vídeo seu, o agente envia um DM personalizado.
          Cada campanha é um vídeo com sua própria palavra-chave e mensagem. O comentarista entra com
          auto-resposta desligada, então respostas seguintes vão para aprovação.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn-approve" onClick={addNew}>
            + Nova campanha
          </button>
          <button className="btn-ghost" onClick={loadMedia}>
            Buscar meus vídeos
          </button>
          {mediaErr && <span className="text-xs text-amber-600">{mediaErr}</span>}
          {media && <span className="text-xs text-neutral-500">{media.length} vídeos carregados.</span>}
        </div>
      </div>

      {items.length === 0 && (
        <div className="card text-sm text-neutral-500">
          Nenhuma campanha ainda. Clique em “Nova campanha”.
        </div>
      )}

      {items.map((c, idx) => (
        <CampaignCard
          key={c.id ?? `new-${idx}`}
          campaign={c}
          media={media}
          onSaved={(saved) =>
            setItems((prev) => (prev ?? []).map((x, i) => (i === idx ? saved : x)))
          }
          onDeleted={() => removeLocal(idx)}
        />
      ))}

      <div className="card">
        <h3 className="font-semibold">Atividade recente</h3>
        {log.length === 0 ? (
          <p className="mt-1 text-sm text-neutral-500">Nada por aqui ainda.</p>
        ) : (
          <div className="mt-2 divide-y divide-neutral-200 dark:divide-neutral-800">
            {log.map((e) => (
              <div key={e.comment_id} className="py-2 text-sm">
                <span
                  className={`pill mr-2 ${
                    e.status === "sent"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                      : e.status === "error"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                        : "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                  }`}
                >
                  {e.status === "sent" ? "DM enviado" : e.status === "error" ? "erro" : "ignorado"}
                </span>
                <span className="font-medium">{e.username ? "@" + e.username : "alguém"}</span>{" "}
                comentou “{e.text}”
                {e.campaign && <span className="text-neutral-500"> · {e.campaign}</span>}
                {e.detail && e.status !== "sent" && (
                  <span className="text-neutral-400"> ({e.detail})</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CampaignCard({
  campaign,
  media,
  onSaved,
  onDeleted,
}: {
  campaign: Campaign;
  media: IgMedia[] | null;
  onSaved: (c: Campaign) => void;
  onDeleted: () => void;
}) {
  const [c, setC] = useState<Campaign>(campaign);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  // "Any comment" mode = keyword-less. Existing keyword-less campaigns load into it.
  const [anyComment, setAnyComment] = useState<boolean>(!!campaign.id && !campaign.keyword?.trim());

  const set = <K extends keyof Campaign>(k: K, v: Campaign[K]) => setC((p) => ({ ...p, [k]: v }));

  function toggleAny(v: boolean) {
    setAnyComment(v);
    if (v) set("keyword", "");
  }

  const hasVideo = !!(c.media_id ?? "").trim();

  async function save() {
    if (anyComment && !hasVideo) {
      setMsg("Selecione um vídeo específico para o modo “qualquer comentário”.");
      return;
    }
    setBusy(true);
    setMsg("Salvando...");
    const r = await apiPost<{ campaign: Campaign; error?: string }>({ action: "save_campaign", ...c });
    setBusy(false);
    if (r.ok) {
      onSaved(r.body.campaign);
      setC(r.body.campaign);
      setMsg("Salvo!");
      setTimeout(() => setMsg(""), 1500);
    } else {
      setMsg("Erro: " + (r.body.error || r.status));
    }
  }

  async function remove() {
    if (c.id && !window.confirm("Excluir esta campanha?")) return;
    if (c.id) {
      setBusy(true);
      const r = await apiPost({ action: "delete_campaign", id: c.id });
      setBusy(false);
      if (!r.ok) return setMsg("Erro ao excluir");
    }
    onDeleted();
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-2">
        <input
          className="field"
          placeholder="Nome da campanha (ex.: Reel do sono)"
          value={c.label}
          onChange={(e) => set("label", e.target.value)}
        />
        <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={c.enabled}
            onChange={(e) => set("enabled", e.target.checked)}
          />
          Ativa
        </label>
      </div>

      <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={anyComment}
          onChange={(e) => toggleAny(e.target.checked)}
        />
        <span>
          Responder a <b>qualquer comentário</b> do vídeo (sem palavra-chave)
        </span>
      </label>

      {!anyComment && (
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <div className="lbl">Palavra-chave do comentário</div>
            <input
              className="field"
              placeholder='Ex.: "Eu quero"'
              value={c.keyword ?? ""}
              onChange={(e) => set("keyword", e.target.value)}
            />
          </div>
          <div>
            <div className="lbl">Correspondência</div>
            <select
              className="field"
              value={c.match_type}
              onChange={(e) => set("match_type", e.target.value as "contains" | "exact")}
            >
              <option value="contains">Contém a palavra-chave</option>
              <option value="exact">Texto exato</option>
            </select>
          </div>
        </div>
      )}

      <div className="mt-2">
        <div className="lbl">
          {anyComment ? "Vídeo (obrigatório neste modo)" : "Vídeo (opcional — em branco vale para qualquer vídeo)"}
        </div>
        {media && media.length > 0 ? (
          <select
            className="field"
            value={c.media_id ?? ""}
            onChange={(e) => set("media_id", e.target.value || null)}
          >
            <option value="">Qualquer vídeo</option>
            {media.map((m) => (
              <option key={m.id} value={m.id}>
                {(m.caption?.slice(0, 60) || m.media_type || m.id) + ` · ${m.id}`}
              </option>
            ))}
          </select>
        ) : (
          <input
            className="field"
            placeholder="ID do vídeo/post (em branco = qualquer vídeo)"
            value={c.media_id ?? ""}
            onChange={(e) => set("media_id", e.target.value || null)}
          />
        )}
        {anyComment && !hasVideo && (
          <p className="mt-1 text-xs text-amber-600">
            No modo “qualquer comentário” é preciso escolher um vídeo específico.
          </p>
        )}
      </div>

      <div className="mt-2">
        <div className="lbl">Mensagem do DM</div>
        <textarea
          className="field min-h-[90px]"
          placeholder='Ex.: "Vi que você comentou Eu quero! Aqui está o link..."'
          value={c.dm_message}
          onChange={(e) => set("dm_message", e.target.value)}
        />
      </div>

      <div className="mt-2">
        <div className="lbl">Resposta pública no comentário (opcional)</div>
        <input
          className="field"
          placeholder='Ex.: "Te chamei no direct! 📩"'
          value={c.public_reply ?? ""}
          onChange={(e) => set("public_reply", e.target.value || null)}
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button className="btn-approve" disabled={busy} onClick={save}>
          Salvar
        </button>
        <button className="btn-ghost text-red-600 dark:text-red-400" disabled={busy} onClick={remove}>
          Excluir
        </button>
        {typeof campaign.sent_count === "number" && (
          <span className="text-xs text-neutral-500">{campaign.sent_count} DMs enviados</span>
        )}
        {msg && <span className="text-sm text-neutral-500">{msg}</span>}
      </div>
    </div>
  );
}
