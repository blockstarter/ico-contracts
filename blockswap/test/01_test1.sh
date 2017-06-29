#!/bin/bash
# ----------------------------------------------------------------------------------------------
# Testing the smart contract
#
# Enjoy. (c) BokkyPooBah / Bok Consulting Pty Ltd 2017. The MIT Licence.
# ----------------------------------------------------------------------------------------------

MODE=${1:-test}

GETHATTACHPOINT=`grep ^IPCFILE= settings.txt | sed "s/^.*=//"`
PASSWORD=`grep ^PASSWORD= settings.txt | sed "s/^.*=//"`
TOKENSOL=`grep ^TOKENSOL= settings.txt | sed "s/^.*=//"`
TOKENJS=`grep ^TOKENJS= settings.txt | sed "s/^.*=//"`
DEPLOYMENTDATA=`grep ^DEPLOYMENTDATA= settings.txt | sed "s/^.*=//"`

INCLUDEJS=`grep ^INCLUDEJS= settings.txt | sed "s/^.*=//"`
TEST1OUTPUT=`grep ^TEST1OUTPUT= settings.txt | sed "s/^.*=//"`
TEST1RESULTS=`grep ^TEST1RESULTS= settings.txt | sed "s/^.*=//"`

#if [ "$MODE" == "dev" ]; then
#else
#fi

printf "MODE            = '$MODE'\n"
printf "GETHATTACHPOINT = '$GETHATTACHPOINT'\n"
printf "PASSWORD        = '$PASSWORD'\n"
printf "TOKENSOL        = '$TOKENSOL'\n"
printf "TOKENJS         = '$TOKENJS'\n"
printf "DEPLOYMENTDATA  = '$DEPLOYMENTDATA'\n"
printf "INCLUDEJS       = '$INCLUDEJS'\n"
printf "TEST1OUTPUT     = '$TEST1OUTPUT'\n"
printf "TEST1RESULTS    = '$TEST1RESULTS'\n"

echo "var tokenOutput=`solc --optimize --combined-json abi,bin,interface $TOKENSOL`;" > $TOKENJS

geth --verbosity 3 attach $GETHATTACHPOINT << EOF | tee $TEST1OUTPUT
loadScript("$TOKENJS");
loadScript("functions.js");

var tokenAbi = JSON.parse(tokenOutput.contracts["$TOKENSOL:EncryptoTelToken"].abi);
var tokenBin = "0x" + tokenOutput.contracts["$TOKENSOL:EncryptoTelToken"].bin;

console.log("DATA: tokenABI=" + JSON.stringify(tokenAbi));

unlockAccounts("$PASSWORD");
printBalances();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var testMessage = "Test 1.1 Deploy Token Contract";
console.log("RESULT: " + testMessage);
var tokenContract = web3.eth.contract(tokenAbi);
console.log(JSON.stringify(tokenContract));
var tokenTx = null;
var tokenAddress = null;
var token = tokenContract.new({from: tokenOwnerAccount, data: tokenBin, gas: 4000000},
  function(e, contract) {
    if (!e) {
      if (!contract.address) {
        tokenTx = contract.transactionHash;
      } else {
        tokenAddress = contract.address;
        addAccount(tokenAddress, "TOKEN");
        addTokenContractAddressAndAbi(tokenAddress, tokenAbi);
        console.log("DATA: tokenAddress=" + tokenAddress);
        printTxData("tokenAddress=" + tokenAddress, tokenTx);
      }
    }
  }
);
while (txpool.status.pending > 0) {
}
printBalances();
failIfGasEqualsGasUsed(tokenTx, testMessage);
printTokenContractStaticDetails();
printTokenContractDynamicDetails();
console.log("RESULT: ");
console.log(JSON.stringify(token));


// -----------------------------------------------------------------------------
var testMessage = "Test 1.2 Attempt to send ethers to the token contract - expecting to fail";
console.log("RESULT: " + testMessage);
var tx1_2_1 = eth.sendTransaction({from: account2, to: tokenAddress, gas: 400000, value: web3.toWei("123.456789", "ether")});
while (txpool.status.pending > 0) {
}
printBalances();
passIfGasEqualsGasUsed(tx1_2_1, testMessage);
printTokenContractDynamicDetails();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var testMessage = "Test 1.3 Token owner transfer 10,000 tokens to account2 and account3";
console.log("RESULT: " + testMessage);
var tx1_3_1 = token.transfer(account2, "1000000000000", {from: tokenOwnerAccount, gas: 100000});
var tx1_3_2 = token.transfer(account3, "1000000000000", {from: tokenOwnerAccount, gas: 100000});
while (txpool.status.pending > 0) {
}
printBalances();
failIfGasEqualsGasUsed(tx1_3_1, testMessage + " - account2");
failIfGasEqualsGasUsed(tx1_3_2, testMessage + " - account3");
printTokenContractDynamicDetails();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var testMessage = "Test 1.4 Account2 transfers 50,000 tokens to account4 - expecting to fail without errors";
console.log("RESULT: " + testMessage);
var tx1_4_1 = token.transfer(account4, "5000000000000", {from: account2, gas: 100000});
while (txpool.status.pending > 0) {
}
printBalances();
failIfGasEqualsGasUsed(tx1_4_1, testMessage);
printTokenContractDynamicDetails();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var testMessage = "Test 1.5 Account2 approves transfer of 2,000 tokens to account3 and account3 transfers";
console.log("RESULT: " + testMessage);
var tx1_5_1 = token.approve(account3, "200000000000", {from: account2, gas: 100000});
while (txpool.status.pending > 0) {
}
var tx1_5_2 = token.transferFrom(account2, account3, "200000000000", {from: account3, gas: 100000});
while (txpool.status.pending > 0) {
}
printBalances();
failIfGasEqualsGasUsed(tx1_5_1, testMessage + " - account2 approves");
failIfGasEqualsGasUsed(tx1_5_2, testMessage + " - account3 transferFrom");
printTokenContractDynamicDetails();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var testMessage = "Test 1.6 Change Ownership";
console.log("RESULT: " + testMessage);
var tx1_6_1 = token.transferOwnership(minerAccount, {from: tokenOwnerAccount, gas: 100000});
while (txpool.status.pending > 0) {
}
var tx1_6_2 = token.acceptOwnership({from: minerAccount, gas: 100000});
while (txpool.status.pending > 0) {
}
printTxData("tx1_6_1", tx1_6_1);
printTxData("tx1_6_2", tx1_6_2);
printBalances();
failIfGasEqualsGasUsed(tx1_6_1, testMessage + " - Change owner");
failIfGasEqualsGasUsed(tx1_6_2, testMessage + " - Accept ownership");
printTokenContractDynamicDetails();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var testMessage = "Test 1.6 Account2 blockswaps to Waves account 3PBcRZBV38UBWQXmmnXNkVf7VZLBQgGZ9DM";
console.log("RESULT: " + testMessage);
var tx1_6_1 = token.moveToWaves("3PBcRZBV38UBWQXmmnXNkVf7VZLBQgGZ9DM", "200000000000", {from: account2, gas: 100000});
while (txpool.status.pending > 0) {
}
printBalances();
failIfGasEqualsGasUsed(tx1_6_1, testMessage);
printTokenContractDynamicDetails();
console.log("RESULT: ");

EOF
grep "DATA: " $TEST1OUTPUT | sed "s/DATA: //" > $DEPLOYMENTDATA
cat $DEPLOYMENTDATA
grep "RESULT: " $TEST1OUTPUT | sed "s/RESULT: //" > $TEST1RESULTS
cat $TEST1RESULTS
