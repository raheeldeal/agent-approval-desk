import { NextResponse } from "next/server";
import { getIntent, updateIntent } from "@/lib/store";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
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

  const body = (await request.json().catch(() => ({}))) as {
    reason?: string;
  };

  const denied = await updateIntent(id, {
    status: "denied",
    resolvedAt: new Date().toISOString(),
    resolvedBy: "human",
    denialReason: body.reason?.trim() || "Denied by operator",
  });

  return NextResponse.json({ intent: denied });
}
