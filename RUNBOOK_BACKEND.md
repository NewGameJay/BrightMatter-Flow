# Backend Runbook - BrightMatter Oracle

## Architecture Overview

The BrightMatter backend consists of:
- **Cadence Smart Contracts** - On-chain escrow and profiles
- **Forte Actions** - Composable payout chain (WithdrawVault → SplitFundsByScore → DepositToCreators)
- **Express Server** - Oracle API with fraud detection and agent scheduling
- **In-Memory Database** - Tracks campaigns, participants, submissions, payouts

---

## Forte Actions Schema

### 1. WithdrawVault
```cadence
access(all) struct WithdrawVault {
    access(all) let campaignId: String
    access(all) let signer: Address
}
```
**Function**: Withdraws entire escrow balance from campaign vault  
**Authorization**: Oracle-only (verifies signer == CampaignEscrowV3.getOracle())  
**Returns**: `@FlowToken.Vault`

### 2. SplitFundsByScore
```cadence
access(all) struct SplitFundsByScore {
    access(all) let campaignId: String
    access(all) let budget: UFix64
    access(all) let splits: [{Address: UFix64}]
}

access(all) struct Payout {
    access(all) let address: Address
    access(all) let amount: UFix64
}
```
**Function**: Calculates concrete payout amounts from percentages  
**Validation**: Ensures splits sum to 1.0 (within epsilon)  
**Returns**: `[Payout]` array

### 3. DepositToCreators
```cadence
access(all) struct DepositToCreators {
    access(all) let payouts: [Payout]
}
```
**Function**: Atomically distributes FLOW to all creators  
**Pre-validation**: Checks all receivers exist and calculates total  
**Post-validation**: Ensures vault is empty (within epsilon)  
**Atomicity**: All-or-nothing (panics on any failure)

---

## API Endpoints

### Health Check
```bash
GET /health
```
**Response**:
```json
{
  "ok": true,
  "service": "brightmatter-oracle-forte",
  "network": "mainnet",
  "contracts": {
    "CampaignEscrowV3": "0x14aca78d100d2001",
    "CreatorProfileV2": "0x14aca78d100d2001"
  },
  "forte": {
    "enabled": true,
    "features": ["scheduled-transactions", "agents", "actions"]
  }
}
```

### Create Campaign
```bash
POST /api/campaigns
Content-Type: application/json

# Open campaign
{
  "type": "open",
  "budgetFlow": "100.0",
  "deadline": "2025-12-31T23:59:59Z",
  "criteria": {
    "windowStart": "2025-10-01T00:00:00Z",
    "minEngagement": 0.01
  }
}

# Curated campaign (existing)
{
  "id": "custom-id",
  "creator": "0xCreator1",
  "threshold": "100.0",
  "payout": "10.0",
  "deadline": "2025-11-03T17:00:00Z"
}
```

### Join Open Campaign
```bash
POST /api/campaigns/:id/join
Content-Type: application/json

{
  "creator": "0xCreator1"
}
```

### Submit Content
```bash
POST /api/campaigns/:id/submit
Content-Type: application/json

{
  "creator": "0xCreator1",
  "url": "https://x.com/p/123",
  "metrics": {
    "views": 5000,
    "likes": 220,
    "comments": 40,
    "shares": 10
  }
}
```

### Get Leaderboard
```bash
GET /api/campaigns/:id/leaderboard
```
**Response**:
```json
{
  "success": true,
  "campaignId": "campaign-123",
  "leaderboard": [
    {
      "creatorAddr": "0xCreator1",
      "totalScore": 150.0,
      "submissionCount": 1,
      "percent": "15.00"
    }
  ]
}
```

### Agent Verification (Manual Trigger)
```bash
POST /api/agent/verify/:id
```
**Response**:
```json
{
  "success": true,
  "campaignId": "campaign-123",
  "action": "payout",
  "type": "open",
  "splits": [
    {
      "addr": "0xCreator1",
      "percent": 0.15,
      "amountFlow": "15.00000000"
    }
  ],
  "flowscanLink": "https://flowscan.org/transaction/abc123"
}
```

