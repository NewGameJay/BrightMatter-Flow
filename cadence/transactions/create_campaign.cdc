import FungibleToken from 0xf233dcee88fe0abe
import FlowToken from 0x1654653399040a61
import CampaignEscrowV2 from 0x14aca78d100d2001

transaction(
  id: String,
  creator: Address,
  threshold: UFix64,
  payout: UFix64,
  deadline: UFix64,
  deposit: UFix64
) {
  // withdraw from brand vault
  let vaultRef: &FlowToken.Vault
  prepare(acct: auth(Storage, BorrowValue) &Account) {
    self.vaultRef = acct.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
      ?? panic("Brand: missing FlowToken vault")
  }
  execute {
    let payment <- self.vaultRef.withdraw(amount: deposit)
    let ok = CampaignEscrowV2.createCampaign(
      id: id,
      creator: creator,
      threshold: threshold,
      payout: payout,
      deadline: deadline,
      from: <- payment
    )
    assert(ok, message: "createCampaign failed")
  }
}
