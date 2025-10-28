/**
 * DepositToCreators Action
 * 
 * Forte Action to deposit FLOW to creator wallets
 */

import FungibleToken from 0xf233dcee88fe0abe
import FlowToken from 0x1654653399040a61

access(all) struct DepositToCreators {
    access(all) let shares: {Address: UFix64}
    
    init(shares: {Address: UFix64}) {
        self.shares = shares
    }
    
    access(all) fun execute(vault: @FlowToken.Vault) {
        // Distribute vault funds to creators based on shares
        for creator in self.shares.keys {
            let amount = self.shares[creator]!
            
            if amount > 0.0 {
                let payment <- vault.withdraw(amount: amount) as! @FlowToken.Vault
                
                let receiverCap = getAccount(creator)
                    .capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
                
                if let receiver = receiverCap.borrow() {
                    receiver.deposit(from: <-payment)
                } else {
                    // If receiver not available, destroy payment (should not happen in production)
                    destroy payment
                }
            }
        }
        
        // Destroy remaining vault (should be empty)
        destroy vault
    }
}
