"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS: [string, string][] = [
  ["/pendentes/", "Pendentes"],
  ["/conversas/", "Conversas"],
  ["/campanhas/", "Campanhas"],
  ["/config/", "Config"],
];

export default function TopBar({
  autoOn,
  onToggle,
  onLogout,
}: {
  autoOn: boolean;
  onToggle: () => void;
  onLogout: () => void;
}) {
  const path = usePathname();
  // "Conversas" stays active on the conversation detail route (/conversa/).
  const active = (href: string) =>
    href === "/conversas/" ? path.startsWith("/conversa") : path === href;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
        <span className="font-semibold">CognX · Operador</span>
        <div className="flex items-center gap-3">
          <button
            onClick={onToggle}
            className={`pill ${
              autoOn
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
            }`}
          >
            Auto: {autoOn ? "ON" : "OFF"}
          </button>
          <button onClick={onLogout} className="text-sm font-medium text-blue-600">
            sair
          </button>
        </div>
      </div>

      <div className="flex gap-1 rounded-2xl border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900">
        {TABS.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className={`flex-1 rounded-xl px-3 py-2 text-center text-sm font-semibold transition ${
              active(href)
                ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
