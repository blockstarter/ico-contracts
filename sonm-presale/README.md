
SONM Presale Contracts
======================

These smart contracts are designed to handle initial distribution of SONM
Presale Tokens (SPT). Please check that you are understande major features
before investing or interacting with these contracts:

  - tokens are provided at fixed price 606 SPT per 1 ETH;
  - maximum amount of tokens distributed during presale is limited to 6.060.000 SPT;
  - dev team is able to stop presale at any time;
  - you can not transfer SPT tokens during presale;
  - you will be able to exchange SPT tokens for real SONM tokens at a later
    phase of SONM development;
  - no refund or moneyback is available during presale;
  - dev team is able to withdraw Ether at any time during or after presale
    - those funds are moved to escrow's address


Refer to [Administrator's Guide](docs/admins-guide.md)
for more details on how to interact with the contracts.


Compile, Test, Deploy
---------------------

Requires Node.js version >= 6.5.1 and truffle@^3.1.1.

**Contracts**

```
$ truffle install
$ truffle test
$ truffle migrate --network testnet --reset
Using network 'testnet'.

Running migration: 1_deploy_contracts.js
  Deploying TokenManager...
  TokenManager: 0x2b171c2805fcc52c1cd4592ed73079cda464dc60
  Deploying PresaleToken...
  PresaleToken: 0x517fe605f789956bb6bcebd23431c9fc3b866b3e
```

**UI**

```
$ cd web-ui
$ npm install
$ npm start
```

You can also deploy UI to gh-pages with `npm run deploy`.
