# 🧪 BrightMatter Flow - End-to-End Test Checklist

## Prerequisites
- [ ] Two wallets funded on Flow mainnet (creator + brand)
- [ ] Oracle backend healthy: `curl https://brightmatter-oracle.fly.dev/health`
- [ ] Flow CLI configured with mainnet account

## 1. Creator Onboarding ✅

### Setup Creator Profile
Run the setup transaction from your creator wallet:

```bash
flow transactions send cadence/transactions/setup_profile.cdc \
  --network mainnet \
  --signer creator-wallet
```

**Expected Result:**
- ✅ Profile created at `/storage/CreatorProfile`
- ✅ Public capability linked at `/public/CreatorProfile`
- ✅ FlowToken vault created
- ✅ Receiver and balance capabilities linked

**Verify on Flowscan:**
Search the transaction hash and confirm no errors.

---

## 2. Brand Creates Campaign ✅

### Create Campaign Transaction
**Manual form for brand to fill:**
- `campaignId`: `"cmp-demo-001"`
- `creator`: Creator wallet address
- `threshold`: `"100.00"` (UFix64)
- `payout`: `"500.00"` (UFix64) 
- `deadline`: `"1735689600.00"` (Unix timestamp in seconds)

**Transaction file:** `cadence/transactions/create_campaign.cdc`

**Expected Result:**
- ✅ Campaign stored in CampaignEscrow
- ✅ FLOW deposited from brand wallet
- ✅ Event emitted: `CampaignCreated`

---

## 3. Post Analysis (Oracle) ✅

### Test the /api/analyze endpoint

```bash
curl -X POST https://brightmatter-oracle.fly.dev/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "postUrl": "https://twitter.com/test/status/123456789",
    "campaignId": "cmp-demo-001",
    "creatorAddress": "0xCREATOR_ADDRESS_HERE"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "score": 87.65,
  "metrics": {
    "likes": 1250,
    "shares": 45,
    "comments": 89,
    "views": 5000,
    "engagementRate": 27.68
  },
  "txResult": {
    "txId": "0x...",
    "sealed": { ... }
  }
}
```

**Verify on Flowscan:**
1. Check transaction ID for `CreatorScoreUpdated` event
2. Check creator profile for new proof added
3. Confirm `CampaignEscrowV2.updateCreatorScore` succeeded

---

## 4. Verify Campaign Status ✅

```bash
curl https://brightmatter-oracle.fly.dev/api/campaigns/cmp-demo-001
```

**Expected:**
```json
{
  "success": true,
  "campaign": {
    "id": "cmp-demo-001",
    "totalScore": 87.65,
    "threshold": 100.0,
    "status": "pending"
  }
}
```

---

## 5. Trigger Payout or Refund ✅

### If threshold met (totalScore >= threshold):

```bash
curl -X POST https://brightmatter-oracle.fly.dev/api/campaigns/cmp-demo-001/payout
```

**Expected:**
- ✅ Transaction succeeds
- ✅ FLOW distributed to creator(s) based on score proportions
- ✅ Event emitted: `PayoutTriggered`

### If deadline passed and threshold not met:

```bash
curl -X POST https://brightmatter-oracle.fly.dev/api/campaigns/cmp-demo-001/refund
```

**Expected:**
- ✅ Transaction succeeds
- ✅ FLOW refunded to brand
- ✅ Event emitted: `CampaignRefunded`

---

## 6. Verify Balances ✅

Check on Flowscan:
1. **Creator wallet**: Should receive payout (if threshold met)
2. **Brand wallet**: Should receive refund (if threshold not met)
3. **CampaignEscrow**: Balance should be zero after payout/refund

---

## Quick Test Scenarios

### Scenario A: Successful Campaign
1. Creator sets up profile
2. Brand creates campaign with threshold: `50.0`
3. Creator submits 3 posts with scores: 20, 25, 30
4. Total score: 75 (exceeds threshold)
5. Trigger payout → Creator receives FLOW

### Scenario B: Failed Campaign
1. Creator sets up profile  
2. Brand creates campaign with threshold: `100.0`
3. Creator submits posts with total score: 45
4. Deadline passes
5. Trigger refund → Brand receives FLOW back

---

## Troubleshooting

### Error: "profile not found"
**Fix:** Run setup_profile.cdc transaction

### Error: "address.replace is not a function"
**Fix:** Ensure all addresses are wrapped with `fcl.withPrefix()`

### Error: "cannot add proof"
**Fix:** Verify creator has public capability linked at `/public/CreatorProfile`

### Error: "updateCreatorScore failed"
**Fix:** Check oracle address matches deployed contract's `oracle` field

### Transaction rejected
**Fix:** 
- Check wallet has sufficient FLOW for fees
- Verify oracle private key is correct in Fly secrets
- Check transaction logs in backend

---

## Demo Runbook 🎯

### Preparation (5 min)
1. Fund two test wallets with 10 FLOW each
2. Verify backend health
3. Prepare campaign parameters

### Demo Flow (10 min)
1. **Creator Onboarding** (2 min)
   - Show "Set up Profile" button
   - Execute transaction
   - Show Flowscan link

2. **Campaign Creation** (2 min)
   - Brand fills form
   - Submits campaign + deposit
   - Show Flowscan link

3. **Post Submission** (3 min)
   - Creator submits post URL
   - Show oracle analysis
   - Show on-chain proof

4. **Payout/Refund** (3 min)
   - Check threshold status
   - Trigger payout or refund
   - Show balance changes

### Post-Demo
- Reset test data if needed
- Rotate private keys if exposed
- Save transaction hashes for reference

---

**Last Updated:** January 2025  
**Environment:** Flow Mainnet  
**Contracts:** CampaignEscrowV2, CreatorProfileV2 @ `0x14aca78d100d2001`
