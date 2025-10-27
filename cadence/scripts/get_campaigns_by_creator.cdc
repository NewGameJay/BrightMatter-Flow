import CampaignEscrowV2 from 0x14aca78d100d2001

access(all) fun main(creator: Address): [CampaignEscrowV2.Campaign] {
    return CampaignEscrowV2.getCampaignsByCreator(creator: creator)
}
