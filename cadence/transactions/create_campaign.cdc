import CampaignEscrowV2 from 0x14aca78d100d2001
import FlowToken from 0x1654653399040a61

transaction(
    campaignId: String,
    creator: Address,
    threshold: UFix64,
    payout: UFix64,
    deadline: UFix64,
    from: @FlowToken.Vault
) {
    prepare(signer: auth(Storage, SaveValue, BorrowValue) &Account) {
        // Create campaign with FLOW deposit
        let success = CampaignEscrowV2.createCampaign(
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
