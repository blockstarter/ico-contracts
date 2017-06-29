pragma solidity ^0.4.8;

import "truffle/Assert.sol";
import '../contracts/ANT.sol';
import '../contracts/MiniMeToken.sol';

contract TestMiniMeCloning {
  MiniMeTokenFactory factory;
  ANT token;
  MiniMeToken clone1;
  MiniMeToken clone2;

  uint baseBlock;

  function beforeAll() {
    factory = new MiniMeTokenFactory();
    token = new ANT(factory);
    token.generateTokens(this, 100);
    token.changeController(0xbeef); // so it doesn't ask this for callbacks
    baseBlock = block.number;
  }

  // Be ware that in order to test with block numbers all tests are asumed to occur
  // sequencially and may interact with each other.

  function testHasTokens() {
    Assert.equal(token.balanceOf(this), 100, 'should have tokens');
  }

  function testCanClone() {
    clone1 = MiniMeToken(token.createCloneToken("ANT2", 18, "ANT2", block.number, true));
    clone1.changeController(0xbeef); // so it doesn't ask this for callbacks
    Assert.equal(clone1.balanceOf(this), 100, 'should have tokens in cloned token');
    Assert.equal(clone1.balanceOfAt(this, block.number - 1), 100, 'should have correct balance before creating it');
  }

  function testCanTransfer() {
    token.transfer(0x1, 10);

    Assert.equal(token.balanceOf(this), 90, 'should have updated balance in token');
    Assert.equal(token.balanceOfAt(this, block.number - 1), 100, 'should have previous balance in token');
    Assert.equal(clone1.balanceOf(this), 100, 'should have previous balance in cloned token');
  }

  function testCanCloneAfterTransfer() {
    clone2 = MiniMeToken(token.createCloneToken("ANT2", 18, "ANT2", block.number, true));
    clone2.changeController(0xbeef); // so it doesn't ask this for callbacks

    Assert.equal(clone2.balanceOf(this), 90, 'should have updated balance in token');
    Assert.equal(clone2.balanceOfAt(this, block.number - 2), 100, 'should have previous balance in token');

    clone1.transfer(0x1, 10);
    Assert.equal(clone1.balanceOf(this), 90, 'should have updated balance in token');
  }

  function testRecurringClones() {
    MiniMeToken lastClone = clone1;
    for (uint i = 0; i < 10; i++) {
      lastClone = MiniMeToken(lastClone.createCloneToken("ANTn", 18, "ANTn", block.number, true));
    }
    lastClone.changeController(0xbeef); // so it doesn't ask this for callbacks

    Assert.equal(lastClone.balanceOf(this), 90, 'should have updated balance in token');
    Assert.equal(lastClone.balanceOfAt(this, baseBlock), 100, 'should be able to travel back in time');
  }

  function testMultitransfer1() {
    Assert.equal(token.balanceOf(this), 90, 'should have correct balance before');
    token.transfer(0x32, 10);
    Assert.equal(token.balanceOf(this), 80, 'should have correct balance before');
  }

  function testMultitransfer2() {
    token.transfer(0x32, 10);
    Assert.equal(token.balanceOf(this), 70, 'should have correct balance before');
  }

  function testMultitransfer3() {
    token.transfer(0x32, 10);
    Assert.equal(token.balanceOf(this), 60, 'should have correct balance before');
    Assert.equal(token.balanceOfAt(this, baseBlock), 100, 'should be able to travel back in time');
  }
}
