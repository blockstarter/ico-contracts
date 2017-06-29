# ANT Initial Sale flow

Example of a successful testnet sale: https://kovan.etherscan.io/address/0x506E1db7DA1B3876eAcd2EdDf6ED551A7F2787D0

### Instantiation

#### 1. Deploy sale – 1,425,663 gas
Aragon token sale will be deployed 1 week prior to the beginning of the sale with the following parameters:

- Initial block: TBC
- Final block: Initial block + 172,800 (4 weeks)
- Aragon Dev Multisig: TBC (2/3 confirms multisig with Jorge, Luis, Security key that can only be reconstructed by Jorge and Luis).
- Community Multisig: TBC (3/5 confirms with Aragon Dev Multisig + 4 trusted members of community)
- Initial price: 100
- Final price: 66
- Price stages: 2
- Cap commitment: sealed commitment for the soft hidden cap.

#### 2. sale.setANT() – 95,427 gas
Set ANT needs to called from the Aragon Multisig. Its parameters are:

- ANT token address: An empty deployed instance of ANT.
- ANPlaceholder: A network placeholder with references to the Sale and ANT.
- Sale wallet: A contract that holds sale funds until final block.

Aragon Dev will perform setANT inmediately after deploying the sale so it is instantiated as soon as possible.

After deployANT has been called, the sale contract will have two public addresses available:

- token: The address of the official MiniMe ERC20 compatible Aragon Network Token.
- networkPlaceholder: The placeholder for the Aragon Network until its deployment.

The sale will be the token controller during the sale. After the sale it will be the network placeholder.

Aragon Dev will at this point prove the source code of the contracts in blockchain explorers.

### Presale

The presale is the period between full sale instantiation to the initialBlock of the sale.

During the presale it is required that the sale is activated, failing to activate the sale during this period, will cause the sale to never start.

#### 3. sale.allocatePresaleTokens() – 209,075 gas

Aragon dev will be able to allocate at its own discretion as many presale tokens as needed before the sale is activated.

Aragon dev will only issue presale token to presale partners that took part in a private sale done for gathering the funds needed for the sale.

Presale tokens have cliff and vesting for avoiding market dumps.

#### 4. sale.activateSale() – 2 * 42,862 gas

Both Aragon Dev and the Community Multisig must call activateSale in order to consider the sale activated.

When both multisigs have called this function, the sale will be activated and no more presale allocations will be allowed.

### Sale

If the presale is successful in activating the sale, the sale will start on the initial block.

#### 5. Buy tokens sale.fallback || token.fallback – 108,242 gas || 118,912 gas

After the sale is started, sending an ether amount greater than the dust value (1 finney) will result in tokens getting minted and assigned to the sender of the payment.

All the funds collected will be instantly sent to the Aragon Dev multisig for security.

Disclaimer: Please do not send from exchanges.

<img src="rsc/ant_buy.png"/>

#### 6. sale.revealCap()

During the sale, Aragon can reveal the hidden cap and cap secret resulting in the hard cap of the contract being modified by this new cap.

In case the cap is revealed and the sale contract has already raised an amount higher than the cap, the sale is automatically finalized.

#### 7. sale.emergencyStopSale() – 43,864 gas

After the sale is activated, Aragon Dev will be able to stop the sale for an emergency.

#### 8. sale.restartSale() – 14,031 gas

After the sale has been stopped for an emergency and the sale is still ongoing, Aragon Dev will be able to restart it.

After the sale has ended, it cannot be restarted. The sale can end in a stopped state without problem, but if enabled to restart after ending it could allow Aragon Dev to block the deployment of the network by the community multisig.

### After sale

The after sale period is considered from the final block (inclusive) until the sale contract is destroyed.

#### 9. sale.finalizeSale() – 105,348 gas

This method will mint an additional 3/7 of tokens so at the end of the sale Aragon Dev will own 30% of all the ANT supply.

In the process of doing so, it will make the ANPlaceholder the controller of the token contract. Which will make the token supply be constant until the network is deployed and it implements a new minting policy.

#### 10. sale.deployNetwork() – 22, 338 gas

After the sale is finalized, the community multisig will be able to provide the address of the already deployed Aragon Network.

The ANPlaceholder will transfer its Token Controller power and it will be able to mint further tokens if the network governance decides so.

The sale contract is now suicided in favor of the network, though it shouldn't have any ether.

<img src="rsc/an_deploy.png"/>

### Token operations

#### transfer – 95,121 gas
#### grantVestedTokens – 163,094 gas
