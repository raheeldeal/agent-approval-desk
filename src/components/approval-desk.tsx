"use client";

import { useCallback, useEffect, useState } from "react";
import { IntentCard } from "@/components/intent-card";
import { BudgetBar, StatCard } from "@/components/stat-card";
import { formatUsd } from "@/lib/format";
import type { DeskSettings, PurchaseIntent } from "@/lib/types";

export function ApprovalDesk() {
  const [intents, setIntents] = useState<PurchaseIntent[]>([]);
  const [settings, setSettings] = useState<DeskSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [intentsRes, settingsRes] = await Promise.all([
      fetch("/api/intents"),
      fetch("/api/settings"),
    ]);
    const intentsData = await intentsRes.json();
    const settingsData = await settingsRes.json();
    setIntents(intentsData.intents);
    setSettings(settingsData.settings);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 8000);
    return () => clearInterval(timer);
  }, [refresh]);

  if (loading || !settings) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-slate-400">
        Loading approval desk…
      </div>
    );
  }

  const pending = intents.filter((intent) => intent.status === "pending");
  const settled = intents.filter((intent) => intent.status === "settled");
  const denied = intents.filter((intent) => intent.status === "denied");

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-300/80">
          Operator console
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          Agent purchase approvals
        </h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Review agent spend intents, approve x402 settlements, and enforce
          guardrails inspired by Stripe Issuing for agents.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pending" value={String(pending.length)} hint="Needs human review" tone={pending.length ? "warn" : "good"} />
        <StatCard label="Settled today" value={String(settled.length)} hint="Approved payments" tone="good" />
        <StatCard label="Denied" value={String(denied.length)} hint="Blocked by operator" />
        <StatCard
          label="Session payments"
          value={`${settings.paymentsThisSession}/${settings.maxPaymentsPerSession}`}
          hint={`Auto-approve under ${formatUsd(settings.autoApproveUnderUsd)}`}
        />
      </div>

      <BudgetBar spent={settings.spendTodayUsd} budget={settings.dailyBudgetUsd} />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-white">Queue</h2>
          <button
            type="button"
            onClick={() => void refresh()}
            className="text-sm text-emerald-300 hover:text-emerald-200"
          >
            Refresh
          </button>
        </div>

        {pending.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-400">
            No pending intents. Use Simulate Agent to create one.
          </div>
        ) : (
          pending.map((intent) => (
            <IntentCard key={intent.id} intent={intent} onChange={refresh} />
          ))
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-white">Ledger</h2>
        <div className="space-y-4">
          {intents
            .filter((intent) => intent.status !== "pending")
            .slice(0, 8)
            .map((intent) => (
              <IntentCard key={intent.id} intent={intent} onChange={refresh} />
            ))}
        </div>
      </section>
    </div>
  );
}
