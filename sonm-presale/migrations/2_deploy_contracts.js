const TokenManager = artifacts.require("./TokenManager.sol");
const PresaleToken = artifacts.require("./PresaleToken.sol");


module.exports = (deployer, network) => {

  let team;

  if (network === "development") {
    team =
      [ "0x980ee67ea21bc8b6c1aaaf9b57c9166052575213"
      , "0x587d96cb98d8e628af7af908f331990e5660df72"
      , "0x7f3307d6e3856ef6991157b5056f9de5e043c75c"
      ];
    // Private keys for these addresses
    // f099584c9fa50e8367b9dd9cb2a7c40cda9d8883b9571c1122cb43bdb7530013
    // 0dee03c50b135c5649f15b373f1b52b160d11954ede41c117999b446a3d146b0
    // 5efb179d282e88f724b160609ccb9a8127761ffbc1ebfcfa83c2344257ea2546


    // send some ether to the team
    team.forEach(addr => web3.eth.sendTransaction({
      from: web3.eth.accounts[9],
      to: addr,
      value: web3.toWei(20, 'ether')
    }));

  }
  else if (network === "ropsten") {
    team =
      [ "0xFB4083E4B305D1de4b6cd61AA29454f7AD1fE7b8" // Andrew
      , "0xC6dD8CAC3709A46Fcfb62F8e8639985864d339d8" // Krzysztof
      , "0x00b7151a4C21E5B09543c070a45Df19873A67A45" // Serguey
      ];

  }
  else if (network === "kovan") {
    team =
      [ "0x980ee67ea21bc8b6c1aaaf9b57c9166052575213"
      , "0x587d96cb98d8e628af7af908f331990e5660df72"
      , "0x7f3307d6e3856ef6991157b5056f9de5e043c75c"
      ];
  }
  else if (network === "mainnet") {
    team =
      [ "0xCc14D25Fae961Ced09709BE04bf13c28Db3FF81b" // Alexey
      , "0xf9AE3E50B994Fa6914757958D65Ad1B3547fBe82" // Sergey
      ];
  }
  const requiredConfirmations = 2;
  const escrow = "0x949341CF3BCA839D21Ee3f15eDCE57280d0133D5";

  deployer.deploy(TokenManager, team, requiredConfirmations)
    .then(TokenManager.deployed)
    .then(tokenMgr => deployer.deploy(PresaleToken, tokenMgr.address, escrow));
};
