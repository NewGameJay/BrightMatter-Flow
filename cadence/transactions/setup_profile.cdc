import CreatorProfileV2 from 0x14aca78d100d2001
import FlowToken from 0x1654653399040a61
import FungibleToken from 0xf233dcee88fe0abe

transaction {
    prepare(signer: auth(Storage, SaveValue, BorrowValue, Capabilities) &Account) {
        // 1. Setup CreatorProfile if it doesn't exist
        if signer.borrow<&CreatorProfileV2.Profile>(from: /storage/CreatorProfile) == nil {
            // Create and save profile
            signer.save(<- CreatorProfileV2.createEmptyProfile(), to: /storage/CreatorProfile)
            
            // Link public capability
            signer.unlink(/public/CreatorProfile)
            signer.link<&{CreatorProfileV2.ProfilePublic}>(
                /public/CreatorProfile,
                target: /storage/CreatorProfile
            )
        }
        
        // 2. Setup FlowToken receiver vault if it doesn't exist
        if signer.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault) == nil {
            // Create empty vault
            signer.save(
                <- FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>()),
                to: /storage/flowTokenVault
            )
            
            // Link public receiver capability
            signer.unlink(/public/flowTokenReceiver)
            signer.link<&{FungibleToken.Receiver}>(
                /public/flowTokenReceiver,
                target: /storage/flowTokenVault
            )
            
            // Link public balance capability
            signer.unlink(/public/flowTokenBalance)
            signer.link<&{FungibleToken.Balance}>(
                /public/flowTokenBalance,
                target: /storage/flowTokenVault
            )
        }
    }
}
