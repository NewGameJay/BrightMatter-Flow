/**
 * WithdrawVault Action
 * 
 * Forte Action for withdrawing FLOW from campaign vault
 * Part of composable payout workflow
 */

import CampaignEscrow from 0x14aca78d100d2001
import FlowToken from 0x1654653399040a61

access(all) fun main(
    campaignId: String,
    amount: UFix64,
    oracleAddress: Address
): @FlowToken.Vault {
    // Get campaign data
    let campaign = CampaignEscrow.getCampaign(id: campaignId)
    if campaign == nil {
        panic("Campaign not found")
    }
    
    // Verify oracle authorization
    if oracleAddress != CampaignEscrow.oracle {
        panic("Unauthorized oracle")
    }
    
    // Withdraw from vault
    let vault = CampaignEscrow.vault.withdraw(amount: amount)
    
    return <- vault
}
