/**
 * Compute Score Module
 * 
 * Handles social media post analysis and V_res score calculation
 * Accepts post URLs and extracts metrics to compute VeriScore
 * This is a simplified mock version for the hackathon demo
 */

import axios from 'axios';

export interface PostMetrics {
  likes: number;
  views: number;
  comments: number;
  shares: number;
  engagement_rate: number;
  reach: number;
  impressions: number;
}

export interface ScoreResult {
  score: number;
  metrics: PostMetrics;
  platform: string;
  post_id: string;
  timestamp: number;
  breakdown: {
    engagement_score: number;
    reach_score: number;
    virality_score: number;
  };
}

export class ScoreComputer {
  private readonly API_KEYS: { [key: string]: string } = {
    // In production, these would be real API keys
    youtube: process.env.YOUTUBE_API_KEY || 'mock_youtube_key',
    twitter: process.env.TWITTER_API_KEY || 'mock_twitter_key',
    instagram: process.env.INSTAGRAM_API_KEY || 'mock_instagram_key',
    tiktok: process.env.TIKTOK_API_KEY || 'mock_tiktok_key'
  };

  /**
   * Parse social media URL and extract platform and post ID
   */
  private parseUrl(url: string): { platform: string; postId: string } | null {
    try {
      const urlObj = new URL(url);
      
      // YouTube
      if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
        let videoId = '';
        if (urlObj.searchParams.has('v')) {
          videoId = urlObj.searchParams.get('v')!;
        } else if (urlObj.pathname.includes('/watch/')) {
          videoId = urlObj.pathname.split('/')[2];
        } else if (urlObj.hostname.includes('youtu.be')) {
          videoId = urlObj.pathname.substring(1);
        }
        return { platform: 'youtube', postId: videoId };
      }
      
      // Twitter/X
      if (urlObj.hostname.includes('twitter.com') || urlObj.hostname.includes('x.com')) {
        const pathParts = urlObj.pathname.split('/');
        if (pathParts.length >= 3 && pathParts[1] === 'status') {
          return { platform: 'twitter', postId: pathParts[2] };
        }
      }
      
      // Instagram
      if (urlObj.hostname.includes('instagram.com')) {
        const pathParts = urlObj.pathname.split('/');
        if (pathParts.length >= 2 && pathParts[1] === 'p') {
          return { platform: 'instagram', postId: pathParts[2] };
        }
      }
      
      // TikTok
      if (urlObj.hostname.includes('tiktok.com')) {
        const pathParts = urlObj.pathname.split('/');
        if (pathParts.length >= 2 && pathParts[1] === '@') {
          const videoId = pathParts[3] || 'unknown';
          return { platform: 'tiktok', postId: videoId };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing URL:', error);
      return null;
    }
  }

  /**
   * Fetch metrics from social media platform (mock implementation)
   */
  private async fetchMetrics(platform: string, postId: string): Promise<PostMetrics | null> {
    try {
      // In a real implementation, this would call actual APIs
      // For the hackathon demo, we'll generate realistic mock data
      
      const baseMetrics = {
        youtube: { baseViews: 10000, baseLikes: 500, baseComments: 50, baseShares: 100 },
        twitter: { baseViews: 5000, baseLikes: 200, baseComments: 30, baseShares: 50 },
        instagram: { baseViews: 8000, baseLikes: 800, baseComments: 40, baseShares: 60 },
        tiktok: { baseViews: 15000, baseLikes: 1200, baseComments: 80, baseShares: 200 }
      };

      const base = baseMetrics[platform as keyof typeof baseMetrics] || baseMetrics.youtube;
      
      // Generate realistic metrics with some randomness
      const views = Math.floor(base.baseViews * (0.5 + Math.random()));
      const likes = Math.floor(base.baseLikes * (0.3 + Math.random()));
      const comments = Math.floor(base.baseComments * (0.2 + Math.random()));
      const shares = Math.floor(base.baseShares * (0.3 + Math.random()));
      
      const engagement_rate = ((likes + comments + shares) / views) * 100;
      const reach = Math.floor(views * (0.7 + Math.random() * 0.3));
      const impressions = Math.floor(views * (1.2 + Math.random() * 0.5));

      return {
        likes,
        views,
        comments,
        shares,
        engagement_rate,
        reach,
        impressions
      };
    } catch (error) {
      console.error(`Error fetching metrics for ${platform}:`, error);
      return null;
    }
  }

  /**
   * Calculate V_res score based on metrics
   * This is a simplified version of the actual VeriScore algorithm
   */
  private calculateVeriScore(metrics: PostMetrics, platform: string): ScoreResult {
    // Platform-specific multipliers
    const platformMultipliers = {
      youtube: 1.0,
      twitter: 1.2,
      instagram: 1.1,
      tiktok: 1.3
    };

    const multiplier = platformMultipliers[platform as keyof typeof platformMultipliers] || 1.0;

    // Engagement score (0-40 points)
    const engagement_score = Math.min(40, metrics.engagement_rate * 2 * multiplier);

    // Reach score (0-35 points)
    const reach_score = Math.min(35, Math.log10(metrics.views + 1) * 5 * multiplier);

    // Virality score (0-25 points)
    const virality_score = Math.min(25, Math.log10(metrics.shares + 1) * 8 * multiplier);

    const total_score = engagement_score + reach_score + virality_score;

    return {
      score: Math.min(100, total_score), // Cap at 100
      metrics,
      platform,
      post_id: '', // Will be set by caller
      timestamp: Date.now(),
      breakdown: {
        engagement_score,
        reach_score,
        virality_score
      }
    };
  }

  /**
   * Main function to analyze a post and return VeriScore
   */
  public async analyzePost(postUrl: string): Promise<ScoreResult | null> {
    try {
      console.log(`Analyzing post: ${postUrl}`);

      // Parse URL to extract platform and post ID
      const parsed = this.parseUrl(postUrl);
      if (!parsed) {
        throw new Error('Invalid social media URL format');
      }

      const { platform, postId } = parsed;

      // Fetch metrics from the platform
      const metrics = await this.fetchMetrics(platform, postId);
      if (!metrics) {
        throw new Error(`Failed to fetch metrics for ${platform} post`);
      }

      // Calculate VeriScore
      const result = this.calculateVeriScore(metrics, platform);
      result.post_id = postId;

      console.log(`Analysis complete. Score: ${result.score.toFixed(2)}`);
      console.log(`Breakdown:`, result.breakdown);

      return result;
    } catch (error) {
      console.error('Error analyzing post:', error);
      return null;
    }
  }

  /**
   * Batch analyze multiple posts
   */
  public async analyzePosts(postUrls: string[]): Promise<ScoreResult[]> {
    const results: ScoreResult[] = [];
    
    for (const url of postUrls) {
      const result = await this.analyzePost(url);
      if (result) {
        results.push(result);
      }
    }
    
    return results;
  }
}

// Export singleton instance
export const scoreComputer = new ScoreComputer();

