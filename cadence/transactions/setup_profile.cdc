import FungibleToken from 0xf233dcee88fe0abe
import FlowToken from 0x1654653399040a61
import CreatorProfileV2 from 0x14aca78d100d2001

transaction {
  prepare(signer: auth(Storage, SaveValue, Capabilities, BorrowValue) &Account) {
    // 1) Ensure FlowToken receiver vault
    let vaultRef = signer.storage.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
    if vaultRef == nil {
      signer.storage.save(<- FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>()), to: /storage/flowTokenVault)
      let cap = signer.capabilities.storage.issue<&{FungibleToken.Receiver}>(/storage/flowTokenVault)
      signer.capabilities.publish(cap, at: /public/flowTokenReceiver)
    } else {
      // Make sure the public receiver link exists
      let receiverCap = signer.capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
      if !receiverCap.check() {
        let cap = signer.capabilities.storage.issue<&{FungibleToken.Receiver}>(/storage/flowTokenVault)
        signer.capabilities.publish(cap, at: /public/flowTokenReceiver)
      }
    }

    // 2) Ensure CreatorProfileV2 profile in storage + public cap
    let profileRef = signer.storage.borrow<&CreatorProfileV2.Profile>(from: /storage/CreatorProfile)
    if profileRef == nil {
      signer.storage.save(<- CreatorProfileV2.createEmptyProfile(), to: /storage/CreatorProfile)
    }
    
    // Unpublish and republish the public capability
    signer.capabilities.unpublish(/public/CreatorProfile)
    let profileCap = signer.capabilities.storage.issue<&{CreatorProfileV2.ProfilePublic}>(/storage/CreatorProfile)
    signer.capabilities.publish(profileCap, at: /public/CreatorProfile)
  }
}
