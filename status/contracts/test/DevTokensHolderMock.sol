pragma solidity ^0.4.11;

import '../DevTokensHolder.sol';

// @dev DevTokensHolderMock mocks current block number

contract DevTokensHolderMock is DevTokensHolder {

    uint mock_time;

    function DevTokensHolderMock(address _owner, address _contribution, address _snt)
    DevTokensHolder(_owner, _contribution, _snt) {
        mock_time = now;
    }

    function getTime() internal returns (uint) {
        return mock_time;
    }

    function setMockedTime(uint _t) {
        mock_time = _t;
    }
}
