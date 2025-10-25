Flow Forte Hackathon: Key Insights and Best
Practices
Flow and the Forte Upgrade (Actions & Agents)
Flow is a consumer-focused Layer-1 blockchain known for its unique Cadence smart contract language and
resource-oriented model (great for NFTs and non-transferable tokens). The Forte upgrade (live on testnet
as of Sept 2025, mainnet launch on Oct 22, 2025) supercharges Flow with composability and automation
features 1 2 3
. Forte introduces two new on-chain primitives: Flow Actions and Flow Agents.
•
Flow Actions: Standardized, protocol-native building blocks for DeFi (e.g. swap, source, sink, flash-
loan, price oracle). Actions can be chained like LEGO pieces to compose multi-step workflows within
a single atomic transaction, without needing custom “glue” code 3
. This greatly simplifies
complex on-chain operations – for example, sourcing liquidity, swapping tokens, and depositing into
a yield sink in one go. New protocols can integrate by providing connectors to these actions, making
the ecosystem highly composable 4 5
. (In Forte’s words, “ERC-20 and ERC-721 unlocked nouns.
6
Actions and Agents unlock verbs.” )
•
Flow Agents: On-chain autonomous actors that live as resources inside user accounts. An Agent
holds a pre-authorized transaction sequence and can be triggered by events or scheduled
transactions (think of it like an on-chain cron job) 7
. When triggered (e.g. by a timer or an external
signed tx), the Agent executes its stored transaction trustlessly on-chain 8 9
. This enables fully
automated workflows without off-chain bots or servers – for instance, an Agent could automatically
rebalance a portfolio every Friday or release escrowed funds when a condition is met, all natively on
Flow 10 11
. These features remove reliance on off-chain automation (avoiding issues of MEV,
11 12
custody or missed triggers) and make on-chain apps far more powerful and user-friendly .
Why Forte Matters: It extends Flow beyond collectibles into advanced DeFi and “smart” dApps. Automated,
composable actions at the protocol level mean developers can build complex logic with less code and risk
12
. In short, Forte aims to make Flow “the platform for onchain AI automation”, with native Agents
executing trustless workflows on-chain 13
. For your project (BrightMatter/Veri), this is promising: you
can orchestrate campaign escrow and payouts via on-chain automation rather than manual intervention
14 15
. (E.g. using a scheduled Agent to trigger payout when KPI metrics are written on-chain.) Forte’s
time-based execution can turn your performance marketing logic into self-governing code, a perfect
showcase of “on-chain automation” for the judges.
1
Forte Hacks Hackathon: Tracks and What Judges Want
The Forte Hacks 2025 hackathon (Oct 1–31, 2025) is Flow’s flagship global event, with $250,000+ in prizes
and big partners (Disney, Dune, Dapper Labs, etc.) 16 17
. It’s all about pushing the boundaries of on-chain
18
innovation using Flow’s new Forte capabilities. There are four main prize tracks :
1.
Best “Killer App” on Flow (Consumer dApp): The top prize for the most promising consumer-facing
application on Flow. This can be anything – DeFi, Gaming, SocialFi, AI – but it should showcase
mainstream appeal and high impact on Flow’s ecosystem 19
. Judges will look for a polished, high-
potential product that leverages Flow’s strengths (cheap, user-friendly transactions, NFT culture, etc.)
to attract users. Your BrightMatter/Veri platform – connecting brands and creators with on-chain
verifiable analytics – certainly fits as a social/marketing dApp. Emphasize how it drives real user
engagement on Flow (e.g. creators earning rewards on Flow, brands getting on-chain proof of
reach). This consumer-growth angle aligns with Flow’s mission and will score well under “killer app”
criteria.
2.
Best Use of Forte Features: This prize rewards projects that leverage Forte’s new primitives
(Actions & Agents) in a novel way 20
. To impress here, plan to incorporate Flow Actions or Agents
into your solution’s core. For example, you might use a Flow Agent to automate campaign escrow
payouts based on on-chain triggers (removing the need for an off-chain scheduler) 14
. Or use a
sequence of Flow Actions to move funds through DeFi steps (perhaps converting a brand’s
deposited token into the proper reward stablecoin, then into a creator’s wallet atomically).
Demonstrating that you embraced Forte’s capabilities (even if just in a prototype form) shows you
are on the cutting edge. Judges in this track will evaluate how effectively you used Actions/Agents
API (FLIP-338 and related standards 21
) and whether it solves a real problem more elegantly than
22 23
before. Even a simple automated workflow can stand out, since Forte is brand-new on Flow .
3.
Best “Vibe Coded” Project (AI-assisted Development): This creative track is about leveraging AI in
the development process or product. “Vibe coding” refers to using AI tools (like GPT-4, etc.) to
generate code or even to be part of the app experience 24
. If you used AI to speed up building your
app (e.g. using code generation or having an AI component in your app), make note of it. Perhaps
your BrightMatter intelligence layer itself is AI-driven – you could highlight how it analyzes creator
content using AI and then ties that to on-chain verification. Or if you built parts of your Cadence
contracts or React app with the help of AI pair-programming, that’s worth mentioning. This track’s
prize is smaller, but it adds a nice flair if you can say “built with AI assistance” or demonstrate an AI
feature (like an AI content recommendation for creators in your UI). Judges will “feel the vibe” of a
futuristic AI+blockchain integration.
4.
Best Integration of Existing Code / Project: Uniquely, Flow’s hackathon allows submissions that
build on pre-existing projects 25
. If Veri (or parts of it) existed off-chain or on another chain, you can
position this as bringing an existing product to Flow – qualifying for this track. To compete here,
be transparent about what was pre-built and what’s newly built for Flow. Show how you integrated or
ported your prior work into the Flow ecosystem (e.g. “We transformed our existing creator analytics
platform by deploying a Flow Cadence smart contract for on-chain profiles, integrating Flow’s USDF
payments, etc.”). Judges will appreciate real-world progress (your slides mention you have users and
revenue already 26
). Demonstrating that Veri is now live on Flow and improved by Flow’s features
2
(like faster finality, resource ownership, etc.) can be compelling 27
celebrating projects that grow the Flow ecosystem by migrating or integrating with it.
. Essentially, this track is about
In general, judges are looking for: innovation, execution, impact, and use of Flow. A strong entry will
clearly communicate: What problem you solve, why Flow (and Forte) is the perfect solution, and a
demo that proves it works. Given Flow’s consumer-app DNA, a clean UX (web or mobile) and a compelling
use-case (e.g. helping creators monetize transparently on-chain) will make your project stand out. Also
leverage the sponsor bounties if possible – for instance, Dune might have a bounty for best use of their
analytics with Flow data, or QuickNode for using their API, etc. 17
. If it’s easy, you could e.g. pipe your on-
chain campaign data to Dune dashboards (to show analytics for brands) or use Thirdweb/QuickNode
tooling for part of your stack. These can earn bonus prizes. However, don’t force it – focus on the core
application first (the tracks above carry the big prizes).
Building with Cadence: Smart Contracts and On-Chain Profiles
Cadence is Flow’s smart contract language, which is quite different from Solidity but very developer-friendly
and safe. It uses a strong static type system and the concept of resources – assets that cannot be
accidentally duplicated or lost (they must be stored, moved, or destroyed explicitly). This makes it ideal for
NFTs and soulbound tokens (SBTs) that represent unique user profiles, as in your use-case. In Cadence,
you can define a Resource that holds a creator’s profile data and then store an instance of that resource
in the user’s account storage (under a path like /storage/CreatorProfile ) 28
. Because resources in
Flow act much like digital objects bound to their owner, a Profile resource can be non-fungible and non-
transferable by design (simply omit any transfer function). This effectively becomes a soulbound profile
token living in the user’s wallet/account – just as you described (“stored directly in their Flow account”)
29
28
.
Key considerations for implementing Creator Profiles as Flow resources:
•
Define the Resource Struct: Your Cadence contract should define a resource type (e.g. Profile )
with fields for VeriScore, reputation metrics, campaign checkpoints, etc. These can be simple types
(Int, String) or even other resource/nft references if needed. For example: struct ProfileData
{ score: UInt32, youtubeSubs: UInt64, lastCampaignId: UInt64, ... } or similar.
You might store a struct inside the resource or just individual fields. Use Cadence’s strong typing to
your advantage (e.g. define an enum for Profile Level or a dictionary of KPI stats).
•
Resource Ownership: When a creator onboards, you’ll create a new Profile resource and save it
in their account (via a transaction they sign, since only the account owner can modify their storage
by default). Typically, you’d have something like account.save(<-new Profile(...), to: /
storage/CreatorProfile) inside a transaction. You can also publish a capability to it (e.g. link it
to /public/CreatorProfile 28
with a restricted type) so that others can read the profile data .
This is important: by providing a public Capability (reference) with an interface that exposes, say,
getVeriScore() or other read methods, any Flow app (including judges testing your app) can
verify on-chain the performance metrics. This showcases composability: other dApps or explorers
28
could read these profiles as a native primitive, which is exactly one of your goals .
3
•
Updatability and Security: Since the profile is an SBT, who can update the data? Likely, you want
only your BrightMatter off-chain engine (or some authorized account) to write new metrics. There
are a couple ways to achieve this on Flow:
•
•
Admin-Only Functions: Have your contract include functions (transactions) like
updateProfile(address: ProfileOwner, newScore: UInt32, newMetrics: {String:
Int}) that update the resource data. In those functions, require that signer (the tx authorizer) is
a specific account (e.g. your service account or a designated oracle account) or holds a certain admin
resource. Cadence lets you use require(signer.address == 0xYourAdmin) or more flexibly,
manage an admin resource that only your backend owns. This way, even though the resource lives in
user accounts, only your trusted process can modify its fields (the user themselves might not need
to or want to update their VeriScore manually). This design effectively makes BrightMatter’s AI the
30 28
oracle that writes to the profile on-chain .
Capability-based Update: Alternatively, when the profile is created you could give your backend a
capability to the resource with write access. For instance, link a private capability from the user’s
storage that the BrightMatter service account can use to borrow a reference and update the
resource. This is a bit advanced, but it leverages Cadence’s capability security model – the user
consents once (by linking the capability in the setup transaction), and then your off-chain service can
call a script to borrow that ref and perform updates on the resource as needed. Either approach
works; just ensure only authorized updates occur, since these profiles are meant to be verifiable
and trustworthy. (If tampering is a concern, you might even log an event or keep a checksum of off-
chain data to validate authenticity of updates.)
•
Interoperability: Flow’s resource paradigm means these profile objects can interact with other
contracts. For example, you might have the profile resource conform to some standard interface if
one exists (none specific for “profile” yet on Flow, but you could define an interface for, say,
VeriProfile with read methods). This allows other contracts to read a profile if given a reference.
In absence of a standard, simply documenting the fields and making them readable is enough – e.g.
judges could run a script to fetch a creator’s VeriScore on-chain to see that your pipeline writes
data correctly. This on-chain verification of off-chain analytics is a core value proposition of your
project 31 32
, so design the contract to make reading as straightforward as possible (public getters
or events on updates).
Finally, remember to emit events for key actions (profile created, profile updated, campaign payout
executed, etc.). Hackathon judges might not dive into code too deeply, but good Cadence practice (and
points in code review) includes using events for transparency. For instance, an
ProfileUpdated(address, newScore, timestamp) event whenever BrightMatter writes new metrics
helps with debugging and demonstrates auditability.
Campaign Escrow and USDF Payouts on Flow
Another major component is your campaign escrow system, where brands put funds in escrow and
creators get paid once performance KPIs are met 14 15
. On Flow, fungible tokens (like stablecoins)
operate via the FungibleToken standard interface. Flow’s core contracts include FungibleToken (the
base interface) and specific token contracts like Flow Token ( FlowToken ) and stablecoins. For example,
USDF (USD Flow) is a Flow-native stablecoin backed 1:1 by PayPal USD (PYUSD) and enabled via LayerZero
4
bridge 33 34
. On mainnet, USDF exists as a real stablecoin; on testnet, a USDF mock contract is deployed
35
at address 0xb7ace0a920d2c37d (with a bridged token name) for development purposes . This
means you can simulate USD payments on testnet easily. There’s also a older Flow FUSD and bridged USDC,
but USDF is a good choice since it’s featured in Forte docs and Flow’s own hackathon examples (e.g. an
36 37
internal team built “SplitFi” for bill-splitting with USDF) .
How to implement escrow: You’ll likely create a Cadence resource or contract vault to hold the funds
during the campaign. A simple pattern is: - The brand (advertiser) calls a transaction to initiate a campaign,
specifying terms (target views, timeframe, payout amount, etc.). In this transaction, they will deposit the
reward funds into the escrow. Technically, the brand would have a Vault for USDF (by integrating the USDF
contract, which implements FungibleToken ). They would call something like
USDFVault.withdraw(amount) to get a token @FungibleToken.Vault object (resources that
represent tokens) and then send that into your escrow contract’s function, which saves it. In Cadence, you
might store it in a resource CampaignEscrow that holds a Vault of USDF inside it. - The
CampaignEscrow resource can be stored either in the contract (e.g. a dictionary mapping campaign IDs
to Escrow resources) or in the brand’s account. Storing in the contract under your control might be simpler
for logic – you can have the contract own all active escrows. Cadence allows a resource to be stored in
contract storage (inside a public or private variable) for the contract’s own management. - When conditions
are met (e.g. off-chain analysis determines the creator hit the KPI), your backend or an Agent triggers the
payout. This could be done by a transaction like completeCampaign(campaignId, toCreatorAddr)
which then moves the USDF vault from escrow to the creator’s account. Flow’s fungible token standard
makes this easy: the creator’s account just needs a USDF Receiver capability. Most likely, the creator would
have set up a USDF Vault (similar to how one sets up a FlowToken Vault) to receive funds. Then your
contract’s payout function would do something like let vault <- escrowVault.withdraw(amount);
receiverCap.borrow()!.deposit(from: <-vault) . This transfers the tokens out of escrow to the
creator. Emit an event for payout success.
•
Automation via Forte: You can make the above payout happen automatically by scheduling it or by
using an Agent. For instance, when a campaign is created, you might schedule a deferred
transaction for the campaign end date that will auto-execute and check if KPIs are met (you’d
include logic or data in the transaction). However, fully on-chain evaluation of “KPI met” is tricky
because the data (views, likes) comes from Web2 platforms. Instead, a common approach is: off-
chain service monitors the data and when ready, it submits an on-chain transaction to finalize the
escrow. This is still “automation” but partly off-chain orchestrated. With Flow Agents, you could
improve this: the brand could create an Agent that awaits a trigger from your off-chain oracle. For
example, the oracle could send a minimal signal tx (like calling a function agent.trigger()
signed by your oracle key) which causes the Agent to run the pre-signed payout logic. The Agent’s
stored transaction could even verify a proof (if you have an on-chain proof of KPI) then release funds.
In summary, whether you fully automate it or not, highlight that payouts are handled trustlessly
on-chain – either instantly by BrightMatter’s trigger or via a scheduled flow. This fulfills the promise
of “automated, KPI-based payouts once performance thresholds are met” 14
. It shows that Flow+Forte
allows performance marketing campaigns with on-chain settlement, which is novel.
•
Reversals or Refunds: What if KPIs are not met by campaign end? You might design escrow to
refund the brand. This could be implemented as a second branch in your payout logic. Perhaps
when the campaign period expires, if no trigger of success came, an admin can reclaim the USDF to
the brand. Flow Forte’s Scheduled Transactions feature could help here – you can schedule a
5
“campaign expiry” transaction at creation time (for, say, X days later). If by that time no payout
happened, that scheduled tx could automatically return the funds to the brand’s Vault. (Note: As of
now, scheduled transactions are in development and worked on testnet/emulator only 38
. By
mainnet launch they may be live, but be cautious and have a manual fallback.) Even without full
automation, demonstrating that you considered the escrow lifecycle (initiation, successful payout, or
refund) will make your project robust and impress judges with completeness.
•
USDF Integration: Using USDF on Flow is straightforward. Import the USDF contract in Cadence (for
testnet, the “EVMVMBridgedToken_…2aabea…” at the testnet address; for mainnet, the mainnet
address and contract name as per Flow docs 39 40
). Then you can treat it like any
FungibleToken token. You might need to guide users to create a USDF Vault (this is usually done
by a script/tx provided by the token contract or just calling account.save(<-
USDF.createEmptyVault(), to: /storage/USDFVault) and linking a receiver). Since this is a
hackathon, you can simplify by pre-registering vaults for your demo accounts or providing a one-
click setup. The Flow Developer Portal and stablecoin guide show how to set up vaults and even
how to get testnet tokens (Flow testnet faucet provides only FLOW tokens, not USDF; but you can
mint yourself some USDF on testnet if the contract allows or use a faucet if available) 41 42
. In any
case, make sure in your README to state how to test the payment flow – e.g. “This project uses USDF
(Flow stablecoin) for rewards; our demo script will fund your testnet account with mock USDF for
convenience.”
By implementing the escrow via Cadence resources and token vaults, you’re showing how Flow enables
transparent, auditable fund flows. Every deposit and payout is an on-chain transaction, so a brand could
verify that “X USDF was escrowed and later paid out to creator Y”. This trustless settlement is a strong point to
emphasize (especially to partners like perhaps Dapper or QuickNode who like seeing on-chain volume and
usage of Flow tokens).
Developer Tools and SDKs for Flow (Cadence, React, APIs)
To build effectively on Flow, you should leverage the rich developer tools available:
•
Flow CLI and Emulator: Start your development using the Flow CLI, which lets you deploy contracts
and run transactions/scripts locally or on testnet. The CLI has a built-in emulator (a local Flow
blockchain) that is great for rapid testing of your Cadence code. You can write unit tests or just
interact via CLI commands. The CLI also manages your key pairs and can deploy to testnet by
configuring your account keys. (Flow’s docs have a “Getting Started with Cadence” and even a full
“Hello World dApp” tutorial with React 43
that might be worth skimming to ensure you’re following
best practices.)
•
Cadence VS Code Extension: Highly recommended for writing Cadence. It provides syntax
highlighting, linting, and even some auto-complete. Given Cadence’s strict type system, having this
feedback while coding is a time-saver. It will catch mistakes before you deploy.
•
Flow Playground: For quick prototyping, the online Flow Playground (play.onflow.org) can be used
to write and test contracts in the browser. However, since your project is more complex (multiple
contracts or integrations), you’ll likely use your own repo with the CLI. Still, Playground can be handy
6
•
•
•
•
•
•
•
to illustrate concepts to the team or even in your presentation (some people show Playground
snippets to demonstrate contract logic).
Front-end SDK (FCL and React): Flow provides the Flow Client Library (FCL) for JavaScript/
TypeScript, and a newer Flow React SDK to simplify React integration. The React SDK is a lightweight
TS library that wraps FCL to make it feel more natural in React apps 44
. With FCL/React SDK, you can
easily configure connection to Flow testnet or mainnet, and handle user wallet interactions. For
instance:
User Authentication: Use FCL’s logIn / authenticate functions to connect a Flow Wallet (such
as Blocto, Dapper Wallet, or Lilico) in your React app. This pops up the wallet for the user to approve
connection. Once connected, you get the user’s Flow address that you can use for transactions.
Signing Transactions & Scripts: With FCL, you can compose Cadence transactions and have users
or your service account sign them. For example, when a brand launches a campaign, your front-end
will call an FCL function to send a transaction (which invokes your createCampaign function in
Cadence). FCL handles the heavy lifting of prompting the user's wallet to sign. It’s very developer-
friendly. The React SDK provides React hooks and components for common tasks – for instance, a
useFlowUser() hook to get the current user, or components for login buttons. This can speed up
your UI development a lot. (Install it with npm install @onflow/fcl @onflow/react-sdk and
follow the docs for configuration – basically pointing it to testnet endpoints and your app’s details)
45 46
.
Querying Cadence Scripts: Use FCL to execute scripts to read data from chain – e.g. to display a
creator’s on-chain VeriScore or campaign status. In Flow, scripts (Cadence code marked as
pub fun main(...) ) run off-chain but verifiably against the blockchain state, and cost no fee.
You’ll likely write a script to get Profile.veriScore or to list campaigns from your contract’s
storage. FCL allows you to call these easily and get results in your React app.
Back-end or Off-chain services: If your BrightMatter intelligence layer needs to run server-side, you
can still interact with Flow using the Flow Go SDK or JS SDK on a server to send transactions when
needed (for example, when updating profiles or triggering payouts). Ensure you secure any private
keys – e.g. if you have an oracle account signing transactions, treat those keys carefully (Flow CLI can
help generate keys, and you might use the testnet service account for simplicity during the hack).
The Flow JavaScript SDK (same FCL under the hood) can be used in Node.js, or you can use the Go
47 48
SDK if you prefer strongly typed backend code .
Third-Party Tools: Flow has a growing ecosystem. For instance, Flowser is an all-in-one
development tool (like a blockchain explorer + emulator GUI) that can help during local
development. VS Code Cadence debugger exists but is early. Testing frameworks: You might check
out Overflow (a Golang based testing framework for Cadence, by the find team) or simply use
Cadence in an emulator with assertions. Given the time crunch, focus on end-to-end demo rather
than perfect tests – but do test manually a lot on testnet. The Flow Dev Discord is very active if you
hit issues; since it’s hackathon time, core devs are around to help.
QuickNode/Alchemy: If you need reliable RPC endpoints or indexing, note that QuickNode and
others provide Flow API services. For hackathon, the default access nodes (like
access.devnet.onflow.org for testnet 49
) should suffice. But if you want analytics, Dune now
7
supports Flow data, which could be a cool integration – e.g. after each payout, you could log an
event and query it on Dune to show a live leaderboard of top earning creators. This is optional, but
since Dune is a sponsor, even a simple Dune dashboard showing “Total USDF paid via BrightMatter”
might catch their eye.
Most Efficient Development Path: Implement your Cadence contracts and test them on Flow emulator,
then deploy to Flow testnet for integration with your React app. The iteration on testnet is pretty fast (Flow
testnet has quicker blocks and updates than mainnet) 50
. You’ll use testnet accounts (obtained from the
faucet) to act as dummy brand or creator. The Flow Faucet (https://testnet-faucet.onflow.org) will create
accounts and give you free test FLOW for transactions 41
. Make sure to note the addresses of any
contracts you deploy (e.g. your Profile contract, Escrow contract) and include them in your README. The
hackathon submission requires you to specify which network (testnet/mainnet) you used and all
contract addresses for verification 51
. Since Forte features only became available on mainnet on Oct 22,
it’s perfectly fine to keep your project on testnet for judging – just be clear about it. (Mainnet deployment is
possible now that Forte is live, but don’t risk major issues last minute; a well-functioning testnet demo is
better than a broken mainnet one.)
Testnet vs Mainnet: Differences & Limitations
During development and demo, you’ll likely rely on Flow Testnet, so it’s crucial to understand its nuances
compared to mainnet:
•
Availability of Forte Features: Forte was deployed to testnet first (Sept 17) and then to mainnet
on Oct 22 1 2
. This means prior to Oct 22, testnet was the only place to use Actions and Agents.
As of now (end of October), mainnet has been upgraded, so in theory you could deploy to mainnet.
However, some Forte features are brand new – for example, Scheduled Transactions were still
under active development and only working on emulator/testnet in early October 38
. There may be
minor differences or even last-minute tweaks in how Agents/Actions work on mainnet. The safe
route is to use testnet for all Forte functionality, where it’s known to be enabled and where failures
have no real cost. If you attempt mainnet use of Agents or scheduling, check the latest Flow docs
and possibly limit to testnet if any uncertainty.
•
Economic differences: Mainnet uses real value – Flow tokens for fees and real USDF/PYUSD for
stablecoin. Testnet uses test FLOW (free from faucet) and a mock USDF with no real backing. On
testnet you can be generous with transactions and token usage; on mainnet you’d need to acquire
actual tokens and manage budgets. Given it’s a hackathon, there’s no need to burden yourselves
with real money. Just be sure to clarify to judges that all demos are on Flow testnet (which is
common in hackathons). If you do deploy to mainnet (for bonus points), you might restrict it to read-
only or minimal functionality unless you have test funds. In any case, deploying on testnet is
sufficient to prove your concept.
• 50
Performance and Reset: Flow testnet runs faster block times and shorter epochs than mainnet .
An epoch on testnet is ~12 hours (versus 7 days on mainnet) 52
. This means things like staking
epoch changes or random beacons refresh more often – not something you likely deal with, but one
side effect is testnet is more frequently updated/restarted. Flow testnet is generally stable and
persistent (data remains between epochs; it’s not wiped on each epoch or anything). However, the
Flow team sometimes performs resets or migrations on testnet, especially around major upgrades
8
like Forte. Keep an eye on the Flow Discord or forums for any announcements. As of the hackathon,
testnet should be stable with Forte, but if something does glitch (e.g. an Agent doesn’t trigger as
expected), it could be a testnet quirk. You can highlight that your project is ready for mainnet once
the features stabilize by mainnet upgrade (which they now have).
•
Addresses and Contracts: On Flow, addresses differ between testnet and mainnet. Core contracts
(like FungibleToken, FlowToken, etc.) have different addresses on each network. The Flow DevPortal
provides tables of addresses for core contracts on testnet vs mainnet. For instance,
FungibleToken is at 0x9a0766d93b6608b7 on testnet, and 0x FungibleTokenAddress on
mainnet (0xf233d…). When writing imports in Cadence, you must use the correct address based on
network. The same goes for USDF: on testnet it’s at 0xb7ace0a920d2c37d (mock), on mainnet the
Cadence contract lives at 0x1e4aa0b87d10b141 under a special name 39 40
. In your code repo,
you might manage this by using conditional compilation or simply by keeping a separate branch for
mainnet addresses. For the hack submission, use testnet addresses and clearly label them in
documentation. Judges might try to run your app – if they need to configure anything (like
connecting to testnet), provide instructions. If using FCL, you simply set the config to testnet
( accessNodeUrl: "https://rest-testnet.onflow.org" and flowNetwork: "testnet"
in FCL config). That will ensure your front-end points to testnet.
•
Limitations: One limitation on testnet is lower usage and sometimes less availability of services like
wallets. For example, certain wallets might default to mainnet and need switching to testnet. Blocto
wallet does support testnet – you can provide a link or instructions for testers on how to switch to
Flow testnet in Blocto, or even easier, use the Flow Dev Wallet for testing (the Dev Wallet is a
browser wallet for testnet that the Flow team provides). Another minor difference: testnet’s token
supply and user accounts are just for testing, so you might not find many “realistic” data feeds on-
chain (e.g. Dune analytics on testnet is sparse since volume is low). But for your purposes – writing
your own data to chain – that’s fine.
In summary, develop on testnet to leverage Forte early, and be mindful that any cutting-edge feature
(like Agents scheduling themselves) should be demonstrated on testnet where it’s supported. If your project
works well there, you can confidently say it’s ready to deploy on mainnet (now that Forte is live) with
minimal adjustments, which is a strong finish in your presentation.
Making It Enticing: Combining Veri’s Vision with Flow’s Strengths
Finally, to ensure your project resonates with judges (and potential Flow partners like Dapper), frame it as a
perfect marriage of Veri/BrightMatter’s innovative marketing AI with Flow/Forte’s powerful on-chain
infrastructure. You’ve essentially described Veri as an AI-driven analytics platform that turns creators’
engagement data into verifiable on-chain records and uses smart contracts to automate campaign
rewards 30 31
. This narrative is very compelling for Flow’s mission of mainstream adoption:
•
On-chain Identity & Reputation: Emphasize that each creator has an on-chain Profile (a bit like an
NFT badge) that grows with them – enabled by Flow’s resource model. This is akin to a decentralized
identity for creators. It’s non-transferrable and secure, which only Flow (with Cadence resources)
does in such a straightforward way 29
. Ethereum could approximate it, but not as elegantly. This
profile can plug into other Flow dApps (composability), perhaps even to give reputable creators
9
perks in the future (imagine a Flow game or DAO checking a user’s VeriScore to offer them access –
the possibilities for ecosystem synergy are big).
•
Trustless Analytics (“Proof of Influence”): Normally, brands must trust screenshots or centralized
reports of campaign performance. With BrightMatter on Flow, the proofs of engagement are
anchored on-chain in those profile resources or via events 53 32
. While the raw data comes from
Web2 APIs, your system validates and summarizes it, then writes tamper-proof logs (e.g. “Campaign
X achieved Y views on YouTube – recorded on Flow at time Z”). This verifiability is a huge selling point.
It aligns with the trend of on-chain credentials and brings marketers into the Web3 fold without
requiring them to handle crypto directly – they get a dashboard that’s powered by Flow under the
hood. Mention that you use Flow as the single source of truth for campaign performance, which
judges will recognize as an innovative use of a blockchain beyond just financial transactions.
•
Automated Escrow = Less Trust, Less Hassle: Using Flow Forte for escrow means neither the
brand nor the creator has to trust an intermediary to pay out correctly – the smart contract holds the
money and releases it based on programmed rules 14 15
. This could even enable new models like
“guaranteed ROI campaigns” or micro-influencer pools, because payouts are guaranteed by code. If
you managed to incorporate an Agent for automatic payouts, tout that as a cutting-edge feature
only made possible in Flow’s Forte era (no Ethereum equivalent without relying on bots or cron
jobs!). If not, you can still say the payouts are done via on-chain transaction triggers, easily auditable
and executable in seconds thanks to Flow’s fast finality and low fees (sub-penny fees as noted in Flow
36
docs) .
•
MEV-Resistance and User Experience: Flow’s architecture avoids front-running and MEV by design
54 55
. For your use-case, that means a fair and predictable execution of these reward transactions
– creators won’t lose money to arbitrage and brands won’t worry about sandwich attacks on their
escrows (these might not be immediate concerns, but it’s nice icing on the cake to mention Flow’s
consumer-friendly platform). Also highlight Flow’s cheap transactions and no complex wallet fees
for users – a creator could claim their reward or create a profile without needing to pay $50 gas as
on Ethereum. In fact, with some Flow wallets (and if you configure it), transactions can even be
sponsored (gasless for the user). A smooth UX (maybe integrate Blocto which lets users sign up with
email) will show that your dApp can onboard Web2 creators easily. Judges love seeing that you care
about the onboarding experience for non-crypto natives, since “consumer onboarding” is Flow’s
mantra.
In summary, you’ll want to communicate that “BrightMatter + Flow” yields a powerful platform where
off-chain AI meets on-chain truth. You have the AI-driven analysis (Veri’s secret sauce) and you have Flow
providing the ledger, automation, and money rails to make it all work trustlessly. Each piece you asked
about – Cadence, Forte, testnet vs mainnet, Flow SDKs, on-chain profiles, escrow contracts –
contributes to this story:
•
•
•
Cadence lets you create robust profile and escrow contracts tailored to your needs (profiles as SBTs,
etc).
14
efficiency .
44
wallets easily .
Forte (Actions/Agents) lets you add automation (timed triggers, multi-step payouts) increasing
Flow’s dev tools (CLI, React SDK) let you build quickly in React/TypeScript and integrate with user
10
• 50
Testnet was your playground to develop and show it working without friction , and now mainnet
is ready for when you go live for real users.
•
Any limitations (like needing off-chain data) you overcome by carefully designing the oracle
mechanism, while leveraging Flow for what it’s best at (secure storage and atomic actions).
Be sure to cite any relevant Flow resources in your documentation – e.g. link to the Flow actions/agents
docs or the stablecoin guide if you want. This shows you did your homework and used the ecosystem to the
fullest. Given that Flow’s team and partners are judging, demonstrating knowledge of these sources (as
we’ve compiled here) can only help.
Good luck, and have fun building! With Cadence + React + Forte, you have the tools to make BrightMatter
a showcase dApp on Flow – one that could very well take home the prize. Happy hacking!
Sources:
•
Flow Blog – “Forte is Live on Testnet, and Forte Hacks is Now Open!” (hackathon announcement, tracks)
18 3
• 3 38 56 57
Flow Developer Portal – Forte Upgrade (Actions & Scheduled Tx) ; Forte Tutorials
• 33 35
Flow Developer Portal – DeFi Contracts & Stablecoins on Flow (USDF info)
• 14 28 15
Veri x Flow Partnership Deck (BrightMatter design and features)
• 58
BlockTelegraph – “Flow Launches Forte Upgrade, Bringing DeFi to the Mainstream” (Forte overview)
59
• 36 60
Flow Core Contracts & Cadence Docs (FungibleToken, NFTs, etc.) resource model)
• 44
Flow Developer Portal – React SDK (using FCL in React)
• 50 41
Flow Testnet Guide (differences from mainnet, using faucet) .
(Flow NFT burn example and
1 3 7 17 18 19 20 22 23 25
Forte is Live on Testnet, and Forte Hacks is Now Open!
https://flow.com/post/forte-is-live-on-testnet-and-forte-hacks-is-now-open
2 56 57
Forte Network Upgrade | Flow Developer Portal
https://developers.flow.com/blockchain-development-tutorials/forte
4 5 6 8 9 10 11 12 43
Forte: Introducing Actions & Agents. Supercharging composability and
automation.
https://flow.com/post/forte-introducing-actions-agents-supercharging-composability-and-automation
13
Forte: The Next Era For Flow - Flow.com - Flow blockchain
https://zh.flow.com/post/forte-the-next-era-for-flow
14 15 26 27 28 29 30 31 32 53
Veri Partner Deck - Flow (4).pdf
file://file_0000000058706230ad4d1b6d760bab6d
16
Highlights by Flow.com (@flow_blockchain) / X
https://x.com/flow_blockchain/highlights
21 51
Forte Hacks by Flow: Build with Disney, Dune and Dapper
https://hackquest.io/en/hackathons/Forte-Hacks
11
24
Vibe Coding Playbook: A 3-Week, $100k Project Done with AI for $5k
https://www.youtube.com/watch?v=ehdyVoscbh4
33 34 42
Stablecoins on Flow: A Complete Guide
https://flow.com/post/stablecoins-on-flow-complete-guide
35 39 40
DeFi Contracts on Flow | Flow Developer Portal
https://developers.flow.com/ecosystem/defi-liquidity/defi-contracts
36 37
Flow Foundation Internal Hackathon: A Deep Dive into Innovation
https://flow.com/post/flow-internal-hackathon-a-deep-dive-into-innovation
38
Introduction to Scheduled Transactions | Flow Developer Portal
https://developers.flow.com/blockchain-development-tutorials/forte/scheduled-transactions/scheduled-transactions-introduction
41 47 48 49 50 52
Flow Testnet | Flow Developer Portal
https://developers.flow.com/protocol/flow-networks/accessing-testnet
44 45 46
Flow React SDK | Flow Developer Portal
https://developers.flow.com/build/tools/react-sdk
54 55 58 59
Flow Launches Forte Upgrade, Bringing DeFi to the Mainstream - BlockTelegraph
https://blocktelegraph.io/flow-launches-forte-upgrade-defi-to-mainstream/
60
Flow Core Contracts | Flow Developer Portal
https://developers.flow.com/build/cadence/core-contracts