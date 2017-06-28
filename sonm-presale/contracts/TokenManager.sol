pragma solidity ^0.4.4;

import "multisig-wallet/MultiSigWallet.sol";
//import "./MultiSigWallet.sol";
import "./PresaleToken.sol";



// This extends MultiSigWallet with proxy functions to control PresaleToken
// contract.

contract TokenManager is MultiSigWallet {

    function TokenManager(address[] _owners, uint _required)
        MultiSigWallet(_owners, _required)
    { }


    event LogTokenSetPresalePhase(PresaleToken.Phase indexed _phase, uint _txId);
    event LogTokenWithdrawEther(uint _txId);
    event LogTokenSetCrowdsaleManager(address indexed _address, uint _txId);


    function tokenSetPresalePhase(
        address _token,
        PresaleToken.Phase _nextPhase
    ) public
        ownerExists(msg.sender)
    {
        // bytes4(sha3('setPresalePhase(uint8)'))
        bytes memory data =
          hex"1ca2e94a0000000000000000000000000000000000000000000000000000000000000000";
        data[35] = bytes1(uint8(_nextPhase));
        uint txId = super.submitTransaction(_token, 0, data);
        LogTokenSetPresalePhase(_nextPhase, txId);
    }


    function tokenWithdrawEther(address _token) public
        ownerExists(msg.sender)
    {
        // bytes4(sha3('withdrawEther()'))
        bytes memory data = hex"7362377b";
        uint txId = super.submitTransaction(_token, 0, data);
        LogTokenWithdrawEther(txId);
    }


    function tokenSetCrowdsaleManager(address _token, address _mgr) public
        ownerExists(msg.sender)
    {
        // bytes4(sha3('setCrowdsaleManager(address)'))
        bytes memory data =
          hex"4defd1bf0000000000000000000000000000000000000000000000000000000000000000";

        // 36 = 4 bytes of signature hash + 32 bytes of array length
        assembly { mstore(add(data, 36), _mgr) }

        uint txId = super.submitTransaction(_token, 0, data);
        LogTokenSetCrowdsaleManager(_mgr, txId);
    }
}
