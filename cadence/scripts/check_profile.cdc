import CreatorProfileV2 from 0x14aca78d100d2001

access(all) fun main(acct: Address): Bool {
  return getAccount(acct)
    .getCapability<&{CreatorProfileV2.ProfilePublic}>(/public/CreatorProfile)
    .check()
}
