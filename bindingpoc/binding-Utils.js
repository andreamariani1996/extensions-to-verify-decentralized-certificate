const { isValidSignature, toBuffer, ecrecover } = require("ethereumjs-util");
const { soliditySha3, toDecimal } = require("web3-utils");

module.exports.N = 1000;
module.exports.k = 20;
module.exports.alpha = 3;

module.exports.probabilisticSelection = (R, bHash, committeePK) => {
    //console.log(`P1 : ${R}, bH: ${bHash}, pk: ${committeePK}`);
    const s = soliditySha3(bHash, R);
    const sc = toBuffer(soliditySha3(s, committeePK)).readUInt32BE();
    const comp = ((1 + this.alpha) * this.k * (2 ** 32)) / (2 * this.N);
    if (sc < comp) {
        return committeePK;
    }
}

module.exports.verifyCommitteeSignature = (Q_c, signature, requestHash, requestBlockHash) => {
    try {
        const expectedMessage = soliditySha3(Q_c, requestHash);
        //console.log(`expected Message: ${expectedMessage.toString('hex')}`);
        const { r, s, v } = signatureSplit(signature);
        if (isValidSignature(v, r, s)) {
            const ethMessage = toBufferEthereumMessage(expectedMessage)
            const committeePK = ecrecover(ethMessage, v, r, s).toString('hex');
            //console.log("Verify committee PK "+committeePK.toString('hex'));
            return this.probabilisticSelection(requestHash, requestBlockHash, committeePK);
        }
    } catch (e) {
        console.log(e)
        return undefined;
    }

}

function signatureSplit(signature) {
    return {
        r: toBuffer(signature.substr(0, 66)),
        s: toBuffer("0x" + signature.substr(66, 64)),
        v: toDecimal("0x" + signature.substr(130, 2))
    }
}

function toBufferEthereumMessage(message) {
    return toBuffer(soliditySha3("\x19Ethereum Signed Message:\n32", message));
}
