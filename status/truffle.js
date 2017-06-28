const HDWalletProvider = require('truffle-hdwallet-provider');

const mnemonic = process.env.TEST_MNEMONIC || 'status mnemonic status mnemonic status mnemonic status mnemonic status mnemonic status mnemonic';
const providerRopsten = new HDWalletProvider(mnemonic, 'https://ropsten.infura.io/', 0);
const providerKovan = new HDWalletProvider(mnemonic, 'https://kovan.infura.io', 0);

module.exports = {
    networks: {
        development: {
            network_id: 15,
            host: "localhost",
            port: 8545,
            gas: 4000000,
            gasPrice: 20e9,
        },
        development_migrate: {
            network_id: 15,
            host: "localhost",
            port: 8545,
            gas: 4000000,
            gasPrice: 20e9,
            from: "0xf93df8c288b9020e76583a6997362e89e0599e99",
        },
        mainnet: {
            network_id: 1,
            host: "localhost",
            port: 8545,
            gas: 4000000,
            gasPrice: 20e9,
            from: "0xf93df8c288b9020e76583a6997362e89e0599e99",
        },
        ropsten: {
            network_id: 3,
            provider: providerRopsten,
            gas: 4000000,
            gasPrice: 20e9,
        },
        kovan: {
            network_id: 42,
            provider: providerKovan,
            gas: 4000000,
            gasPrice: 20e9,
        },
    }
};
