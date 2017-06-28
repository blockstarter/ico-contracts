pragma solidity ^0.4.11;

import '../SNT.sol';

// @dev SNTMock mocks current block number

contract SNTMock is SNT {

    function SNTMock(address _tokenFactory) SNT(_tokenFactory) {}

    function getBlockNumber() internal constant returns (uint) {
        return mock_blockNumber;
    }

    function setMockedBlockNumber(uint _b) public {
        mock_blockNumber = _b;
    }

    uint mock_blockNumber = 1;
}
