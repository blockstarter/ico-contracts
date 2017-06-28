

export default {
  "*": {
    NETWORK_NAME: "testrpc",
    TOKEN_ADDRESS: "0x2e3f1ea34938c3262578dff85d5061d3eb651b4a",
    // check if this is our token
    EXPECTED_TOKEN_NAME: "SONM Presale Token",
    // Block number when token was deployed (this is used to filter events).
    DEPLOYMENT_BLOCK_NUMBER: 1
  },

  1: {
    NETWORK_NAME: "Main",
    TOKEN_ADDRESS: "0xc8e3aA7718CF72f927B845D834be0b93C66b34E1",
    EXPECTED_TOKEN_NAME: "SONM Presale Token",
    DEPLOYMENT_BLOCK_NUMBER: 3522705
  },

  3: {
    NETWORK_NAME: "Ropsten",
    TOKEN_ADDRESS: "0x5e27967f8fb05ec1a76ed1ecb0b57cced6f2cba8",
    EXPECTED_TOKEN_NAME: "SONM Presale Token",
    DEPLOYMENT_BLOCK_NUMBER: 589666
  },

  42: {
    NETWORK_NAME: "Kovan",
    TOKEN_ADDRESS: "0x3000162dccb71e830cb1c2c6ed116b12aa4d9355",
    EXPECTED_TOKEN_NAME: "SONM Presale Token",
    DEPLOYMENT_BLOCK_NUMBER: 158597
  },
}
