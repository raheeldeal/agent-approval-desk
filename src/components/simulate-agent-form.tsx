"use client";

import { usePostHog } from "@posthog/next";
import { useState } from "react";
import { captureDeskEvent } from "@/lib/analytics";
import type { IntentCategory } from "@/lib/types";

const presets = [
  {
    title: "Enrich company profile",
    description: "Funding, headcount, HQ for a target account.",
    category: "data_enrichment" as IntentCategory,
    amountUsd: 0.12,
    endpoint: "https://stableenrich.dev/api/enrich/company",
  },
  {
    title: "Verify work email",
    description: "Check deliverability before outbound sequence.",
    category: "api_call" as IntentCategory,
    amountUsd: 0.03,
    endpoint: "https://stableenrich.dev/api/verify/email",
  },
  {
    title: "Scrape pricing page",
    description: "Pull public pricing table for competitive analysis.",
    category: "web_scrape" as IntentCategory,
    amountUsd: 0.08,
    endpoint: "https://stableenrich.dev/api/scrape",
  },
];

export function SimulateAgentForm() {
  const posthog = usePostHog();
  const [agentName, setAgentName] = useState("Research Agent");
  const [title, setTitle] = useState(presets[0].title);
  const [description, setDescription] = useState(presets[0].description);
  const [category, setCategory] = useState<IntentCategory>(presets[0].category);
  const [amountUsd, setAmountUsd] = useState(presets[0].amountUsd);
  const [endpoint, setEndpoint] = useState(presets[0].endpoint);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function applyPreset(index: number) {
    const preset = presets[index];
    setTitle(preset.title);
    setDescription(preset.description);
    setCategory(preset.category);
    setAmountUsd(preset.amountUsd);
    setEndpoint(preset.endpoint);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    captureDeskEvent(posthog, "intent_created", {
      amount_usd: amountUsd,
      category,
      agent_name: agentName,
    });

    const response = await fetch("/api/intents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentName,
        title,
        description,
        category,
        amountUsd,
        endpoint,
      }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error || "Failed to create intent");
      return;
    }

    if (data.autoApproved) {
      captureDeskEvent(posthog, "intent_auto_approved", {
        intent_id: data.intent.id,
        amount_usd: amountUsd,
      });
      setMessage("Intent auto-approved under your threshold and settled.");
    } else {
      setMessage("Intent queued for human approval on the desk.");
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-300/80">
          Agent simulator
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          Request a purchase
        </h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Pretend you are an autonomous agent asking to spend USDC via x402.
          Intents under your auto-approve threshold settle immediately.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {presets.map((preset, index) => (
          <button
            key={preset.title}
            type="button"
            onClick={() => applyPreset(index)}
            className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5"
          >
            {preset.title}
          </button>
        ))}
      </div>

      <form
        onSubmit={submit}
        className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6"
      >
        <label className="block space-y-2 text-sm">
          <span className="text-slate-400">Agent name</span>
          <input
            value={agentName}
            onChange={(event) => setAgentName(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none ring-emerald-400/40 focus:ring"
          />
        </label>

        <label className="block space-y-2 text-sm">
          <span className="text-slate-400">Purchase title</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none ring-emerald-400/40 focus:ring"
          />
        </label>

        <label className="block space-y-2 text-sm">
          <span className="text-slate-400">Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none ring-emerald-400/40 focus:ring"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2 text-sm">
            <span className="text-slate-400">Amount (USD)</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amountUsd}
              onChange={(event) => setAmountUsd(Number(event.target.value))}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none ring-emerald-400/40 focus:ring"
            />
          </label>
          <label className="block space-y-2 text-sm">
            <span className="text-slate-400">Category</span>
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as IntentCategory)
              }
              className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none ring-emerald-400/40 focus:ring"
            >
              <option value="api_call">API call</option>
              <option value="data_enrichment">Data enrichment</option>
              <option value="web_scrape">Web scrape</option>
              <option value="compute">Compute</option>
              <option value="other">Other</option>
            </select>
          </label>
        </div>

        <label className="block space-y-2 text-sm">
          <span className="text-slate-400">x402 endpoint</span>
          <input
            value={endpoint}
            onChange={(event) => setEndpoint(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none ring-emerald-400/40 focus:ring"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
        >
          {loading ? "Submitting…" : "Submit purchase intent"}
        </button>

        {message ? (
          <p className="text-sm text-emerald-200">{message}</p>
        ) : null}
      </form>
    </div>
  );
}
