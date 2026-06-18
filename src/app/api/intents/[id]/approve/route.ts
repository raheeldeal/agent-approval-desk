import { NextResponse } from "next/server";
import { executeApprovedPayment } from "@/lib/payments";
import {
  getIntent,
  getSettings,
  recordSpend,
  updateIntent,
} from "@/lib/store";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  const intent = await getIntent(id);

  if (!intent) {
    return NextResponse.json({ error: "Intent not found" }, { status: 404 });
  }

  if (intent.status !== "pending") {
    return NextResponse.json(
      { error: `Intent is already ${intent.status}` },
      { status: 409 },
    );
  }

  const settings = await getSettings();

  if (settings.paymentsThisSession >= settings.maxPaymentsPerSession) {
    return NextResponse.json(
      {
        error: `Session payment cap reached (${settings.maxPaymentsPerSession}). Reset session in settings.`,
      },
      { status: 429 },
    );
  }

  if (settings.spendTodayUsd + intent.amountUsd > settings.dailyBudgetUsd) {
    return NextResponse.json(
      { error: "Daily budget exceeded. Raise the budget or deny this intent." },
      { status: 402 },
    );
  }

  await updateIntent(id, { status: "processing" });

  try {
    const receipt = await executeApprovedPayment(intent);
    const settled = await updateIntent(id, {
      status: "settled",
      resolvedAt: new Date().toISOString(),
      resolvedBy: "human",
      receipt,
    });
    await recordSpend(intent.amountUsd);
    return NextResponse.json({ intent: settled, receipt });
  } catch (error) {
    const failed = await updateIntent(id, {
      status: "failed",
      resolvedAt: new Date().toISOString(),
      resolvedBy: "human",
      denialReason:
        error instanceof Error ? error.message : "Payment execution failed",
    });
    return NextResponse.json(
      { error: failed?.denialReason, intent: failed },
      { status: 500 },
    );
  }
}
