/**
 * Verify and Payout Transaction
 * 
 * Called by Forte Agent to verify proofs and trigger payout Action chain
 */

import CampaignEscrowV3 from 0x14aca78d100d2001

transaction(campaignId: String) {
    prepare(signer: &Account) {
        let signerAddr = signer.address
        
        // Call the contract's verifyAndPayout function
        // This internally executes the Action chain:
        // WithdrawVault → SplitFundsByScore → DepositToCreators
        let success = CampaignEscrowV3.triggerPayout(
            campaignId: campaignId,
            signer: signerAddr
        )
        
        assert(success, message: "Payout verification failed")
        
        log("Campaign ".concat(campaignId).concat(" payout executed"))
    }
    
    execute {
        log("Verify and payout complete")
    }
}

