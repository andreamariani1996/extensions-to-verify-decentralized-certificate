const {publicToAddress} = require("ethereumjs-util");

const {randomHex, soliditySha3} = require("web3-utils");

const {toBuffer, privateToPublic} = require("ethereumjs-util");

const { probabilisticSelection } = require("./binding-Utils");
const dgram = require('dgram');


module.exports = function (web3) {

    const sk = randomHex(32);
    const pk = privateToPublic(toBuffer(sk));

    this.sendChallenge = async function (newbindingEvent, index) {
        //console.log("event-Binding");
        console.log("[G]: Debug")
        console.log(newbindingEvent);
        
        // value contiene un po' di cose, tra R mandata dal prover
        const value = newbindingEvent.returnValues

        // hash del blocco dove si trova la transazione del prover
        const bHash = newbindingEvent.blockHash

        if(probabilisticSelection(value.R.toString('hex'), bHash, pk.toString('hex'))) {

            // endpoint che il prover vuole gli sia certificato
            const endpoint = value.endpoint;

            //console.log(`pk = ${pk.toString('hex')} \t account = ${publicToAddress(pk).toString('hex')}`);
            const [ip, port] = endpoint.split(':');
            //console.log(`ip = ${ip}, port=${port}`)

            // sfida random generata dal membro del comitato
            const Q_c = randomHex(5);
            //console.log(Q_c);

            // hash della sfida del comitato con R
            const hash = soliditySha3(Q_c, value.R.toString('hex'));
            //console.log(hash);

            // firmo l'hash di prima con la mia chiave privata
            const signature = web3.eth.accounts.sign(hash, sk);
            //console.log(signature);

            // diciamo che metto insieme sfida e quello di prima
            const Pi_c = Q_c + '|' + JSON.stringify(signature);

            const socket = dgram.createSocket('udp4');

            //console.log('I send ' + Pi_c);
            socket.send(Pi_c, Number(port), ip, (r) => {
                //console.log('disconnect');
                console.log("[MEMBRO " + index + "]: sono stato scelto, mando una challenge al prover attraverso il suo endpoint:")
                console.log("porta: " + Number(port))
                console.log("indirizzo IP: " + ip)
                console.log("[MEMBRO " + index + "]: la mia chiave segreta è: " + sk);
                console.log("[MEMBRO " + index + "]: la mia chiave pubblica è: " + pk.toString('hex'));
                console.log("[MEMBRO " + index + "]: la sfida Q_c che ho generato è: " + Q_c);
                console.log("[MEMBRO " + index + "]: ho ricevuto questa R dal prover: " + value.R.toString('hex'));
                console.log("[MEMBRO " + index + "]: faccio l'hash tra Q_c e R: " + hash);
                console.log("[MEMBRO " + index + "]: firmo l'hash di prima con la mia chiave privata: " + JSON.stringify(signature));
                console.log("[MEMBRO " + index + "]: alla fine mando questo: " + Pi_c);
                console.log("[MEMBRO " + index + "]: invio da indirizzo IP: " + socket.address().address);
                console.log("[MEMBRO " + index + "]: invio da porta: " + socket.address().port + "\n");
                socket.close();
            });
        }

    }

}