export type IntentStatus =
  | "pending"
  | "approved"
  | "denied"
  | "processing"
  | "settled"
  | "failed";

export type IntentCategory =
  | "api_call"
  | "data_enrichment"
  | "web_scrape"
  | "compute"
  | "other";

export interface PurchaseIntent {
  id: string;
  agentId: string;
  agentName: string;
  title: string;
  description: string;
  category: IntentCategory;
  amountUsd: number;
  endpoint?: string;
  status: IntentStatus;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: "human" | "auto";
  denialReason?: string;
  receipt?: PaymentReceipt;
}

export interface PaymentReceipt {
  txId: string;
  mode: "live" | "mock";
  settledAt: string;
  amountUsd: number;
  endpoint?: string;
  summary?: string;
}

export interface DeskSettings {
  dailyBudgetUsd: number;
  autoApproveUnderUsd: number;
  maxPaymentsPerSession: number;
  paymentsThisSession: number;
  spendTodayUsd: number;
  spendSessionUsd: number;
  sessionStartedAt: string;
}

export interface DeskSnapshot {
  intents: PurchaseIntent[];
  settings: DeskSettings;
}
