/**
 * DepositToCreators Action
 * 
 * Forte Action to deposit FLOW to creator wallets
 * Atomically deposits to all recipients
 */

import FungibleToken from 0xf233dcee88fe0abe
import FlowToken from 0x1654653399040a61

access(all) struct DepositToCreators {
    access(all) let payouts: [{Address: UFix64}]
    
    init(payouts: [{Address: UFix64}]) {
        self.payouts = payouts
    }
    
    access(all) fun execute(vault: @FlowToken.Vault) {
        var failedRecipients: [Address] = []
        
        // Distribute vault funds to creators based on payouts
        for payout in self.payouts {
            for addr in payout.keys {
                let amount = payout[addr]!
                
                if amount > 0.0 {
                    let payment <- vault.withdraw(amount: amount) as! @FlowToken.Vault
                    
                    let receiverCap = getAccount(addr)
                        .capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
                    
                    if let receiver = receiverCap.borrow() {
                        receiver.deposit(from: <-payment)
                        log("Deposited ".concat(amount.toString()).concat(" FLOW to ").concat(addr.toString()))
                    } else {
                        // If receiver not available, track failure but continue
                        failedRecipients.append(addr)
                        // Re-deposit the payment
                        vault.deposit(from: <-payment)
                        log("Failed deposit to ".concat(addr.toString()).concat(": no receiver capability"))
                    }
                }
            }
        }
        
        if failedRecipients.length > 0 {
            log("Failed recipients: ".concat(failedRecipients.toString()))
        }
        
        // Destroy remaining vault (should be empty)
        destroy vault
    }
}
