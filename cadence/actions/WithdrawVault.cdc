/**
 * WithdrawVault Action
 * 
 * Forte Action to withdraw FLOW from campaign escrow vault
 * Restricted to authorized oracle/agent
 */

import FungibleToken from 0xf233dcee88fe0abe
import FlowToken from 0x1654653399040a61
import CampaignEscrowV3 from 0x14aca78d100d2001

access(all) struct WithdrawVault {
    access(all) let campaignId: String
    access(all) let signer: Address
    
    init(campaignId: String, signer: Address) {
        self.campaignId = campaignId
        self.signer = signer
    }
    
    access(all) fun execute(): @FlowToken.Vault {
        // Get campaign from escrow
        let campaign = CampaignEscrowV3.getCampaign(id: self.campaignId)
        
        if campaign == nil {
            panic("Campaign not found: ".concat(self.campaignId))
        }
        
        // Verify signer is the oracle
        pre {
            CampaignEscrowV3.getOracle() == self.signer: "Only oracle can withdraw from vault"
        }
        
        // Get the escrow vault
        let vaultRef = CampaignEscrowV3.getVault(campaignId: self.campaignId)
        
        if vaultRef == nil {
            panic("Vault not found for campaign: ".concat(self.campaignId))
        }
        
        // Withdraw entire balance
        return <-vaultRef!.withdraw(amount: vaultRef!.balance) as! @FlowToken.Vault
    }
}
