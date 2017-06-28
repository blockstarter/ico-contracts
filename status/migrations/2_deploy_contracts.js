const randomBytes = require("random-bytes");

const MultiSigWallet = artifacts.require("MultiSigWallet");
const MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
const SGT = artifacts.require("SGT");
const SNT = artifacts.require("SNT");
const StatusContribution= artifacts.require("StatusContribution");
const ContributionWallet = artifacts.require("ContributionWallet");
const DevTokensHolder = artifacts.require("DevTokensHolder");
const SGTExchanger = artifacts.require("SGTExchanger");
const DynamicCeiling = artifacts.require("DynamicCeiling");
const SNTPlaceHolder = artifacts.require("SNTPlaceHolder");


// Set hidden curves
const setHiddenCurves = async function(dynamicCeiling, curves, nHiddenCurves) {
    let hashes = [];
    let i = 0;
    for (let c of curves) {
        let salt = await randomBytes(32);
        console.log(`Curve ${i} has salt: ${salt.toString("hex")}`);
        let h = await dynamicCeiling.calculateHash(c[0], c[1], c[2], i === curves.length - 1, salt);
        hashes.push(h);
        i += 1;
    }
    for (; i < nHiddenCurves; i += 1) {
        let salt = randomBytes(32);
        hashes.push(web3.sha3(salt));
    }
    await dynamicCeiling.setHiddenCurves(hashes);
    console.log(`${i} curves set!`);
};


// All of these constants need to be configured before deploy
const addressOwner = "0xf93df8c288b9020e76583a6997362e89e0599e99";
const addressesStatus = [
    "0x2ca9d4d0fd9622b08de76c1d484e69a6311db765",
];
const multisigStatusReqs = 1
const addressesCommunity = [
    "0x166ddbcfe4d5849b0c62063747966a13706a4af7",
];
const multisigCommunityReqs = 1
const addressesReserve = [
    "0x4781fee94e7257ffb6e3a3dcc5f8571ddcc02109",
];
const multisigReserveReqs = 1
const addressesDevs = [
    "0xcee9f54a23324867d8537589ba8dc6c8a6e9d0b9",
];
const multisigDevsReqs = 1
const addressSGT = "";

const startBlock = 3800000;
const endBlock = 3900000;

const maxSGTSupply = 500000000;

const curves = [
    [web3.toWei(1000), 30, 10**12],
    [web3.toWei(21000), 30, 10**12],
    [web3.toWei(61000), 30, 10**12],
];
const nHiddenCurves = 7;


module.exports = async function(deployer, network, accounts) {
    if (network === "development") return;  // Don't deploy on tests

    // MultiSigWallet send
    let multisigStatusFuture = MultiSigWallet.new(addressesStatus, multisigStatusReqs);
    let multisigCommunityFuture = MultiSigWallet.new(addressesCommunity, multisigCommunityReqs);
    let multisigReserveFuture = MultiSigWallet.new(addressesReserve, multisigReserveReqs);
    let multisigDevsFuture = MultiSigWallet.new(addressesDevs, multisigDevsReqs);
    // MiniMeTokenFactory send
    let miniMeTokenFactoryFuture = MiniMeTokenFactory.new();

    // MultiSigWallet wait
    let multisigStatus = await multisigStatusFuture;
    console.log("\nMultiSigWallet Status: " + multisigStatus.address);
    let multisigCommunity = await multisigCommunityFuture;
    console.log("MultiSigWallet Community: " + multisigCommunity.address);
    let multisigReserve = await multisigReserveFuture;
    console.log("MultiSigWallet Reserve: " + multisigReserve.address);
    let multisigDevs = await multisigDevsFuture;
    console.log("MultiSigWallet Devs: " + multisigDevs.address);
    // MiniMeTokenFactory wait
    let miniMeTokenFactory = await miniMeTokenFactoryFuture;
    console.log("MiniMeTokenFactory: " + miniMeTokenFactory.address);
    console.log();

    // SGT send
    let sgtFuture;
    if (addressSGT.length === 0) {  // Testnet
        sgtFuture = SGT.new(miniMeTokenFactory.address);
    } else {
        sgtFuture = SGT.at(addressSGT);
    }
    // SNT send
    let sntFuture = SNT.new(miniMeTokenFactory.address);
    // StatusContribution send
    let statusContributionFuture = StatusContribution.new();

    // SGT wait
    let sgt = await sgtFuture;
    console.log("SGT: " + sgt.address);
    // SNT wait
    let snt = await sntFuture;
    console.log("SNT: " + snt.address);
    // StatusContribution wait
    let statusContribution = await statusContributionFuture;
    console.log("StatusContribution: " + statusContribution.address);
    console.log();

    // SNT initialize checkpoints for 0th TX gas savings
    await snt.generateTokens('0x0', 1);
    await snt.destroyTokens('0x0', 1);

    // SNT changeController send
    let sntChangeControllerFuture = snt.changeController(statusContribution.address);
    // ContributionWallet send
    let contributionWalletFuture = ContributionWallet.new(
        multisigStatus.address,
        endBlock,
        statusContribution.address);
    // DevTokensHolder send
    let devTokensHolderFuture = DevTokensHolder.new(
        multisigDevs.address,
        statusContribution.address,
        snt.address);
    // SGTExchanger send
    let sgtExchangerFuture = SGTExchanger.new(sgt.address, snt.address, statusContribution.address);
    // DynamicCeiling send
    let dynamicCeilingFuture = DynamicCeiling.new(addressOwner, statusContribution.address);

    // SNT changeController wait
    await sntChangeControllerFuture;
    console.log("SNT changed controller!");
    // ContributionWallet wait
    let contributionWallet = await contributionWalletFuture;
    console.log("ContributionWallet: " + contributionWallet.address);
    // DevTokensHolder wait
    let devTokensHolder = await devTokensHolderFuture;
    console.log("DevTokensHolder: " + devTokensHolder.address);
    // SGTExchanger wait
    let sgtExchanger = await sgtExchangerFuture;
    console.log("SGTExchanger: " + sgtExchanger.address);
    // DynamicCeiling wait
    let dynamicCeiling = await dynamicCeilingFuture;
    console.log("DynamicCeiling: " + dynamicCeiling.address);
    console.log();

    // DynamicCeiling setHiddenCurves send
    let dynamicCeilingSetHiddenCurvesFuture = setHiddenCurves(dynamicCeiling, curves, nHiddenCurves);
    console.log();
    // SNTPlaceHolder send
    let sntPlaceHolderFuture = SNTPlaceHolder.new(
        multisigCommunity.address,
        snt.address,
        statusContribution.address,
        sgtExchanger.address);

    // DynamicCeiling setHiddenCurves wait
    await dynamicCeilingSetHiddenCurvesFuture;
    console.log("DynamicCeiling hidden curves set!");
    // SNTPlaceHolder wait
    let sntPlaceHolder = await sntPlaceHolderFuture;
    console.log("SNTPlaceHolder: " + sntPlaceHolder.address);
    console.log();

    // StatusContribution initialize send/wait
    await statusContribution.initialize(
        snt.address,
        sntPlaceHolder.address,

        startBlock,
        endBlock,

        dynamicCeiling.address,

        contributionWallet.address,

        multisigReserve.address,
        sgtExchanger.address,
        devTokensHolder.address,

        sgt.address,
        maxSGTSupply);
    console.log("StatusContribution initialized!");
};
