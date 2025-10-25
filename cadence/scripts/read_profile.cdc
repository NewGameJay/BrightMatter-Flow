import CreatorProfile from 0x14aca78d100d2001

access(all) fun main(address: Address): CreatorProfile.IProfilePublic? {
    let account = getAccount(address)
    
    if let profile = account.getCapability<&CreatorProfile.Profile{CreatorProfile.IProfilePublic}>(
        CreatorProfile.ProfilePublicPath
    ).borrow() {
        return profile
    }
    
    return nil
}