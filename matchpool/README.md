## Installation

1. Clone this repository

2. Install the dependencies [Truffle](https://github.com/ConsenSys/truffle) (requires NodeJS 5.0+) and [Testrpc](https://github.com/ethereumjs/testrpc):
    ```
    npm install
    ```

## Using Truffle for testing

From the Crowdfund directory in your terminal:

1. Launch a testrpc client with these arguments:
    ```
    testrpc --account="0xfa6a83f0e0c943f4d4654ae1d71d85f87f758a8f2846534b82c10e1070cf2e7a,1000000000000000000000000000000000000000000000"testrpc --account="0x19bc61f018488e683e5dd211bb1ad806a127cf4595b8cffb0821d017d4dee2bb,1000000000000000000000000000000000000000000000"testrpc --account="0x54bc25ebb3bab281ceff1bd7c93534726421e9669c353aaac8f1bbeb21be05c9,1000000000000000000000000000000000000000000000"testrpc --account="0xc3126ccdacb2f9f7956394f10c300a074a5fd59ee5f23df2d91dbd3e2510820e,1000000000000000000000000000000000000000000000"testrpc --account="0xcbefbe1454406dcf7a3849ee7808678a4abc039b8ba91f9eeb9f61c6ede803b4,1000000000000000000000000000000000000000000000"testrpc --account="0x07390a780157acacd91bd312cbfbeadb534c9aa47c426ae7b124334e5bbf3001,1000000000000000000000000000000000000000000000"testrpc --account="0xab073664853150f19468677d1be0165b7a6d781b4d285e99a48d24798b6001b0,1000000000000000000000000000000000000000000000"testrpc --account="0x7a3cb8ec310fc5f2a20c5706005df7f7f89b46dfbf879d41a040c21c61c21863,1000000000000000000000000000000000000000000000"testrpc --account="0xad7e6bd5ceddaaad396e81e6a69988c2bb52a35617272e5eef664836a7cf87d7,1000000000000000000000000000000000000000000000"

    ```

2. in a second terminal in the same directory run 
    ```
    truffle test
    ```

to run all test or

    ```
    truffle test <path>
    ```

to run tests individually
    

KNOWN ISSUES: Truffle tests will sometimes fail whole blocks of tests as testrpc fails to keep up with the test script. Retry or run individual 'contract' objects one at a time.

## Acknowledgements

These token contracts have been influenced by the work of FirstBlood, MelonPort and Golem.
