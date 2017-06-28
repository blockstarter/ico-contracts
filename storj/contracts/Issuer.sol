pragma solidity ^0.4.8;

import './StandardToken.sol';
import "zeppelin/contracts/ownership/Ownable.sol";
import 'zeppelin/contracts/SafeMath.sol';

/**
 * Issuer manages token distribution after the crowdsale.
 *
 * This contract is fed a CSV file with Ethereum addresses and their
 * issued token balances.
 *
 * Issuer act as a gate keeper to ensure there is no double issuance
 * per address, in the case we need to do several issuance batches,
 * there is a race condition or there is a fat finger error.
 *
 * Issuer contract gets allowance from the team multisig to distribute tokens.
 *
 */
contract Issuer is Ownable, SafeMath {

  /** Map addresses whose tokens we have already issued. */
  mapping(address => bool) public issued;

  /** Centrally issued token we are distributing to our contributors */
  StandardToken public token;

  /** Party (team multisig) who is in the control of the token pool. Note that this will be different from the owner address (scripted) that calls this contract. */
  address public masterTokenBalanceHolder;

  /** How many addresses have received their tokens. */
  uint public issuedCount;

  /**
   *
   * @param _issuerDeploymentAccount Ethereun account that controls the issuance process and pays the gas fee
   * @param _token Token contract address
   * @param _masterTokenBalanceHolder Multisig address that does StandardToken.approve() to give allowance for this contract
   */
  function Issuer(address _issuerDeploymentAccount, address _masterTokenBalanceHolder, StandardToken _token) {
    owner = _issuerDeploymentAccount;
    masterTokenBalanceHolder = _masterTokenBalanceHolder;
    token = _token;
  }

  function issue(address benefactor, uint amount) onlyOwner {
    if(issued[benefactor]) throw;
    token.transferFrom(masterTokenBalanceHolder, benefactor, amount);
    issued[benefactor] = true;
    issuedCount = safeAdd(amount, issuedCount);
  }

  /**
   * How many tokens we have left in our approval pool.
   */
  function getApprovedTokenCount() public constant returns(uint tokens) {
    return token.allowance(masterTokenBalanceHolder, address(this));
  }

}
