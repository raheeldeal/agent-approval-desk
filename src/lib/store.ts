import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { DEFAULT_SETTINGS, SEED_INTENTS } from "./defaults";
import type { DeskSettings, DeskSnapshot, PurchaseIntent } from "./types";

const dataDir = process.env.VERCEL
  ? "/tmp/agent-approval-desk"
  : path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "snapshot.json");

async function ensureStore(): Promise<DeskSnapshot> {
  try {
    const raw = await readFile(dataFile, "utf8");
    return JSON.parse(raw) as DeskSnapshot;
  } catch {
    const snapshot: DeskSnapshot = {
      intents: SEED_INTENTS,
      settings: { ...DEFAULT_SETTINGS },
    };
    await saveStore(snapshot);
    return snapshot;
  }
}

async function saveStore(snapshot: DeskSnapshot): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataFile, JSON.stringify(snapshot, null, 2), "utf8");
}

export async function getSnapshot(): Promise<DeskSnapshot> {
  return ensureStore();
}

export async function listIntents(): Promise<PurchaseIntent[]> {
  const { intents } = await ensureStore();
  return intents.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getIntent(id: string): Promise<PurchaseIntent | undefined> {
  const intents = await listIntents();
  return intents.find((intent) => intent.id === id);
}

export async function addIntent(
  intent: Omit<PurchaseIntent, "id" | "status" | "createdAt">,
): Promise<PurchaseIntent> {
  const snapshot = await ensureStore();
  const created: PurchaseIntent = {
    ...intent,
    id: crypto.randomUUID(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  snapshot.intents.unshift(created);
  await saveStore(snapshot);
  return created;
}

export async function updateIntent(
  id: string,
  patch: Partial<PurchaseIntent>,
): Promise<PurchaseIntent | null> {
  const snapshot = await ensureStore();
  const index = snapshot.intents.findIndex((intent) => intent.id === id);
  if (index === -1) return null;
  snapshot.intents[index] = { ...snapshot.intents[index], ...patch };
  await saveStore(snapshot);
  return snapshot.intents[index];
}

export async function getSettings(): Promise<DeskSettings> {
  const { settings } = await ensureStore();
  return settings;
}

export async function updateSettings(
  patch: Partial<DeskSettings>,
): Promise<DeskSettings> {
  const snapshot = await ensureStore();
  snapshot.settings = { ...snapshot.settings, ...patch };
  await saveStore(snapshot);
  return snapshot.settings;
}

export async function recordSpend(amountUsd: number): Promise<DeskSettings> {
  const snapshot = await ensureStore();
  snapshot.settings = {
    ...snapshot.settings,
    spendTodayUsd: snapshot.settings.spendTodayUsd + amountUsd,
    spendSessionUsd: snapshot.settings.spendSessionUsd + amountUsd,
    paymentsThisSession: snapshot.settings.paymentsThisSession + 1,
  };
  await saveStore(snapshot);
  return snapshot.settings;
}
