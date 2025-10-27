import FungibleToken from 0xf233dcee88fe0abe
import FlowToken from 0x1654653399040a61
import CreatorProfileV2 from 0x14aca78d100d2001

transaction {
  prepare(acct: auth(Storage, SaveValue, Capabilities, BorrowValue) &Account) {
    // 1) Ensure FlowToken receiver vault
    if acct.storage.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault) == nil {
      acct.storage.save(<- FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>()), to: /storage/flowTokenVault)
      acct.capabilities.storage.issue<&{FungibleToken.Receiver}>(
        /storage/flowTokenVault
      ).link(/public/flowTokenReceiver)
    } else {
      // Make sure the public receiver link exists
      if !acct.capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver).check() {
        acct.capabilities.storage.issue<&{FungibleToken.Receiver}>(
          /storage/flowTokenVault
        ).link(/public/flowTokenReceiver)
      }
    }

    // 2) Ensure CreatorProfileV2 profile in storage + public cap
    if acct.storage.borrow<&CreatorProfileV2.Profile>(from: /storage/CreatorProfile) == nil {
      acct.storage.save(<- CreatorProfileV2.createEmptyProfile(), to: /storage/CreatorProfile)
    }
    acct.capabilities.unlink(/public/CreatorProfile)
    acct.capabilities.storage.issue<&{CreatorProfileV2.ProfilePublic}>(
      /storage/CreatorProfile
    ).link(/public/CreatorProfile)
  }
}
