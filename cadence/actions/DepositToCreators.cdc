/**
 * DepositToCreators Action
 * 
 * Forte Action to atomically deposit FLOW to creator wallets
 * Uses Payout struct array for type safety
 */

import FungibleToken from 0xf233dcee88fe0abe
import FlowToken from 0x1654653399040a61

access(all) struct Payout {
    access(all) let address: Address
    access(all) let amount: UFix64
    
    init(address: Address, amount: UFix64) {
        self.address = address
        self.amount = amount
    }
}

access(all) struct DepositToCreators {
    access(all) let payouts: [Payout]
    
    init(payouts: [Payout]) {
        self.payouts = payouts
    }
    
    access(all) fun execute(vault: @FlowToken.Vault) {
        // Pre-validate all receivers exist and calculate total
        var totalRequested: UFix64 = 0.0
        
        for payout in self.payouts {
            // Validate receiver capability exists
            let receiverCap = getAccount(payout.address)
                .capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            
            if receiverCap == nil {
                destroy vault
                panic("Missing receiver capability for address ".concat(payout.address.toString()))
            }
            
            // Validate receiver is valid
            if !receiverCap!.check() {
                destroy vault
                panic("Invalid receiver capability for address ".concat(payout.address.toString()))
            }
            
            totalRequested = totalRequested + payout.amount
        }
        
        // Validate vault has sufficient balance (with epsilon)
        let epsilon: UFix64 = 0.00000001
        if totalRequested > vault.balance + epsilon {
            destroy vault
            panic("Insufficient vault balance: requested ".concat(totalRequested.toString()).concat(" but have ").concat(vault.balance.toString()))
        }
        
        // Execute all payouts
        for payout in self.payouts {
            if payout.amount > 0.0 {
                let payment <- vault.withdraw(amount: payout.amount) as! @FlowToken.Vault
                
                let receiverCap = getAccount(payout.address)
                    .capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)!
                
                let receiver = receiverCap.borrow()!
                receiver.deposit(from: <-payment)
            }
        }
        
        // Ensure vault is empty (within epsilon)
        if vault.balance > epsilon {
            destroy vault
            panic("Vault not empty after payout: remainder ".concat(vault.balance.toString()))
        }
        
        // Destroy empty vault
        destroy vault
    }
}
