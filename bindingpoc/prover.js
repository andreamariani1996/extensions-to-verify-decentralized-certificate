const Web3 = require('web3');

const env = require("./environment.json");
const {toBuffer,bufferToInt} = require("ethereumjs-util");
const {k, verifyCommitteeSignature} = require("./binding-Utils");

const BindingRegistryContract = require("./Binding.json");

const dgram = require('dgram');

const { GetProof } = require('eth-proof');

const fs = require('fs');

// prova DID document a mano
var DIDdocument = {};

module.exports = function () {

    // due collegamenti con il nodo, uno mediante HTTP e uno mediante web socket
    const web3 = new Web3(new Web3.providers.HttpProvider(env.UrlProviderHTTP));
    const web3ws = new Web3(new Web3.providers.WebsocketProvider(env.UrlProviderWS));

    const accountAddress = env.User.address

    let endPoint;
    let socket;

    let BindingRegistry;

    let requestHash;
    let requestBlockHash;
    let certificateTxHash;

    let VerEndPoint;

    let G = new Map();
    let C = [];


    this.newBindingRequest_endPoint_turnOn =  function () {

        socket = dgram.createSocket('udp4');

        socket.bind(41234, 'localhost');

        socket.on('listening', () => {
            const address = socket.address(); //{"address":"127.0.0.1","family":"IPv4","port":41234}
            endPoint = `${address.address}:${address.port}`
            console.log("[PROVER]: metto in ascolto l'endpoint che voglio certificare su " + endPoint + " e mando la richiesta al contratto");
            newBindingRequest();
        });

        let i = 1;
        socket.on('message', (msg, rinfo) => {
            console.log("[ENDPOINT]: mi è arrivato " + i + " messaggio \n");
            i = i + 1;
            console.log(`user got: ${msg.toString()} from ${rinfo.address}:${rinfo.port}` + "\n");

            // qui sicuramente entra perché all'inizio la mappa è vuota
            if(G.size < k) {
                //console.log(`user got from ${rinfo.address}:${rinfo.port}`);

                // si splitta il messaggio ricevuto da un membro del comitato,
                // questo messaggio contiene sfida_inviata_dal_membro | {...}, 
                // dove {...} è stato ottenuto dal membro del comitato facendo
                // web3.eth.accounts.sign(hash(challenge_membro, R_inviata dal prover), chiave_privata_membro)
                const [Q_c, signatureObjectString] = msg.toString().split('|');

                // si prende la parte {...} e si parsa
                const signatureJSON = JSON.parse(signatureObjectString);
                // console.log("[A]: Debug")
                // console.log(JSON.stringify(signatureObjectString, null, 2))

                // così si trova l'address del membro del comitato
                const committeeAccount = web3.eth.accounts.recover(signatureJSON);

                // se nella lista C non c'è l'indirizzo del membro del comitato e se (requestHash = R inviata dal prover
                // signatureJSON.signature = r @ s @ ultimi_due_caratteri_di_v, requestBlockHash è l'hash del blocco che 
                // contiene la richiesta del prover di certificazione), verifyCommitteeSignature da true se il 
                // prover riesce a ricostruire ciò che ha generato il membro del comitato
                if(!C.includes(committeeAccount) && verifyCommitteeSignature(Q_c, signatureJSON.signature, requestHash, requestBlockHash)){

                    // inizio a riempire la mappa con firma membro del comitato e la sfida che lui ha mandato
                    G.set(signatureJSON.signature, Q_c);

                    // metto nella lista l'indirizzo dell'account che il prover deve pagare
                    C.push(committeeAccount);
                    if(G.size === k){
                        // se ho raggiunto il numero giusto di membri del comitato

                        console.log("[PROVER]: mi sono arrivati un numero sufficiente di messaggi, pago i membri del comitato")
                        //console.log(requestBlockHash);

                        // si pagano i membri del comitato con il metodo payCommitee del contratto
                        const pay = BindingRegistry.methods.payCommittee(toBuffer(requestBlockHash), toBuffer(requestHash),Array.from(G.values()),Array.from(G.keys()));
                        let gas = 41598.1 *k + 30162.4
                        pay.send({from: accountAddress,value:0 , gas: Math.trunc(gas*(1.5))})
                            .once('transactionHash', txhash => {
                                console.log("[PROVER]: sto facendo la transazione per pagare i membri del comitato che mi hanno rilasciato il certificato");
                                console.log("[PROVER]: hash della transazione: " + txhash);

                                // hash della transazione che rappresenta il pagamento dei membri del comitato
                                certificateTxHash = txhash;
                            }).then((receipt)=>{
                                console.log("[PROVER]: ho pagato i membri del comitato, eccola la ricevuta: \n" + JSON.stringify(receipt));
                                console.log("[PROVER]: l'effetto dell'invocazione del metodo payCommittee è anche quello di memorizzare il certificato nella blockchain")
                                console.log("[PROVER]: fatto, adesso devo mettere il certificato indipendente nel contratto EthereumDIDRegistry")
                                
                                updateDIDAndSendDID();
                        });
                    }
                }
            }


        });

    }


    function newBindingRequest() {

        const bindingPair = `${env.User.pK}, ${endPoint}`
        console.log("[PROVER]: richiedo un certificato per legare la mia chiave pubblica con l'endpoint")

        // prendo il riferimento al contratto deployato
        BindingRegistry = new web3ws.eth.Contract(BindingRegistryContract.abi, BindingRegistryContract.address);

        // voglio invocare il metodo newRequest del contratto passandogli quei due parametri
        const newReq =  BindingRegistry.methods.newRequest(endPoint, env.User.pK);

        // faccio la transazione e la invio
        newReq.estimateGas({from: accountAddress, value: 1000000000000000})
              .then((gas)=> {newReq.send({ from: accountAddress,
                                           gas: Math.trunc(gas*(1.5)), 
                                           value: 1000000000000000
                                         }) // la send è una promise, e la possiamo monitorare
                                   .once('transactionHash', txhash => {
                                            console.log("[PROVER]: ho inviato la transazione di richiesta del certificato");
                                            console.log("[PROVER]: la transazione è in attesa di essere minata");
                                            console.log("[PROVER]: hash della transazione: " + txhash);
                                            
                                        })
                                   .then((receipt) => { // se la promessa è stata mantenuta questa mi ha dato una ricevuta, in
                                                        // uin questa ricevuta ci sono anche gli eventi?
                                            
                                            console.log("[PROVER]: transazione minata, ho ricevuto questa ricevuta: \n" + JSON.stringify(receipt));

                                            // dalla ricevuta della transazione si vanno a vedere gli eventi e si prende R
                                            console.log("[PROVER]: ecco R dentro il contratto: " + receipt.events.NewRequest.returnValues.R + "\n");

                                            // si aggiornano due variabili di istanza
                                            requestHash = receipt.events.NewRequest.returnValues.R;
                                            requestBlockHash = receipt.events.NewRequest.blockHash;
                                        });
            });

    }

    this.setVerifierEndpoint = function (verifier) {
        VerEndPoint = verifier.getEndPoint();
    }

    async function updateDIDAndSendDID () {

        const getProof = new GetProof(env.UrlProviderHTTP);

        const { header, txProof, txIndex} = await getProof.transactionProof(certificateTxHash);
        const receiptAndMerkleProof = await getProof.receiptProof(certificateTxHash);

        DIDdocument = {
            service: [ { type: "certifiedUDPEndpoint",
                         serviceEndpoint: { endpoint: endPoint,
                                            proof: { tBlockNumber: bufferToInt(header.number),
                                            tAndMerkleProof: txProof.toHex(),
                                            receiptAndMerkleProof: receiptAndMerkleProof.receiptProof.toHex(),
                                            tIndex: txIndex
                                            }
                         }
                       }
            ]}

        console.log(JSON.stringify(DIDdocument))

        try {
            fs.writeFileSync('./cert/cert.txt', '"' + JSON.stringify(DIDdocument).replace(/"/g, "'") + '"');
            console.log("[PROVER]: salvato certificato in cert.json");
        } catch (error) {
            console.error(err);
        }
        
        socket.send(JSON.stringify(DIDdocument), Number(VerEndPoint.port), VerEndPoint.ip, (r) => {
            console.log("[PROVER]: mandato il DID document al verifier")
            socket.close();
        });

    }

}