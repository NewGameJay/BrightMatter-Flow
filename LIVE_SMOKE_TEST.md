# 🔥 Live Smoke Test Runbook

## 📋 Pre-Flight Checklist

### Wallet Setup
- [ ] **Creator Wallet**: Funded with ≥ 1 FLOW
- [ ] **Brand Wallet**: Funded with ≥ 1 FLOW
- [ ] **Oracle Account**: Funded and configured on Fly.io

### Backend Verification
- [x] ✅ Health check: `https://brightmatter-oracle.fly.dev/health` returns OK
- [x] ✅ Contracts deployed: CampaignEscrowV2 & CreatorProfileV2 @ `0x14aca78d100d2001`

### Test Values
- **Campaign ID**: `cmp-smoke-001`
- **Creator Address**: `REPLACE_WITH_CREATOR_ADDRESS`
- **Threshold**: `5.00`
- **Payout Amount**: `0.05 FLOW`
- **Deposit Amount**: `0.05 FLOW`
- **Deadline**: Current time + 1 hour (Unix timestamp)

---

## 🚀 Execution Steps

### Step 1: Creator Setup (2 min)

**Purpose**: Initialize creator's FlowToken vault and CreatorProfile on-chain

```bash
flow transactions send cadence/transactions/setup_profile.cdc \
  --network mainnet \
  --signer creator
```

**Expected Output**: Transaction ID and `SEALED` status

**Verify Setup**:

```bash
# Check FlowToken vault
flow scripts execute cadence/scripts/check_vault.cdc \
  --network mainnet \
  --arg Address:0xYOUR_CREATOR_ADDRESS

# Should return: true

# Check CreatorProfile
flow scripts execute cadence/scripts/check_profile.cdc \
  --network mainnet \
  --arg Address:0xYOUR_CREATOR_ADDRESS

# Should return: true
```

✅ **Success Criteria**: Both checks return `true`

---

### Step 2: Campaign Creation (2 min)

**Purpose**: Brand creates and funds a test campaign

```bash
# Calculate deadline (current time + 1 hour)
NOW=$(date +%s)
DEADLINE=$((NOW + 3600))

flow transactions send cadence/transactions/create_campaign.cdc \
  --network mainnet \
  --signer brand \
  --arg String:"cmp-smoke-001" \
  --arg Address:0xYOUR_CREATOR_ADDRESS \
  --arg UFix64:"5.00" \
  --arg UFix64:"0.05000000" \
  --arg UFix64:"${DEADLINE}.00" \
  --arg UFix64:"0.05000000"
```

**Expected Output**: 
- Transaction ID with `SEALED` status
- Event: `CampaignCreated` with campaign details

**Verify Campaign**:
```bash
flow scripts execute cadence/scripts/get_campaign.cdc \
  --network mainnet \
  --arg String:"cmp-smoke-001"
```

✅ **Success Criteria**: Campaign data returned with correct threshold and deadline

---

### Step 3: Oracle Analysis (3 min)

**Purpose**: Oracle analyzes post and updates creator score

```bash
curl -sS -X POST https://brightmatter-oracle.fly.dev/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "postUrl": "https://x.com/test/status/123",
    "campaignId": "cmp-smoke-001",
    "creatorAddress": "0xYOUR_CREATOR_ADDRESS"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "txId": "0x...",
  "score": "12.34",
  "flowscanLink": "https://flowscan.org/transaction/0x...",
  "timestamp": "2025-01-XX ..."
}
```

**Verify on Flowscan**:
1. Click the `flowscanLink`
2. Confirm transaction shows:
   - `CreatorScoreUpdated` event
   - Score value matches response
   - Oracle address as proposer/payer

✅ **Success Criteria**: Transaction sealed, score updated, proof added to profile

---

### Step 4: Check Campaign Status (1 min)

**Purpose**: Verify totalScore meets threshold

```bash
flow scripts execute cadence/scripts/get_campaign.cdc \
  --network mainnet \
  --arg String:"cmp-smoke-001"
```

**Expected Output**: Campaign with:
- `totalScore` ≥ `5.00` (threshold)
- `paidOut` = `false`
- `creatorScores` contains creator's address and score

✅ **Success Criteria**: `totalScore >= threshold`

---

### Step 5A: Trigger Payout (if threshold met) (2 min)

**Purpose**: Execute FLOW payout to creator

```bash
curl -sS -X POST https://brightmatter-oracle.fly.dev/api/campaigns/cmp-smoke-001/payout \
  -H "Content-Type: application/json"
```

**Expected Response**:
```json
{
  "success": true,
  "txId": "0x...",
  "flowscanLink": "https://flowscan.org/transaction/0x...",
  "message": "Payout executed successfully",
  "timestamp": "2025-01-XX ..."
}
```

**Verify on Flowscan**:
1. Click the `flowscanLink`
2. Confirm transaction shows:
   - `PayoutExecuted` event
   - Creator address as recipient
   - FLOW amount transferred (should be `0.05 FLOW`)

**Verify Creator Balance**:
- Check creator wallet balance increased by `0.05 FLOW`

✅ **Success Criteria**: FLOW transferred to creator, campaign marked `paidOut: true`

---

### Step 5B: Trigger Refund (if threshold NOT met after deadline) (2 min)

**Only use this path if**:
- `totalScore < threshold` AND
- Current time > `deadline`

```bash
curl -sS -X POST https://brightmatter-oracle.fly.dev/api/campaigns/cmp-smoke-001/refund \
  -H "Content-Type: application/json"
```

**Expected Response**:
```json
{
  "success": true,
  "txId": "0x...",
  "flowscanLink": "https://flowscan.org/transaction/0x...",
  "message": "Refund executed successfully",
  "timestamp": "2025-01-XX ..."
}
```

**Verify on Flowscan**:
1. Click the `flowscanLink`
2. Confirm transaction shows:
   - `RefundExecuted` event
   - Oracle/brand address as recipient
   - FLOW amount returned

✅ **Success Criteria**: FLOW returned to brand/oracle

---

## 🐛 Troubleshooting

### Issue: "profile not found"
**Fix**: Re-run `setup_profile.cdc` from creator wallet

### Issue: "updateCreatorScore failed"
**Fix**: 
1. Verify Fly.io secrets match deployed oracle address
2. Check env vars: `FLOW_ADDRESS`, `FLOW_KEY_ID`, `FLOW_PRIVATE`

### Issue: "address.replace is not a function"
**Fix**: Ensure all addresses use `0x` prefix in API calls

### Issue: Payout/refund no-op
**Fix**: 
1. Check `totalScore` vs `threshold`
2. Verify deadline has passed (for refund)
3. Check campaign state via `get_campaign.cdc`

### Issue: "Campaign ID already exists"
**Fix**: Use a different campaign ID or wait for expiration

---

## 📊 Success Metrics

- ✅ All transactions sealed successfully
- ✅ Creator score updated on-chain
- ✅ Proof added to CreatorProfile
- ✅ FLOW transferred correctly (payout or refund)
- ✅ All events visible on Flowscan
- ✅ No errors in backend logs

---

## 🎯 Demo-Ready Checklist

- [x] Backend API healthy and monitoring
- [x] Smart contracts deployed to mainnet
- [x] All scripts and transactions tested
- [ ] Two funded wallets ready
- [ ] End-to-end smoke test completed
- [ ] Flowscan links working
- [ ] Demo narration prepared

---

**Last Updated**: January 2025  
**Status**: Ready for live testing with funded wallets  
**Next Step**: Fund wallets and execute smoke test
