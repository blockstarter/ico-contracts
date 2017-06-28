# Status Network Token
[![Build Status](https://travis-ci.org/status-im/status-network-token.svg?branch=master)](https://travis-ci.org/status-im/status-network-token)

- [Whitepaper](https://status.im/whitepaper.pdf)
- [Contribution Period Specification](/SPEC.md)
- [The Importance of Distribution](https://blog.status.im/distribution-dynamic-ceilings-e2f427f5cca) blogpost.
- [Encoding the Status ‘Genesis Block’](https://blog.status.im/encoding-the-status-genesis-block-d73d287a750) blogpost.

## Technical definition

At the technical level SGT & SNT are a ERC20-compliant tokens, derived from the [MiniMe Token](https://github.com/Giveth/minime) that allows for token cloning (forking), which will be useful for many future use-cases.

Also built in the token is a vesting schedule for limiting SNT transferability over time. Status Project Founders tokens are vesting.

## Contracts

- [SNT.sol](/contracts/SNT.sol): Main contract for the token.
- [SGT.sol](/contracts/SGT.sol): Token contract for early adopters. Deployed to [0xd248B0D48E44aaF9c49aea0312be7E13a6dc1468](https://etherscan.io/address/0xd248B0D48E44aaF9c49aea0312be7E13a6dc1468#readContract)
- [MiniMeToken.sol](/contracts/MiniMeToken.sol): Token implementation.
- [StatusContribution.sol](/contracts/StatusContribution.sol): Implementation of the initial distribution of SNT.
- [DynamicCeiling.sol](/contracts/DynamicCeiling.sol): Auxiliary contract to manage the dynamic ceiling during the contribution period.
- [SNTPlaceHolder.sol](/contracts/SNTPlaceHolder.sol): Placeholder for the Status Network before its deployment.
- [ContributionWallet.sol](/contracts/ContributionWallet.sol): Simple contract that will hold all funds until final block of the contribution period.
- [MultiSigWallet.sol](/contracts/MultiSigWallet.sol): ConsenSys multisig used for Status and community multisigs.
- [DevTokensHolder.sol](/contracts/DevTokensHolder.sol): Contract where tokens belonging to developers will be held. This contract will release this tokens in a vested timing.
- [SGTExchanger.sol](/contracts/SGTExchanger.sol): Contract responsible for crediting SNTs to the SGT holders after the contribution period ends.

See [INSTRUCTIONS.md](/INSTRUCTIONS.md) for instructions on how to test and deploy the contracts.

## Reviewers and audits.

Code for the SNT token and the offering is being reviewed by:

- Jordi Baylina, Author.
- [Smart Contract Solutions (OpenZeppelin)](https://smartcontractsolutions.com/). [Pending audit results](/) [Preliminary](/audits/prelim-smartcontractsolutions-ef163f1b6fd6fb0630a4b8c78d3b706f3fe1da33.md)
- [CoinFabrik](http://www.coinfabrik.com/). [2152b17aa2ef584a2aea95533c707a345c6ccf69](/audits/coinfabrik-2152b17aa2ef584a2aea95533c707a345c6ccf69.pdf)
- [BlockchainLabs.nz](http://blockchainlabs.nz/). [Audit results](/audits/BlockchainLabs-SNT-audit-report.md)
- [Bok Consulting](https://www.bokconsulting.com.au/). [Pending audit results](/)
- YYYYYY. [Pending audit results](/)

A bug bounty for the SNT token and offering started on 14/6/2017. [More details](https://blog.status.im/status-network-token-bug-bounty-a66fc2324359)
