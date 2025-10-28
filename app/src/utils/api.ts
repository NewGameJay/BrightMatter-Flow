const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://brightmatter-oracle.fly.dev'

interface ApiClient {
  getCampaigns: (address: string) => Promise<any>
}

export const apiClient: ApiClient = {
  async getCampaigns(address: string) {
    const response = await fetch(`${API_BASE_URL}/api/campaigns/by-creator/${address}`)
    if (!response.ok) {
      return { success: false, data: [] }
    }
    return await response.json()
  }
}

