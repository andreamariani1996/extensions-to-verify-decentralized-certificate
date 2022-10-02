// come al solito si importa ciò che serve
const Web3 = require("web3");

// si importano le informazioni relative al nodo e all'utente, 
// in questo caso le informazioni dell'utente non servono
const env = require("./environment.json");

// si prende N che rappresenta il numero dei potenziali membri del comitato
const { N } = require("./binding-Utils");

// come è fatto un membro del comitato
const cm = require("./member");

// informazioni relative al contratto, interfaccia e indirizzo di dove si trova
// nella blockchain
const BindingRegistryContract = require("./Binding.json");
// const BindingRegistryContract_2 = require("./Binding_3.json");


// const assert = require("chai").assert;
// const truffleAssert = require('truffle-assertions');

module.exports = function () {

    console.log("[COMITATO]: metto insieme " + N + " potenziali membri\n");
    let committeePool = [];

    const web3 = new Web3(new Web3.providers.HttpProvider(env.UrlProviderHTTP));
    const web3ws = new Web3(new Web3.providers.WebsocketProvider(env.UrlProviderWS));

    // si creano 1000 potenziali membri del comitato, ognuno ha una funzione "sendChallenge"
    for (let i = 0; i < N; i++) {
        committeePool.push(new cm(web3));
    }

    // // const networkId = web3.eth.net.getId();
    // const deployedNetwork = BindingRegistryContract_2.networks["5777"];
    // // const BindingReg = new web3.eth.Contract(BindingRegistryContract.abi, deployedNetwork && deployedNetwork.address);

    

    // si prende un riferimento al contratto deployato
    const BindingReg = new web3ws.eth.Contract(BindingRegistryContract.abi, BindingRegistryContract.address);

    // truffleAssert.eventEmitted(app, 'NewRequest', (ev) => {
    //     console.log("Hello")
    //  });

    
    // ci si mette in ascolto degli eventi mandati dal contratto
    BindingReg.events
              .NewRequest()
              .on('data', newEvent);

    function newEvent (bindingEvent) {
    console.log("[COMITATO]: il contratto ha mandato questo evento:")
    console.log(bindingEvent)
    console.log("[COMITATO]: ogni potenziale membro del comitato controlla se fa parte del comitato \n");
    setTimeout(function() {
                committeePool.forEach(function(member, index) {
                                    member.sendChallenge(bindingEvent, index)
                                });
                web3ws.currentProvider.disconnect();
            }, 1500);
}

}