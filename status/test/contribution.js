// Simulate a full contribution

const MultiSigWallet = artifacts.require("MultiSigWallet");
const MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
const SGT = artifacts.require("SGTMock");
const SNT = artifacts.require("SNTMock");
const StatusContributionMock = artifacts.require("StatusContributionMock");
const ContributionWallet = artifacts.require("ContributionWallet");
const DevTokensHolder = artifacts.require("DevTokensHolderMock");
const SGTExchangerMock = artifacts.require("SGTExchangerMock");
const DynamicCeiling = artifacts.require("DynamicCeiling");
const SNTPlaceHolderMock = artifacts.require("SNTPlaceHolderMock");

const setHiddenCurves = require("./helpers/hiddenCurves.js").setHiddenCurves;
const assertFail = require("./helpers/assertFail");

contract("StatusContribution", function(accounts) {
    const addressStatus = accounts[0];
    const addressCommunity = accounts[1];
    const addressReserve = accounts[2];
    const addressDevs = accounts[3];
    const addressSGTHolder = accounts[4];
    const addressGuaranteed0 = accounts[7];
    const addressGuaranteed1 = accounts[8];

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
    let lim;
    let cur;
    const divs = 30;

    const curves = [
        [web3.toWei(3), 30, 10**12],
        [web3.toWei(8), 30, 10**12],
        [web3.toWei(15), 30, 10**12],
    ];
    const startBlock = 1000000;
    const endBlock = 1040000;

    const maxSGTSupply = 5000 * 2;

    it("Deploys all contracts", async function() {
        multisigStatus = await MultiSigWallet.new([addressStatus], 1);
        multisigCommunity = await MultiSigWallet.new([addressCommunity], 1);
        multisigReserve = await MultiSigWallet.new([addressReserve], 1);
        multisigDevs = await MultiSigWallet.new([addressDevs], 1);

        miniMeTokenFactory = await MiniMeTokenFactory.new();

        sgt = await SGT.new(miniMeTokenFactory.address);
        await sgt.generateTokens(addressSGTHolder, 2500);
        await sgt.generateTokens(addressStatus, 2500);

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
        sgtExchanger = await SGTExchangerMock.new(sgt.address, snt.address, statusContribution.address);
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
    });

    it("Checks initial parameters", async function() {
        assert.equal(await snt.controller(), statusContribution.address);
    });

    it("Checks that nobody can buy before the sale starts", async function() {
        await assertFail(async function() {
            await snt.send(web3.toWei(1));
        });
    });

    it("Adds 2 guaranteed addresses ", async function() {
        await statusContribution.setGuaranteedAddress(addressGuaranteed0, web3.toWei(1));
        await statusContribution.setGuaranteedAddress(addressGuaranteed1, web3.toWei(2));

        const permited7 = await statusContribution.guaranteedBuyersLimit(addressGuaranteed0);
        const permited8 = await statusContribution.guaranteedBuyersLimit(addressGuaranteed1);

        assert.equal(web3.fromWei(permited7).toNumber(), 1);
        assert.equal(web3.fromWei(permited8).toNumber(), 2);
    });

    it("Reveals a curve, moves time to start of the ICO, and does the first buy", async function() {
        await dynamicCeiling.revealCurve(
            curves[0][0],
            curves[0][1],
            curves[0][2],
            false,
            web3.sha3("pwd0"));

        await statusContribution.setMockedBlockNumber(1000000);
        await sgt.setMockedBlockNumber(1000000);
        await snt.setMockedBlockNumber(1000000);

        lim = 3;
        cur = 0;

        await snt.sendTransaction({value: web3.toWei(1), gas: 300000, gasPrice: "20000000000", from: addressStatus});

        const b = Math.min(1, ((lim - cur) / divs));
        cur += b;

        const balance = await snt.balanceOf(addressStatus);

        assert.equal(web3.fromWei(balance).toNumber(), b * 10000);
    });
    it("Pauses and resumes the contribution ", async function() {
        await statusContribution.setMockedBlockNumber(1005000);
        await sgt.setMockedBlockNumber(1005000);
        await snt.setMockedBlockNumber(1005000);
        await statusContribution.pauseContribution();
        await assertFail(async function() {
            await snt.sendTransaction({value: web3.toWei(5), gas: 300000, gasPrice: "20000000000"});
        });
        await statusContribution.resumeContribution();
    });
    it("Returns the remaining of the last transaction ", async function() {
        const initialBalance = await web3.eth.getBalance(addressStatus);
        await snt.sendTransaction({value: web3.toWei(5), gas: 300000, gasPrice: "20000000000"});
        const finalBalance = await web3.eth.getBalance(addressStatus);

        const b = Math.min(5, ((lim - cur) / divs));
        cur += b;

        const spent = web3.fromWei(initialBalance.sub(finalBalance)).toNumber();
        assert.isAbove(spent, b);
        assert.isBelow(spent, b + 0.02);

        const totalCollected = await statusContribution.totalCollected();
        assert.equal(web3.fromWei(totalCollected), cur);

        const balanceContributionWallet = await web3.eth.getBalance(contributionWallet.address);
        assert.equal(web3.fromWei(balanceContributionWallet), cur);
    });

    it("Reveals second curve and checks that the limit is right", async function() {
        await dynamicCeiling.revealCurve(
            curves[1][0],
            curves[1][1],
            curves[1][2],
            false,
            web3.sha3("pwd1"));
        await dynamicCeiling.moveTo(1);

        await statusContribution.setMockedBlockNumber(1005200);
        await sgt.setMockedBlockNumber(1005200);
        await snt.setMockedBlockNumber(1005200);

        const initialBalance = await web3.eth.getBalance(addressStatus);
        await snt.sendTransaction({value: web3.toWei(10), gas: 300000, gasPrice: "20000000000"});
        const finalBalance = await web3.eth.getBalance(addressStatus);

        lim = 8;
        const b = Math.min(5, ((lim - cur) / divs));
        cur += b;

        const spent = web3.fromWei(initialBalance.sub(finalBalance)).toNumber();
        assert.isAbove(spent, b);
        assert.isBelow(spent, b + 0.02);

        const totalCollected = await statusContribution.totalCollected();
        assert.equal(web3.fromWei(totalCollected), cur);

        const balanceContributionWallet = await web3.eth.getBalance(contributionWallet.address);
        assert.equal(web3.fromWei(balanceContributionWallet), cur);
    });

    it("Reveals last curve and fills the collaboration", async function() {
        await dynamicCeiling.revealCurve(
            curves[2][0],
            curves[2][1],
            curves[2][2],
            true,
            web3.sha3("pwd2"));
        await dynamicCeiling.moveTo(2);

        let blk = 1025100;
        await statusContribution.setMockedBlockNumber(blk);
        await sgt.setMockedBlockNumber(blk);
        await snt.setMockedBlockNumber(blk);
        blk += 100;

        const initialBalance = await web3.eth.getBalance(addressStatus);
        await statusContribution.proxyPayment(
            addressCommunity,
            {value: web3.toWei(15), gas: 300000, from: addressStatus, gasPrice: "20000000000"});

        lim = 15;
        const b = Math.min(5, ((lim - cur) / divs));
        cur += b;

        const finalBalance = await web3.eth.getBalance(addressStatus);

        const balance1 = await snt.balanceOf(addressCommunity);

        assert.equal(web3.fromWei(balance1).toNumber(), b * 10000);

        const spent = web3.fromWei(initialBalance.sub(finalBalance)).toNumber();
        assert.isAbove(spent, b);
        assert.isBelow(spent, b + 0.02);

        const totalCollected = await statusContribution.totalCollected();
        assert.equal(web3.fromWei(totalCollected), cur);

        const balanceContributionWallet = await web3.eth.getBalance(contributionWallet.address);
        assert.equal(web3.fromWei(balanceContributionWallet), cur);

        while (cur < 14) {
            await statusContribution.setMockedBlockNumber(blk);
            blk += 101;

            await statusContribution.proxyPayment(
                addressCommunity,
                {value: web3.toWei(15), gas: 300000, from: addressStatus, gasPrice: "20000000000"});

            const b2 = Math.min(5, ((lim - cur) / divs));
            cur += b2;


            const balanceContributionWallet2 =
                await web3.eth.getBalance(contributionWallet.address);

            assert.isBelow(Math.abs(web3.fromWei(balanceContributionWallet2).toNumber() - cur), 0.0001);
        }
    });

    it("Doesn't allow transfers during contribution period", async function() {
        await assertFail(async function() {
            await snt.transfer(addressSGTHolder, web3.toWei(1000));
        });
    });

    it("Checks that Guaranteed addresses are able to buy", async function() {
        await snt.sendTransaction({value: web3.toWei(3), gas: 300000, from: addressGuaranteed0});
        await snt.sendTransaction({value: web3.toWei(3), gas: 300000, from: addressGuaranteed1});

        const balance7 = await snt.balanceOf(addressGuaranteed0);
        const balance8 = await snt.balanceOf(addressGuaranteed1);

        assert.equal(web3.fromWei(balance7).toNumber(), 10000);
        assert.equal(web3.fromWei(balance8).toNumber(), 20000);
    });

    it("Finalizes", async function() {
        await statusContribution.setMockedBlockNumber(endBlock + 1);
        await statusContribution.finalize();

        const totalSupply = await snt.totalSupply();

        assert.isBelow(web3.fromWei(totalSupply).toNumber() - (180000 / 0.46), 0.01);

        const balanceSGT = await snt.balanceOf(sgtExchanger.address);
        assert.equal(balanceSGT.toNumber(), totalSupply.mul(0.05).toNumber());

        const balanceDevs = await snt.balanceOf(devTokensHolder.address);
        assert.equal(balanceDevs.toNumber(), totalSupply.mul(0.20).toNumber());

        const balanceSecondary = await snt.balanceOf(multisigReserve.address);
        assert.equal(balanceSecondary.toNumber(), totalSupply.mul(0.29).toNumber());
    });

    it("Moves the Ether to the final multisig", async function() {
        await sgtExchanger.setMockedBlockNumber(endBlock + 5);
        await multisigStatus.submitTransaction(
            contributionWallet.address,
            0,
            contributionWallet.contract.withdraw.getData());

        const balance = await web3.eth.getBalance(multisigStatus.address);

        assert.isBelow(Math.abs(web3.fromWei(balance).toNumber() - (cur+3)), 0.00001);
    });

    it("Exchanges SGT by SNT", async function() {
        await sgtExchanger.collect({from: addressSGTHolder});

        const balance = await snt.balanceOf(addressSGTHolder);
        const totalSupply = await snt.totalSupply();

        assert.equal(totalSupply.mul(0.025).toNumber(), balance.toNumber());
    });

    it("Doesn't allow transfers in the 1 week period", async function() {
        await assertFail(async function() {
            await snt.transfer(addressSGTHolder, web3.toWei(1000));
        });
    });

    it("Allows transfers after 1 week period", async function() {
        const t = Math.floor(new Date().getTime() / 1000) + (86400 * 7) + 1000;
        await sntPlaceHolder.setMockedTime(t);

        await snt.transfer(accounts[5], web3.toWei(1000));

        const balance2 = await snt.balanceOf(accounts[5]);

        assert.equal(web3.fromWei(balance2).toNumber(), 1000);
    });

    it("Disallows devs from transfering before 6 months have past", async function() {
        const t = Math.floor(new Date().getTime() / 1000) + (86400 * 7) + 1000;
        await devTokensHolder.setMockedTime(t);

        // This function will fail in the multisig
        await multisigDevs.submitTransaction(
            devTokensHolder.address,
            0,
            devTokensHolder.contract.collectTokens.getData(),
            {from: addressDevs, gas: 1000000});

        const balance = await snt.balanceOf(multisigDevs.address);
        assert.equal(balance,0);
    });

    it("Allows devs to extract after 6 months", async function() {
        const t = (await statusContribution.finalizedTime()).toNumber() + (86400 * 360);
        await devTokensHolder.setMockedTime(t);

        const totalSupply = await snt.totalSupply();

        await multisigDevs.submitTransaction(
            devTokensHolder.address,
            0,
            devTokensHolder.contract.collectTokens.getData(),
            {from: addressDevs});

        const balance = await snt.balanceOf(multisigDevs.address);

        const calcTokens = web3.fromWei(totalSupply.mul(0.20).mul(0.5)).toNumber();
        const realTokens = web3.fromWei(balance).toNumber();

        assert.equal(realTokens, calcTokens);
    });

    it("Allows devs to extract everything after 24 months", async function() {
        const t = Math.floor(new Date().getTime() / 1000) + (86400 * 360 * 2);
        await devTokensHolder.setMockedTime(t);

        const totalSupply = await snt.totalSupply();

        await multisigDevs.submitTransaction(
            devTokensHolder.address,
            0,
            devTokensHolder.contract.collectTokens.getData(),
            {from: addressDevs});

        const balance = await snt.balanceOf(multisigDevs.address);

        const calcTokens = web3.fromWei(totalSupply.mul(0.20)).toNumber();
        const realTokens = web3.fromWei(balance).toNumber();

        assert.equal(calcTokens, realTokens);
    });

    it("Checks that SNT's Controller is upgradeable", async function() {
        await multisigCommunity.submitTransaction(
            sntPlaceHolder.address,
            0,
            sntPlaceHolder.contract.changeController.getData(accounts[6]),
            {from: addressCommunity});

        const controller = await snt.controller();

        assert.equal(controller, accounts[6]);
    });
});
