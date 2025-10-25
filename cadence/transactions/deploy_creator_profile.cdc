import CreatorProfile from 0xe54a946a7830e4ec

transaction(oracleAddress: Address) {
    prepare(signer: AuthAccount) {
        signer.contracts.add(name: "CreatorProfile", code: CreatorProfile.code)
    }
}
