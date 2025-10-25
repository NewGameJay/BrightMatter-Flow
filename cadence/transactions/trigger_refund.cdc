import CampaignEscrow from 0x14aca78d100d2001

transaction(
    campaignId: String,
    signer: Address
) {
    prepare(acct: AuthAccount) {
        // Trigger refund if campaign failed
        let success = CampaignEscrow.triggerRefund(
            campaignId: campaignId,
            signer: signer
        )
        
        if !success {
            panic("Failed to trigger refund")
        }
    }
}

