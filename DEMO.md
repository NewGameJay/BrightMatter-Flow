# Veri x Flow Demo Script

## 🎯 Demo Overview

This demo showcases the complete Veri x Flow creator campaign platform, demonstrating:
- On-chain soulbound creator profiles
- Automated USDF escrow with Forte scheduled transactions
- Social media post analysis and VeriScore calculation
- Trustless campaign management

## 🎬 Demo Flow (15-20 minutes)

### 1. Project Introduction (2 minutes)

**What we built:**
- Creator economy platform on Flow blockchain
- Non-transferable creator profiles (SBTs)
- Automated campaign escrow with USDF
- Flow Forte scheduled transactions for automation

**Why Flow:**
- Consumer-friendly blockchain
- Forte automation capabilities
- USDF stablecoin integration
- Composability and ecosystem integration

### 2. Creator Journey Demo (8 minutes)

#### Step 1: Wallet Connection
1. Open the app at http://localhost:3000
2. Click "Connect Your Flow Wallet"
3. Select wallet (Blocto, Lilico, or Dapper)
4. Approve connection
5. **Show**: Connected address displayed in header

#### Step 2: Profile Creation
1. Navigate to Creator Dashboard
2. Click "Create Profile" (if no profile exists)
3. Sign transaction to mint SBT
4. **Show**: Profile created with VeriScore 0.00

#### Step 3: Post Analysis
1. Enter a YouTube or Twitter post URL
2. Click "Analyze Post"
3. **Show**: Real-time analysis with metrics breakdown
4. **Show**: VeriScore calculation (engagement + reach + virality)

#### Step 4: Score Update
1. Click "Update VeriScore"
2. Sign transaction to write score on-chain
3. **Show**: Profile updated with new VeriScore
4. **Show**: On-chain verification via Flow explorer

### 3. Brand Journey Demo (8 minutes)

#### Step 1: Campaign Creation
1. Navigate to Brand Dashboard
2. Click "Create Campaign"
3. Fill out form:
   - Campaign ID: "demo-campaign-001"
   - Creator Address: (from creator demo)
   - VeriScore Threshold: 75
   - Payout Amount: 100 USDF
   - Deadline: 30 days
4. Click "Create Campaign"
5. **Show**: Campaign created with USDF deposit

#### Step 2: Escrow Funding
1. Approve USDF spending
2. Deposit 100 USDF into escrow
3. **Show**: Escrow funded and campaign active

#### Step 3: Forte Integration
1. **Show**: Scheduled transaction created for auto-refund
2. **Show**: Campaign monitoring dashboard
3. **Show**: Automatic payout when threshold met

### 4. Automation Demo (2 minutes)

#### Scheduled Transactions
1. **Show**: Flow Forte scheduled transaction in explorer
2. **Show**: Automatic refund when deadline expires
3. **Show**: No manual intervention needed

#### Composability
1. Navigate to Profile page
2. **Show**: Public profile data readable by other dApps
3. **Show**: VeriScore and campaign history on-chain

## 🎯 Key Points to Highlight

### Technical Excellence
- **Cadence Smart Contracts** - Resource-oriented programming
- **Flow Forte** - Scheduled transactions for automation
- **USDF Integration** - Real stablecoin payments
- **FCL Integration** - Seamless wallet connectivity

### User Experience
- **No Crypto Complexity** - Simple wallet connection
- **Real-time Analysis** - Instant post scoring
- **Transparent Payouts** - All on-chain verification
- **Mobile Responsive** - Works on all devices

### Innovation
- **Soulbound Profiles** - Non-transferable creator identity
- **Trustless Automation** - No intermediaries needed
- **Web2/Web3 Bridge** - Social media → blockchain
- **Composable Data** - Ecosystem integration ready

## 🔍 Technical Deep Dive (Optional)

### Smart Contract Architecture
```cadence
// CreatorProfile - Non-transferable SBT
pub resource Profile: IProfilePublic {
    pub var veriScore: UFix64
    pub var campaignScores: {String: UFix64}
    // Only oracle can update scores
}

// CampaignEscrow - Automated USDF management
pub struct Campaign {
    pub let threshold: UFix64
    pub let payout: UFix64
    pub let scheduledTxId: String? // Forte integration
}
```

### Oracle Service
- **Post Analysis** - Social media metrics extraction
- **Score Calculation** - VeriScore algorithm
- **On-chain Updates** - Transaction signing and submission
- **Campaign Monitoring** - Automated payout triggers

### Frontend Architecture
- **React + TypeScript** - Modern development
- **TailwindCSS** - Utility-first styling
- **Flow Client Library** - Blockchain integration
- **Responsive Design** - Mobile-first approach

## 🎪 Demo Tips

### Preparation
- Have test accounts ready with FLOW tokens
- Pre-analyze some posts for consistent results
- Test all flows before demo
- Have Flow explorer links ready

### Presentation
- Start with the problem (creator economy pain points)
- Show the solution (on-chain verification)
- Demonstrate the automation (Forte features)
- Highlight the innovation (SBTs + scheduled transactions)

### Backup Plans
- Have screenshots ready if live demo fails
- Prepare video recordings as fallback
- Have alternative post URLs ready
- Test network connectivity beforehand

## 🏆 Hackathon Positioning

### Best Use of Forte
- **Scheduled Transactions** - Automated refund system
- **On-chain Automation** - No off-chain dependencies
- **Trustless Execution** - Everything runs on Flow

### Killer App on Flow
- **Consumer-Friendly** - Easy wallet connection
- **Real Utility** - Solves actual creator economy problems
- **Ecosystem Integration** - Composable with other dApps
- **Scalable Architecture** - Ready for mass adoption

## 📊 Success Metrics

- **User Engagement** - Wallet connections and profile creation
- **Transaction Volume** - On-chain score updates and payouts
- **Automation Success** - Scheduled transactions executing
- **Ecosystem Integration** - Other dApps reading profile data

---

**Ready to demo the future of creator economy on Flow! 🚀**

