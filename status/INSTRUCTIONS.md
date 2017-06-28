## Before starting

* Install `yarn` and `npm`.
* Run `yarn` at the repo root.
* Use the same BIP39 compatible mnemonic in both `truffle.js` (can be set by environment variable `TEST_MNEMONIC`) and for your client.
* Change the `from` key in `truffle.js` for any network that requires it.
* Compile contracts:
  ```
  ./node_modules/.bin/truffle compile
  ```
* Start your Ethereum client:
  ```
  ./node_modules/.bin/testrpc --network-id 15 --mnemonic 'status mnemonic status mnemonic status mnemonic status mnemonic status mnemonic status mnemonic'
  ```

## Run tests

* Run tests
  ```
  ./node_modules/.bin/truffle test --network development
  ```

## Deploy

* Change the config constants in `migrations/2_deploy_contracts.js` to match your addresses and parameters.
* Deploy contracts (choose network from `truffle.js`). The following command deploys up to migration step 2:
  ```
  ./node_modules/.bin/truffle migrate --network development_migrate -f 2
  ```

## Calculations

* Install `python3.6`.
* Caculate outcomes of different ceilings by running:
  ```
  ./scripts/ceiling_curve_calc.py --limit=6100000000000000000000 --curve-factor=300 --fee-token=0.1
  ```
* Run the following to see all options:
  ```
  ./scripts/ceiling_curve_calc.py --help
  ```
