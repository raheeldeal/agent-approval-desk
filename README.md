# Agent Approval Desk

Human-in-the-loop console for approving agent purchase intents and settling x402 micropayments. Inspired by **Stripe Link / Issuing for agents** and **Coinbase Agentic Wallets**.

**Live demo:** add your Vercel URL here after deploy.

## What it does

- **Approval Desk** — review pending agent spend requests, approve or deny
- **Simulate Agent** — create purchase intents (enrichment, scrape, API calls)
- **Guardrails** — auto-approve under a threshold, daily budget, session payment cap
- **PostHog** — track `intent_created`, `intent_approved`, `intent_denied`, funnels
- **Payments** — mock x402 settlement by default; wire Coinbase CDP for live USDC

## Quick start (local)

```bash
git clone https://github.com/YOUR_USERNAME/agent-approval-desk.git
cd agent-approval-desk
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo flow

1. Go to **Simulate Agent** → submit a $0.12 enrichment request → appears on desk
2. Go to **Approval Desk** → click **Approve & pay** → receipt appears
3. Submit a $0.03 request → auto-approves if under your threshold ($0.05 default)
4. Open PostHog → watch `intent_approved` events in Live events

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_POSTHOG_KEY` | Optional | PostHog project API key |
| `MOCK_PAYMENTS` | Optional | `true` (default) = simulated settlement |
| `CDP_API_KEY_ID` | Live payments | Coinbase Developer Platform key |
| `CDP_API_KEY_SECRET` | Live payments | CDP secret |

## PostHog setup

1. Create a free project at [posthog.com](https://posthog.com)
2. Copy the project API key into `.env.local`:
   ```
   NEXT_PUBLIC_POSTHOG_KEY=phc_...
   ```
3. Suggested events to build funnels from:
   - `intent_created` → `intent_approve_clicked` → `intent_approved`
   - `intent_auto_approved` (under threshold)

## Deploy to Vercel (public URL)

```bash
npx vercel --prod
```

Or connect the GitHub repo in the Vercel dashboard for automatic deploys on push.

Add env vars in **Vercel → Project → Settings → Environment Variables**.

## Publish to GitHub

```bash
git branch -M main
gh auth login   # if your token expired
gh repo create agent-approval-desk --public --source=. --remote=origin --push
```

## Architecture

```
Agent submits intent → POST /api/intents
  → auto-approve if amount ≤ threshold
  → else status: pending

Human approves → POST /api/intents/:id/approve
  → executeApprovedPayment() (mock or CDP)
  → status: settled + receipt

Data persisted to data/snapshot.json locally, /tmp on Vercel serverless.
```

## Stack

- Next.js 16 (App Router)
- Tailwind CSS
- PostHog (`@posthog/next`)
- AgentCash / x402 (optional live payments)

## License

MIT
