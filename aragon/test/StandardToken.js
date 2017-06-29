// Zeppelin tests for ERC20 StandardToken.

const assertJump = require('./helpers/assertJump');
const assertGas = require('./helpers/assertGas');
var AragonTokenSaleTokenMock = artifacts.require("AragonTokenSaleTokenMock");
var TokenReceiverMock = artifacts.require("TokenReceiverMock");
var StandardToken = artifacts.require("MiniMeToken.sol");

contract('StandardToken', function(accounts) {
  let token;
  beforeEach(async () => {
    const sale = await AragonTokenSaleTokenMock.new(accounts[0], 70) // 30 extra tokens are 30% extra at sale end
    token = StandardToken.at(await sale.token())
  })

  it("should return the correct totalSupply after construction", async function() {
    let totalSupply = await token.totalSupply();

    assert.equal(totalSupply, 100);
  })

  it("should return the correct allowance amount after approval", async function() {
    let approve = await token.approve(accounts[1], 100);
    let allowance = await token.allowance(accounts[0], accounts[1]);

    assert.equal(allowance, 100);
  });

  it("should return correct balances after transfer", async function() {
    let transfer = await token.transfer(accounts[1], 100);
    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 0);

    let balance1 = await token.balanceOf(accounts[1]);
    assert.equal(balance1, 100);
  });

  it("should throw an error when trying to transfer more than balance", async function() {
    try {
      let transfer = await token.transfer(accounts[1], 101);
    } catch(error) {
      return assertJump(error);
    }
    assert.fail('should have thrown before');
  });

  it("should return correct balances after transfering from another account", async function() {
    let approve = await token.approve(accounts[1], 100);
    let transferFrom = await token.transferFrom(accounts[0], accounts[2], 100, {from: accounts[1]});

    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 0);

    let balance1 = await token.balanceOf(accounts[2]);
    assert.equal(balance1, 100);

    let balance2 = await token.balanceOf(accounts[1]);
    assert.equal(balance2, 0);
  });

  it("should throw an error when trying to transfer more than allowed", async function() {
    let approve = await token.approve(accounts[1], 99);
    try {
      let transfer = await token.transferFrom(accounts[0], accounts[2], 100, {from: accounts[1]});
    } catch (error) {
      return assertJump(error);
    }
    assert.fail('should have thrown before');
  });

  it("should approve and call", async function() {
    let receiver = await TokenReceiverMock.new()
    await token.approveAndCall(receiver.address, 15, '0xbeef')

    assert.equal(await receiver.tokenBalance(), 15, 'Should have transfered tokens under the hood')
    assert.equal(await receiver.extraData(), '0xbeef', 'Should have correct extra data')
  })

  it("approve and call should throw when transferring more than balance", async function() {
    let receiver = await TokenReceiverMock.new()
    try {
      let approveAndCall = await token.approveAndCall(receiver.address, 150, '0xbeef')
    } catch (error) {
      return assertGas(error);
    }
    assert.fail('should have thrown before');
  })
});
