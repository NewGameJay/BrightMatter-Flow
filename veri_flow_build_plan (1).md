# Veri x Flow Integration Build Plan (Cursor Setup)

---

## ✅ Step 1: Project Structure
```
veri-flow-intelligence-layer/
├── cadence/                     # Smart contracts
│   ├── Profile.cdc
│   └── CampaignEscrow.cdc
├── scripts/                     # Flow CLI scripts and Cadence transactions
│   ├── setup_profile.cdc
│   ├── update_veriscore.cdc
│   ├── create_campaign.cdc
│   ├── trigger_payout.cdc
│   └── deploy_contracts.ts
├── app/                         # Frontend (React + FCL)
│   ├── pages/
│   ├── components/
│   └── utils/
├── verifier/                    # BrightMatter verifier + signer service
│   ├── computeScore.ts
│   ├── signer.ts
│   ├── cadenceClient.ts
│   └── server.ts
├── flow.json / .flow.testnet.json
├── README.md / DEMO.md
```

---

## ✅ Step 2: Creator Profile Contract (Cadence)
```cadence
pub contract CreatorProfile {
    pub resource interface IProfilePublic {
        pub fun getVeriScore(): UFix64
        pub fun getCampaignScore(campaignId: String): UFix64?
    }

    pub resource Profile: IProfilePublic {
        pub var veriScore: UFix64
        pub var campaignScores: {String: UFix64}

        init() {
            self.veriScore = 0.0
            self.campaignScores = {}
        }

        pub fun updateScore(score: UFix64) {
            self.veriScore = score
        }

        pub fun logCampaign(campaignId: String, score: UFix64) {
            self.campaignScores[campaignId] = score
        }

        pub fun getVeriScore(): UFix64 {
            return self.veriScore
        }

        pub fun getCampaignScore(campaignId: String): UFix64? {
            return self.campaignScores[campaignId]
        }
    }

    pub fun createProfile(): @Profile {
        return <- create Profile()
    }

    pub event ProfileCreated(address: Address)
    init() { log("CreatorProfile deployed") }
}
```

---

## ✅ Step 3: Campaign Escrow Contract (with Scheduled Transactions)
```cadence
import FungibleToken from 0xFungibleToken
import USDFToken from 0xUSDFToken

pub contract CampaignEscrow {
    pub struct Campaign {
        pub let creator: Address
        pub let threshold: UFix64
        pub let payout: UFix64
        pub var paidOut: Bool
        pub let deadline: UFix64
    }

    pub var campaigns: {String: Campaign}
    pub var vault: @FungibleToken.Vault

    pub fun createCampaign(id: String, creator: Address, threshold: UFix64, payout: UFix64, deadline: UFix64, from: @FungibleToken.Vault) {
        self.campaigns[id] = Campaign(creator: creator, threshold: threshold, payout: payout, paidOut: false, deadline: deadline)
        self.vault.deposit(from: <-from)
    }

    pub fun triggerPayout(id: String, actualScore: UFix64, recipient: &{FungibleToken.Receiver}) {
        let campaign = self.campaigns[id]!
        if actualScore >= campaign.threshold && !campaign.paidOut {
            campaign.paidOut = true
            recipient.deposit(from: <- self.vault.withdraw(amount: campaign.payout))
        }
    }

    pub fun refundExpired(id: String, currentTime: UFix64, brandVault: &{FungibleToken.Receiver}) {
        let campaign = self.campaigns[id]!
        if currentTime > campaign.deadline && !campaign.paidOut {
            campaign.paidOut = true
            brandVault.deposit(from: <- self.vault.withdraw(amount: campaign.payout))
        }
    }

    init() {
        self.campaigns = {}
        self.vault <- USDFToken.createEmptyVault()
    }
}
```

---

## ✅ Step 4: BrightMatter Verifier Service (Node/TypeScript)
- Runs scoring function using your `V_res` formula
- Signs score payload and submits transaction to Flow testnet
- Exposes endpoint `/score`

Files:
- `computeScore.ts` – takes metrics and returns score
- `signer.ts` – signs score payload with oracle key
- `cadenceClient.ts` – sends txs to Flow
- `server.ts` – Express API for internal + front-end use

---

## ✅ Step 5: React Frontend (User Flow)
- Uses `@onflow/fcl` and `@onflow/react`
- On login, checks if Profile exists
- If not, runs `setup_profile.cdc` (signed by user)
- Then queries `/score` or displays veriScore

Key Flow:
```ts
const hasProfile = await fcl.query({ ... })
if (!hasProfile) await fcl.mutate({ cadence: setupTx })
```

---

## ✅ Step 6: Flow Testnet Deployment
- Use faucet: https://testnet-faucet.onflow.org
- Deploy with `flow project deploy --network testnet`
- Include testnet addresses in `.env` or `constants.ts`
- All scripts use `flow.json` and can run from CLI

---

## ✅ Step 7: Campaign Setup and KPI Trigger
- Brand creates campaign with ID, threshold, and deadline
- USDF vault is funded
- BrightMatter later triggers payout tx if KPI met
- If not met by deadline, fallback refund is scheduled

---

## ✅ Step 8: Forte Scheduled Transactions
- On campaign creation, schedule a tx that calls `refundExpired()` after `deadline`
- Format:
```json
{
  "action": "refundExpired",
  "args": ["campaignId", currentTime, brandAddressReceiverCap],
  "triggerAt": <timestamp>
}
```
- Leverages Flow Forte automation

---

## 📄 1-Page Context Overview for Cursor

**Project:** BrightMatter + Flow Hackathon Build (Veri)

**Summary:**
Building a proof-of-performance automation layer for creator campaigns. Creators have a non-transferrable on-chain Profile with veriScore and campaign data. Brands launch campaigns with USDF escrow. When BrightMatter AI determines a post hit its KPI, a payout is triggered. Campaigns have a deadline enforced via Flow Forte's scheduled transactions.

**Cursor Needs to Know:**
- Language: Cadence (smart contracts), TypeScript/React (front-end + verifier)
- Build target: Flow testnet
- Uses Flow Forte Scheduled Transactions for auto-expiration
- All payouts trustless and verifiable on-chain
- Profiles act like SBTs: cannot be transferred, stored in user account, updated only by BrightMatter oracle
- BrightMatter off-chain service acts as verifier/oracle and signer for updates
- Campaign escrow is funded in USDF and automates payout or refund on schedule
- Flow Forte automation is optional but strongly encouraged for scoring
- **Automatic Profile Mint on Login:** When a user logs into BrightMatter with their Flow wallet, the app checks if a Profile exists. If not, it calls `setup_profile.cdc` (signed by the user) to mint a new non-transferable Profile resource and publish a public capability.
- Goal: demo a working Flow-native resonance automation app to win Best Use of Forte and Killer App on Flow

This plan is modular, hackathon-ready, and shows off Flow’s strengths: composability, automation, and user-first design.

