/**
 * Schedule Agent Transaction
 * 
 * Schedules a Forte agent to verify and payout campaign after deadline + 1h
 */

import CampaignEscrowV3 from 0x14aca78d100d2001

transaction(campaignId: String) {
    prepare(signer: auth(Storage, BorrowValue) &Account) {
        // Get campaign to calculate execution time
        let campaign = CampaignEscrowV3.getCampaign(id: campaignId)
            ?? panic("Campaign not found")
        
        let executeAt = campaign.deadline + 3600.0 // +1 hour after deadline
        
        log("Scheduling agent for campaign ".concat(campaignId))
        log("Execution time: ".concat(executeAt.toString()))
        
        // In production, this would call Forte's Scheduler Manager:
        // ForteScheduler.scheduleTransaction(
        //     script: "cadence/transactions/verify_and_payout.cdc",
        //     args: [campaignId],
        //     executeAt: executeAt,
        //     payer: signer.address
        // )
        
        // For now, emit event for manual tracking
        emit CampaignEscrowV3.AgentScheduled(campaignId: campaignId, executeAt: executeAt)
    }
    
    execute {
        log("Agent scheduling complete")
    }
}

