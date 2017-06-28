
pragma solidity ^0.4.11;


// This is a part of the PreICO contract interface.
// https://github.com/sonm-io/presale-token/blob/master/contracts/PresaleToken.sol
// We specify here only the parts that are relevant to token migration.

contract PreICO {
  function balanceOf(address _owner) constant returns (uint256);
  function burnTokens(address _owner);
}
