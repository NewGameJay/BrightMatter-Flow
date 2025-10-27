# Forte Integration - BrightMatter x Flow

## Overview

This project demonstrates **Flow Forte's Actions and Agents** for automated campaign verification and payouts.

## Forte Features Implemented

### 1. **Scheduled Transactions**
- Campaigns schedule an Agent to run **1 hour after deadline**
- Fallback refund scheduled at same time
- Leverages Forte's Scheduler Manager for trustless automation

### 2. **Agents**
- **Campaign Verification Agent** (`/api/agent/verify/:id`)
  - Validates creator proofs
  - Runs fraud detection
  - Triggers payout if clean
  - Executes fallback refund if flagged

### 3. **Actions Chain**
Three composable Actions execute atomically during payout:
1. **WithdrawVault** - Withdraws FLOW from escrow
2. **SplitFundsByScore** - Calculates creator shares proportionally
3. **DepositToCreators** - Distributes FLOW to creator wallets

## Architecture

```
Brand Creates Campaign
  ↓
Escrow FLOW + Schedule Agent (+1h post-deadline)
  ↓
Creator Submits Content → Oracle Records Proof
  ↓
Deadline Passes → Forte Triggers Agent
  ↓
Agent Verifies Proofs → Fraud Checks
  ↓
✅ Clean → Action Chain: Withdraw → Split → Deposit
❌ Flagged → Fallback Refund
```

## Key Files

### Smart Contracts
- `cadence/contracts/CampaignEscrow.cdc` - Escrow + verifyAndPayout
- `cadence/contracts/CreatorProfile.cdc` - SBT profiles + proofs

### Forte Actions
- `cadence/actions/WithdrawVault.cdc`
- `cadence/actions/SplitFundsByScore.cdc`
- `cadence/actions/DepositToCreators.cdc`

### Transactions
- `cadence/transactions/schedule_agent.cdc` - Schedule verification agent
- `cadence/transactions/verify_and_payout.cdc` - Agent execution tx
- `cadence/transactions/schedule_refund.cdc` - Fallback refund

### Backend Services
- `verifier/src/server.ts` - Express server with agent endpoints
- `verifier/src/flow/client.ts` - Flow transaction client
- `verifier/src/flow/signer.ts` - ECDSA_P256 signing
- `verifier/src/services/fraud.ts` - Fraud detection

## API Endpoints

### Agent Endpoints (Forte)
- `POST /api/agent/verify/:id` - Agent verification & payout

### Creator/Brand Endpoints
- `POST /api/analyze` - Submit content & record proof
- `POST /api/analyze-post` - Mock score generation
- `POST /api/campaigns/:id/payout` - Manual payout trigger
- `POST /api/campaigns/:id/refund` - Manual refund trigger

### Query Endpoints
- `GET /api/campaigns/:id` - Get campaign data
- `GET /api/campaigns/by-creator/:address` - Get creator's campaigns
- `GET /api/profile/:address` - Get creator profile
- `GET /api/setup-profile` - Get profile setup transaction

## Environment Variables

```bash
# Flow Mainnet
FLOW_ACCESS_NODE=https://rest-mainnet.onflow.org
FLOW_ACCOUNT_ADDRESS=14aca78d100d2001
FLOW_PRIVATE_KEY=<ECDSA_P256_hex_key>
FLOW_KEY_INDEX=0

# Server
PORT=8080
```

## Fraud Detection

The agent runs automated checks:
1. ✅ No duplicate post IDs
2. ✅ Engagement ratios (likes ≤ 10x comments)
3. ✅ All timestamps present
4. ✅ Non-negative metrics

Failed checks → campaign flagged → refund triggered

## Testing Locally

```bash
# Install dependencies
cd verifier
npm install

# Run development server
npm run dev

# Trigger agent manually (simulates Forte scheduler)
curl -X POST http://localhost:8080/api/agent/verify/campaign-001
```

## Production Deployment

Deployed on Fly.io with Forte integration:
- **Backend**: https://brightmatter-oracle.fly.dev
- **Frontend**: https://brightmatter-frontend.fly.dev

### Deploy Commands
```bash
# Backend (with Forte agent)
flyctl deploy --app brightmatter-oracle --remote-only

# Frontend
flyctl deploy --config app/fly.toml --remote-only
```

## Forte Benefits

1. **Trustless Automation** - No off-chain bots or servers needed
2. **Atomic Actions** - Payout chain executes atomically
3. **Composability** - Actions can be reused across campaigns
4. **On-Chain Scheduling** - Forte Scheduler Manager handles timing
5. **Gas Efficiency** - Single transaction for multi-step payout

## Mainnet Contracts

All contracts deployed to `0x14aca78d100d2001`:
- CampaignEscrowV3
- CreatorProfileV2

## FLIX Template

Campaign workflow documented in `cadence/flix/veri.campaign.v1.json`

## Demo Flow

1. **Brand** creates campaign (6h window)
2. **Creator** submits post → proof recorded
3. **Forte Agent** runs at deadline + 1h
4. **Agent** verifies proofs → triggers payout
5. **Actions** execute: Withdraw → Split → Deposit
6. **Creators** receive FLOW automatically

## Hackathon Tracks

✅ **Best Use of Forte** - Demonstrates Actions + Agents + Scheduled Transactions
✅ **Killer App on Flow** - End-to-end creator campaign automation with real FLOW

## Links

- [Flow Forte Docs](https://flow.com/post/forte-introducing-actions-agents-supercharging-composability-and-automation)
- [GitHub Repo](https://github.com/NewGameJay/BrightMatter-Flow)
- [Live Demo](https://brightmatter-frontend.fly.dev)

