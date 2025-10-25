/**
 * Cadence Client Module
 * 
 * Provides high-level interface for interacting with Flow blockchain
 * Handles contract interactions, script execution, and transaction management
 * Abstracts complex Flow operations into simple function calls
 */

import * as fcl from '@onflow/fcl';
import { FlowAddress } from '@onflow/fcl/types';

export interface ProfileData {
  veriScore: number;
  campaignScores: { [campaignId: string]: number };
  lastUpdated: number;
  totalCampaigns: number;
}

export interface CampaignData {
  id: string;
  creator: string;
  brand: string;
  threshold: number;
  payout: number;
  paidOut: boolean;
  deadline: number;
  createdAt: number;
  scheduledTxId?: string;
}

export class CadenceClient {
  private isInitialized = false;

  constructor() {
    this.initializeFCL();
  }

  /**
   * Initialize FCL configuration for mainnet
   */
  private initializeFCL(): void {
    fcl.config({
      'accessNode.api': 'https://rest-mainnet.onflow.org',
      'flow.network': 'mainnet',
      'app.detail.title': 'Veri Flow Oracle',
      'app.detail.icon': 'https://veri.flow.com/icon.png'
    });

    this.isInitialized = true;
    console.log('Cadence client initialized for mainnet');
  }

  /**
   * Read profile data for a given address
   */
  public async readProfile(address: string): Promise<ProfileData | null> {
    try {
      const script = `
        import CreatorProfile from 0xCreatorProfile
        
        pub fun main(address: Address): CreatorProfile.Profile? {
          let account = getAccount(address)
          let profileRef = account.getCapability<&CreatorProfile.Profile{CreatorProfile.IProfilePublic}>(
            /public/CreatorProfile
          ).borrow()
          
          return profileRef
        }
      `;

      const result = await fcl.query({
        cadence: script,
        args: (arg: any, t: any) => [arg(address, t.Address)]
      });

      if (result) {
        return {
          veriScore: parseFloat(result.veriScore),
          campaignScores: result.campaignScores || {},
          lastUpdated: parseFloat(result.lastUpdated),
          totalCampaigns: parseInt(result.totalCampaigns) || 0
        };
      }

      return null;
    } catch (error) {
      console.error('Error reading profile:', error);
      return null;
    }
  }

  /**
   * Read campaign data by ID
   */
  public async readCampaign(campaignId: string): Promise<CampaignData | null> {
    try {
      const script = `
        import CampaignEscrow from 0xCampaignEscrow
        
        pub fun main(campaignId: String): CampaignEscrow.Campaign? {
          let account = getAccount(0xCampaignEscrow)
          let escrowRef = account.getCapability<&CampaignEscrow>(/public/CampaignEscrow)
            .borrow()
          
          if escrowRef != nil {
            return escrowRef!.getCampaign(id: campaignId)
          }
          
          return nil
        }
      `;

      const result = await fcl.query({
        cadence: script,
        args: (arg: any, t: any) => [arg(campaignId, t.String)]
      });

      if (result) {
        return {
          id: result.id,
          creator: result.creator,
          brand: result.brand,
          threshold: parseFloat(result.threshold),
          payout: parseFloat(result.payout),
          paidOut: result.paidOut,
          deadline: parseFloat(result.deadline),
          createdAt: parseFloat(result.createdAt),
          scheduledTxId: result.scheduledTxId
        };
      }

      return null;
    } catch (error) {
      console.error('Error reading campaign:', error);
      return null;
    }
  }

  /**
   * Get all campaigns for a specific address
   */
  public async getCampaignsForAddress(address: string): Promise<CampaignData[]> {
    try {
      const script = `
        import CampaignEscrow from 0xCampaignEscrow
        
        pub fun main(address: Address): [CampaignEscrow.Campaign] {
          let account = getAccount(0xCampaignEscrow)
          let escrowRef = account.getCapability<&CampaignEscrow>(/public/CampaignEscrow)
            .borrow()
          
          if escrowRef != nil {
            return escrowRef!.getCampaignsForAddress(address: address)
          }
          
          return []
        }
      `;

      const result = await fcl.query({
        cadence: script,
        args: (arg: any, t: any) => [arg(address, t.Address)]
      });

      return result.map((campaign: any) => ({
        id: campaign.id,
        creator: campaign.creator,
        brand: campaign.brand,
        threshold: parseFloat(campaign.threshold),
        payout: parseFloat(campaign.payout),
        paidOut: campaign.paidOut,
        deadline: parseFloat(campaign.deadline),
        createdAt: parseFloat(campaign.createdAt),
        scheduledTxId: campaign.scheduledTxId
      }));
    } catch (error) {
      console.error('Error reading campaigns for address:', error);
      return [];
    }
  }

  /**
   * Get vault balance
   */
  public async getVaultBalance(): Promise<number> {
    try {
      const script = `
        import CampaignEscrow from 0xCampaignEscrow
        
        pub fun main(): UFix64? {
          let account = getAccount(0xCampaignEscrow)
          let escrowRef = account.getCapability<&CampaignEscrow>(/public/CampaignEscrow)
            .borrow()
          
          if escrowRef != nil {
            return escrowRef!.getVaultBalance()
          }
          
          return nil
        }
      `;

      const result = await fcl.query({
        cadence: script,
        args: []
      });

      return result ? parseFloat(result) : 0;
    } catch (error) {
      console.error('Error reading vault balance:', error);
      return 0;
    }
  }

  /**
   * Check if an address has a profile
   */
  public async hasProfile(address: string): Promise<boolean> {
    try {
      const profile = await this.readProfile(address);
      return profile !== null;
    } catch (error) {
      console.error('Error checking profile existence:', error);
      return false;
    }
  }

  /**
   * Get current block timestamp
   */
  public async getCurrentTimestamp(): Promise<number> {
    try {
      const script = `
        pub fun main(): UFix64 {
          return getCurrentBlock().timestamp
        }
      `;

      const result = await fcl.query({
        cadence: script,
        args: []
      });

      return parseFloat(result);
    } catch (error) {
      console.error('Error getting current timestamp:', error);
      return Date.now() / 1000; // Fallback to current time
    }
  }

  /**
   * Validate address format
   */
  public isValidAddress(address: string): boolean {
    try {
      // Flow addresses are 16 characters (8 bytes) in hex format
      return /^[0-9a-f]{16}$/i.test(address);
    } catch {
      return false;
    }
  }

  /**
   * Format address for display
   */
  public formatAddress(address: string): string {
    if (!this.isValidAddress(address)) {
      return 'Invalid Address';
    }
    
    return `0x${address}`;
  }

  /**
   * Check if client is ready
   */
  public isReady(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const cadenceClient = new CadenceClient();

