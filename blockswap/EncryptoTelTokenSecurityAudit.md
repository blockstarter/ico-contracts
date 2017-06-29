# EncryptoTel Token Audit

EncryptoTel has recently had a [crowdsale](http://ico.encryptotel.com/) between Apr 24 2017 and May 31 2017. 
This crowdsale raised over USD 4,429,211.94 consisting of BTC 851.84, ETH 3,742.16, WAVES 2,071,053.30, ETC 5,944.01 .

The EncryptoTel token ETT will be a dual Waves and Ethereum blockchain token.

<br />

<hr />

**Table of contents**
* [Background And History](#background-and-history)
* [Security Overview Of The Smart Contract](#security-overview-of-the-smart-contract)
  * [Risks](#risks)
* * [Other Notes](#other-notes)
  [Comments On The Source Code](#comments-on-the-source-code)
* [References](#references)

<br />

<hr />

## Background And History

See description above.

<br />

<hr />

## Security Overview Of The Smart Contract
* [x] The smart contract has been kept relatively simple
* [x] The code has been tested for the normal [ERC20](https://github.com/ethereum/EIPs/issues/20) use cases, and around some of the boundary cases
  * [x] Deployment, with correct `symbol()`, `name()`, `decimals()` and `totalSupply()`
  * [x] Block for ethers being sent to this contract
  * [x] `transfer(...)` from one account to another
  * [x] `approve(...)` and `transferFrom(...)` from one account to another
  * [x] `transferOwnership(...)` and `acceptOwnership()` of the token contract
  * [x] `moveToWaves(...)` with the Waves address where the `WavesTransfer(...)` event is logged
* [x] The testing has been done using geth v1.6.1-stable-021c3c28/darwin-amd64/go1.8.1 and solc 0.4.11+commit.68ef5810.Darwin.appleclang instead of one of the testing frameworks and JavaScript VMs to simulate the live environment as closely as possible
* [x] The `approveAndCall(...)` function has been omitted from this token smart contract as the side effects of this function has not been evaluated fully
* [x] There is no logic with potential division by zero errors
* [x] All numbers used are uint256 (with the exception of `decimals`), reducing the risk of errors from type conversions
* [x] Areas with potential overflow errors in `transfer(...)` and `transferFrom(...)` have the logic to prevent overflows
* [x] Areas with potential underflow errors in `transfer(...)` and `transferFrom(...)` have the logic to prevent underflows
* [x] Function and event names are differentiated by case - function names begin with a lowercase character and event names begin with an uppercase character
* [x] A default constructor has been added to reject any ethers being received by this smart contract
* [x] The function `transferAnyERC20Token(...)` has been added in case the owner has to free any accidentally trapped ERC20 tokens
* [x] The test results can be found in [test/test1results.txt](test/test1results.txt) for the results and [test/test1output.txt](test/test1output.txt) for the full output

<br />

### Risks

* This token contract will not hold any ethers
* In the case where a security vulnerability in this contract is discovered or exploited, a new token contract can be deployed to a new address with the correct(ed) balances transferred over from the old contract to the new contract
* This token contract suffers from the same ERC20 double spend issue with the `approve(...)` and `transferFrom(...)` workflow, but this is a low risk exploit where:
  * Account1 approves for account2 to spend `x`
  * Account1 changes the approval limit to `y`. Account2 waits for the second approval transaction to be broadcasted and sends a `transferFrom(...)` to spend up to `x` before the second approval is mined
  * Account2 spends up to `y` after the second approval is mined. Account2 can therefore spend up to `x` + `y`, instead of `x` or `y`
  * To avoid this double spend, account1 has to set the approval limit to `0`, checking the `allowance(...)` and then setting the approval limit to `y` if account2 has not spent `x`

<br />

<hr />

### Other Notes

* This token contract has been developed and self-security audited - independent checks should be conducted before deployment
* Remember to update TOTALSUPPLY to the finalised and reconciled ICO total supply

<br />

<hr />

## Comments On The Source Code

My comments in the following code are market in the lines beginning with `// NOTE: `. In this case there is nothing to note in the source code below.

Following is the source code for [contracts/EncryptoTelToken.sol](https://github.com/bokkypoobah/Blockswap/blob/ca87455c4650e20cf44bb3e1a3a5378104b33921/contracts/EncryptoTelToken.sol): 

```javascript
pragma solidity ^0.4.10;

// ----------------------------------------------------------------------------
// The EncryptoTel smart contract - provided by Incent - join us on slack; 
// http://incentinvites.herokuapp.com/
//
// A collaboration between Incent, Bok and EncryptoTel :)
//
// Enjoy. (c) Incent Loyalty Pty Ltd and Bok Consulting Pty Ltd 2017. 
// The MIT Licence.
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Contract configuration
// ----------------------------------------------------------------------------
contract TokenConfig {
    string public constant symbol = "ETT";
    string public constant name = "EncyptoTel Token";
    uint8 public constant decimals = 8;  // 8 decimals, same as tokens on Waves
    uint256 public constant TOTALSUPPLY = 5436479500000000;
}


// ----------------------------------------------------------------------------
// ERC Token Standard #20 Interface
// https://github.com/ethereum/EIPs/issues/20
// ----------------------------------------------------------------------------
contract ERC20Interface {
    uint256 public totalSupply;
    function balanceOf(address _owner) constant returns (uint256 balance);
    function transfer(address _to, uint256 _value) returns (bool success);
    function transferFrom(address _from, address _to, uint256 _value) 
        returns (bool success);
    function approve(address _spender, uint256 _value) returns (bool success);
    function allowance(address _owner, address _spender) constant 
        returns (uint256 remaining);
    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, 
        uint256 _value);
}


// ----------------------------------------------------------------------------
// Owned contract
// ----------------------------------------------------------------------------
contract Owned {
    address public owner;
    address public newOwner;
    event OwnershipTransferred(address indexed _from, address indexed _to);

    function Owned() {
        owner = msg.sender;
    }

    modifier onlyOwner {
        if (msg.sender != owner) throw;
        _;
    }

    function transferOwnership(address _newOwner) onlyOwner {
        newOwner = _newOwner;
    }

    function acceptOwnership() {
        if (msg.sender == newOwner) {
            OwnershipTransferred(owner, newOwner);
            owner = newOwner;
        }
    }
}


// ----------------------------------------------------------------------------
// WavesEthereumSwap functionality
// ----------------------------------------------------------------------------
contract WavesEthereumSwap is Owned, ERC20Interface {
    event WavesTransfer(address indexed _from, string wavesAddress,
        uint256 amount);

    function moveToWaves(string wavesAddress, uint256 amount) {
        if (!transfer(owner, amount)) throw;
        WavesTransfer(msg.sender, wavesAddress, amount);
    }
}


// ----------------------------------------------------------------------------
// ERC Token Standard #20 Interface
// https://github.com/ethereum/EIPs/issues/20
// ----------------------------------------------------------------------------
contract EncryptoTelToken is TokenConfig, WavesEthereumSwap {

    // ------------------------------------------------------------------------
    // Balances for each account
    // ------------------------------------------------------------------------
    mapping(address => uint256) balances;

    // ------------------------------------------------------------------------
    // Owner of account approves the transfer of an amount to another account
    // ------------------------------------------------------------------------
    mapping(address => mapping (address => uint256)) allowed;

    // ------------------------------------------------------------------------
    // Constructor
    // ------------------------------------------------------------------------
    function EncryptoTelToken() Owned() TokenConfig() {
        totalSupply = TOTALSUPPLY;
        balances[owner] = TOTALSUPPLY;
    }

    // ------------------------------------------------------------------------
    // Get the account balance of another account with address _owner
    // ------------------------------------------------------------------------
    function balanceOf(address _owner) constant returns (uint256 balance) {
        return balances[_owner];
    }

    // ------------------------------------------------------------------------
    // Transfer the balance from owner's account to another account
    // ------------------------------------------------------------------------
    function transfer(
        address _to, 
        uint256 _amount
    ) returns (bool success) {
        if (balances[msg.sender] >= _amount             // User has balance
            && _amount > 0                              // Non-zero transfer
            && balances[_to] + _amount > balances[_to]  // Overflow check
        ) {
            balances[msg.sender] -= _amount;
            balances[_to] += _amount;
            Transfer(msg.sender, _to, _amount);
            return true;
        } else {
            return false;
        }
    }

    // ------------------------------------------------------------------------
    // Allow _spender to withdraw from your account, multiple times, up to the
    // _value amount. If this function is called again it overwrites the
    // current allowance with _value.
    // ------------------------------------------------------------------------
    function approve(
        address _spender,
        uint256 _amount
    ) returns (bool success) {
        allowed[msg.sender][_spender] = _amount;
        Approval(msg.sender, _spender, _amount);
        return true;
    }

    // ------------------------------------------------------------------------
    // Spender of tokens transfer an amount of tokens from the token owner's
    // balance to another account. The owner of the tokens must already
    // have approve(...)-d this transfer
    // ------------------------------------------------------------------------
    function transferFrom(
        address _from,
        address _to,
        uint256 _amount
    ) returns (bool success) {
        if (balances[_from] >= _amount                  // From a/c has balance
            && allowed[_from][msg.sender] >= _amount    // Transfer approved
            && _amount > 0                              // Non-zero transfer
            && balances[_to] + _amount > balances[_to]  // Overflow check
        ) {
            balances[_from] -= _amount;
            allowed[_from][msg.sender] -= _amount;
            balances[_to] += _amount;
            Transfer(_from, _to, _amount);
            return true;
        } else {
            return false;
        }
    }

    // ------------------------------------------------------------------------
    // Returns the amount of tokens approved by the owner that can be
    // transferred to the spender's account
    // ------------------------------------------------------------------------
    function allowance(
        address _owner, 
        address _spender
    ) constant returns (uint256 remaining) {
        return allowed[_owner][_spender];
    }

    // ------------------------------------------------------------------------
    // Transfer out any accidentally sent ERC20 tokens
    // ------------------------------------------------------------------------
    function transferAnyERC20Token(
        address tokenAddress, 
        uint256 amount
    ) onlyOwner returns (bool success) {
        return ERC20Interface(tokenAddress).transfer(owner, amount);
    }
    
    // ------------------------------------------------------------------------
    // Don't accept ethers
    // ------------------------------------------------------------------------
    function () {
        throw;
    }
}
```

<br />

<hr />

## References

* [Ethereum Contract Security Techniques and Tips](https://github.com/ConsenSys/smart-contract-best-practices)
* Solidity [bugs.json](https://github.com/ethereum/solidity/blob/develop/docs/bugs.json) and [bugs_by_version.json](https://github.com/ethereum/solidity/blob/develop/docs/bugs_by_version.json).

<br />

(c) BokkyPooBah / Bok Consulting Pty Ltd - May 27 2017
