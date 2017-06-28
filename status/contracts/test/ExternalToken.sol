pragma solidity ^0.4.11;

import "../MiniMeToken.sol";

contract ExternalToken is MiniMeToken {

    function ExternalToken(address _tokenFactory)
            MiniMeToken(
                _tokenFactory,
                0x0,                           // no parent token
                0,                             // no snapshot block number from parent
                "External Token for testing",  // Token name
                1,                             // Decimals
                "EXT",                         // Symbol
                true                           // Enable transfers
            ) {}
}
