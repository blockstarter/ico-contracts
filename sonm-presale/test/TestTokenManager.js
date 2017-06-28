const TokenManager = artifacts.require("./TokenManager.sol");
const PresaleToken = artifacts.require("./PresaleToken.sol");

contract("TokenManager", () => {
  const [a, b, c] = web3.eth.accounts;
  const escrow = "0x0303030303030303030303030303030303030303";
  let manager;
  let token;

  it("should be able to create TokenManager with 3 members", () =>
    TokenManager.new([a, b, c], 2).then(mgr => {
      manager = mgr;
      return mgr.getOwners.call().then(owners =>
        assert.equal(3, owners.length, "has invalid number of members"))
    })
  )

  it("should be able to create PresaleToken with specified manager", () =>
    PresaleToken.new(manager.address, escrow).then(tok => token = tok)
  )

  it("should be able to switch presale phase", () =>
    manager.tokenSetPresalePhase(token.address, 1).then(res => {
      const log = res.logs.find(log => log.event == "LogTokenSetPresalePhase");
      const txId = log.args._txId;
      return manager.confirmTransaction(txId, {from: b}).then(res =>
        token.currentPhase.call().then(phase =>
          assert.equal(1, phase.toFixed(), "should be in Running phase"))
      )
    })
  )

  it("should be able to set crowdsale manager", () =>
    manager.tokenSetCrowdsaleManager(token.address, c).then(res => {
      const log = res.logs.find(log => log.event == "LogTokenSetCrowdsaleManager");
      const txId = log.args._txId;
      return manager.confirmTransaction(txId, {from: b}).then(res =>
        token.crowdsaleManager.call().then(csm =>
          assert.equal(c, csm, "should change crowdsale manager address")))
    })
  )

  it("should be able to withdraw funds", () =>
    token.buyTokens(a, {value: 3})
      .then(() => {
        const balance = web3.eth.getBalance(escrow);
        return assert.equal(0, balance.toFixed(), "escrow has no ether initially");
      })
      .then(() => manager.tokenWithdrawEther(token.address))
      .then(res => {
        const log = res.logs.find(log => log.event == "LogTokenWithdrawEther");
        const txId = log.args._txId;
        return manager.confirmTransaction(txId, {from: b}).then(res => {
          const balance = web3.eth.getBalance(escrow);
          return assert.isAbove(balance.toFixed(), 0, "escrow got some ether");
        })
      })
  )

  // TODO:
  // - move to migration phase
  // - burn all tokens {from: c}
})
