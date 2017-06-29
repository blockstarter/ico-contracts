# Blockswap Token - Testing

Note that this recent testing only covers the EncryptoTel token

## Requirements

* The tests works on OS/X. Should work in Linux. May work in Windows with Cygwin
* Geth/v1.6.1-stable-021c3c28/darwin-amd64/go1.8.1
* Solc 0.4.11+commit.68ef5810.Darwin.appleclang

<br />

<hr />

## Executing The Tests

* Run `geth` in dev mode

      ./00_runGeth.sh

* Run the test in [01_test1.sh](01_test1.sh)

      ./01_test1.sh

* See  [test1results.txt](test1results.txt) for the results and [test1output.txt](test1output.txt) for the full output.

<br />

<hr />

## Note

These smart contract tests have been tested with the Mainnet `geth` client, using a Dev blockchain.
This is to reduce the chances of any side effects from testing against Truffle or other testing frameworks.