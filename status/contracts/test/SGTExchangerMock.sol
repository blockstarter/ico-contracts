pragma solidity ^0.4.11;

import '../SGTExchanger.sol';

// @dev SGTExchangerMock mocks current block number

contract SGTExchangerMock is SGTExchanger {

    function SGTExchangerMock(address _sgt, address _snt, address _statusContribution)
        SGTExchanger(_sgt,  _snt, _statusContribution) {}

    function getBlockNumber() internal constant returns (uint) {
        return mock_blockNumber;
    }

    function setMockedBlockNumber(uint _b) public {
        mock_blockNumber = _b;
    }

    uint public mock_blockNumber = 1;
}
