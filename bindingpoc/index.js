// require non è una istruzione di javascript, ma di Node.js,
// è una funzione built-in (predefinita) con lo scopo di caricare moduli (dividere l'applicazione in file separati)

// dentro la variabile prover_module ci sarà una funzione
const prover_module = require("./prover");
// dentro la variabile committee_members_module ci sarà una funzione
const committee_members_module = require("./committee");
// dentro la variabile verifier_module ci sarà una funzione
const verifier_module = require("./verifier");

// non c'è bisogno della keyword "new", perché con quella keyword si crea un oggetto
// che viene restituito, ma tanto in questo caso non si fa riferimento a quell'oggetto.
// Per dettagli sul comportamento vedere il relativo modulo
committee_members_module();

// qua invece la keyword "new" serve, perché si fa riferimento all'oggetto riferito che 
// avrà solo una funzione
const verifier = new verifier_module();

// passati 1000 millisecondi, ovvero 1 secondo chiama main
setTimeout(main, 1000);

function main() {

    const prover = new prover_module();

    console.log("[MAIN]: dico al prover che il verifier si trova qua: " + JSON.stringify(verifier.getEndPoint()) + "\n");

    // si prende l'endpoint del verifier (ovvero la locazione del verifier) e si istanza la variabile 
    // VerEndPoint del prover, questa variabile viene utilizzata dal prover 
    // per mandare poi il certificato al verifier
    prover.setVerifierEndpoint(verifier);

    // notare come il prover richiede il certificato del fatto che lui controlla un certo endpoint
    // questa richiesta la manda da un endpoint e vuole proprio che sia quello l'endpoint da 
    // certificare
    prover.newBindingRequest_endPoint_turnOn();

}
