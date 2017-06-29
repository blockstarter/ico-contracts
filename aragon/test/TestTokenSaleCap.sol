pragma solidity ^0.4.8;

import "truffle/Assert.sol";
import "zeppelin/token/ERC20.sol";
import "./helpers/AragonTokenSaleMock.sol";
import "./helpers/ThrowProxy.sol";
import "./helpers/MultisigMock.sol";
import "./helpers/NetworkMock.sol";

contract TestTokenSaleCap {
  uint public initialBalance = 250 finney;

  address factory;

  ThrowProxy throwProxy;

  function beforeAll() {
    factory = address(new MiniMeTokenFactory());
  }

  function beforeEach() {
    throwProxy = new ThrowProxy(address(this));
  }

  function testCantFinalizeNotEndedSale() {
    TestTokenSaleCap(throwProxy).throwsWhenFinalizingNotEndedSale();
    throwProxy.assertThrows("Should have thrown when sale is ended");
  }

  function throwsWhenFinalizingNotEndedSale() {
    MultisigMock ms = new MultisigMock();
    AragonTokenSaleMock sale = new AragonTokenSaleMock(10, 20, address(ms), address(ms), 3, 1, 2);
    ms.deployAndSetANT(sale);
    ms.activateSale(sale);
    sale.setMockedBlockNumber(19);
    ms.finalizeSale(sale);
  }

  function testCantFinalizeIfNotMultisig() {
    TestTokenSaleCap(throwProxy).throwsWhenFinalizingIfNotMultisig();
    throwProxy.assertThrows("Should have thrown if not multisig");
  }

  function throwsWhenFinalizingIfNotMultisig() {
    MultisigMock ms = new MultisigMock();
    AragonTokenSaleMock sale = new AragonTokenSaleMock(10, 20, address(ms), address(ms), 3, 1, 2);
    ms.deployAndSetANT(sale);
    ms.activateSale(sale);
    sale.setMockedBlockNumber(30);
    sale.finalizeSale(1, 1);
  }

  function testCantFinalizeWithIncorrectCap() {
    TestTokenSaleCap(throwProxy).throwsWhenFinalizingWithIncorrectCap();
    throwProxy.assertThrows("Should have thrown if incorrect cap");
  }

  function throwsWhenFinalizingWithIncorrectCap() {
    MultisigMock ms = new MultisigMock();
    AragonTokenSaleMock sale = new AragonTokenSaleMock(10, 20, address(ms), address(ms), 5, 1, 2);
    ms.deployAndSetANT(sale);
    ms.activateSale(sale);
    sale.setMockedBlockNumber(21);
    ms.finalizeSale(sale, 101 finney); // cap is 100
  }

  function testCanFinalizeOnCap() {
    MultisigMock ms = new MultisigMock();
    AragonTokenSaleMock sale = new AragonTokenSaleMock(10, 20, address(ms), address(ms), 5, 1, 2);
    ms.deployAndSetANT(sale);
    ms.activateSale(sale);
    sale.setMockedBlockNumber(12);
    sale.proxyPayment.value(100 finney)(address(this));

    sale.revealCap(100 finney, sale.mock_capSecret());

    Assert.isTrue(sale.saleFinalized(), 'Sale should be finished after revealing cap');
  }

  function testFinalizingBeforeCapChangesHardCap() {
    MultisigMock ms = new MultisigMock();
    AragonTokenSaleMock sale = new AragonTokenSaleMock(10, 20, address(ms), address(ms), 5, 1, 2);
    ms.deployAndSetANT(sale);
    ms.activateSale(sale);
    sale.setMockedBlockNumber(12);
    sale.proxyPayment.value(98 finney)(address(this));

    sale.revealCap(100 finney, sale.mock_capSecret());

    Assert.equal(sale.hardCap(), 100 finney, 'Revealing cap should change hard cap');
    Assert.isFalse(sale.saleFinalized(), 'Revealing cap shouldnt end sale if not reached yet');
  }

  function testHardCap() {
    TestTokenSaleCap(throwProxy).throwsWhenHittingHardCap();
    throwProxy.assertThrows("Should have thrown when hitting hard cap");
  }

  function throwsWhenHittingHardCap() {
    MultisigMock ms = new MultisigMock();
    AragonTokenSaleMock sale = new AragonTokenSaleMock(10, 20, address(ms), address(ms), 5, 1, 2);
    ms.deployAndSetANT(sale);
    ms.activateSale(sale);
    sale.setMockedBlockNumber(12);
    sale.setMockedTotalCollected(999999 ether + 950 finney); // hard cap is 1m
    sale.proxyPayment.value(60 finney)(address(this));
  }

  function testCanFinalizeEndedSale() {
    MultisigMock ms = new MultisigMock();
    AragonTokenSaleMock sale = new AragonTokenSaleMock(10, 20, address(ms), address(ms), 5, 1, 2);
    ms.deployAndSetANT(sale);
    ms.activateSale(sale);
    sale.setMockedBlockNumber(12);
    sale.proxyPayment.value(14 finney)(address(this));

    Assert.equal(ERC20(sale.token()).balanceOf(address(this)), 70 finney, 'Should have correct balance after allocation');
    Assert.equal(ERC20(sale.token()).totalSupply(), 70 finney, 'Should have correct supply before ending sale');

    sale.setMockedBlockNumber(21);
    ms.finalizeSale(sale);

    Assert.equal(ERC20(sale.token()).balanceOf(address(ms)), 30 finney, 'Should have correct balance after ending sale');
    Assert.equal(ERC20(sale.token()).totalSupply(), 100 finney, 'Should have correct supply after ending sale');
  }

  function testTokensAreTransferrableAfterSale() {
    MultisigMock ms = new MultisigMock();
    AragonTokenSaleMock sale = new AragonTokenSaleMock(10, 20, address(ms), address(ms), 3, 1, 2);
    ms.deployAndSetANT(sale);
    ms.activateSale(sale);

    Assert.equal(ANT(sale.token()).controller(), address(sale), "Sale is controller during sale");

    sale.setMockedBlockNumber(12);
    sale.proxyPayment.value(15 finney)(address(this));
    sale.setMockedBlockNumber(22);
    ms.finalizeSale(sale);

    Assert.equal(ANT(sale.token()).controller(), sale.networkPlaceholder(), "Network placeholder is controller after sale");

    ERC20(sale.token()).transfer(0x1, 10 finney);
    Assert.equal(ERC20(sale.token()).balanceOf(0x1), 10 finney, 'Should have correct balance after receiving tokens');
  }

  function testFundsAreTransferrableAfterSale() {
    MultisigMock ms = new MultisigMock();
    AragonTokenSaleMock sale = new AragonTokenSaleMock(1000000, 60000000, address(ms), address(ms), 3, 1, 2);
    ms.deployAndSetANT(sale);
    ms.activateSale(sale);

    Assert.equal(ANT(sale.token()).controller(), address(sale), "Sale is controller during sale");

    sale.setMockedBlockNumber(1000000);
    sale.proxyPayment.value(15 finney)(address(this));
    sale.setMockedBlockNumber(60000000);
    ms.finalizeSale(sale);

    ms.withdrawWallet(sale);
    Assert.equal(ms.balance, 15 finney, "Funds are collected after sale");
    Assert.equal(sale.saleWallet().balance, 0 finney, "Funds shouldnt have been transfered");
  }

  function testFundsAreLockedDuringSale() {
    MultisigMock ms = new MultisigMock();
    AragonTokenSaleMock sale = new AragonTokenSaleMock(1000000, 60000000, address(ms), address(ms), 3, 1, 2);
    ms.deployAndSetANT(sale);
    ms.activateSale(sale);

    Assert.equal(ANT(sale.token()).controller(), address(sale), "Sale is controller during sale");

    sale.setMockedBlockNumber(1000000);
    sale.proxyPayment.value(15 finney)(address(this));

    ms.withdrawWallet(sale);
    Assert.equal(ms.balance, 0 finney, "Funds shouldnt have been transfered");
    Assert.equal(sale.saleWallet().balance, 15 finney, "Funds shouldnt have been transfered");
  }
}
