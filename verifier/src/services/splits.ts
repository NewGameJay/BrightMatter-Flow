/**
 * Splits Service
 * 
 * Handles resonance-based payout calculations for open campaigns
 */

export type SplitRow = { creatorAddr: string; resonanceScore: number };

export interface CreatorSplit {
  addr: string;
  percent: number;
}

export interface PayoutSplit extends CreatorSplit {
  amountFlow: string;
}

export function splitByResonance(rows: SplitRow[]): CreatorSplit[] {
  // Group by creator and sum resonance scores
  const totals = new Map<string, number>();
  for (const row of rows) {
    const current = totals.get(row.creatorAddr) || 0;
    totals.set(row.creatorAddr, current + row.resonanceScore);
  }
  
  // Calculate grand total
  const grandTotal = Array.from(totals.values()).reduce((a, b) => a + b, 0);
  
  if (grandTotal <= 0) {
    return [];
  }
  
  // Calculate percentages
  const splits: CreatorSplit[] = [];
  for (const [addr, score] of totals.entries()) {
    splits.push({
      addr,
      percent: score / grandTotal
    });
  }
  
  return splits;
}

/**
 * Normalize percentages to ensure they sum to exactly 1.0 for UFix64 safety
 * Uses 8 decimal places and adjusts remainder to largest share
 */
export function normalizePercentsForUFix64(splits: CreatorSplit[]): CreatorSplit[] {
  if (splits.length === 0) return [];
  
  const PRECISION = 8;
  const factor = Math.pow(10, PRECISION);
  
  // Calculate raw percentages and round
  const rounded = splits.map(s => ({
    ...s,
    rawPercent: Math.round(s.percent * factor) / factor
  }));
  
  // Calculate sum of rounded values
  const sum = rounded.reduce((acc, s) => acc + s.rawPercent, 0);
  
  // Find the difference from 1.0
  const diff = 1.0 - sum;
  
  if (Math.abs(diff) < 0.00000001) {
    // Already normalized, return rounded
    return rounded.map(s => ({ addr: s.addr, percent: s.rawPercent }));
  }
  
  // Adjust the largest share to make sum exactly 1.0
  const sorted = [...rounded].sort((a, b) => b.rawPercent - a.rawPercent);
  sorted[0].rawPercent += diff;
  
  // Rebuild in original order
  const result: CreatorSplit[] = [];
  for (const original of rounded) {
    const adjusted = sorted.find(s => s.addr === original.addr);
    result.push({
      addr: original.addr,
      percent: adjusted?.rawPercent || original.rawPercent
    });
  }
  
  return result;
}

/**
 * Calculate payout amounts from percentages and budget
 */
export function calculatePayoutAmounts(splits: CreatorSplit[], budgetFlow: string): PayoutSplit[] {
  const budget = parseFloat(budgetFlow);
  
  return splits.map(split => ({
    addr: split.addr,
    percent: split.percent,
    amountFlow: (budget * split.percent).toFixed(8)
  }));
}
