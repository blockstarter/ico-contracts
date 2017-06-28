const ICO = artifacts.require("./ICO.sol");
const MSig = artifacts.require("./installed/MultiSigWallet.sol");


module.exports = (deployer, network) => {
  const team =  [ "0xCc14D25Fae961Ced09709BE04bf13c28Db3FF81b" , "0xf9AE3E50B994Fa6914757958D65Ad1B3547fBe82" ];
  const requiredConfirmations = team.length;
  const preICO = "0xc8e3aA7718CF72f927B845D834be0b93C66b34E1";
  const robot =   "0xffa40c76E54b528A3C0538116c387f4131923388";

  deployer.deploy(MSig, team, requiredConfirmations)
    .then(MSig.deployed)
    .then(msig => deployer.deploy(ICO, msig.address, preICO, robot));
};
