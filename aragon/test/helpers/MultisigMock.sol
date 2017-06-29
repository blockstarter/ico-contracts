pragma solidity ^0.4.8;

import './AragonTokenSaleMock.sol';

contract MultisigMock {
  function deployAndSetANT(address sale) {
    ANT token = new ANT(new MiniMeTokenFactory());
    ANPlaceholder networkPlaceholder = new ANPlaceholder(sale, token);
    token.changeController(address(sale));

    AragonTokenSale s = AragonTokenSale(sale);
    token.setCanCreateGrants(sale, true);
    s.setANT(token, networkPlaceholder, new SaleWallet(s.aragonDevMultisig(), s.finalBlock(), sale));
  }

  function activateSale(address sale) {
    AragonTokenSale(sale).activateSale();
  }

  function emergencyStopSale(address sale) {
    AragonTokenSale(sale).emergencyStopSale();
  }

  function restartSale(address sale) {
    AragonTokenSale(sale).restartSale();
  }

  function finalizeSale(address sale) {
    finalizeSale(sale, AragonTokenSaleMock(sale).mock_hiddenCap());
  }

  function withdrawWallet(address sale) {
    SaleWallet(AragonTokenSale(sale).saleWallet()).withdraw();
  }

  function finalizeSale(address sale, uint256 cap) {
    AragonTokenSale(sale).finalizeSale(cap, AragonTokenSaleMock(sale).mock_capSecret());
  }

  function deployNetwork(address sale, address network) {
    AragonTokenSale(sale).deployNetwork(network);
  }

  function () payable {}
}
