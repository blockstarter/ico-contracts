#!/bin/sh

geth --datadir ./testchain --unlock 0 --password ./testpassword --rpc --rpccorsdomain '*' --rpcport 8646 --port 32323 --mine --minerthreads 1 --maxpeers 0 --ipcpath /Users/bok/Library/Ethereum/geth.ipc --targetgaslimit 994712388 console

