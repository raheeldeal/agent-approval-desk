import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/store";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    dailyBudgetUsd?: number;
    autoApproveUnderUsd?: number;
    maxPaymentsPerSession?: number;
    resetSession?: boolean;
  };

  const current = await getSettings();
  const next = await updateSettings({
    dailyBudgetUsd: body.dailyBudgetUsd ?? current.dailyBudgetUsd,
    autoApproveUnderUsd:
      body.autoApproveUnderUsd ?? current.autoApproveUnderUsd,
    maxPaymentsPerSession:
      body.maxPaymentsPerSession ?? current.maxPaymentsPerSession,
    ...(body.resetSession
      ? {
          paymentsThisSession: 0,
          spendSessionUsd: 0,
          sessionStartedAt: new Date().toISOString(),
        }
      : {}),
  });

  return NextResponse.json({ settings: next });
}
