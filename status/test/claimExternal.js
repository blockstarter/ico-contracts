// Simulate a an external claim

const MultiSigWallet = artifacts.require("MultiSigWallet");
const MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
const SGT = artifacts.require("SGT");
const SNT = artifacts.require("SNT");
const StatusContributionMock = artifacts.require("StatusContributionMock");
const ContributionWallet = artifacts.require("ContributionWallet");
const DevTokensHolder = artifacts.require("DevTokensHolderMock");
const SGTExchanger = artifacts.require("SGTExchanger");
const DynamicCeiling = artifacts.require("DynamicCeiling");
const SNTPlaceHolderMock = artifacts.require("SNTPlaceHolderMock");
const ExternalToken = artifacts.require("ExternalToken");

const setHiddenCurves = require("./helpers/hiddenCurves.js").setHiddenCurves;
const assertFail = require("./helpers/assertFail");

contract("StatusContribution", function(accounts) {
    const addressStatus = accounts[0];
    const addressCommunity = accounts[1];
    const addressReserve = accounts[2];
    const addressDevs = accounts[3];
    const addressSGTHolder = accounts[4];

    let multisigStatus;
    let multisigCommunity;
    let multisigReserve;
    let multisigDevs;
    let miniMeTokenFactory;
    let sgt;
    let snt;
    let statusContribution;
    let contributionWallet;
    let devTokensHolder;
    let sgtExchanger;
    let dynamicCeiling;
    let sntPlaceHolder;
    let externalToken;

    const curves = [
        [web3.toWei(3), 30, 10**12],
        [web3.toWei(13), 30, 10**12],
        [web3.toWei(15), 30, 10**12],
    ];
    const startBlock = 1000000;
    const endBlock = 1003000;

    const maxSGTSupply = 5000 * 2;

    it("Deploys all contracts", async function() {
        multisigStatus = await MultiSigWallet.new([addressStatus], 1);
        multisigCommunity = await MultiSigWallet.new([addressCommunity], 1);
        multisigReserve = await MultiSigWallet.new([addressReserve], 1);
        multisigDevs = await MultiSigWallet.new([addressDevs], 1);

        miniMeTokenFactory = await MiniMeTokenFactory.new();

        sgt = await SGT.new(miniMeTokenFactory.address);
        await sgt.generateTokens(addressSGTHolder, 5000);

        snt = await SNT.new(miniMeTokenFactory.address);
        statusContribution = await StatusContributionMock.new();
        contributionWallet = await ContributionWallet.new(
            multisigStatus.address,
            endBlock,
            statusContribution.address);
        devTokensHolder = await DevTokensHolder.new(
            multisigDevs.address,
            statusContribution.address,
            snt.address);
        sgtExchanger = await SGTExchanger.new(sgt.address, snt.address, statusContribution.address);
        dynamicCeiling = await DynamicCeiling.new(addressStatus, statusContribution.address);

        await setHiddenCurves(dynamicCeiling, curves);

        sntPlaceHolder = await SNTPlaceHolderMock.new(
            multisigCommunity.address,
            snt.address,
            statusContribution.address,
            sgtExchanger.address);

        await snt.changeController(statusContribution.address);

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

        externalToken = await ExternalToken.new();
        await externalToken.generateTokens(addressStatus, 1000);
    });

    it("Sends to and recover tokens from the StatusContribution", async function() {
        await externalToken.transfer(statusContribution.address, 100);
        const balanceBefore = await externalToken.balanceOf(addressStatus);
        assert.equal(balanceBefore.toNumber(), 900);

        await statusContribution.claimTokens(externalToken.address);
        const afterBefore = await externalToken.balanceOf(addressStatus);
        assert.equal(afterBefore.toNumber(), 1000);
    });

    it("Recovers tokens sent to SNT", async function() {
        await externalToken.transfer(snt.address, 100);
        const balanceBefore = await externalToken.balanceOf(addressStatus);
        assert.equal(balanceBefore.toNumber(), 900);

        await statusContribution.claimTokens(externalToken.address);
        const afterBefore = await externalToken.balanceOf(addressStatus);
        assert.equal(afterBefore.toNumber(), 1000);
    });
});
