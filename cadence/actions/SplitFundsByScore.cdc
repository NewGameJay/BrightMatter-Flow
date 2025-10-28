/**
 * SplitFundsByScore Action
 * 
 * Forte Action to calculate creator payout shares based on scores
 * Supports both curated and open campaigns
 */

import CampaignEscrowV3 from 0x14aca78d100d2001
import DepositToCreators from "./DepositToCreators.cdc"

// Re-export Payout for composability
access(all) struct Payout {
    access(all) let address: Address
    access(all) let amount: UFix64
    
    init(address: Address, amount: UFix64) {
        self.address = address
        self.amount = amount
    }
}

access(all) struct SplitFundsByScore {
    access(all) let campaignId: String
    access(all) let budget: UFix64
    access(all) let splits: [{Address: UFix64}]
    
    init(campaignId: String, budget: UFix64, splits: [{Address: UFix64}]) {
        self.campaignId = campaignId
        self.budget = budget
        self.splits = splits
    }
    
    access(all) fun execute(): [Payout] {
        var totalPercent: UFix64 = 0.0
        let epsilon: UFix64 = 0.00000001
        
        // Calculate total percent
        for split in self.splits {
            for address in split.keys {
                totalPercent = totalPercent + split[address]!
            }
        }
        
        // Validate sum is approximately 1.0 (within epsilon)
        if totalPercent > 1.0 + epsilon || totalPercent < 1.0 - epsilon {
            panic("Splits must sum to 1.0, got ".concat(totalPercent.toString()))
        }
        
        // Compute concrete amounts and return Payout array
        var payouts: [Payout] = []
        
        for split in self.splits {
            for address in split.keys {
                let percent = split[address]!
                let amount = self.budget * percent
                payouts.append(Payout(address: address, amount: amount))
            }
        }
        
        return payouts
    }
}
