/**
 * Update VeriScore Transaction
 * 
 * Oracle-signed transaction to update a user's VeriScore
 * Only the oracle account can execute this transaction
 * Updates the profile with new score and timestamp
 */

import CreatorProfile from 0xCreatorProfile

transaction(newScore: UFix64, targetAddress: Address) {
    
    let oracle: Address
    
    init(newScore: UFix64, targetAddress: Address) {
        self.oracle = CreatorProfile.oracle
    }
    
    prepare(oracleAcct: AuthAccount) {
        // Verify oracle authorization
        assert(oracleAcct.address == self.oracle, message: "Only oracle can update scores")
    }
    
    execute {
        // Get the target account's profile
        let targetAccount = getAccount(targetAddress)
        let profileRef = targetAccount.getCapability<&CreatorProfile.Profile{CreatorProfile.IProfilePublic}>(
            /public/CreatorProfile
        ).borrow()
        
        if profileRef != nil {
            // Update the score with current timestamp
            let timestamp = getCurrentBlock().timestamp
            profileRef!.updateScore(score: newScore, timestamp: timestamp)
            
            emit CreatorProfile.ProfileUpdated(
                address: targetAddress,
                newScore: newScore,
                timestamp: timestamp
            )
            
            log("VeriScore updated for address: ".concat(targetAddress.toString()))
        } else {
            log("Profile not found for address: ".concat(targetAddress.toString()))
        }
    }
}
