# 🏗️ Veri x Flow Integration - Project Structure

## 📁 **Complete Directory Structure**

```
veri-flow-intelligence-layer/
├── cadence/                           # Smart contracts and scripts
│   ├── contracts/                     # Core smart contracts
│   │   ├── CreatorProfile.cdc         # SBT profile with proof storage
│   │   └── CampaignEscrow.cdc         # Campaign management with FLOW vault
│   ├── transactions/                  # Transaction scripts
│   │   ├── setup_profile.cdc          # Creator profile minting
│   │   ├── create_campaign.cdc        # Campaign creation with FLOW deposit
│   │   ├── update_creator_score.cdc   # Oracle score updates
│   │   ├── trigger_payout.cdc         # Automated payout execution
│   │   ├── trigger_refund.cdc         # Automated refund execution
│   │   ├── schedule_payout.cdc        # Forte payout scheduling
│   │   └── schedule_refund.cdc        # Forte refund scheduling
│   ├── scripts/                       # Query scripts
│   │   ├── read_profile.cdc           # Read creator profile data
│   │   └── read_campaign.cdc          # Read campaign data
│   ├── actions/                       # Forte Actions (composable)
│   │   ├── WithdrawVault.cdc          # Withdraw FLOW from vault
│   │   ├── SplitFundsByScore.cdc      # Calculate creator shares
│   │   └── DepositToCreators.cdc      # Distribute FLOW to creators
│   ├── agents/                        # Forte Agents (automation)
│   │   └── campaign_monitor.cdc       # Hourly campaign monitoring
│   ├── resources/                     # Resource definitions
│   │   └── Proof.cdc                  # Proof resource structure
│   └── flix/                          # FLIX templates
│       └── veri.campaign.v1.json      # Campaign creation template
├── verifier/                          # BrightMatter Oracle Backend
│   ├── package.json                   # Node.js dependencies
│   ├── tsconfig.json                  # TypeScript configuration
│   ├── server.ts                      # Express server with REST API
│   ├── computeScore.ts                # AI scoring with V_res formula
│   ├── cadenceClient.ts               # Flow blockchain interactions
│   ├── forteAgent.ts                  # Forte agent management
│   └── env.example                    # Environment configuration
├── app/                               # React Frontend
│   ├── src/                           # Source code
│   ├── package.json                   # Frontend dependencies
│   └── vite.config.ts                 # Vite configuration
├── scripts/                           # Deployment and utility scripts
│   └── deploy_contracts.ts            # Contract deployment script
├── flow.json                          # Flow CLI configuration
├── README.md                          # Project documentation
├── DEPLOYMENT.md                      # Deployment guide
├── PROJECT_STRUCTURE.md               # This file
└── DEMO.md                            # Demo instructions
```

---

## 🔧 **Core Components**

### **Smart Contracts**
- **CreatorProfile.cdc** - Non-transferable SBT with proof storage
- **CampaignEscrow.cdc** - Campaign management with FLOW vault integration

### **Forte Integration**
- **Actions** - Composable transaction components
- **Agents** - Automated monitoring and execution
- **FLIX Templates** - Reusable campaign creation workflows

### **Backend Services**
- **BrightMatter Oracle** - AI scoring and blockchain interactions
- **Forte Agent Manager** - Automated transaction scheduling
- **REST API** - Campaign and score management endpoints

### **Frontend**
- **React App** - Creator and brand dashboards
- **FCL Integration** - Flow wallet connectivity
- **Campaign Management** - User interface for campaign operations

---

## 🚀 **Deployment Architecture**

### **Flow Mainnet**
- **Account:** `0x14aca78d100d2001`
- **Contracts:** CreatorProfile + CampaignEscrow
- **Oracle:** BrightMatter scoring service

### **Fly.io Deployment**
- **Backend:** Node.js oracle service
- **Frontend:** React application
- **Database:** Campaign and score storage

### **Forte Integration**
- **Scheduled Transactions** - Automated payouts and refunds
- **Agent Monitoring** - Hourly campaign status checks
- **Action Workflows** - Composable transaction sequences

---

## 🔄 **Data Flow**

```
Creator Post → BrightMatter AI → Score Computation → Oracle Updates → Smart Contracts → Forte Automation → Payouts/Refunds
```

### **Campaign Lifecycle**
1. **Creation** - Brand creates campaign with FLOW deposit
2. **Scheduling** - Forte schedules payout and refund transactions
3. **Monitoring** - Agent monitors campaign performance hourly
4. **Scoring** - Oracle updates creator scores based on AI analysis
5. **Execution** - Forte triggers payout or refund based on performance
6. **Completion** - Campaign results are recorded on-chain

---

## 🛡️ **Security & Trust Model**

### **Oracle Control**
- Only BrightMatter oracle can update scores
- All score updates are logged as events
- Proof resources provide verifiable performance data

### **Trustless Execution**
- Smart contracts enforce all rules
- Forte automation ensures timely execution
- No central authority controls funds

### **Transparency**
- All campaign data is publicly accessible
- Score updates are logged as events
- Proof resources provide audit trails

---

## 📊 **Key Features**

### **Campaign Management**
- 6-hour campaign windows
- FLOW token escrow
- Automated payout/refund logic
- Performance-based creator compensation

### **Creator Profiles**
- Non-transferable SBT profiles
- Campaign performance history
- Verifiable proof storage
- Transparent score tracking

### **Forte Automation**
- Scheduled transaction execution
- Agent-based monitoring
- Composable action workflows
- Template-based campaign creation

---

## 🎯 **Next Steps**

1. **Deploy Updated Contracts** - Deploy new contract versions with proof storage
2. **Test Forte Integration** - Verify scheduled transactions and agent monitoring
3. **End-to-End Testing** - Test complete user flows with real transactions
4. **Production Deployment** - Deploy to Fly.io with proper configuration
5. **Documentation** - Complete user guides and API documentation

The project structure is now complete and ready for the next phase of development!

