// GENERAL PARAMS

const sourceAccount = "0x1dba1131000664b884a1ba238464159892252d3a";
const tokenAddress = '0xd248b0d48e44aaf9c49aea0312be7e13a6dc1468';

const Web3 = require("web3");
const fs = require("fs");
const async = require("async");
const path = require("path");
// create an instance of web3 using the HTTP provider.
// NOTE in mist web3 is already available, so check first if its available before instantiating
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const BigNumber = require("bignumber.js");

const eth = web3.eth;

var tokenAbi =[{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_amount","type":"uint256"}],"name":"approve","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"creationBlock","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_amount","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_newController","type":"address"}],"name":"changeController","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_blockNumber","type":"uint256"}],"name":"balanceOfAt","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"version","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_cloneTokenName","type":"string"},{"name":"_cloneDecimalUnits","type":"uint8"},{"name":"_cloneTokenSymbol","type":"string"},{"name":"_snapshotBlock","type":"uint256"},{"name":"_transfersEnabled","type":"bool"}],"name":"createCloneToken","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"parentToken","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_owner","type":"address"},{"name":"_amount","type":"uint256"}],"name":"generateTokens","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_blockNumber","type":"uint256"}],"name":"totalSupplyAt","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"data","type":"uint256[]"}],"name":"multiMint","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_amount","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"transfersEnabled","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"parentSnapShotBlock","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_amount","type":"uint256"},{"name":"_extraData","type":"bytes"}],"name":"approveAndCall","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_owner","type":"address"},{"name":"_amount","type":"uint256"}],"name":"destroyTokens","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"tokenFactory","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_transfersEnabled","type":"bool"}],"name":"enableTransfers","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"controller","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"inputs":[{"name":"_tokenFactory","type":"address"}],"payable":false,"type":"constructor"},{"payable":true,"type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_from","type":"address"},{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_amount","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_cloneToken","type":"address"},{"indexed":false,"name":"_snapshotBlock","type":"uint256"}],"name":"NewCloneToken","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_owner","type":"address"},{"indexed":true,"name":"_spender","type":"address"},{"indexed":false,"name":"_amount","type":"uint256"}],"name":"Approval","type":"event"}];
var token = web3.eth.contract(tokenAbi).at(tokenAddress);

const multiple = 50;
const D160 = new BigNumber("10000000000000000000000000000000000000000", 16);

const loadCsv = (cb) => {
    const repeated = {};
    const balances = [];
    fs.readFile(path.join(__dirname, "initialBalance.csv"), "utf8", (err, res) => {
        if (err) {
            cb(err);
            return;
        }
        const lines = res.split("\n");
        for (let i = 0; i < lines.length; i += 1) {
            const line = lines[ i ].split(",");
            if (line.length === 2) {
                const addr = line[ 0 ].toLowerCase();
                if (!web3.isAddress(addr)) {
                    console.log("Invalid address: ", addr);
                    cb(new Error(`Invalid address ${ addr }`));
                    return;
                }
                if (repeated[ addr ]) {
                    console.log("Address is repeated: ", addr);
                    cb(new Error(`Address is repeated: ${ addr }`));
                    return;
                }
                repeated[ addr ] = true;
                const amount = new BigNumber(line[ 1 ]);
                if (amount.isZero()) {
                    console.log("Address with zero balance: ", addr);
                    cb(new Error(`Address with zero balance ${ addr }`));
                    return;
                }
                balances.push({
                    address: line[ 0 ],
                    amount: amount.toString(10),
                });
            }
        }

        cb(null, balances);
    });
};

const multiSend = (balances, cb) => {
    let i;
    const packetbalances = [];
    for (i = 0; i < balances.length; i += 1) {
        packetbalances.push(pack(balances[ i ].address, balances[ i ].amount));
    }

    let pos = 0;
    async.whilst(
        () => pos < packetbalances.length,
        (cb1) => {
            const sendBalances = packetbalances.slice(pos, pos + multiple);
            console.log("Transaction: " + pos + " Length: " + sendBalances.length);
            pos += multiple;

            token.multiMint(
                sendBalances,
                { from: sourceAccount, gas: 3700000, gasPrice: eth.gasPrice.mul(1.1).floor() },
                (err, txHash) => {
                    if (err) return cb(err);
                    console.log("txHash: ", txHash);
                    cb1();
                });
        },
        cb);

    function pack(address, amount) {
        const addressNum = new BigNumber(address.substring(2), 16);
        const amountWei = new BigNumber(amount);
        const v = D160.mul(amountWei).add(addressNum);
        return v.toString(10);
    }
};

loadCsv((err, balances) => {
    if (err) {
        console.log(err);
    } else {
        multiSend(balances, (err2) => {
            if (err2) {
                console.log(err2);
            } else {
                console.log("terminated succefully");
            }
        });
    }
});
