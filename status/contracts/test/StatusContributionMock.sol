pragma solidity ^0.4.11;

import '../StatusContribution.sol';

// @dev StatusContributionMock mocks current block number

contract StatusContributionMock is StatusContribution {

    function StatusContributionMock() StatusContribution() {}

    function getBlockNumber() internal constant returns (uint) {
        return mock_blockNumber;
    }

    function setMockedBlockNumber(uint _b) public {
        mock_blockNumber = _b;
    }

    uint mock_blockNumber = 1;
}
