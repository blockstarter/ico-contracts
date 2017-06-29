pragma solidity ^0.4.8;

import "./MiniMeIrrevocableVestedToken.sol";

/*
    Copyright 2017, Jorge Izquierdo (Aragon Foundation)
*/

contract ANT is MiniMeIrrevocableVestedToken {
  // @dev ANT constructor just parametrizes the MiniMeIrrevocableVestedToken constructor
  function ANT(
    address _tokenFactory
  ) MiniMeIrrevocableVestedToken(
    _tokenFactory,
    0x0,                    // no parent token
    0,                      // no snapshot block number from parent
    "Aragon Network Token", // Token name
    18,                     // Decimals
    "ANT",                  // Symbol
    true                    // Enable transfers
    ) {}
}
