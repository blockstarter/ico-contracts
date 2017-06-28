exports.setHiddenCurves = async function(dynamicCeiling, curves) {
    const hashes = [];
    let i = 0;
    for (let c of curves) {
        const h = await dynamicCeiling.calculateHash(
            c[0],
            c[1],
            c[2],
            i === curves.length - 1,
            web3.sha3(`pwd${ i }`));
        hashes.push(h);
        i += 1;
    }
    for (; i < 10; i += 1) {
        hashes.push(web3.sha3(`pwd${ i }`));
    }
    await dynamicCeiling.setHiddenCurves(hashes);
};
