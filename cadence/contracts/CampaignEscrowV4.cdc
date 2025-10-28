/**
 * CampaignEscrowV4 Contract
 * 
 * Manages campaign escrow with FLOW tokens and automated payouts
 * Supports both CLOSED (curated) and OPEN campaigns
 * CLOSED: Brand specifies allowlist of creators upfront
 * OPEN: Any creator can join dynamically via oracle-signed transaction
 */

import FungibleToken from 0xf233dcee88fe0abe
import FlowToken from 0x1654653399040a61

access(all) contract CampaignEscrowV4 {
    
    // Campaign type enum
    access(all) enum CampaignType: UInt8 {
        access(all) case closed
        access(all) case open
    }
    
    // Campaign data structure
    access(all) struct Campaign {
        access(all) let id: String
        access(all) let brand: Address
        access(all) let threshold: UFix64
        access(all) let payout: UFix64
        access(all) let deadline: UFix64
        access(all) let createdAt: UFix64
        access(all) let scheduledTxId: String?
        access(all) let campaignType: CampaignType
        access(all) let title: String
        access(self) var totalScore: UFix64
        access(all) var creatorScores: {Address: UFix64}
        access(all) var allowlist: [Address]  // Dynamic allowlist for creators
        access(self) var paidOut: Bool
        
        init(
            id: String,
            brand: Address,
            threshold: UFix64,
            payout: UFix64,
            deadline: UFix64,
            createdAt: UFix64,
            scheduledTxId: String?,
            campaignType: CampaignType,
            title: String,
            allowlist: [Address]
        ) {
            self.id = id
            self.brand = brand
            self.threshold = threshold
            self.payout = payout
            self.deadline = deadline
            self.createdAt = createdAt
            self.scheduledTxId = scheduledTxId
            self.campaignType = campaignType
            self.title = title
            self.totalScore = 0.0
            self.creatorScores = {}
            self.allowlist = allowlist
            self.paidOut = false
        }
        
        // Setter function to add to total score
        access(all) fun addToTotalScore(_ amount: UFix64) {
            self.totalScore = self.totalScore + amount
        }
        
        // Getter for totalScore
        access(all) fun getTotalScore(): UFix64 {
            return self.totalScore
        }
        
        // Add creator to allowlist
        access(all) fun addToAllowlist(_ creator: Address) {
            if !self.allowlist.contains(creator) {
                self.allowlist.append(creator)
            }
        }
        
        // Check if creator is in allowlist
        access(all) fun isCreatorAllowed(_ creator: Address): Bool {
            return self.allowlist.contains(creator)
        }
        
        // Setter for paidOut
        access(all) fun setPaidOut(_ value: Bool) {
            self.paidOut = value
        }
        
        // Getter for paidOut
        access(all) fun isPaidOut(): Bool {
            return self.paidOut
        }
    }
    
    // Oracle account for triggering payouts
    access(all) let oracle: Address
    
    // Storage for campaigns and FLOW vault
    access(all) var campaigns: {String: Campaign}
    access(all) var vault: @FlowToken.Vault
    
    // Create a new campaign with FLOW deposit
    access(all) fun createCampaign(
        id: String,
        brand: Address,
        threshold: UFix64,
        payout: UFix64,
        deadline: UFix64,
        campaignType: CampaignType,
        title: String,
        allowlist: [Address],
        from: @FlowToken.Vault
    ): Bool {
        // Validate inputs
        pre {
            threshold > 0.0: "Threshold must be positive"
            payout > 0.0: "Payout must be positive"
            deadline > getCurrentBlock().timestamp: "Deadline must be in the future"
            !self.campaigns.containsKey(id): "Campaign ID already exists"
        }
        
        // Create campaign
        let campaign = Campaign(
            id: id,
            brand: brand,
            threshold: threshold,
            payout: payout,
            deadline: deadline,
            createdAt: getCurrentBlock().timestamp,
            scheduledTxId: nil,
            campaignType: campaignType,
            title: title,
            allowlist: allowlist
        )
        
        // Store campaign
        self.campaigns[id] = campaign
        
        // Deposit FLOW into vault
        self.vault.deposit(from: <- from)
        
        // Emit event
        emit CampaignCreated(
            id: id, 
            brand: brand, 
            threshold: threshold, 
            payout: payout, 
            campaignType: campaignType.rawValue,
            title: title
        )
        
        return true
    }
    
    // Join an open campaign (oracle-signed to verify creator wallet)
    access(all) fun joinCampaign(
        campaignId: String,
        creator: Address,
        signer: Address
    ): Bool {
        pre {
            signer == self.oracle: "Only oracle can add creators to campaigns"
            self.campaigns.containsKey(campaignId): "Campaign does not exist"
        }
        
        let campaign = self.campaigns[campaignId]!
        
        // Check if campaign is open
        assert(campaign.campaignType == CampaignType.open, message: "Only open campaigns allow joining")
        
        // Add creator to allowlist
        campaign.addToAllowlist(creator)
        
        // Write back the mutated struct to storage
        self.campaigns[campaignId] = campaign
        
        // Emit event
        emit CreatorJoinedCampaign(campaignId: campaignId, creator: creator)
        
        return true
    }
    
    // Update creator performance score (oracle only)
    access(all) fun updateCreatorScore(
        campaignId: String,
        creator: Address,
        score: UFix64,
        signer: Address
    ): Bool {
        pre {
            signer == self.oracle: "Only oracle can update scores"
            self.campaigns.containsKey(campaignId): "Campaign does not exist"
        }
        
        let campaign = self.campaigns[campaignId]!
        
        // Check if creator is in allowlist
        assert(campaign.isCreatorAllowed(creator), message: "Creator not in campaign allowlist")
        
        // Update creator score
        campaign.creatorScores[creator] = score
        
        // Update total campaign score using setter
        campaign.addToTotalScore(score)
        
        // Write back the mutated struct to storage
        self.campaigns[campaignId] = campaign
        
        // Emit event
        emit CreatorScoreUpdated(campaignId: campaignId, creator: creator, score: score)
        
        return true
    }
    
    // Verify campaign performance and trigger payout or refund
    access(all) fun verifyAndPayout(
        campaignId: String,
        signer: Address
    ): String {
        pre {
            signer == self.oracle: "Only oracle can verify and payout"
            self.campaigns.containsKey(campaignId): "Campaign does not exist"
        }
        
        let campaign = self.campaigns[campaignId]!
        
        // Check if deadline has passed
        if getCurrentBlock().timestamp > campaign.deadline {
            // Campaign expired - check if threshold was met
            if campaign.getTotalScore() >= campaign.threshold {
                return "payout"
            } else {
                return "refund"
            }
        } else {
            // Campaign still active - check if threshold already met
            if campaign.getTotalScore() >= campaign.threshold {
                return "payout"
            } else {
                return "pending"
            }
        }
    }
    
    // Trigger payout if KPI is met (oracle only)
    access(all) fun triggerPayout(
        campaignId: String,
        signer: Address
    ): Bool {
        pre {
            signer == self.oracle: "Only oracle can trigger payouts"
            self.campaigns.containsKey(campaignId): "Campaign does not exist"
        }
        
        let campaign = self.campaigns[campaignId]!
        
        // Check if already paid out
        assert(!campaign.isPaidOut(), message: "Campaign already paid out")
        
        // Check if KPI is met
        if campaign.getTotalScore() >= campaign.threshold {
            // Calculate creator shares and distribute payouts
            let totalScore = campaign.getTotalScore()
            let payoutAmount = campaign.payout
            
            // Guard against division by zero
            if totalScore > 0.0 {
                // Withdraw from vault
                let vault <- self.vault.withdraw(amount: payoutAmount) as! @FlowToken.Vault
                
                // Distribute to each creator based on their score share
                for creator in campaign.creatorScores.keys {
                    let creatorScore = campaign.creatorScores[creator]!
                    let creatorShare = (creatorScore / totalScore) * payoutAmount
                    
                    // Get creator's FLOW receiver capability
                    let creatorAccount = getAccount(creator)
                    let receiverCap = creatorAccount.capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
                    
                    if receiverCap.check() {
                        let receiver = receiverCap.borrow()!
                        let payment <- vault.withdraw(amount: creatorShare)
                        receiver.deposit(from: <- payment)
                    } else {
                        // If creator doesn't have a receiver, destroy the tokens (shouldn't happen in production)
                        destroy vault.withdraw(amount: creatorShare)
                    }
                }
                
                // Destroy any remaining dust
                destroy vault
            }
            
            // Mark as paid out
            campaign.setPaidOut(true)
            self.campaigns[campaignId] = campaign
            
            // Emit event
            emit PayoutTriggered(campaignId: campaignId, totalScore: campaign.getTotalScore(), payout: payoutAmount)
            
            return true
        }
        
        return false
    }
    
    // Trigger refund if campaign failed (oracle only)
    access(all) fun triggerRefund(
        campaignId: String,
        signer: Address
    ): Bool {
        pre {
            signer == self.oracle: "Only oracle can trigger refunds"
            self.campaigns.containsKey(campaignId): "Campaign does not exist"
        }
        
        let campaign = self.campaigns[campaignId]!
        
        // Check if already paid out
        assert(!campaign.isPaidOut(), message: "Campaign already processed")
        
        // Check if deadline has passed and KPI not met
        if getCurrentBlock().timestamp > campaign.deadline && campaign.getTotalScore() < campaign.threshold {
            // Refund FLOW to brand
            let refundAmount = campaign.payout
            let vault <- self.vault.withdraw(amount: refundAmount) as! @FlowToken.Vault
            
            // Get brand's FLOW receiver capability
            let brandAccount = getAccount(campaign.brand)
            let receiverCap = brandAccount.capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            
            if receiverCap.check() {
                let receiver = receiverCap.borrow()!
                receiver.deposit(from: <- vault)
            } else {
                // If brand doesn't have a receiver, keep the tokens in contract vault
                self.vault.deposit(from: <- vault)
            }
            
            // Mark as paid out (processed)
            campaign.setPaidOut(true)
            self.campaigns[campaignId] = campaign
            
            // Emit event
            emit CampaignRefunded(campaignId: campaignId, brand: campaign.brand, amount: refundAmount)
            
            return true
        }
        
        return false
    }
    
    // Get campaign details
    access(all) fun getCampaign(id: String): Campaign? {
        return self.campaigns[id]
    }
    
    // Get all campaigns
    access(all) fun getAllCampaigns(): [Campaign] {
        let campaigns: [Campaign] = []
        for campaign in self.campaigns.values {
            campaigns.append(campaign)
        }
        return campaigns
    }
    
    // Get campaigns by creator (where creator is in allowlist)
    access(all) fun getCampaignsByCreator(creator: Address): [Campaign] {
        let creatorCampaigns: [Campaign] = []
        for campaign in self.campaigns.values {
            if campaign.isCreatorAllowed(creator) {
                creatorCampaigns.append(campaign)
            }
        }
        return creatorCampaigns
    }
    
    // Get open campaigns that a creator hasn't joined yet
    access(all) fun getOpenCampaigns(excludeCreator: Address?): [Campaign] {
        let openCampaigns: [Campaign] = []
        for campaign in self.campaigns.values {
            if campaign.campaignType == CampaignType.open && !campaign.isPaidOut() {
                // If excludeCreator provided, filter out campaigns they're already in
                if excludeCreator != nil && campaign.isCreatorAllowed(excludeCreator!) {
                    continue
                }
                openCampaigns.append(campaign)
            }
        }
        return openCampaigns
    }
    
    // Events
    access(all) event CampaignCreated(id: String, brand: Address, threshold: UFix64, payout: UFix64, campaignType: UInt8, title: String)
    access(all) event CreatorJoinedCampaign(campaignId: String, creator: Address)
    access(all) event CreatorScoreUpdated(campaignId: String, creator: Address, score: UFix64)
    access(all) event PayoutTriggered(campaignId: String, totalScore: UFix64, payout: UFix64)
    access(all) event CampaignRefunded(campaignId: String, brand: Address, amount: UFix64)
    
    init(oracle: Address) {
        self.oracle = oracle
        self.campaigns = {}
        self.vault <- FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>())
    }
}

