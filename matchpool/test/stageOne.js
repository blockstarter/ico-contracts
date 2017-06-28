var Contribution = artifacts.require("./Contribution.sol");
var GUPToken = artifacts.require("./GUPToken.sol");
var send = require("./util").send;
var guptokenadd;
var GUPTokenDeployed;
var ContributionDeployed;



contract('stage one', function(accounts){
  const BTCSUISSE = accounts[0];
  const MATCHPOOL = accounts[2];
  const MULTISIG = accounts[1];

  //Fetch deployed contracts
  before("fetch deployed instances",function(){
    return Contribution.deployed().then(function(instance){
      ContributionDeployed = instance;
      return instance.gupToken().then(function(instance){
        guptokenadd = instance;
        GUPTokenDeployed = GUPToken.at(guptokenadd);

      })
    })
  });

  before("advance time", function(){
    return ContributionDeployed.publicStartTime().then(function(instance){
      console.log("old time: ", web3.eth.getBlock('latest').timestamp)
      send('evm_increaseTime',[3600],function(err,result){
        send('evm_mine',[],function(){
          console.log("new time: ", web3.eth.getBlock('latest').timestamp)
        })
      });
    })
  })
  it("BTCS Should throw and not be able to buy during crowdsale", function(){
    return ContributionDeployed.preBuy({from: BTCSUISSE, value: web3.toWei(1, 'ether')}).then(function(arg){
      console.log(arg);
      return GUPTokenDeployed.balanceOf(BTCSUISSE).then(function(instance){
        assert.equal(instance.toNumber(),0,"mis-match");
        console.log("BTCS Balance ", instance.toNumber())
      })
    }).catch(function(instance){
      return GUPTokenDeployed.balanceOf(BTCSUISSE).then(function(instance){
        assert.equal(instance.toNumber(),0,"mis-match");
        console.log("BTCS Balance ", instance.toNumber())
      })
    });;
  });
  it("buy should work and send GUP to account", function(done){
    web3.eth.sendTransaction({to: ContributionDeployed.address, from: web3.eth.accounts[4],value: web3.toWei(1, 'ether')},(err,result)=>{
      if (!err) {
        GUPTokenDeployed.balanceOf(web3.eth.accounts[4]).then(function(instance){
          assert.equal(instance.toNumber(), 120000,"mis-match");
          console.log("purchased GUP: ", instance.toNumber())

          done()
        })
      }
    });
  })
  it("no more than 60,000,000 GUP should be created", function(done){
    web3.eth.sendTransaction({to: ContributionDeployed.address, from: web3.eth.accounts[4],value: web3.toWei(675000, 'ether')},(err,result)=>{
      if (err) {
        GUPTokenDeployed.balanceOf(web3.eth.accounts[4]).then(function(instance){
          assert.equal(instance.toNumber(), 120000,"mis-match");
          console.log("purchased GUP: ", instance.toNumber())

          done()
        })
      }
    });
  })
  it("Tokens should not be transferrable", function(){
    return GUPTokenDeployed.transfer(accounts[5],50,{from:MATCHPOOL}).catch(function(){
      return GUPTokenDeployed.balanceOf(accounts[5]).then(function(instance){
        assert.equal(instance.toNumber(),0,"tokens transferred")
      })
    })
  })
  it("is not halted", function(){
    return ContributionDeployed.halted().then(function(instance){
      assert.equal(instance,false,"mis-match");
      console.log("halted: ", instance)
    });
  });
  it("test halting", function(){
    return ContributionDeployed.toggleHalt(true,{from: accounts[0]}).then(function(){
      return ContributionDeployed.halted().then(function(instance){
        assert.equal(instance,true,"mis-match");
        console.log("halted: ", instance)
      });
    });
  });
  it("buy should not work and should throw", function(){
    web3.eth.sendTransaction({to: ContributionDeployed.address, from: web3.eth.accounts[4],value: web3.toWei(1, 'ether')},(err,result)=>{
      if (!err) {
        assert.fail("")
      }
    });
  })
  afterEach("contract should never have any ether", function(done){
    assert.equal(web3.eth.getBalance(ContributionDeployed.address).toNumber(),0,"is not zero")
    console.log("Contract Balance is: ",web3.eth.getBalance(ContributionDeployed.address).toNumber())
    done()
  })
  
});
