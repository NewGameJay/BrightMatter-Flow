# 🧪 Smoke Test Status

## ✅ Completed Tests

### 1. Health Check ✅
```bash
curl -sS https://brightmatter-oracle.fly.dev/health
```
**Result**: ✅ PASSED
- Service: brightmatter-oracle
- Network: mainnet
- Contracts: CampaignEscrowV2 & CreatorProfileV2 @ 0x14aca78d100d2001
- Oracle: 14aca78d100d2001

### 2. Contracts Deployed ✅
**Status**: ✅ CONFIRMED LIVE
- CampaignEscrowV2 TX: `1acb427d053222df49b23a5de1f0440f29a1e2018754690cb9b2e02fd0b9af16`
- CreatorProfileV2 TX: `315997c59340c1fbd9d454c54742384220b400c3ac01dde264eed2ad79cb2aae`

### 3. Backend API Live ✅
**URL**: `https://brightmatter-oracle.fly.dev`
**Status**: ✅ RUNNING
- Enhanced logging implemented
- Input validation added
- Flowscan links in responses
- Health monitoring active

## ⏳ Pending Tests (Require Live Wallets)

### 4. Creator Setup & Verification
**Required**: Creator wallet funded with FLOW
```bash
# Setup
flow transactions send cadence/transactions/setup_profile.cdc \
  --network mainnet --signer creator

# Verify
flow scripts execute cadence/scripts/check_vault.cdc \
  --network mainnet --arg Address:0xCREATOR

flow scripts execute cadence/scripts/check_profile.cdc \
  --network mainnet --arg Address:0xCREATOR
```

### 5. Campaign Creation
**Required**: Brand wallet with FLOW balance
```bash
flow transactions send cadence/transactions/create_campaign.cdc \
  --network mainnet --signer brand \
  --arg String:"cmp-smoke-001" \
  --arg Address:0xCREATOR \
  --arg UFix64:"0.00500000" \
  --arg UFix64:"0.01000000" \
  --arg UFix64:"1735689600.00" \
  --arg UFix64:"0.01000000"
```

### 6. Oracle Analysis
**Command**:
```bash
curl -sS -X POST https://brightmatter-oracle.fly.dev/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "postUrl":"https://x.com/creator/status/1",
    "campaignId":"cmp-smoke-001",
    "creatorAddress":"0xCREATOR"
  }'
```

### 7. Campaign Status Check
```bash
flow scripts execute cadence/scripts/get_campaign.cdc \
  --network mainnet --arg String:"cmp-smoke-001"
```

### 8. Payout/Refund Trigger
```bash
# If threshold met
curl -sS -X POST https://brightmatter-oracle.fly.dev/api/campaigns/cmp-smoke-001/payout

# If deadline passed & threshold not met
curl -sS -X POST https://brightmatter-oracle.fly.dev/api/campaigns/cmp-smoke-001/refund
```

## 📋 Ready for End-to-End Testing

### Prerequisites
- [ ] Two test wallets funded with FLOW on mainnet
- [ ] Creator wallet runs setup transaction
- [ ] Brand wallet ready to create campaign
- [ ] Backend API healthy (✅ Verified)

### Testing Status
- ✅ Backend deployed and monitoring
- ✅ Smart contracts deployed to mainnet
- ✅ V2 integration complete
- ✅ All scripts and transactions ready
- ⏳ Awaiting live wallet tests

### Next Steps
1. Fund two test wallets with ~10 FLOW each
2. Run creator setup transaction
3. Create test campaign with minimal FLOW
4. Execute full workflow (analyze → payout/refund)
5. Verify on Flowscan

---

**Last Updated**: January 2025  
**Status**: Ready for end-to-end testing with funded wallets
