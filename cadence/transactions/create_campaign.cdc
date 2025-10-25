import CampaignEscrow from 0x14aca78d100d2001
import FlowToken from 0x7e60df042a9c0868

transaction(
    campaignId: String,
    creator: Address,
    threshold: UFix64,
    payout: UFix64,
    deadline: UFix64,
    from: @FlowToken.Vault
) {
    prepare(signer: AuthAccount) {
        // Create campaign with FLOW deposit
        let success = CampaignEscrow.createCampaign(
            id: campaignId,
            creator: creator,
            threshold: threshold,
            payout: payout,
            deadline: deadline,
            from: <- from
        )
        
        if !success {
            panic("Failed to create campaign")
        }
    }
}