import CampaignEscrow from 0x14aca78d100d2001

access(all) fun main(campaignId: String): CampaignEscrow.Campaign? {
    return CampaignEscrow.getCampaign(id: campaignId)
}