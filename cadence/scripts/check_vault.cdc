import FungibleToken from 0xf233dcee88fe0abe

access(all) fun main(acct: Address): Bool {
  return getAccount(acct)
    .getCapability<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
    .check()
}
