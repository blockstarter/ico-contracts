pragma solidity ^0.4.8;

import "./interface/Controller.sol";
import "./ANT.sol";

/*
    Copyright 2017, Jorge Izquierdo (Aragon Foundation)
*/
/*

@notice The ANPlaceholder contract will take control over the ANT after the sale
        is finalized and before the Aragon Network is deployed.

        The contract allows for ANT transfers and transferFrom and implements the
        logic for transfering control of the token to the network when the sale
        asks it to do so.
*/

contract ANPlaceholder is Controller {
  address public sale;
  ANT public token;

  function ANPlaceholder(address _sale, address _ant) {
    sale = _sale;
    token = ANT(_ant);
  }

  function changeController(address network) public {
    if (msg.sender != sale) throw;
    token.changeController(network);
    suicide(network);
  }

  // In between the sale and the network. Default settings for allowing token transfers.
  function proxyPayment(address _owner) payable public returns (bool) {
    throw;
    return false;
  }

  function onTransfer(address _from, address _to, uint _amount) public returns (bool) {
    return true;
  }

  function onApprove(address _owner, address _spender, uint _amount) public returns (bool) {
    return true;
  }
}
