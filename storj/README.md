## Requirements

* OSX or Linux 

* Python 3.5+ (Preferably from Homebrew if OSX)

* solc

## Fund collection and token issuance process walkthrough

### Contracts

Storj tokens are based on Zeppelin `StandardToken` ERC-20 contract. This contract has been further mixed in to include [burn](https://github.com/Storj/storj-contracts/blob/master/contracts/BurnableToken.sol) and [upgradeable](https://github.com/Storj/storj-contracts/blob/master/contracts/UpgradeableToken.sol) traits.

OpenZeppelin is pinned down to commit ffce7e3b08afad8d08a5fdbfbbca098f4d6cdf4e and `solc` is pinned down to version 0.4.8.

### Issuance

500,000,000 tokens will be created on Storj Ethereum smaster wallet. This is the total supply of current Counterparty tokens.

These tokens are then allocated (using `approve`) for 
 
* CounterParty -> Storj conversion server (based on the current Storj circulation)

* Token sale (at the end of the sale)
 
* Storj the company (held back in the master wallet)

### End of token sale

Token distribution is exported as CSV and tokens allocated to their corresponding ETH addresses through an issuance script. Token sale accepts USD, BTC and ETH. Pricing and currency conversion mechanism for tokens can be decided later.

Storj will retain % tokens for the company and these are moved to a time locked vault (TODO, contract here).

Storj will burn % of their tokens.

Early investors may have their tokens also moved in time locked vaults.

[Issuer contract and script is used to distribute token](https://github.com/Storj/storj-contracts/blob/master/contracts/Issuer.sol) to retail token sale contributors.

### Conversion

Tokens are directly distributed from `approve` pool given to the conversion server.

* Counterparty user gives their Ethereum address

* Server gives a Counterparty burn address where old tokens can be sent
 
* When burn addresss is credited the conversion server does `transferFrom` and credits the given Ethereum address with the same amount of tokens

## Installation

### solc

[Install solc 0.4.8](http://solidity.readthedocs.io/en/develop/installing-solidity.html#binary-packages). This exact version is required. Read full paragraph how to install it on OSX.

### Repo

Clone the repository and initialize submodules:

    git clone --recursive git@github.com:Storj/storj-contracts.git

### Populus

First install Python 3.5+:

    brew install python3

Then in the repo folder we install Python dependencies in `venv`:

    cd storj-contracts
    python3.5 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    
Then test solc:

    solc --version
    
    solc, the solidity compiler commandline interface
    Version: 0.4.8+commit.60cc1668.Darwin.appleclang
    
Then test populus:
                                         
    populus          
    
    Usage: populus [OPTIONS] COMMAND [ARGS]...
    ...
                                                
## Compiling contracts
                   
Compile:                   
                             
    populus compile                                
                              
Output will be in `build` folder.                                       
                                        
## Running tests

Tests are written using `py.test` in tests folder.

To run tests activate the virtual environment and then run:

    py.test
    
## Distributing tokens
    
Token balances are inputted as a CSV file with tuples (Ethereum address, balance).
    
Address entries must be unique - same Ethereum address cannot appear twice.

### CSV example

Example of CSV data:
    
    address,amount
    0x001d2A8b10F4b74852A70517C91Db2e924Fc9fc5,3.3
    0x006dD316CA3131738396b15f82F11511b3313Bf4,4.4
  
### Steps to issue tokens to normal accounts

Take update of scripts git repo 

    cd venv/src/ico ; git pull ; cd ../../..

Make sure you have Mainnet running in localhost:8545 or Kovan testnet running localhost:8547 (see `populous.json` for port configuration).

Scripts will try to verify the deployed contract on EtherScan.io using Chrome, so you need to have `chromedriver` browser automation utility installed.

    brew install chromedriver

Make sure you have all contracts compiled to the latest version:

    populus compile

Create an issuer Ethereum account on Parity. This is later referred as *issuer account*. Move some gas ETH there. You can do using geth console:

    geth attach http://120.0.0.1:8547

    personal.newAccount()

Unlock issuer account on Parity when starting parity on command line:

    /usr/bin/parity --chain=kovan --unlock 0x72e0bdab1b4daccb9968a0e7bb1175dd629590e2 --unlock 0x001fc7d7e506866aeab82c11da515e9dd6d02c25 --password password.txt --jsonrpc-apis "web3,eth,net,parity,traces,rpc,personal"
    
Deploy the token contract (`CentrallyIssuedToken`) with full urburnt balance and having the team multisig wallet as the balance owner and upgrade master. The team multisig wallet address is later referred as *master address*. Make sure the token contract has decimals value correctly set.
   
    deploy-token --chain=kovan --address=[issuer account] --contract-name=CentrallyIssuedToken --name=Xtoken --symbol=XXX --supply=1000000 --decimals=8 --verify --verify-filename=CentrallyIssuedToken.sol --master-address=[team multisig wallet address] 
   
Write down the token contract address.
      
Deploy an issuer contract using the following command. this is later referred as *issuer contract*. 
  
    distribute-tokens --chain=kovan --address=[issuer account] --token=[token contract address] --csv-file=dummy.csv --master-address=[team multisig address]        
   
### Approve tokens to the Issuer contract

We can use the Gnosis multisig wallet by loading the STORJ Token abi and contract address. Call the approve function with the number of tokens allowed and the address of the account to issue tokens.
    
(Example using ipython console for a normal account. First start with `ipython` and then paste in the text using `%paste` command):

```python

    from populus import Project
    from ico.utils import check_succesful_tx

    # Unlock fake team multisig using geth console
    fake_team_multisig_address = "0x72e0bdab1b4daccb9968a0e7bb1175dd629590e2"
    
    token_address = "0x399fe67a232dd457c3639b3dccd64d5f7dcad187"
    issuer_contract_address = "0x66b735baff9e4be524c555b61e3a20f0116a4527"
    tokens_to_distribute = 500 * 10**8  # Use 8 decimals
        
    project = Project()
   
    with project.get_chain("kovan") as c:
        web3 = c.web3
        CentrallyIssuedToken = c.provider.get_base_contract_factory('CentrallyIssuedToken')
        contract = CentrallyIssuedToken(address=token_address)
        
        print("Fake team multisig ETH balance is", web3.eth.getBalance(fake_team_multisig_address))
        
        print("Fake team multisig token balance is", contract.call().balanceOf(fake_team_multisig_address))
        
        # We need to call approve() twice due to attack mitigation 
        txid = contract.transact({"from": fake_team_multisig_address}).approve(issuer_contract_address, 0)
        check_succesful_tx(web3, txid)

        txid = contract.transact({"from": fake_team_multisig_address}).approve(issuer_contract_address, tokens_to_distribute) 
        check_succesful_tx(web3, txid)
        
        print("Approved", tokens_to_distribute)
                        
```
Run the distribution script:

    distribute-tokens --chain=kovan --address=[issuer account] --address-column=[Ethereum address column name in CSV] --amount-column=[Token amount column name in the CSV file] --csv-file=distribution.csv --issuer-address=[issuer contract] --no-allow-zero --limit=10000 --token=[token contract address] --master-address=[team multisig wallet address]
      
This script will start issuing tokens. In the case the script is interrupted you can start it again.

The number of tokens issued so far can be checked on Issuer contract address on etherscan.io.

## Distributing vaults

This is step-by-step process how to create time vaults and how to put tokens in them. This assumes you have already created token (above).

Multiple vault contracts are needed to deploy, one for each time period. 

For each vault, manually verify the sum of the tokens going in. The deployment script and contracts will check this multiple times. 

TokenVault is controlled from an controller account that will pay the gas fees.

### Deploying a single vault

This will deploy the vault contract and verify it on EtherScan.

First we deploy a TokenVault contract using `token-vault`  tool for 3000 tokens. Decimal place conversion is calculated internally.:
 
    token-vault --chain=kovan --address=[controlled account] --action=deploy --freeze-ends-at=1497746334 --tokens-to-be-allocated=3000 --token-address=[token address]
        
Write down the vault contract address. Also manually check it variables in Read contract view on EtherScan.

Now lets load vault data. The CSV amount column sum must match what we gave earlier in --tokens-to-be-allocated.
    
    token-vault --chain=kovan --address=[controlled account] --action=load --token-address=[token account] --csv-file="dummy2.csv" --address-column="address" --amount-column="amount" --vault-address=[token vault address]
    
Example CSV:
    
    address,amount
    0x001d2A8b10F4b74852A70517C91Db2e924Fc9fc5,100
    0x006dD316CA3131738396b15f82F11511b3313Bf4,100
    0x72e0bdab1b4daccb9968a0e7bb1175dd629590e2,2800

Before we can lock the vault we need to move `tokens-to-be-allocated` amount of tokens on the vault contract from the master account. Here is a Python example to move the tokens on the contract. You can also manually inspect using EtherScan that the token balance on the contract matches expected total amount:

```python
    from populus import Project
    from ico.utils import check_succesful_tx

    # Unlock fake team multisig using geth console
    fake_team_multisig_address = "0x001FC7d7E506866aEAB82C11dA515E9DD6D02c25"
    
    token_address = "0x2829aa40614901fc677aae4b090759d8fc660faf"
    vault_address = "0xb9cdb05a6a4341ca72cfdc41f88a38c2755839a9"
    tokens_to_locked = 3000 * 10**8  # Use 8 decimals
        
    project = Project()
   
    with project.get_chain("kovan") as c:
        web3 = c.web3
    
        CentrallyIssuedToken = c.provider.get_base_contract_factory('CentrallyIssuedToken')
        TokenVault = c.provider.get_base_contract_factory('TokenVault')
        
        contract = CentrallyIssuedToken(address=token_address)
        vault = TokenVault(address=vault_address)
                
        print("Fake team multisig ETH balance is", web3.eth.getBalance(fake_team_multisig_address))
        
        print("Fake team multisig token balance is", contract.call().balanceOf(fake_team_multisig_address))
        
        print("Transfering tokens to the vault")
        txid = contract.transact({"from": fake_team_multisig_address}).transfer(vault_address, tokens_to_locked)
        check_succesful_tx(web3, txid)
        
        print("Tokens expected", vault.call().tokensToBeAllocated())
        print("Tokens allocated", vault.call().tokensAllocatedTotal())
        print("Tokens hold", vault.call().getBalance())
```

We lock the vault when the vault contract is holding the correct amount token, and we have manually inspected on EtherScan that the investor count, investor addresses and freeze ends at date are correct.

    token-vault --chain=kovan --address=[controller account] --action=lock --token-address=[token address] --vault-address=[vault address]

Investors can claim the tokens from the vault calling the claim function.

```python
    from populus import Project
    from ico.utils import check_succesful_tx

    vault_address = "0xb9cdb05a6a4341ca72cfdc41f88a38c2755839a9"        
    claimer_account = "0x72e0bdab1b4daccb9968a0e7bb1175dd629590e2"
        
    project = Project()
   
    with project.get_chain("kovan") as c:
        web3 = c.web3
    
        CentrallyIssuedToken = c.provider.get_base_contract_factory('CentrallyIssuedToken')
        TokenVault = c.provider.get_base_contract_factory('TokenVault')
        
        vault = TokenVault(address=vault_address)
        token_address = vault.call().token()
        token = CentrallyIssuedToken(address=token_address)
                
        print("Claiming tokens for the account", claimer_account)
        before_balance = token.call().balanceOf(claimer_account)
        txid = vault.transact({"from": claimer_account}).claim()
        check_succesful_tx(web3, txid)
        after_balance = token.call().balanceOf(claimer_account)    
        print("Claimed tokens", after_balance - before_balance)
```

### Emergency procedures

In the case you load wrong amount of tokens on the vault you can claim them back to the controller account. This **cannot** be done for a locked vault.:

```python
    from populus import Project
    from ico.utils import check_succesful_tx

    # Unlock fake team multisig using geth console
    fake_team_multisig_address = "0x001FC7d7E506866aEAB82C11dA515E9DD6D02c25"
    
    token_address = "0x2829aa40614901fc677aae4b090759d8fc660faf"
    vault_address = "0xb9cdb05a6a4341ca72cfdc41f88a38c2755839a9"
    tokens_to_locked = 3000 * 10**8  # Use 8 decimals
        
    project = Project()
   
    with project.get_chain("kovan") as c:
        web3 = c.web3
    
        CentrallyIssuedToken = c.provider.get_base_contract_factory('CentrallyIssuedToken')
        TokenVault = c.provider.get_base_contract_factory('TokenVault')
        
        contract = CentrallyIssuedToken(address=token_address)
        vault = TokenVault(address=vault_address)
                               
        print("Restoring tokens from faulted vault")
        print("Vault owner", vault.call().owner())
        before_balance = contract.call().balanceOf(fake_team_multisig_address)
        txid = vault.transact({"from": fake_team_multisig_address}).recoverFailedLock()
        check_succesful_tx(web3, txid)
        after_balance = contract.call().balanceOf(fake_team_multisig_address)
        
        print("Tokens recovered", after_balance - before_balance)
        print("Tokens expected", vault.call().tokensToBeAllocated())
        print("Tokens allocated", vault.call().tokensAllocatedTotal())
        print("Tokens hold", vault.call().getBalance())
```

                                                                           
