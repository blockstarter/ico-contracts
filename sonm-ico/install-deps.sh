#!/bin/bash

IC=contracts/installed
mkdir -p $IC/token


function github {
  echo $1 $3
  cd $4 ; curl -s https://raw.githubusercontent.com/$1/$2/$3 -O ; cd $OLDPWD
}


github ConsenSys/MultiSigWallet \
  e3240481928e9d2b57517bd192394172e31da487 \
  contracts/solidity/MultiSigWallet.sol \
  $IC


function zeppelin {
  github \
    OpenZeppelin/zeppelin-solidity \
    7592122e4df1b0632fcef48e8987c0bd90006437 \
    $1 $2
}

zeppelin contracts/SafeMath.sol $IC
zeppelin contracts/token/ERC20.sol $IC/token
zeppelin contracts/token/ERC20Basic.sol $IC/token
zeppelin contracts/token/BasicToken.sol $IC/token
zeppelin contracts/token/StandardToken.sol $IC/token
