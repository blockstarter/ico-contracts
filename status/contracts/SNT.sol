pragma solidity ^0.4.11;

/*
    Copyright 2017, Jarrad Hope (Status Research & Development GmbH)
*/


import "./MiniMeToken.sol";


contract SNT is MiniMeToken {
    // @dev SNT constructor just parametrizes the MiniMeIrrevocableVestedToken constructor
    function SNT(address _tokenFactory)
            MiniMeToken(
                _tokenFactory,
                0x0,                     // no parent token
                0,                       // no snapshot block number from parent
                "Status Network Token",  // Token name
                18,                      // Decimals
                "SNT",                   // Symbol
                true                     // Enable transfers
            ) {}
}