---

## Fraud Checks

The agent performs the following validation before executing payouts:

1. **Duplicate Detection**
   - Rejects submissions with duplicate `platform:postId` hashes
   - Prevents double-counting

2. **Window Validation**
   - Requires timestamp between `windowStart` and `deadline`
   - Rejects expired or premature submissions

3. **Engagement Ratios**
   - Validates `likes/views` and `comments/views` ratios
   - Flags suspicious engagement patterns

4. **Participant Verification**
   - For open campaigns: verifies creator joined before submitting
   - Returns 403 if non-participant attempts submission

5. **Receiver Validation**
   - Pre-validates all creator addresses have `/public/flowTokenReceiver` capability
   - Ensures atomic payout (all succeed or all fail)

---

## Common Errors

### Missing Receiver Capability
```
Error: Missing receiver capability for address 0x...
```
**Cause**: Creator hasn't set up FlowToken vault  
**Fix**: Creator must run `/api/setup-profile` transaction

### Duplicate Submission
```
Error: Duplicate submission
```
**Cause**: Same `platform:postId` submitted twice  
**Fix**: Use different post ID or update existing submission

### Insufficient Vault Balance
```
Error: Insufficient vault balance: requested 100.5 but have 100.0
```
**Cause**: Splits exceed escrowed amount  
**Fix**: Adjust splits to sum ≤ budget

### Splits Don't Sum to 1.0
```
Error: Splits must sum to 1.0, got 0.9999
```
**Cause**: Normalization error in split calculation  
**Fix**: Use `normalizePercentsForUFix64()` before payout

### Not a Participant
```
Error: Not a participant in this campaign
```
**Cause**: Creator didn't join before submitting  
**Fix**: Call `POST /api/campaigns/:id/join` first

---

## Deployment

### Rebuild and Deploy
```bash
cd verifier
npm run build
flyctl deploy --app brightmatter-oracle --dockerfile Dockerfile --config fly.backend.toml --remote-only
```

### Check Health
```bash
curl https://brightmatter-oracle.fly.dev/health | jq
```

### View Logs
```bash
flyctl logs --app brightmatter-oracle
```

---

## End-to-End Test Flow

```bash
# 1. Create open campaign
BASE="https://brightmatter-oracle.fly.dev"
CID=$(curl -sX POST $BASE/api/campaigns \
  -H 'Content-Type: application/json' \
  -d '{"type":"open","budgetFlow":"100.0","deadline":"2025-12-31T23:59:59Z","windowStart":"2025-10-01T00:00:00Z"}' \
  | jq -r .campaignId)

# 2. Join
curl -sX POST $BASE/api/campaigns/$CID/join \
  -H 'Content-Type: application/json' \
  -d '{"creator":"0xCreator1"}'

# 3. Submit
curl -sX POST $BASE/api/campaigns/$CID/submit \
  -H 'Content-Type: application/json' \
  -d '{"creator":"0xCreator1","url":"https://x.com/p/1","metrics":{"views":5000,"likes":220,"comments":40}}'

# 4. Check leaderboard
curl -s $BASE/api/campaigns/$CID/leaderboard | jq

# 5. Trigger payout
curl -sX POST $BASE/api/agent/verify/$CID | jq
```

---

## Architecture Decision: Frontend Unchanged

This runbook **explicitly excludes frontend changes**. The `app/` directory remains untouched. All new functionality is:
- Backend API-only (no UI changes)
- Testing via curl/shell scripts
- Frontend integration handled separately if needed

---

## Security Notes

- **Oracle Authorization**: All on-chain writes require oracle signature
- **Pre-validation**: Actions validate all inputs before execution
- **Atomicity**: Payout chain is all-or-nothing
- **Fraud Detection**: Multiple layers of validation
- **Epsilon Handling**: UFix64 precision managed with epsilon = 0.00000001

---

**Last Updated**: Deployed with Forte Actions atomic payout chain
