import { NextResponse } from "next/server";
import { executeApprovedPayment } from "@/lib/payments";
import {
  addIntent,
  getSettings,
  recordSpend,
  updateIntent,
} from "@/lib/store";
import type { IntentCategory } from "@/lib/types";

async function tryAutoApprove(intentId: string) {
  const { getIntent } = await import("@/lib/store");
  const intent = await getIntent(intentId);
  if (!intent || intent.status !== "pending") return intent;

  const settings = await getSettings();
  if (intent.amountUsd > settings.autoApproveUnderUsd) return intent;
  if (settings.paymentsThisSession >= settings.maxPaymentsPerSession) return intent;
  if (settings.spendTodayUsd + intent.amountUsd > settings.dailyBudgetUsd) {
    return intent;
  }

  await updateIntent(intentId, { status: "processing" });

  try {
    const receipt = await executeApprovedPayment(intent);
    const settled = await updateIntent(intentId, {
      status: "settled",
      resolvedAt: new Date().toISOString(),
      resolvedBy: "auto",
      receipt,
    });
    await recordSpend(intent.amountUsd);
    return settled;
  } catch (error) {
    return updateIntent(intentId, {
      status: "failed",
      resolvedAt: new Date().toISOString(),
      resolvedBy: "auto",
      denialReason:
        error instanceof Error ? error.message : "Auto-approval payment failed",
    });
  }
}

export async function GET() {
  const { listIntents } = await import("@/lib/store");
  const intents = await listIntents();
  return NextResponse.json({ intents });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    agentId?: string;
    agentName?: string;
    title?: string;
    description?: string;
    category?: IntentCategory;
    amountUsd?: number;
    endpoint?: string;
  };

  if (!body.title?.trim() || !body.agentName?.trim() || !body.amountUsd) {
    return NextResponse.json(
      { error: "title, agentName, and amountUsd are required" },
      { status: 400 },
    );
  }

  const created = await addIntent({
    agentId: body.agentId?.trim() || "agent-simulated",
    agentName: body.agentName.trim(),
    title: body.title.trim(),
    description: body.description?.trim() || "",
    category: body.category || "api_call",
    amountUsd: Number(body.amountUsd),
    endpoint: body.endpoint?.trim(),
  });

  const intent = (await tryAutoApprove(created.id)) ?? created;
  return NextResponse.json({ intent, autoApproved: intent.resolvedBy === "auto" }, { status: 201 });
}
