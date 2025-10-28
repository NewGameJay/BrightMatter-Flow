/**
 * Splits Service
 * 
 * Calculates creator payout percentages based on resonance scores
 */

export interface CreatorRow {
  creatorAddr: string;
  resonanceScore: number;
}

export interface CreatorSplit {
  addr: string;
  percent: number;
}

export interface CreatorSplitWithAmount extends CreatorSplit {
  amountFlow: string;
  creatorAddr: string; // Add this field
}

/**
 * Calculate payout splits based on resonance scores
 */
export function splitByResonance(rows: CreatorRow[]): CreatorSplit[] {
  const totals = new Map<string, number>();
  
  // Sum scores by creator
  for (const row of rows) {
    const current = totals.get(row.creatorAddr) || 0;
    totals.set(row.creatorAddr, current + row.resonanceScore);
  }
  
  const grandTotal = Array.from(totals.values()).reduce((a, b) => a + b, 0);
  
  if (grandTotal <= 0) {
    return [];
  }
  
  return Array.from(totals.entries()).map(([addr, score]) => ({
    addr,
    percent: score / grandTotal
  }));
}

/**
 * Normalize percentages for UFix64 (8 decimal places)
 * Ensures sum equals exactly 1.00000000
 */
export function normalizePercentsForUFix64(splits: CreatorSplit[]): CreatorSplit[] {
  if (splits.length === 0) return [];
  
  // Round to 8 decimal places
  const rounded = splits.map(split => ({
    ...split,
    percent: Math.round(split.percent * 100000000) / 100000000
  }));
  
  // Calculate current sum
  const currentSum = rounded.reduce((sum, split) => sum + split.percent, 0);
  const targetSum = 1.00000000;
  const difference = targetSum - currentSum;
  
  // Adjust the largest share to reach exact sum
  if (Math.abs(difference) > 0.00000001) {
    const largestIndex = rounded.reduce((maxIdx, split, idx) => 
      split.percent > rounded[maxIdx].percent ? idx : maxIdx, 0
    );
    
    rounded[largestIndex].percent += difference;
    rounded[largestIndex].percent = Math.round(rounded[largestIndex].percent * 100000000) / 100000000;
  }
  
  return rounded;
}

/**
 * Calculate actual FLOW amounts from percentages and budget
 */
export function calculateAmounts(splits: CreatorSplit[], budgetFlow: string): CreatorSplitWithAmount[] {
  const budget = parseFloat(budgetFlow);
  
  return splits.map(split => ({
    ...split,
    creatorAddr: split.addr, // Map addr to creatorAddr
    amountFlow: (budget * split.percent).toFixed(8)
  }));
}

/**
 * Validate that splits sum to 1.0 within tolerance
 */
export function validateSplits(splits: CreatorSplit[], tolerance: number = 0.00000001): boolean {
  const sum = splits.reduce((total, split) => total + split.percent, 0);
  return Math.abs(sum - 1.0) <= tolerance;
}