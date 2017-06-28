pragma solidity ^0.4.8;

import './StandardToken.sol';


/**
 * A trait that allows any token owner to decrease the token supply.
 *
 * We add a Burned event to differentiate from normal transfers.
 * However, we still try to support some legacy Ethereum ecocsystem,
 * as ERC-20 has not standardized on the burn event yet.
 *
 */
contract BurnableToken is StandardToken {

  address public constant BURN_ADDRESS = 0;

  /** How many tokens we burned */
  event Burned(address burner, uint burnedAmount);

  /**
   * Burn extra tokens from a balance.
   *
   */
  function burn(uint burnAmount) {
    address burner = msg.sender;
    balances[burner] = safeSub(balances[burner], burnAmount);
    totalSupply = safeSub(totalSupply, burnAmount);
    Burned(burner, burnAmount);

    // Keep token balance tracking services happy by sending the burned amount to
    // "burn address", so that it will show up as a ERC-20 transaction
    // in etherscan, etc. as there is no standarized burn event yet
    Transfer(burner, BURN_ADDRESS, burnAmount);
  }
}
