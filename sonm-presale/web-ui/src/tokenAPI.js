
import Truffle              from 'truffle-contract';
import PresaleToken_json    from '../../build/contracts/PresaleToken';
import TokenManager_json    from '../../build/contracts/TokenManager';
import Const                from './constants';

const PresaleToken = Truffle(PresaleToken_json);
const TokenManager = Truffle(TokenManager_json);
const web3 = window.web3;


if(web3) {
  PresaleToken.setProvider(web3.currentProvider);
  TokenManager.setProvider(web3.currentProvider);
}

const fromWei = x => {
  const y = web3.fromWei(x, 'ether');
  if(y.toNumber) return y.toNumber();
  else return y;
}

const PHASE_NAME = ["Created", "Running", "Paused", "Migrating", "Migrated"];
let net;


// TODO:
//  - check if networkId changed

const API = {
  getBalance: address => new Promise((resolve, reject) =>
    web3.eth.getBalance(
      address,
      (err, res) => err
        ? reject({message: err, arg: address})
        : resolve(fromWei(res)))
  ),


  checkNetwork: () => new Promise((resolve, reject) =>
    web3.version.getNetwork((err,res) => {
      if(err)
        return reject({UNKNOWN_ERROR: true, more: err});
      net = res in Const ? res : "*";
      resolve({
        tokenAddress: Const[net].TOKEN_ADDRESS,
        networkName: Const[net].NETWORK_NAME
      });
    })
  ),


  getTokenInfo: tokenAddress => new Promise((resolve, reject) => {
    try {
      resolve(PresaleToken.at(tokenAddress));
    } catch(err) {
      reject({INVALID_TOKEN_ADDRESS: true});
    }
  })
    .then(token =>
      token.name.call()
        .then(name => name === Const[net].EXPECTED_TOKEN_NAME
            ? Promise.resolve(name)
            : Promise.reject({INVALID_TOKEN_NAME: true, arg: name}))
        .then(name => Promise.all(
          [ Promise.resolve(name)
          , token.PRICE.call()
          , API.getBalance(token.address)
          , token.symbol.call()
          , token.totalSupply.call()
          , token.currentPhase.call()
          , token.tokenManager.call()
          , token.crowdsaleManager.call()
          ]))
        .then(([name, price, balance, symbol, supply, phase, mgr1, mgr2]) =>
          Promise.resolve({
            name, price, balance, symbol,
            supply: fromWei(supply),
            currentPhase: phase.toNumber(),
            tokenManager: {address: mgr1},
            crowdsaleManager: {address: mgr2},
            address: tokenAddress,
          }))
        .then(info => TokenManager.at(info.tokenManager.address)
          .then(mgr => Promise.all(
            [ API.getBalance(mgr.address)
            , mgr.getOwners.call()
            , API.getManagerActions(mgr)
            ])
          .then(([balance, managers, pendingActions]) => {
            Object.assign(info.tokenManager, {balance, managers, pendingActions});
            return Promise.resolve(info);
          })))
      ),

  getTokenEvents: address => new Promise((resolve, reject) => {
    const t = TokenManager.at(address);
    const filter = t.allEvents({
      fromBlock: Const[net].DEPLOYMENT_BLOCK_NUMBER,
      toBlock: "latest"});
    filter.get((err, res) => err ? reject(err) : resolve(res));
  }),


  getManagerActions: m => new Promise((resolve, reject) => {
    const filter = m.allEvents({
      fromBlock: Const[net].DEPLOYMENT_BLOCK_NUMBER,
      toBlock: "latest"
    });

    filter.get((err, events) => {
      if(err) return reject(err);
      const txMap = {};
      events.forEach(e => {
        const txId = e.args._txId === undefined ? e.args.transactionId : e.args._txId;
        txMap[txId] || (txMap[txId] = {txId, confirmations: []});

        switch(e.event) {
          case "LogTokenSetPresalePhase": {
            txMap[txId].action = "setPresalePhase";
            txMap[txId].newPhase = e.args._phase;
            txMap[txId].name = `Switch to phase: ${PHASE_NAME[e.args._phase]}`;
            break;
          }
          case "LogTokenWithdrawEther": {
            txMap[txId].action = "withdrawEther";
            txMap[txId].name = "Withdraw Ether to multisig";
            break;
          }
          case "LogTokenSetCrowdsaleManager": {
            txMap[txId].action = "setCrowdsaleManager";
            txMap[txId].crowdsaleManager = e.args._address;
            txMap[txId].name = `Set crowdsale address to ${e.args._address}`;
            break;
          }
          case "Confirmation": {
            txMap[txId].confirmations.push(e.args.sender);
            break;
          }
          case "Execution": {
            txMap[txId].executed = true;
            break;
          }
          case "ExecutionFailure": {
            txMap[txId].failed = true;
            break;
          }
          default: break;
        }
      });

      resolve(Object.values(txMap).filter(tx => !tx.executed && !tx.failed));
    })
  }),

  buyTokens: (tokenAddress, value) => new Promise((resolve, reject) =>
    web3.eth.sendTransaction(
      { to: tokenAddress,
        value: web3.toWei(value, "ether"),
        gas: 500000,
      },
      (err, res) => err ? reject(err) : resolve(res)
    )),

  setPhase: (tokenAddr, phase, mgrAddr) => {
    const m = TokenManager.at(mgrAddr);
    return m.tokenSetPresalePhase(
      tokenAddr, phase,
      {gas: 500000, from: web3.eth.accounts[0]}
    );
  },

  withdrawEther: (tokenAddr, mgrAddr) => {
    const m = TokenManager.at(mgrAddr);
    return m.tokenWithdrawEther(
      tokenAddr,
      {gas: 500000, from: web3.eth.accounts[0]}
    );
  },

  confirmTransaction: (txId, mgrAddr) => {
    const m = TokenManager.at(mgrAddr);
    return m.confirmTransaction(
      txId,
      {gas: 500000, from: web3.eth.accounts[0]}
    );
  },


};

export default API;
