import { formatUsd } from "@/lib/format";

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warn" | "good";
}) {
  const toneClass =
    tone === "warn"
      ? "border-amber-500/20 bg-amber-500/5"
      : tone === "good"
        ? "border-emerald-500/20 bg-emerald-500/5"
        : "border-white/10 bg-white/[0.03]";

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}

export function BudgetBar({
  spent,
  budget,
}: {
  spent: number;
  budget: number;
}) {
  const pct = Math.min(100, Math.round((spent / budget) * 100));
  const warn = pct >= 80;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-slate-400">Daily budget burn</span>
        <span className={warn ? "text-amber-300" : "text-slate-200"}>
          {formatUsd(spent)} / {formatUsd(budget)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all ${warn ? "bg-amber-400" : "bg-emerald-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
