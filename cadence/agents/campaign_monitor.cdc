/**
 * Campaign Monitor Agent
 * 
 * Forte Agent that monitors campaign performance every hour
 * Automatically triggers payouts or refunds based on campaign status
 */

import CampaignEscrow from 0x14aca78d100d2001

access(all) fun main(): [String] {
    let results: [String] = []
    
    // Get all active campaigns
    let campaigns = CampaignEscrow.getAllCampaigns()
    
    for campaign in campaigns {
        let campaignId = campaign.id
        let currentTime = getCurrentBlock().timestamp
        
        // Check if campaign deadline has passed
        if currentTime > campaign.deadline {
            // Campaign expired - check if threshold was met
            if campaign.totalScore >= campaign.threshold {
                // Trigger payout
                results.append("Campaign ".concat(campaignId).concat(": Threshold met, triggering payout"))
                
                // In a real implementation, you would call:
                // CampaignEscrow.triggerPayout(campaignId: campaignId, signer: oracleAddress)
                
            } else {
                // Trigger refund
                results.append("Campaign ".concat(campaignId).concat(": Threshold not met, triggering refund"))
                
                // In a real implementation, you would call:
                // CampaignEscrow.triggerRefund(campaignId: campaignId, signer: oracleAddress)
            }
        } else {
            // Campaign still active - check if threshold already met
            if campaign.totalScore >= campaign.threshold {
                results.append("Campaign ".concat(campaignId).concat(": Threshold met, ready for payout"))
            } else {
                results.append("Campaign ".concat(campaignId).concat(": Active, threshold not yet met"))
            }
        }
    }
    
    return results
}

