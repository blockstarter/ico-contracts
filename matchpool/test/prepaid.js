var Contribution = artifacts.require("./Contribution.sol");
var GUPToken = artifacts.require("./GUPToken.sol");
var send = require("./util").send;
var guptokenadd;
var GUPTokenDeployed;
var ContributionDeployed;




contract('Pre-period', function(accounts){
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
  })
  it("should have a start time", function(){
    return ContributionDeployed.publicStartTime().then(function(instance){
      assert.notEqual(instance,0,"starttime equals zero");
      console.log("public Start Time", instance.toString());
    });
  });
  it("should have a private start time", function(){
    return ContributionDeployed.privateStartTime().then(function(instance){
      assert.notEqual(instance,0,"starttime equals zero");
      console.log("private Start Time", instance.toString());
    });
  });

  //TO BE REWRITTEN START
  it("Should have an end time", function(){
    return Contribution.deployed().then(function(instance){
      return instance.publicEndTime().then(function(instance){
        assert.notEqual(instance,0,"end time equals zero");
        console.log("Public End Time", instance.toString())
      });
    });
  });
  it("Should have a BTCSuisse Account", function(){
    return Contribution.deployed().then(function(instance){
      return instance.BTCSuisse().then(function(instance){
        assert.equal(instance,BTCSUISSE,"mis-match");
        console.log("BTC Account: ", instance.toString())
      });
    });
  });
  it("Should have a Matchpool account", function(){
    return Contribution.deployed().then(function(instance){
      return instance.matchpool().then(function(instance){
        assert.equal(instance,MATCHPOOL,"mis-match");
        console.log("matchpool account: ", instance.toString())
      });
    });
  });
  it("Should have a multisig account", function(){
    return Contribution.deployed().then(function(instance){
      return instance.matchpool().then(function(instance){
        assert.equal(instance,MATCHPOOL,"mis-match");
        console.log("multisig account: ", instance.toString())
      });
    });
  });
  //END

  it("buy should not work and should throw", function(){
    web3.eth.sendTransaction({to: ContributionDeployed.address, from: web3.eth.accounts[4],value: web3.toWei(1, 'ether')},(err,result)=>{
      if (!err) {
        assert.fail("")
      }
    });
  })

  it("BTCS Should be able to buy early", function(){
    ContributionDeployed.preBuy({from: BTCSUISSE, value: web3.toWei(100, 'ether')}).then(function(){
      return GUPTokenDeployed.balanceOf(BTCSUISSE).then(function(instance){
        assert.equal(instance.toNumber(),12000000,"mis-match");
        console.log("BTCS Balance ", instance.toNumber())
      });
    });
  });
  it("BTCS Should not be able to buy more than 125000 ETH worth", function(){
    ContributionDeployed.preBuy({from: BTCSUISSE, value: web3.toWei(125000, 'ether')}).catch(function(){
      return GUPTokenDeployed.balanceOf(BTCSUISSE).then(function(instance){
        assert.equal(instance.toNumber(),12000000,"mis-match");
        console.log("BTCS Balance ", instance.toNumber())
      });
    });
  });
  it("Other accounts should not be able to buy early", function(){
    return ContributionDeployed.preBuy({from: accounts[4], value: web3.toWei(1, 'ether')}).catch(function(){
      return GUPTokenDeployed.balanceOf(accounts[4]).then(function(instance){
        assert.equal(instance.toNumber(),0,"mis-match");
        console.log("account 4 Balance ", instance.toNumber())
      });
    });
  });
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
  it("prebuy function fails when halted", function(){
    return ContributionDeployed.preBuy({from: accounts[0],value: web3.toWei(1, 'ether')}).catch(function(){
      console.log("function failed");
    })
  })
  //needs to be timeshifted
  it("buy should not work and should throw", function(){
    web3.eth.sendTransaction({to: ContributionDeployed.address, from: web3.eth.accounts[4],value: web3.toWei(1, 'ether')},(err,result)=>{
      if (!err) {
        assert(false)
      }
    });
  })
  it("test unhalting", function(){
    return ContributionDeployed.toggleHalt(false,{from: accounts[0]}).then(function(){
      return ContributionDeployed.halted().then(function(instance){
        assert.equal(instance,false,"mis-match");
        console.log("halted: ", instance)
      });
    });
  });
  it("cannot be halted by non-owner", function(){
    return ContributionDeployed.toggleHalt(true,{from: accounts[1]}).catch(function(){
      return ContributionDeployed.halted().then(function(instance){
        assert.equal(instance,false,"mis-match");
        console.log("halted: ", instance)
      });
    });
  });
  it("Tokens should not be transferrable", function(){
    return GUPTokenDeployed.transfer(accounts[5],50,{from:MATCHPOOL}).catch(function(){
      return GUPTokenDeployed.balanceOf(accounts[5]).then(function(instance){
        assert.equal(instance.toNumber(),0,"tokens transferred")
      })
    })
  })

  afterEach("contract should never have any ether", function(done){
    assert.equal(web3.eth.getBalance(ContributionDeployed.address).toNumber(),0,"is not zero")
    console.log("Contract Balance is: ",web3.eth.getBalance(ContributionDeployed.address).toNumber())
    //window.setTimeout(function(){
    done()
    //},1000);
    
  })


});
