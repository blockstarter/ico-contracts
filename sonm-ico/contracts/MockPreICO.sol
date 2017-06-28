pragma solidity ^0.4.11;

import "./PreICO.sol";


contract MockPreICO is PreICO {

  mapping (address => uint) balance;

  function setBalance(uint _value) {
    balance[msg.sender] = _value;
  }

  function balanceOf(address _owner) constant returns (uint256) {
    return balance[_owner];
  }

  function burnTokens(address _owner) {
    balance[_owner] = 0;
  }
}
