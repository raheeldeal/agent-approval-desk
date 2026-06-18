import type { PaymentReceipt, PurchaseIntent } from "./types";

const MOCK_MODE = process.env.MOCK_PAYMENTS !== "false";

export async function executeApprovedPayment(
  intent: PurchaseIntent,
): Promise<PaymentReceipt> {
  if (MOCK_MODE) {
    await delay(600 + Math.random() * 400);
    return {
      txId: `mock_${intent.id.slice(0, 8)}_${Date.now()}`,
      mode: "mock",
      settledAt: new Date().toISOString(),
      amountUsd: intent.amountUsd,
      endpoint: intent.endpoint,
      summary: `Simulated x402 settlement for “${intent.title}”. Set MOCK_PAYMENTS=false and configure CDP wallet env vars for live USDC.`,
    };
  }

  const apiKey = process.env.CDP_API_KEY_ID;
  const apiSecret = process.env.CDP_API_KEY_SECRET;
  if (!apiKey || !apiSecret) {
    throw new Error(
      "Live payments require CDP_API_KEY_ID and CDP_API_KEY_SECRET, or set MOCK_PAYMENTS=true.",
    );
  }

  // Placeholder for Coinbase CDP / x402 server wallet integration.
  // Keeps the approval flow working while you wire your facilitator credentials.
  await delay(800);
  return {
    txId: `live_pending_${Date.now()}`,
    mode: "live",
    settledAt: new Date().toISOString(),
    amountUsd: intent.amountUsd,
    endpoint: intent.endpoint,
    summary:
      "Live wallet credentials detected. Connect your x402 facilitator call here to settle on Base USDC.",
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
