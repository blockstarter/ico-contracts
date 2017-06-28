# Status Network Contribution Period
## Functional Specification

### Distribution
- 29% is for reserve (multisig)
- 20% goes to the status team and founders (multisig, 2 Year Vesting Contract, 6 month cliffs)
- Remaining 51% is divided between the initial contribution period itself and SGT, where SGT is <= 10% of total supply.

### Whitelist
Addresses can be whitelisted and have guaranteed participation up to a set maximum amount, ignores Dynamic Ceiling. Sending ETH to the smart contract address should be no different, whether whitelisted or not.
Status Genesis Tokens
SGT is a Minime Token that’s total supply of 500,000,000 maps to, and cannot exceed 10% of the total supply.
ie. If 250,000,000 of SGT is allocated then SGT maps to 5% of the total supply.
SGT can be redeemed for SNT after contribution period.

### Dynamic Ceiling
A Curve that specifies a series of hidden hard caps at specific block intervals, that can be revealed at anytime during the contribution period. The entire curve must be revealed before finalising the contribution period. Finalising the contribution period can happen at any moment during the curve, as long as entire curve has been revealed. Whitelisted addresses ignore ceiling.

### Misc
Tokens are not transferrable for 1 week after contribution period and are minted at 10,000 SNT per 1 ETH.
