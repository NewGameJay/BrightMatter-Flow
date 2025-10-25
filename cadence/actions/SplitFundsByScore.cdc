/**
 * SplitFundsByScore Action
 * 
 * Forte Action for calculating creator shares based on performance scores
 * Part of composable payout workflow
 */

import CampaignEscrow from 0x14aca78d100d2001

access(all) fun main(
    campaignId: String,
    totalAmount: UFix64
): {Address: UFix64} {
    // Get campaign data
    let campaign = CampaignEscrow.getCampaign(id: campaignId)
    if campaign == nil {
        panic("Campaign not found")
    }
    
    let creatorShares: {Address: UFix64} = {}
    let totalScore = campaign!.totalScore
    
    // Calculate each creator's share
    for creator in campaign!.creatorScores.keys {
        let creatorScore = campaign!.creatorScores[creator]!
        let creatorShare = (creatorScore / totalScore) * totalAmount
        creatorShares[creator] = creatorShare
    }
    
    return creatorShares
}

