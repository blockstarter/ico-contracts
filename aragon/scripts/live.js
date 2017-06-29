const trackedAddresses = ['0x209c4784AB1E8183Cf58cA33cb740efbF3FC18EF'].map(x => x.toLowerCase())   // addresses we are tracking pending tx to
const balanceAddress = '0x32be343b94f860124dc4fee278fdcbd38c102d88'.toLowerCase()      // address we are showing its consolidated balance
const ethPrice = 80

let txQueue = []                 // tx that are pdending that we are showing their pending value
let txValue = {}

let pendingValue = 0
let currentValue = 0

const printState = () => {
  console.log(`Mined balance: ${currentValue.toFixed(2)} ETH ($${(currentValue * ethPrice).toFixed(2)}) Pending balance: ${pendingValue.toFixed(2)} ETH ($${(pendingValue * ethPrice).toFixed(2)})`)
}

const newTransaction = (txId) => {
  web3.eth.getTransaction(txId, (err, tx) => {
    if (err || !tx) return
    if (!tx.to) return

    if (trackedAddresses.indexOf(tx.to) == -1) return
    if (txQueue.indexOf(txId) > -1) return

    txQueue.push(txId)

    const value = web3.fromWei(tx.value, 'ether').toNumber()
    pendingValue += value
    txValue[txId] = value

    printState()
  })
}

const newBlock = (blockHash) => {
  web3.eth.getBlock(blockHash, (err, block) => {
    if (err || !block) return
    block.transactions.forEach(tx => {
      if (txQueue.indexOf(tx) > -1) {
        txQueue.splice(txQueue.indexOf(tx), 1)
        pendingValue -= txValue[tx]
      }
    })
    web3.eth.getBalance(balanceAddress, (err, balance) => {
      if (err) return
      currentValue = web3.fromWei(balance, 'ether').toNumber()
      console.log('New block')

      printState()
    })
  })
}

module.exports = function (callback) {
  web3.eth.filter('pending').watch((err, txId) => {
    if (!err) newTransaction(txId)
  })

  web3.eth.filter('latest').watch((err, blockHash) => {
    if (!err) newBlock(blockHash)
  })
}
