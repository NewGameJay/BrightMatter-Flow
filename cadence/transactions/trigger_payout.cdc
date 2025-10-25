import CampaignEscrow from 0x14aca78d100d2001

transaction(
    campaignId: String,
    signer: Address
) {
    prepare(acct: AuthAccount) {
        // Trigger payout if KPI is met
        let success = CampaignEscrow.triggerPayout(
            campaignId: campaignId,
            signer: signer
        )
        
        if !success {
            panic("Failed to trigger payout")
        }
    }
}