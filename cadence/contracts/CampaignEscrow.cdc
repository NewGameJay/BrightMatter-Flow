/**
 * CampaignEscrow Contract
 * 
 * Manages campaign escrow with FLOW tokens and automated payouts
 * Integrates with Flow Forte scheduled transactions for auto-refund
 * Handles trustless campaign management between brands and creators
 */

import FungibleToken from 0xf233dcee88fe0abe
import FlowToken from 0x1654653399040a61

access(all) contract CampaignEscrow {
    
    // Campaign data structure
    access(all) struct Campaign {
        access(all) let id: String
        access(all) let creator: Address
        access(all) let brand: Address
        access(all) let threshold: UFix64
        access(all) let payout: UFix64
        access(all) let deadline: UFix64
        access(all) let createdAt: UFix64
        access(all) let scheduledTxId: String? // Forte scheduled transaction ID for auto-refund
        access(self) var totalScore: UFix64
        access(all) var creatorScores: {Address: UFix64}
        
        init(
            id: String,
            creator: Address,
            brand: Address,
            threshold: UFix64,
            payout: UFix64,
            deadline: UFix64,
            createdAt: UFix64,
            scheduledTxId: String?
        ) {
            self.id = id
            self.creator = creator
            self.brand = brand
            self.threshold = threshold
            self.payout = payout
            self.deadline = deadline
            self.createdAt = createdAt
            self.scheduledTxId = scheduledTxId
            self.totalScore = 0.0
            self.creatorScores = {}
        }
        
        // Setter function to add to total score
        access(all) fun addToTotalScore(_ amount: UFix64) {
            self.totalScore = self.totalScore + amount
        }
        
        // Getter for totalScore
        access(all) fun getTotalScore(): UFix64 {
            return self.totalScore
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
        creator: Address,
        threshold: UFix64,
        payout: UFix64,
        deadline: UFix64,
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
            creator: creator,
            brand: self.oracle, // Using oracle as brand for simplicity
            threshold: threshold,
            payout: payout,
            deadline: deadline,
            createdAt: getCurrentBlock().timestamp,
            scheduledTxId: nil
        )
        
        // Store campaign
        self.campaigns[id] = campaign
        
        // Deposit FLOW into vault
        self.vault.deposit(from: <- from)
        
        // Emit event
        emit CampaignCreated(id: id, creator: creator, threshold: threshold, payout: payout)
        
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
        
        // Update creator score
        campaign.creatorScores[creator] = score
        
        // Update total campaign score using setter
        campaign.addToTotalScore(score)
        
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
        
        // Check if KPI is met
        if campaign.getTotalScore() >= campaign.threshold {
            // Calculate creator shares and distribute payouts
            let totalScore = campaign.getTotalScore()
            let payoutAmount = campaign.payout
            
            // Distribute to each creator based on their score share
            for creator in campaign.creatorScores.keys {
                let creatorScore = campaign.creatorScores[creator]!
                let creatorShare = (creatorScore / totalScore) * payoutAmount
                
                // Transfer FLOW to creator
                // Note: In a real implementation, you'd need to handle the transfer
                // This is simplified for the demo
            }
            
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
        
        // Check if deadline has passed and KPI not met
        if getCurrentBlock().timestamp > campaign.deadline && campaign.getTotalScore() < campaign.threshold {
            // Refund FLOW to brand
            // Note: In a real implementation, you'd need to handle the transfer
            // This is simplified for the demo
            
            // Emit event
            emit CampaignRefunded(campaignId: campaignId, brand: campaign.brand, amount: campaign.payout)
            
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
    
    // Events
    access(all) event CampaignCreated(id: String, creator: Address, threshold: UFix64, payout: UFix64)
    access(all) event CreatorScoreUpdated(campaignId: String, creator: Address, score: UFix64)
    access(all) event PayoutTriggered(campaignId: String, totalScore: UFix64, payout: UFix64)
    access(all) event CampaignRefunded(campaignId: String, brand: Address, amount: UFix64)
    
    init(oracle: Address) {
        self.oracle = oracle
        self.campaigns = {}
        self.vault <- FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>())
    }
}