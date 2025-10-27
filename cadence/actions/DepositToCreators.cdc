/**
 * DepositToCreators Action
 *
 * Forte Action to deposit FLOW to multiple creator wallets.
 * This action expects a vault containing the campaign's escrowed FLOW
 * and an explicit list of payouts with concrete amounts.
 *
 * Safety:
 * - Pre-validates all recipient receiver capabilities exist.
 * - Asserts the sum of amounts does not exceed the vault balance (with tiny epsilon).
 * - Reverts on any capability or deposit error to maintain atomicity.
 * - Asserts no remainder is left undistributed.
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
        // Tiny epsilon for UFix64 rounding tolerance
        let epsilon: UFix64 = 0.00000001

        // 1) Pre-validate all recipients expose a Receiver capability
        for payout in self.payouts {
            let cap = getAccount(payout.address)
                .capabilities
                .get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)

            // Use a borrow attempt to validate the capability exists
            if cap.borrow() == nil {
                panic("Missing FungibleToken.Receiver capability for recipient ".concat(payout.address.toString()))
            }
        }

        // 2) Check totals vs vault balance
        var totalRequested: UFix64 = 0.0
        for payout in self.payouts {
            if payout.amount < 0.0 {
                panic("Negative payout requested for ".concat(payout.address.toString()))
            }
            totalRequested = totalRequested + payout.amount
        }

        if totalRequested > vault.balance + epsilon {
            panic(
                "Requested payouts exceed available vault balance. Requested: "
                .concat(totalRequested.toString())
                .concat(", Available: ")
                .concat(vault.balance.toString())
            )
        }

        // 3) Execute deposits atomically
        for payout in self.payouts {
            if payout.amount > 0.0 {
                let payment <- vault.withdraw(amount: payout.amount) as! @FlowToken.Vault

                let receiver = getAccount(payout.address)
                    .capabilities
                    .get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
                    .borrow()!
                receiver.deposit(from: <-payment)

                log("Deposited ".concat(payout.amount.toString()).concat(" FLOW to ").concat(payout.address.toString()))
            }
        }

        // 4) Ensure no undistributed remainder
        if vault.balance > epsilon {
            panic("Undistributed remainder detected: ".concat(vault.balance.toString()))
        }

        destroy vault
    }
}
