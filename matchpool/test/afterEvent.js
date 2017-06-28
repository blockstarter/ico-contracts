var Contribution = artifacts.require("./Contribution.sol");
var GUPToken = artifacts.require("./GUPToken.sol");
var send = require("./util").send;
var guptokenadd;
var GUPTokenDeployed;
var ContributionDeployed;



contract('after event', function(accounts){
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
      send('evm_increaseTime',[4842000],function(err,result){
        send('evm_mine',[],function(){
          console.log("new time: ", web3.eth.getBlock('latest').timestamp)
        })
      });
    })
  })
  it("Tokens should now be transferrable", function(){
    return GUPTokenDeployed.transfer(accounts[5],50,{from:MATCHPOOL}).then(function(){
      return GUPTokenDeployed.balanceOf(accounts[5]).then(function(instance){
        assert.equal(instance.toNumber(),50,"tokens transferred")
        console.log("New recipient Balance: ", instance.toNumber())
      })
    })
  })
  it("buy shouldn throw and shouldn't create GUP", function(done){
    web3.eth.sendTransaction({to: ContributionDeployed.address, from: web3.eth.accounts[4],value: web3.toWei(1, 'ether')},(err,result)=>{
      if (err) {
        GUPTokenDeployed.balanceOf(web3.eth.accounts[4]).then(function(instance){
          console.log("purchased GUP: ", instance.toNumber())

          done()
        })
      }
    });
  })
});
