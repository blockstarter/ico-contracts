var AragonTokenSale = artifacts.require("AragonTokenSale");
var MultiSigWallet = artifacts.require("MultiSigWallet");
var moment = require('moment')
var async = require('async')

const contributors = [
  { address: '0x92b7fce758d6d1b52204663e5d8cd4bcd018649e', usd: 10000 },
  { address: '0x00e5cdd4b7b3a78a4277749957553371cb6b2310', usd: 40000 },
  { address: '0x003de03e1b5a4ce31fbcbd6e2a2b574af5ad46a4', usd: 40000 },
  { address: '0xd64A2d50f8858537188A24e0F50Df1681ab07ED7', usd: 10000 },
  { address: '0x53C72d570fB57DB8bfAd81F2eb6b4a3910f49976', usd: 10000 },
]

const ethPrice = 87.91
const jorgeAddress = '0x4838Eab6F43841E0D233Db4CeA47BD64F614f0c5'
const saleAddress = '0xdcab5d235131b02ab93f7e9bf3daed22d464be8a'
const multisigAddress = '0xcafE1A77e84698c83CA8931F54A755176eF75f2C'

const now = +new Date() / 1000
const month = 30 * 24 * 3600

const cliff = now + 3 * month
const vesting = now + 6 * month

const calculateANT = usd => 120 * usd / ethPrice
const formatDate = x => moment(1000 * x).format('MMMM Do YYYY, h:mm:ss a')

module.exports = function (callback) {
  const sale = AragonTokenSale.at(saleAddress)

  async.eachSeries(contributors, ({ address, usd }, cb) => {
    const antAmount = calculateANT(usd)
    const wantAmount = web3.toWei(antAmount)

    const tx = sale.allocatePresaleTokens.request(
      address,
      wantAmount,
      cliff,
      vesting
    )

    const data = tx.params[0].data

    console.log(`Assigning ${address} ${antAmount} ANT (${wantAmount} wANT). Cliff ${formatDate(cliff)} (${cliff}) Vesting ${formatDate(vesting)} (${vesting})\n${data}`)

    return MultiSigWallet
      .at(multisigAddress)
      .submitTransaction(saleAddress, 0, data, { gas: 3e5, from: jorgeAddress })
      .then(() => { console.log('tx submitted yay'); cb() })
      .catch(e => { console.log('stopping operation'); callback() })
  }, callback)
}
