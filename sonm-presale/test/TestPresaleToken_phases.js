const PresaleToken = artifacts.require("./PresaleToken.sol");

const Phase = {
  Created:   0,
  Running:   1,
  Paused:    2,
  Migrating: 3,
  Migrated:  4
};

const PhaseStr = {};
Object.keys(Phase).forEach(k => PhaseStr[Phase[k]] = k);


contract("PresaleToken", () => {
  const
    [ tokenManager
    , crowdsaleManager
    , investor1
    , investor2
    , creator
    ] = web3.eth.accounts;
  const escrow = "0x0303030303030303030303030303030303030303";
  let token = null;

  const evmThrow = err =>
    assert.isOk(err.message.match(/invalid JUMP/), err.message, 'should throw');

  const ok = (from, to) =>
    it(`can move from ${PhaseStr[from]} to ${PhaseStr[to]}`, () =>
      token.setPresalePhase(to, {from: tokenManager}).then(() =>
        token.currentPhase.call().then(res =>
          assert.equal(to, res.toFixed(), `not Phase.${PhaseStr[to]}`))));

  const no = (from, to) =>
    it(`can't move from ${PhaseStr[from]} to ${PhaseStr[to]}`, () =>
      token.setPresalePhase(to, {from: tokenManager})
        .then(assert.fail)
        .catch(() =>
          token.currentPhase.call().then(res =>
            assert.equal(from, res.toFixed(), `not Phase.${PhaseStr[from]}`))));

  it("can succesfully create PresaleToken", () =>
    PresaleToken.new(tokenManager, escrow, {from: creator})
      .then(res => {token = res}));

  it("should start in phase Created", () =>
    token.currentPhase.call().then(res =>
      assert.equal(0, res.toFixed(), "not Phase.Created")));


  // At phase Created
  // - buy
  // - burn
  // + withdraw
  // + set crowdsale manager
  it("should fail to buyTokens in Phase.Created", () =>
    token.buyTokens(investor1, {value: web3.toWei(1, 'ether'), from: investor1})
      .then(assert.fail).catch(evmThrow))

  it("should fail to call burnTokens in Phase.Created", () =>
    token.burnTokens(investor1, {from: crowdsaleManager})
      .then(assert.fail).catch(evmThrow))

  it("tokenManager can call withdrawEther in Phase.Created", () =>
    token.withdrawEther({from: tokenManager})
      .then(() => {}))

  it("tokenManager can call setCrowdsaleManager in Phase.Created", () =>
    token.setCrowdsaleManager(crowdsaleManager, {from: tokenManager})
      .then(() => token.crowdsaleManager.call().then(res =>
        assert.equal(crowdsaleManager, res, "Invalid crowdsaleManager"))))

  it("random guy should fail to call setCrowdsaleManager in Phase.Created", () =>
    token.setCrowdsaleManager(crowdsaleManager, {from: investor1})
      .then(assert.fail).catch(evmThrow))

  it("can succesfully create another PresaleToken", () =>
    PresaleToken.new(tokenManager, escrow, {from: creator})
      .then(res => {token = res}));

  no(Phase.Created, Phase.Created);
  no(Phase.Created, Phase.Paused);
  no(Phase.Created, Phase.Migrating);
  no(Phase.Created, Phase.Migrated);
  ok(Phase.Created, Phase.Running);

  // At phase Running
  // + buy
  // - burn
  // + withdraw
  // + set crowdsale manager
  it("can call buyTokens in Phase.Running", () =>
    token.buyTokens(investor1, {value: web3.toWei(1, 'ether'), from: investor1})
      .then(() => {
        token.balanceOf.call(investor1).then(res =>
          assert.equal(606, web3.fromWei(res.toFixed(), 'ether'),
            "1 Ether should buy 606 SPT"))
        const balance = web3.eth.getBalance(token.address)
        return assert.equal(1, web3.fromWei(balance.toFixed(), 'ether'), "contract balance is 1 ether")
      }))

  it("should fail to call burnTokens in Phase.Running", () =>
    token.burnTokens(investor1, {from: crowdsaleManager})
      .then(assert.fail).catch(evmThrow))

  it("tokenManager can call withdrawEther in Phase.Running", () => {
    const mgrBalance1 = web3.eth.getBalance(escrow).toFixed();
    token.withdrawEther({from: tokenManager})
      .then(() => {
        const tokBalance = web3.fromWei(web3.eth.getBalance(token.address).toFixed(), 'ether');
        assert.equal(0, tokBalance, "contract balance is 0 ether");
        const mgrBalance2 = web3.eth.getBalance(escrow).toFixed();
        return assert.isAbove(mgrBalance2, mgrBalance1, "escrow got some ether");
      })
  });

  it("tokenManager can call setCrowdsaleManager in Phase.Running", () =>
    token.setCrowdsaleManager(crowdsaleManager, {from: tokenManager})
      .then(() => token.crowdsaleManager.call().then(res =>
          assert.equal(crowdsaleManager, res, "Invalid crowdsaleManager"))))

  it("random guy should fail to call setCrowdsaleManager in Phase.Running", () =>
    token.setCrowdsaleManager(crowdsaleManager, {from: investor1})
      .then(assert.fail).catch(evmThrow))

  it("can call buyTokens in Phase.Running again", () =>
    token.buyTokens(investor2, {value: web3.toWei(1, 'ether'), from: investor2})
      .then(() => {
        token.balanceOf.call(investor2).then(res =>
          assert.equal(606, web3.fromWei(res.toFixed(), 'ether'),
            "1 Ether should buy 606 SPT"))
        const balance = web3.eth.getBalance(token.address)
        return assert.equal(1, web3.fromWei(balance.toFixed(), 'ether'), "contract balance is 1 ether")
      }))


  no(Phase.Running, Phase.Created);
  no(Phase.Running, Phase.Running);
  no(Phase.Running, Phase.Migrated);
  ok(Phase.Running, Phase.Paused);

  // At phase Paused
  // - buy
  // - burn
  // + withdraw
  // + set crowdsale manager
  it("should fail to call buyTokens in Phase.Paused", () =>
    token.buyTokens(investor1, {value: web3.toWei(1, 'ether'), from: investor1})
      .then(assert.fail).catch(evmThrow))

  it("should fail to call burnTokens in Phase.Paused", () =>
    token.burnTokens(investor1, {from: crowdsaleManager})
      .then(assert.fail).catch(evmThrow))

  it("tokenManager can call withdrawEther in Phase.Paused", () => {
    const mgrBalance1 = web3.eth.getBalance(escrow).toFixed();
    token.withdrawEther({from: tokenManager})
      .then(() => {
        const tokBalance = web3.fromWei(web3.eth.getBalance(token.address).toFixed(), 'ether');
        assert.equal(0, tokBalance, "contract balance is 0 ether");
        const mgrBalance2 = web3.eth.getBalance(escrow).toFixed();
        return assert.isAbove(mgrBalance2, mgrBalance1, "escrow got some ether");
      })
  });

  it("random guy should fail to call setCrowdsaleManager in Phase.Paused", () =>
    token.setCrowdsaleManager(crowdsaleManager, {from: investor1})
      .then(assert.fail).catch(evmThrow))

  no(Phase.Paused, Phase.Created);
  no(Phase.Paused, Phase.Paused);
  no(Phase.Paused, Phase.Migrated);
  ok(Phase.Paused, Phase.Running);

  it("can call buyTokens in Phase.Running again", () =>
    token.buyTokens(investor2, {value: web3.toWei(1, 'ether'), from: investor2})
      .then(() => {
        token.balanceOf.call(investor2).then(res =>
          assert.equal(2*606, web3.fromWei(res.toFixed(), 'ether'),
            "1 Ether should buy 606 DPT"))
        const balance = web3.eth.getBalance(token.address)
        return assert.equal(1, web3.fromWei(balance.toFixed(), 'ether'), "contract balance is 1 ether")
      }))


  // check if crowdsale manager is set
  it("tokenManager can call setCrowdsaleManager in Phase.Running", () =>
    token.setCrowdsaleManager('0x0', {from: tokenManager})
      .then(() => token.crowdsaleManager.call().then(res =>
          assert.equal('0x0000000000000000000000000000000000000000', res, "Invalid crowdsaleManager"))))

  no(Phase.Running, Phase.Migrating);

  it("tokenManager can call setCrowdsaleManager in Phase.Running", () =>
    token.setCrowdsaleManager(crowdsaleManager, {from: tokenManager})
      .then(() => token.crowdsaleManager.call().then(res =>
          assert.equal(crowdsaleManager, res, "Invalid crowdsaleManager"))))

  ok(Phase.Running, Phase.Migrating);

  // At phase Migrating
  // - buy
  // + burn
  // + withdraw
  // - set crowdsale manager
  it("should fail to call buyTokens in Phase.Migrating", () =>
    token.buyTokens(investor1, {value: web3.toWei(1, 'ether'), from: investor1})
      .then(assert.fail).catch(evmThrow))

  it("random guy should fail to call burnTokens in Phase.Migrating", () =>
    token.burnTokens(investor1, {from: investor1})
      .then(assert.fail).catch(evmThrow))

  it("crowdsaleManager can call burnTokens in Phase.Migrating", () =>
    token.burnTokens(investor1, {from: crowdsaleManager}).then(() =>
        token.balanceOf.call(investor1).then(res =>
          assert.equal(0, web3.fromWei(res.toFixed(), 'ether'),
            "tokens burned, balance is zero"))))

  it("tokenManager can call withdrawEther in Phase.Migrating", () =>
    token.withdrawEther({from: tokenManager})
      .then(() => {}))

  it("should fail to call setCrowdsaleManager in Phase.Migrating", () =>
    token.setCrowdsaleManager(crowdsaleManager, {from: tokenManager})
      .then(assert.fail).catch(evmThrow))

  no(Phase.Migrating, Phase.Created);
  no(Phase.Migrating, Phase.Running);
  no(Phase.Migrating, Phase.Paused);
  no(Phase.Migrating, Phase.Migrating);

  // check if everyting is migrated
  no(Phase.Migrating, Phase.Migrated);
  // burn all
  it("crowdsaleManager can call burnTokens in Phase.Migrating", () =>
    token.burnTokens(investor2, {from: crowdsaleManager})
      .then(() => {
        token.balanceOf.call(investor2).then(res =>
          assert.equal(0, web3.fromWei(res.toFixed(), 'ether'),
            "tokens burned, balance is zero"))
      }))
  it("should automatically switch to Phase.Migrated when all tokens burned", () =>
    token.currentPhase.call().then(res =>
      assert.equal(Phase.Migrated, res.toFixed(), "not Phase.Migrated")));

  no(Phase.Migrated, Phase.Created);
  no(Phase.Migrated, Phase.Running);
  no(Phase.Migrated, Phase.Paused);
  no(Phase.Migrated, Phase.Migrating);
  no(Phase.Migrated, Phase.Migrated);


  // At phase Migrated
  // - buy
  // + withdraw
  it("should fail to call buyTokens in Phase.Migrated", () =>
    token.buyTokens(investor1, {value: web3.toWei(1, 'ether'), from: investor1})
      .then(assert.fail).catch(evmThrow))

  it("tokenManager can call withdrawEther in Phase.Migrated", () =>
    token.withdrawEther({from: tokenManager})
      .then(() => {}))
})
