// come al solito si importa ciò che serve

// si importa la libreria web3.js
const Web3 = require("web3");

// si importano le informazioni relative all'utente e al nodo infuria della 
// rete ropsten che si sta contattando, le informazioni dell'utente non servono
const env = require("./environment.json");

// si prende un riferimento alla funzione che trasforma i byte in esadecimali
const {bytesToHex} = require("web3-utils");

// si prendono le informazioni del contratto già deployato, in particolare serviranno
// interfaccia e indirizzo (di dove è stato caricato)
const BindingRegistryContract = require("./Binding.json");

// si prendono: (i) la funzione che permette di controllare la firma di  un membro del comitato;
// (ii) il numero di membri del comitato
const { verifyCommitteeSignature, k} = require("./binding-Utils");

// decodificatore per Application Binary Interface (ABI), serve per convertire
const abiDecoder = require('abi-decoder');

// "toChecksumAddress" restituisce un indirizzo checksummed e 
// "toBuffer" è una funzione trasforma un valore in un buffer
const {toChecksumAddress, toBuffer} = require("ethereumjs-util");

const dgram = require('dgram');

const { VerifyProof } = require('eth-proof');
const { Proof } = require('eth-object');

module.exports = function () {

    // endpoint del verifier, dove si trova il verifier
    let endPoint;

    // collegamento al nodo della rete ropsten
    const web3 = new Web3(new Web3.providers.HttpProvider(env.UrlProviderHTTPS));

    // creazione socket
    const socket = dgram.createSocket('udp4');
    socket.bind(41235, 'localhost');

    // socket in ascolto
    socket.on('listening', () => {
        const address = socket.address(); //{"address":"127.0.0.1","family":"IPv4","port":41235}
        endPoint = {ip: address.address, port: address.port};
        console.log("[VERIFIER]: sono in ascolto su: " + JSON.stringify(endPoint) + "\n");
    });

    socket.on('message', (msg, rinfo) => {
        const DID_document = JSON.parse(msg.toString());
        console.log("[VERIFIER]: mi è arrivato il seguente messaggio:")
        console.log(msg.toString());
        console.log("[VERIFIER]: lo verifico")
        // console.log(JSON.stringify(DID_document))
        verifyDID(DID_document);
        console.log("[VERIFIER]: ho terminato la verifica")
        socket.close()

    });

    this.getEndPoint = function () {
        return endPoint;
    }

    async function verifyDID (DIDdocument) {
        console.log("[VERIFIER]: sto iniziando la procedura di verifica")
        /* il DIDdocument ha questa struttura campi: 
           - @context: "stringa";
           - id: "stringa";
           - publicKey: [{ id: "stringa",
                           type: "stringa",
                           controller: "stringa",
                           ethereumAddress: "stringa"
                         }] (è una lista di oggetti JSON con quei campi);
           - authentication: [{ id: "stringa",
                                publicKey: "stringa"
                               }] (è una lista di oggetti JSON con quei campi);
           - service: [{ type: "stringa",
                         serviceEndpoint: { endpoint: "stringa",
                                            proof: { tBlockNumber: "stringa",
                                                     tAndMerkleProof: "stringa di byte",
                                                     receiptAndMerkleProof: "stringa di byte",
                                                     tIndex: "stringa"
                                                   }
                                          }
                       }] (è una lista di oggetti JSON con quei campi);
        */
        // il campo service è una lista di oggetti JSON,
        // per ogni elemento di quella lista
        for (const s of DIDdocument.service) {
            // se il campo type è "certifiedUDPEndpoint"
            if (s.type === 'certifiedUDPEndpoint') {
                // si prende l'oggetto JSON del campo serviceEndpoint, che ha due campi: endpoint e proof
                const bindingService = s.serviceEndpoint;

                // si prende il JSON proof
                const proof = bindingService.proof;
                // si prendono tutti i campi del JSON proof, due sono stringhe di byte quindi vanno convertite
                const blockNumber = proof.tBlockNumber;
                const tAndMerkleProof = Proof.fromHex(proof.tAndMerkleProof);
                const receiptAndMerkleProof = Proof.fromHex(proof.receiptAndMerkleProof);
                const tIndex = proof.tIndex;

                const receipt = await VerifyProof.getReceiptFromReceiptProofAt(receiptAndMerkleProof, tIndex);

                if (bytesToHex(receipt.postTransactionState) !== "0x01") throw new Error('[VERIFIER]: Transaction rejected');

                const block = await web3.eth.getBlock(blockNumber); //It can be only the header.
                if (!block) throw new Error('[VERIFIER]: BlockHeader not in chain');

                const receiptRootHeader = block.receiptsRoot;
                const receiptRootProof = VerifyProof.getRootFromProof(receiptAndMerkleProof);


                if (!receiptRootProof.equals(toBuffer(receiptRootHeader))) throw new Error('[VERIFIER]: Receipt proof mismatch');

                const txRootHeader = block.transactionsRoot;
                const txRootProof = VerifyProof.getRootFromProof(tAndMerkleProof);


                if (!txRootProof.equals(toBuffer(txRootHeader))) throw new Error('[VERIFIER]: Tx proof mismatch');

                const certificateTx = await VerifyProof.getTxFromTxProofAt(tAndMerkleProof, tIndex);

                if (toChecksumAddress("0x"+certificateTx.to.toString('hex')) !== BindingRegistryContract.address) throw new Error('[VERIFIER]: TX Error');
                abiDecoder.addABI(BindingRegistryContract.abi);

                const decodedInput = abiDecoder.decodeMethod("0x"+certificateTx.data.toString('hex'));

                if (decodedInput.name !== "payCommittee") throw new Error('[VERIFIER]: Wrong method Error');

                const blockHash = decodedInput.params[0].value;
                const R = decodedInput.params[1].value;
                const Q_c_Array = decodedInput.params[2].value;
                const Signature_Array = decodedInput.params[3].value;

                try {
                    const C = [];
                    if (Q_c_Array.length < k) throw new Error('[VERIFIER]: Partial Challenges size error');

                    for (let i = 0; i < k; i++) {
                        const pk = verifyCommitteeSignature(Q_c_Array[i], Signature_Array[i], R, blockHash);
                        if (C.includes(pk)) throw new Error('[VERIFIER]: Partial Challenge signature Error');
                        C.includes(pk);
                    }
                    console.log('[VERIFIER]: Valid Certificate');
                    return true;
                } catch (e) {
                    console.log(e);
                    console.log('[VERIFIER]: No Valid Certificate');
                    return false;
                }

            }
        }

    }
}