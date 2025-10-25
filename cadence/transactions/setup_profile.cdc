import CreatorProfile from 0x14aca78d100d2001

transaction {
    prepare(signer: AuthAccount) {
        // Check if profile already exists
        if signer.borrow<&CreatorProfile.Profile>(from: CreatorProfile.ProfileStoragePath) == nil {
            // Create new profile
            let profile <- CreatorProfile.createProfile()
            
            // Store profile in account storage
            signer.save(<- profile, to: CreatorProfile.ProfileStoragePath)
            
            // Create public capability
            signer.link<&CreatorProfile.Profile{CreatorProfile.IProfilePublic}>(
                CreatorProfile.ProfilePublicPath,
                target: CreatorProfile.ProfileStoragePath
            )
            
            // Emit event
            CreatorProfile.ProfileCreated(address: signer.address)
        }
    }
}