"use client";

import { useEffect, useState } from "react";
import { BudgetBar, StatCard } from "@/components/stat-card";
import { formatUsd } from "@/lib/format";
import type { DeskSettings } from "@/lib/types";

export function SettingsPanel() {
  const [settings, setSettings] = useState<DeskSettings | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const response = await fetch("/api/settings");
    const data = await response.json();
    setSettings(data.settings);
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(patch: Partial<DeskSettings> & { resetSession?: boolean }) {
    setSaving(true);
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await response.json();
    setSettings(data.settings);
    setSaving(false);
    setMessage("Guardrails updated.");
  }

  if (!settings) {
    return <div className="text-slate-400">Loading settings…</div>;
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-300/80">
          Guardrails
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          Spending policy
        </h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Mirrors Stripe Issuing controls: auto-approve small amounts, cap
          payments per session, and enforce a daily budget.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Auto-approve under"
          value={formatUsd(settings.autoApproveUnderUsd)}
        />
        <StatCard
          label="Session cap"
          value={String(settings.maxPaymentsPerSession)}
        />
        <StatCard label="Daily budget" value={formatUsd(settings.dailyBudgetUsd)} />
      </div>

      <BudgetBar spent={settings.spendTodayUsd} budget={settings.dailyBudgetUsd} />

      <form
        className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          void save({
            autoApproveUnderUsd: Number(form.get("autoApproveUnderUsd")),
            maxPaymentsPerSession: Number(form.get("maxPaymentsPerSession")),
            dailyBudgetUsd: Number(form.get("dailyBudgetUsd")),
          });
        }}
      >
        <label className="block space-y-2 text-sm">
          <span className="text-slate-400">Auto-approve under (USD)</span>
          <input
            name="autoApproveUnderUsd"
            type="number"
            min="0"
            step="0.01"
            defaultValue={settings.autoApproveUnderUsd}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white"
          />
        </label>
        <label className="block space-y-2 text-sm">
          <span className="text-slate-400">Max payments per session</span>
          <input
            name="maxPaymentsPerSession"
            type="number"
            min="1"
            step="1"
            defaultValue={settings.maxPaymentsPerSession}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white"
          />
        </label>
        <label className="block space-y-2 text-sm">
          <span className="text-slate-400">Daily budget (USD)</span>
          <input
            name="dailyBudgetUsd"
            type="number"
            min="0.1"
            step="0.1"
            defaultValue={settings.dailyBudgetUsd}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white"
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save guardrails"}
          </button>
          <button
            type="button"
            onClick={() => void save({ resetSession: true })}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
          >
            Reset session counters
          </button>
        </div>
        {message ? <p className="text-sm text-emerald-200">{message}</p> : null}
      </form>
    </div>
  );
}
