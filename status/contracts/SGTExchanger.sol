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

/// @title SGTExchanger Contract
/// @author Jordi Baylina
/// @dev This contract will be used to distribute SNT between SGT holders.
///  SGT token is not transferable, and we just keep an accounting between all tokens
///  deposited and the tokens collected.
///  The controllerShip of SGT should be transferred to this contract before the
///  contribution period starts.


import "./MiniMeToken.sol";
import "./SafeMath.sol";
import "./Owned.sol";
import "./StatusContribution.sol";
import "./ERC20Token.sol";

contract SGTExchanger is TokenController, Owned {
    using SafeMath for uint256;

    mapping (address => uint256) public collected;
    uint256 public totalCollected;
    MiniMeToken public sgt;
    MiniMeToken public snt;
    StatusContribution public statusContribution;

    function SGTExchanger(address _sgt, address _snt, address _statusContribution) {
        sgt = MiniMeToken(_sgt);
        snt = MiniMeToken(_snt);
        statusContribution = StatusContribution(_statusContribution);
    }

    /// @notice This method should be called by the SGT holders to collect their
    ///  corresponding SNTs
    function collect() public {
        uint256 finalizedBlock = statusContribution.finalizedBlock();

        require(finalizedBlock != 0);
        require(getBlockNumber() > finalizedBlock);

        uint256 total = totalCollected.add(snt.balanceOf(address(this)));

        uint256 balance = sgt.balanceOfAt(msg.sender, finalizedBlock);

        // First calculate how much correspond to him
        uint256 amount = total.mul(balance).div(sgt.totalSupplyAt(finalizedBlock));

        // And then subtract the amount already collected
        amount = amount.sub(collected[msg.sender]);

        require(amount > 0);  // Notify the user that there are no tokens to exchange

        totalCollected = totalCollected.add(amount);
        collected[msg.sender] = collected[msg.sender].add(amount);

        assert(snt.transfer(msg.sender, amount));

        TokensCollected(msg.sender, amount);
    }

    function proxyPayment(address) public payable returns (bool) {
        throw;
    }

    function onTransfer(address, address, uint256) public returns (bool) {
        return false;
    }

    function onApprove(address, address, uint256) public returns (bool) {
        return false;
    }

    //////////
    // Testing specific methods
    //////////

    /// @notice This function is overridden by the test Mocks.
    function getBlockNumber() internal constant returns (uint256) {
        return block.number;
    }

    //////////
    // Safety Method
    //////////

    /// @notice This method can be used by the controller to extract mistakenly
    ///  sent tokens to this contract.
    /// @param _token The address of the token contract that you want to recover
    ///  set to 0 in case you want to extract ether.
    function claimTokens(address _token) public onlyOwner {
        require(_token != address(snt));
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
    event TokensCollected(address indexed _holder, uint256 _amount);

}
