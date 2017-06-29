var AragonTokenSale = artifacts.require("AragonTokenSale");
var MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
var ANPlaceholder = artifacts.require("ANPlaceholder");
var ANT = artifacts.require("ANT");
var SaleWallet = artifacts.require("SaleWallet");


module.exports = function(deployer, network, accounts) {
  if (network.indexOf('dev') > -1) return // dont deploy on tests

  const aragonMs =    '0xcafE1A77e84698c83CA8931F54A755176eF75f2C'
  const communityMs = '0xbEEFbEeF03c7E5a1C29E0Aa675f8E16AEe0A5FAd'

  const initialBlock = 3723000
  const finalBlock =   3881000

  deployer.deploy(MiniMeTokenFactory);
  deployer.deploy(AragonTokenSale, initialBlock, finalBlock, aragonMs, communityMs, 100, 66, 2, '0x663fae46b5b6ef5cc01783af56194e693b71fe529ac917716e460f18f86742b6')
    .then(() => {
      return MiniMeTokenFactory.deployed()
        .then(f => {
          factory = f
          return AragonTokenSale.deployed()
        })
        .then(s => {
          sale = s
          return ANT.new(factory.address)
        }).then(a => {
          ant = a
          console.log('ANT:', ant.address)
          return ant.changeController(sale.address)
        })
        .then(() => {
          return ant.setCanCreateGrants(sale.address, true)
        })
        .then(() => {
          return ant.changeVestingWhitelister(aragonMs)
        })
        .then(() => {
          return ANPlaceholder.new(sale.address, ant.address)
        })
        .then(n => {
          networkPlaceholder = n
          console.log('Placeholder:', networkPlaceholder.address)
          return SaleWallet.new(aragonMs, finalBlock, sale.address)
        })
        .then(wallet => {
          console.log('Wallet:', wallet.address)
          if (aragonMs != accounts[0]) {
            console.log(sale.setANT.request(ant.address, networkPlaceholder.address, wallet.address))
          } else {
            console.log('Test mode, setting ANT')
            return sale.setANT(ant.address, networkPlaceholder.address, wallet.address)
          }
        })
        .then(() => {
          if (aragonMs != accounts[0]) return
          sale.activateSale()
        })
    })
};
