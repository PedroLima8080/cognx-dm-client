"use client";
import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import type { DisabledItem, Settings } from "@/types";
import { Loading } from "./Bits";

// category key → friendly label
const CATS: [string, string][] = [
  ["greeting", "Saudação / rapport"],
  ["faq", "Dúvida simples (FAQ)"],
  ["smalltalk", "Conversa leve"],
  ["price", "Preço / cupom"],
  ["objection", "Objeção"],
  ["health_claim", "Saúde / ansiedade / sono"],
  ["closing", "Fechamento"],
  ["payment", "Pagamento"],
  ["other", "Suspeita / spam"],
];

export default function ConfigView() {
  const [prompt, setPrompt] = useState<string | null>(null);
  const [disabled, setDisabled] = useState<DisabledItem[]>([]);
  const [saveMsg, setSaveMsg] = useState("");
  const [newIg, setNewIg] = useState("");
  const [newMode, setNewMode] = useState<"auto" | "block">("auto");

  const [settings, setSettings] = useState<Settings | null>(null);
  const [settingsMsg, setSettingsMsg] = useState("");
  const [catMsg, setCatMsg] = useState("");

  async function loadDisabled() {
    const r = await apiGet<{ disabled: DisabledItem[] }>("?action=disabled");
    if (r.ok) setDisabled(r.body.disabled);
  }

  useEffect(() => {
    apiGet<{ prompt: string }>("?action=prompt").then((r) => setPrompt(r.ok ? r.body.prompt : ""));
    apiGet<{ settings: Settings }>("?action=settings").then((r) => r.ok && setSettings(r.body.settings));
    loadDisabled();
  }, []);

  async function savePrompt() {
    setSaveMsg("Salvando...");
    const r = await apiPost({ action: "prompt", text: prompt });
    setSaveMsg(r.ok ? "Salvo!" : "Erro: " + (r.body.error || r.status));
    if (r.ok) setTimeout(() => setSaveMsg(""), 1500);
  }

  function setNum(key: keyof Settings, v: string) {
    if (!settings) return;
    setSettings({ ...settings, [key]: Number(v) });
  }

  async function saveSettings() {
    if (!settings) return;
    setSettingsMsg("Salvando...");
    const keys: (keyof Settings)[] = ["debounce_seconds", "per_user_hourly_cap", "daily_auto_cap"];
    for (const k of keys) {
      const r = await apiPost({ action: "setting", key: k, value: settings[k] });
      if (!r.ok) return setSettingsMsg("Erro: " + (r.body.error || r.status));
    }
    setSettingsMsg("Salvo!");
    setTimeout(() => setSettingsMsg(""), 1500);
  }

  // checked = category REQUIRES approval (is in approval_categories = NOT auto)
  function toggleCat(cat: string) {
    if (!settings) return;
    const has = settings.approval_categories.includes(cat);
    const next = has
      ? settings.approval_categories.filter((c) => c !== cat)
      : [...settings.approval_categories, cat];
    setSettings({ ...settings, approval_categories: next });
  }

  async function saveCats() {
    if (!settings) return;
    setCatMsg("Salvando...");
    const posts: [keyof Settings, unknown][] = [
      ["approval_categories", settings.approval_categories],
      ["custom_rule_enabled", settings.custom_rule_enabled],
      ["custom_rule", settings.custom_rule],
    ];
    for (const [key, value] of posts) {
      const r = await apiPost({ action: "setting", key, value });
      if (!r.ok) return setCatMsg("Erro: " + (r.body.error || r.status));
    }
    setCatMsg("Salvo!");
    setTimeout(() => setCatMsg(""), 1500);
  }

  async function reactivate(c: DisabledItem) {
    const patch: any = { action: "set_flags", ig_user_id: c.ig_user_id };
    if (c.blocked) patch.blocked = false;
    else patch.auto_reply = true;
    const r = await apiPost(patch);
    if (r.ok) loadDisabled();
  }

  async function addManual() {
    const ig = newIg.trim();
    if (!ig) return;
    const r = await apiPost({ action: "add_disabled", ig_user_id: ig, mode: newMode });
    if (r.ok) {
      setNewIg("");
      loadDisabled();
    }
  }

  if (prompt === null) return <Loading />;

  return (
    <div className="space-y-3">
      <div className="card">
        <h3 className="font-semibold">Não responder automaticamente</h3>
        <p className="mb-2 mt-0.5 text-sm text-neutral-500">
          Marque os tipos de mensagem que devem SEMPRE ir para a fila de aprovação. Os desmarcados
          são respondidos automaticamente (respeitando as travas de segurança).
        </p>
        {!settings ? (
          <p className="text-sm text-neutral-500">Carregando...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {CATS.map(([key, label]) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={settings.approval_categories.includes(key)}
                    onChange={() => toggleCat(key)}
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>

            <div className="mt-2 border-t border-neutral-200 pt-2 dark:border-neutral-800">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={settings.custom_rule_enabled}
                  onChange={(e) => setSettings({ ...settings, custom_rule_enabled: e.target.checked })}
                />
                <span className="text-sm font-medium">Outra (regra personalizada)</span>
              </label>
              {settings.custom_rule_enabled && (
                <div className="px-2">
                  <textarea
                    className="field mt-1 min-h-[70px]"
                    placeholder='Ex.: "Se o cliente perguntar sobre reembolso ou trocar de produto"'
                    value={settings.custom_rule}
                    onChange={(e) => setSettings({ ...settings, custom_rule: e.target.value })}
                  />
                  <p className="mt-1 text-xs text-neutral-500">
                    Se a mensagem se enquadrar nessa condição, a resposta vai para aprovação (mesmo que
                    a categoria seja automática).
                  </p>
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center gap-3">
              <button className="btn-approve" onClick={saveCats}>
                Salvar
              </button>
              {catMsg && <span className="text-sm text-neutral-500">{catMsg}</span>}
            </div>
          </>
        )}
      </div>

      <div className="card">
        <h3 className="font-semibold">Ajustes</h3>
        {!settings ? (
          <p className="mt-1 text-sm text-neutral-500">Carregando...</p>
        ) : (
          <>
            <div className="lbl">Delay de agrupamento (segundos)</div>
            <input
              className="field"
              type="number"
              min={0}
              max={100}
              value={settings.debounce_seconds}
              onChange={(e) => setNum("debounce_seconds", e.target.value)}
            />
            <p className="mt-1 text-xs text-neutral-500">
              Espera esse tempo depois da última mensagem antes de responder, agrupando mensagens
              picadas em uma resposta só. 0 = responde na hora.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="lbl">Limite por pessoa/hora</div>
                <input
                  className="field"
                  type="number"
                  min={1}
                  value={settings.per_user_hourly_cap}
                  onChange={(e) => setNum("per_user_hourly_cap", e.target.value)}
                />
              </div>
              <div>
                <div className="lbl">Teto diário (auto)</div>
                <input
                  className="field"
                  type="number"
                  min={1}
                  value={settings.daily_auto_cap}
                  onChange={(e) => setNum("daily_auto_cap", e.target.value)}
                />
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <button className="btn-approve" onClick={saveSettings}>
                Salvar ajustes
              </button>
              {settingsMsg && <span className="text-sm text-neutral-500">{settingsMsg}</span>}
            </div>
          </>
        )}
      </div>

      <div className="card">
        <h3 className="font-semibold">Prompt do sistema</h3>
        <p className="mb-2 mt-0.5 text-sm text-neutral-500">
          Define a persona e as regras do vendedor. As regras de segurança e o formato de saída ficam
          fixos no código e são sempre aplicados.
        </p>
        <textarea className="field min-h-[260px] font-mono text-xs" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        <div className="mt-2 flex items-center gap-3">
          <button className="btn-approve" onClick={savePrompt}>
            Salvar prompt
          </button>
          {saveMsg && <span className="text-sm text-neutral-500">{saveMsg}</span>}
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold">Auto-resposta desabilitada / bloqueados</h3>
        <div className="mt-2 divide-y divide-neutral-200 dark:divide-neutral-800">
          {disabled.length === 0 && <p className="py-2 text-sm text-neutral-500">Ninguém por aqui.</p>}
          {disabled.map((c) => (
            <div key={c.ig_user_id} className="flex items-center justify-between gap-2 py-2.5">
              <span className="min-w-0 truncate text-sm">
                {c.who}{" "}
                <span
                  className={`pill ${
                    c.blocked ? "bg-neutral-800 text-white" : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                  }`}
                >
                  {c.blocked ? "bloqueado" : "auto off"}
                </span>
              </span>
              <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => reactivate(c)}>
                Reativar
              </button>
            </div>
          ))}
        </div>

        <div className="lbl">Adicionar manualmente (por ID do Instagram / IGSID)</div>
        <input className="field" placeholder="ig_user_id" value={newIg} onChange={(e) => setNewIg(e.target.value)} />
        <div className="mt-2 flex gap-2">
          <select className="field" value={newMode} onChange={(e) => setNewMode(e.target.value as "auto" | "block")}>
            <option value="auto">Desligar auto-resposta</option>
            <option value="block">Bloquear total</option>
          </select>
          <button className="btn-primary shrink-0" onClick={addManual}>
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}
