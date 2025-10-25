# 🌊 BrightMatter x Flow Integration

> **Hackathon Project**: Veri x Flow Integration - Proof-of-Performance Automation Layer for Creator Campaigns

## 🎯 Project Overview

BrightMatter AI acts as an oracle to automate creator campaign payouts on the Flow blockchain. Brands launch campaigns with FLOW escrow, creators submit posts, and the system automatically triggers payouts or refunds based on performance KPIs.

## 🏗️ Architecture

- **Blockchain**: Flow Mainnet
- **Smart Contracts**: Cadence 1.0
- **Oracle**: BrightMatter AI (Node.js backend)
- **Automation**: Flow Forte (Scheduled Transactions + Agents)
- **Frontend**: React + TypeScript + FCL
- **Deployment**: Fly.io

## 📂 Project Structure

```
bm-flow/
├── cadence/
│   ├── contracts/       # Smart contracts (CreatorProfile, CampaignEscrow)
│   ├── transactions/    # Transaction scripts
│   ├── scripts/         # Query scripts
│   ├── actions/         # Forte Actions
│   ├── agents/          # Cadence Agents
│   └── flix/            # FLIX templates
├── verifier/            # Oracle backend (Node.js)
├── scripts/             # Deployment and test scripts
├── fly.toml             # Fly.io configuration
└── Dockerfile           # Container configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Flow CLI
- Flow wallet with FLOW tokens

### Installation

```bash
# Clone repository
git clone https://github.com/NewGameJay/BrightMatter-Flow.git
cd BrightMatter-Flow

# Install dependencies
cd verifier
npm install

# Configure environment
cp env.example .env
# Edit .env with your configuration
```

### Development

```bash
# Start oracle backend
cd verifier
npm run dev

# Run end-to-end tests
node ../scripts/test-end-to-end.js
```

## 📖 Documentation

- [Production Deployment Guide](README_PRODUCTION.md)
- [End-to-End Test Results](E2E_TEST_RESULTS.md)
- [Project Structure](PROJECT_STRUCTURE.md)
- [Deployment Notes](DEPLOYMENT.md)

## ✨ Features

- ✅ **Creator Profiles**: Non-transferable SBT profiles with performance tracking
- ✅ **Campaign Escrow**: FLOW token escrow for automated payouts
- ✅ **Oracle Scoring**: BrightMatter AI computes performance scores
- ✅ **Forte Automation**: Scheduled transactions and agent monitoring
- ✅ **Mainnet Ready**: Production-deployed smart contracts

## 🔐 Security

- Oracle signer enforcement on all updates
- Smart contract escrow protection
- Access control and role-based permissions
- Private key management

## 🎓 Hackathon Details

**Challenge**: Flow Forte Integration  
**Team**: BrightMatter  
**Platform**: Flow Blockchain  
**Focus**: Creator campaign automation with proof-of-performance

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

This is a hackathon project. Pull requests welcome!

---

**Built with ❤️ for the Flow ecosystem**
