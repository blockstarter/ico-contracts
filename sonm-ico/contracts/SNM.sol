
pragma solidity ^0.4.11;

import "./installed/token/StandardToken.sol";

contract SNM  is StandardToken {

  // Constants
  // =========

  string public name = "SONM Token";
  string public symbol = "SNM";
  uint public decimals = 18;
  uint constant TOKEN_LIMIT = 444 * 1e6 * 1e18;


  // State variables
  // ===============

  address public ico;

  // We block token transfers until ICO is finished.
  bool public tokensAreFrozen = true;


  // Constructor
  // ===========

  function SNM(address _ico) {
    ico = _ico;
  }


  // Priveleged functions
  // ====================

  // Mint few tokens and transefer them to some address.
  function mint(address _holder, uint _value) external {
    require(msg.sender == ico);
    require(_value != 0);
    require(totalSupply + _value <= TOKEN_LIMIT);

    balances[_holder] += _value;
    totalSupply += _value;
    Transfer(0x0, _holder, _value);
  }


  // Allow token transfer.
  function defrost() external {
    require(msg.sender == ico);
    tokensAreFrozen = false;
  }


  // ERC20 functions
  // =========================

  function transfer(address _to, uint _value) public {
    require(!tokensAreFrozen);
    super.transfer(_to, _value);
  }


  function transferFrom(address _from, address _to, uint _value) public {
    require(!tokensAreFrozen);
    super.transferFrom(_from, _to, _value);
  }


  function approve(address _spender, uint _value) public {
    require(!tokensAreFrozen);
    super.approve(_spender, _value);
  }
}
