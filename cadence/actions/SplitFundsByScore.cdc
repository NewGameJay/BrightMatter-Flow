/**
 * SplitFundsByScore Action
 * 
 * Forte Action to calculate creator payout amounts from percentages
 * Accepts dynamic splits from backend
 */

access(all) struct SplitFundsByScore {
    access(all) let budget: UFix64
    access(all) let splits: [{Address: UFix64}]
    
    init(budget: UFix64, splits: [{Address: UFix64}]) {
        self.budget = budget
        self.splits = splits
    }
    
    access(all) fun execute(): [{Address: UFix64}] {
        // Validate: sum of percents must be ≈ 1.0
        var totalPercent: UFix64 = 0.0
        for split in self.splits {
            for amount in split.values {
                totalPercent = totalPercent + amount
            }
        }
        
        let epsilon: UFix64 = 0.00000001
        assert(totalPercent > (1.0 - epsilon) && totalPercent < (1.0 + epsilon), 
               message: "Percents must sum to 1.0")
        
        // Calculate actual amounts
        var payouts: [{Address: UFix64}] = []
        
        for split in self.splits {
            for addr in split.keys {
                let percent = split[addr]!
                let amount = self.budget * percent
                payouts.append({addr: amount})
            }
        }
        
        return payouts
    }
}
