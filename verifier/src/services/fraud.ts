/**
 * Fraud Detection Service
 * 
 * Validates creator proofs for suspicious patterns
 */

interface ProofMetrics {
  postId: string;
  likes: number;
  comments: number;
  shares: number;
  timestamp: number;
}

export async function runFraudChecks(campaignId: string, proofs: ProofMetrics[]): Promise<boolean> {
  console.log(`[Fraud] Checking ${proofs.length} proofs for campaign ${campaignId}`);
  
  // Check 1: No duplicate post IDs
  const postIds = proofs.map(p => p.postId);
  const uniqueIds = new Set(postIds);
  if (postIds.length !== uniqueIds.size) {
    console.warn(`[Fraud] Duplicate post IDs detected in campaign ${campaignId}`);
    return false;
  }
  
  // Check 2: Engagement ratios (likes should not be > 10x comments)
  for (const proof of proofs) {
    if (proof.comments > 0) {
      const ratio = proof.likes / proof.comments;
      if (ratio > 10) {
        console.warn(`[Fraud] Suspicious likes/comments ratio (${ratio.toFixed(1)}) for post ${proof.postId}`);
        return false;
      }
    }
  }
  
  // Check 3: All timestamps present
  for (const proof of proofs) {
    if (!proof.timestamp || proof.timestamp <= 0) {
      console.warn(`[Fraud] Missing timestamp for post ${proof.postId}`);
      return false;
    }
  }
  
  // Check 4: Reasonable engagement numbers
  for (const proof of proofs) {
    if (proof.likes < 0 || proof.comments < 0 || proof.shares < 0) {
      console.warn(`[Fraud] Negative engagement metrics for post ${proof.postId}`);
      return false;
    }
  }
  
  console.log(`[Fraud] All checks passed for campaign ${campaignId}`);
  return true;
}

export function mockMetrics(url: string) {
  // Generate mock metrics for testing
  const postId = url.split("/").pop() || `post-${Date.now()}`;
  return {
    postId,
    likes: Math.floor(Math.random() * 1000) + 100,
    comments: Math.floor(Math.random() * 100) + 10,
    shares: Math.floor(Math.random() * 50) + 5,
    views: Math.floor(Math.random() * 10000) + 1000,
    timestamp: Date.now(),
  };
}

export function computeResonance(metrics: any): number {
  // Simple resonance score calculation
  // Handle metrics with or without views
  const views = metrics.views || metrics.views || 1000; // Default to 1000 if not provided
  
  // Calculate engagement
  const likes = metrics.likes || 0;
  const comments = metrics.comments || 0;
  const shares = metrics.shares || 0;
  
  const engagementRate = views > 0 ? (likes + comments * 2 + shares * 3) / views : 0;
  const baseScore = Math.min(engagementRate * 1000, 100);
  
  // Ensure score is between 1 and 100
  return Math.max(1, Math.min(100, baseScore || 10));
}

