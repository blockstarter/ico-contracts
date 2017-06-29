pragma solidity ^0.4.8;

import './AragonTokenSaleMock.sol';

// @dev AragonTokenSaleTokenMock for ERC20 tests purpose.
// As it also deploys MiniMeTokenFactory, nonce will increase and therefore will be broken for future deployments

contract AragonTokenSaleTokenMock is AragonTokenSaleMock {
  function AragonTokenSaleTokenMock(address initialAccount, uint initialBalance)
    AragonTokenSaleMock(10, 20, msg.sender, msg.sender, 100, 50, 2)
    {
      ANT token = new ANT(new MiniMeTokenFactory());
      ANPlaceholder networkPlaceholder = new ANPlaceholder(this, token);
      token.changeController(address(this));

      setANT(token, networkPlaceholder, new SaleWallet(msg.sender, 20, address(this)));
      allocatePresaleTokens(initialAccount, initialBalance, uint64(now), uint64(now));
      activateSale();
      setMockedBlockNumber(21);
      finalizeSale(mock_hiddenCap, mock_capSecret);

      token.changeVestingWhitelister(msg.sender);
  }
}
