"use client";

import { usePostHog } from "@posthog/next";
import { Check, Loader2, X } from "lucide-react";
import { useState } from "react";
import { captureDeskEvent } from "@/lib/analytics";
import { formatDateTime, formatRelativeTime, formatUsd } from "@/lib/format";
import type { PurchaseIntent } from "@/lib/types";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-200",
  processing: "bg-sky-500/15 text-sky-200",
  settled: "bg-emerald-500/15 text-emerald-200",
  denied: "bg-rose-500/15 text-rose-200",
  failed: "bg-rose-500/15 text-rose-200",
  approved: "bg-sky-500/15 text-sky-200",
};

export function IntentCard({
  intent,
  onChange,
}: {
  intent: PurchaseIntent;
  onChange: () => void;
}) {
  const posthog = usePostHog();
  const [loading, setLoading] = useState<"approve" | "deny" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    setLoading("approve");
    setError(null);
    captureDeskEvent(posthog, "intent_approve_clicked", {
      intent_id: intent.id,
      amount_usd: intent.amountUsd,
    });

    const response = await fetch(`/api/intents/${intent.id}/approve`, {
      method: "POST",
    });
    const data = await response.json();
    setLoading(null);

    if (!response.ok) {
      setError(data.error || "Approval failed");
      captureDeskEvent(posthog, "intent_approval_failed", {
        intent_id: intent.id,
        reason: data.error,
      });
      return;
    }

    captureDeskEvent(posthog, "intent_approved", {
      intent_id: intent.id,
      amount_usd: intent.amountUsd,
      mode: data.receipt?.mode,
    });
    onChange();
  }

  async function deny() {
    setLoading("deny");
    setError(null);
    captureDeskEvent(posthog, "intent_deny_clicked", { intent_id: intent.id });

    const response = await fetch(`/api/intents/${intent.id}/deny`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Denied by operator" }),
    });
    setLoading(null);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Deny failed");
      return;
    }

    captureDeskEvent(posthog, "intent_denied", { intent_id: intent.id });
    onChange();
  }

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[intent.status]}`}
            >
              {intent.status}
            </span>
            <span className="text-xs text-slate-500">
              {formatRelativeTime(intent.createdAt)}
            </span>
          </div>
          <h3 className="mt-3 text-lg font-semibold text-white">{intent.title}</h3>
          <p className="mt-1 text-sm text-slate-400">{intent.description}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-white">
            {formatUsd(intent.amountUsd)}
          </p>
          <p className="text-xs text-slate-500">{intent.agentName}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
        <span className="rounded-full border border-white/10 px-2 py-1">
          {intent.category.replace("_", " ")}
        </span>
        {intent.endpoint ? (
          <span className="truncate rounded-full border border-white/10 px-2 py-1">
            {intent.endpoint}
          </span>
        ) : null}
      </div>

      {intent.receipt ? (
        <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-100">
          <p className="font-medium">Receipt · {intent.receipt.mode}</p>
          <p className="mt-1 text-emerald-200/80">{intent.receipt.summary}</p>
          <p className="mt-2 text-xs text-emerald-300/70">
            {intent.receipt.txId} · {formatDateTime(intent.receipt.settledAt)}
          </p>
        </div>
      ) : null}

      {intent.denialReason && intent.status === "denied" ? (
        <p className="mt-4 text-sm text-rose-300">{intent.denialReason}</p>
      ) : null}

      {intent.status === "pending" ? (
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={approve}
            disabled={loading !== null}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950 transition hover:bg-emerald-400 disabled:opacity-60"
          >
            {loading === "approve" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Approve & pay
          </button>
          <button
            type="button"
            onClick={deny}
            disabled={loading !== null}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/5 disabled:opacity-60"
          >
            {loading === "deny" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
            Deny
          </button>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </article>
  );
}
