pragma solidity ^0.4.11;

/*
    Copyright 2017, Jordi Baylina

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/// @title SNTPlaceholder Contract
/// @author Jordi Baylina
/// @dev The SNTPlaceholder contract will take control over the SNT after the contribution
///  is finalized and before the Status Network is deployed.
///  The contract allows for SNT transfers and transferFrom and implements the
///  logic for transferring control of the token to the network when the offering
///  asks it to do so.


import "./MiniMeToken.sol";
import "./StatusContribution.sol";
import "./SafeMath.sol";
import "./Owned.sol";
import "./ERC20Token.sol";


contract SNTPlaceHolder is TokenController, Owned {
    using SafeMath for uint256;

    MiniMeToken public snt;
    StatusContribution public contribution;
    uint256 public activationTime;
    address public sgtExchanger;

    /// @notice Constructor
    /// @param _owner Trusted owner for this contract.
    /// @param _snt SNT token contract address
    /// @param _contribution StatusContribution contract address
    /// @param _sgtExchanger SGT-SNT Exchange address. (During the first week
    ///  only this exchanger will be able to move tokens)
    function SNTPlaceHolder(address _owner, address _snt, address _contribution, address _sgtExchanger) {
        owner = _owner;
        snt = MiniMeToken(_snt);
        contribution = StatusContribution(_contribution);
        sgtExchanger = _sgtExchanger;
    }

    /// @notice The owner of this contract can change the controller of the SNT token
    ///  Please, be sure that the owner is a trusted agent or 0x0 address.
    /// @param _newController The address of the new controller

    function changeController(address _newController) public onlyOwner {
        snt.changeController(_newController);
        ControllerChanged(_newController);
    }


    //////////
    // MiniMe Controller Interface functions
    //////////

    // In between the offering and the network. Default settings for allowing token transfers.
    function proxyPayment(address) public payable returns (bool) {
        return false;
    }

    function onTransfer(address _from, address, uint256) public returns (bool) {
        return transferable(_from);
    }

    function onApprove(address _from, address, uint256) public returns (bool) {
        return transferable(_from);
    }

    function transferable(address _from) internal returns (bool) {
        // Allow the exchanger to work from the beginning
        if (activationTime == 0) {
            uint256 f = contribution.finalizedTime();
            if (f > 0) {
                activationTime = f.add(1 weeks);
            } else {
                return false;
            }
        }
        return (getTime() > activationTime) || (_from == sgtExchanger);
    }


    //////////
    // Testing specific methods
    //////////

    /// @notice This function is overrided by the test Mocks.
    function getTime() internal returns (uint256) {
        return now;
    }


    //////////
    // Safety Methods
    //////////

    /// @notice This method can be used by the controller to extract mistakenly
    ///  sent tokens to this contract.
    /// @param _token The address of the token contract that you want to recover
    ///  set to 0 in case you want to extract ether.
    function claimTokens(address _token) public onlyOwner {
        if (snt.controller() == address(this)) {
            snt.claimTokens(_token);
        }
        if (_token == 0x0) {
            owner.transfer(this.balance);
            return;
        }

        ERC20Token token = ERC20Token(_token);
        uint256 balance = token.balanceOf(this);
        token.transfer(owner, balance);
        ClaimedTokens(_token, owner, balance);
    }

    event ClaimedTokens(address indexed _token, address indexed _controller, uint256 _amount);
    event ControllerChanged(address indexed _newController);
}
