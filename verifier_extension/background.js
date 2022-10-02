// connessione all'applicazione per gestire le trust anchor
let port = browser.runtime.connectNative("handle_trust_anchor");

// ci si mette in ascolto dei messaggi inviati dall'applicazione
port.onMessage.addListener(function(response) {
  console.log("[MAIN]: dall'applicazione ho ricevuto: " + response);
});

console.log("[MAIN]: estensione caricata");

// connessione con Ganache
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));
const web3ws = new Web3(new Web3.providers.WebsocketProvider("ws://127.0.0.1:8545"));

// connessione alla blockchain locale in questo
if (web3.eth.net.isListening()) 
    console.log("[MAIN]: connessione HTTP blockchain riuscita");
else
    console.log("[MAIN]: connessione HTTP blockchain rifiutata");

if (web3ws.eth.net.isListening()) 
    console.log("[MAIN]: connessione WS blockchain riuscita");
else
    console.log("[MAIN]: connessione WS blockchain rifiutata");

web3.eth
    .getBlockNumber()
    .then(function(block) {
        console.log("[MAIN]: l'ultimo blocco della blockchain ha numero: " + block);
    });


function handleInstalled(details) {
  console.log("[MAIN]: installazione trust anchor: " + details.reason);

  console.log("[MAIN]: invio all'applicazione la richiesta di aggiungere la trust anchor");
  port.postMessage("add");

}

browser.runtime.onInstalled.addListener(handleInstalled);

// ======================================================================================================================================================
// questa prima parte fa riferimento a: https://stackoverflow.com/questions/6566545/is-there-any-way-to-access-certificate-information-from-a-chrome-extension

async function verify(details) {
  console.log("[LISTENER TLS]: ricevuta una richiesta per " + details.url + " con ID " + details.requestId);

  // questa è una stringa, anche se il contenuto è un numero
  var requestId = details.requestId;

  var filter = browser.webRequest.filterResponseData(requestId);
  console.log("[LST TLS PARSING]: creato un filtro qua per modificare la risposta:")
  console.log(filter)

  var securityInfo = await browser.webRequest.getSecurityInfo(requestId, {
      // se si mette certificateChain : true non compare il certificato
      certificateChain: false,
      rawDER: true
  });

  console.log("[LISTENER TLS]: informazioni di sicurezza:\n" + JSON.stringify(securityInfo, null, 2));

  console.log("[LISTENER TLS]: Certificato grezzo con tutte le informazioni 1:")
  console.log(securityInfo.certificates[0]["rawDER"].toString())

  console.log("[LISTENER TLS]: Certificato grezzo con tutte le informazioni 2:")
  console.log(new Uint8Array(securityInfo.certificates[0]["rawDER"]))

  var raw_DER = new Uint8Array(securityInfo.certificates[0]["rawDER"]).buffer;
  console.log("[LISTENER TLS]: Certificato grezzo con tutte le informazioni 3:")
  console.log(raw_DER)

  console.log("[LISTENER TLS]: parsing del certificato grezzo ...")
  decoder.parse(raw_DER)
            .then(function(result) {
              console.log("[LST TLS PARSING]: sono dentro la callback");
              var proof_cert = result["extensions"][0]["extnValue"]["valueBlock"]["value"][0]["valueBlock"]["value"];
              console.log("[LST TLS PARSING]: questo è il contenuto del campo aggiuntivo:");
              console.log(proof_cert)
              
              var DIDdocument = JSON.parse(proof_cert.replace(/'/g, '"'));
              console.log("[LST TLS PARSING]: lo trasformo in JSON:");
              console.log(DIDdocument)
              console.log("[LST TLS PARSING]: lo trasformo in stringa nuovamente:");
              console.log(JSON.stringify(DIDdocument, null, 2))
              console.log("[LST TLS PARSING]: lo verifico:");
              var result_verifier = verifier.verifyDID(DIDdocument, web3)
              console.log("[LST TLS PARSING]: la verifica mi restituisce questo:")
              console.log(result_verifier)
              result_verifier.then(function (result) {
                console.log("[LST TLS PARSING]: il risultato della verifica è: " + result)
                var decoder = new TextDecoder("utf-8");
                var encoder = new TextEncoder();
                // questa parte serve quando il plug-in fa la verifica della prova presente nel certificato, 
                // se la verifica va a buon fine viene mostrata la pagina, no altrimenti 
                filter.ondata = event => {
                  let str = decoder.decode(event.data, {stream: true});
                  // Just change any instance of Example in the HTTP response
                  // to WebExtension Example.
                  console.log("[DEBUG]: sono dentro")
                  if (result) {
                    console.log("[FILTER]: la verifica è andata a buon fine")
                    str = str.replace(/Hello/g, 'Hello ( Tutto Bene )');
                    filter.write(encoder.encode(str));
                  }
                  else {
                    console.log("[FILTER]: la verifica non è andata a buon fine")
                    filter.write(encoder.encode(""));
                  }
                  filter.disconnect();
                }
              })
              
          })
  console.log("[LISTENER TLS]: fine parsing del certificato grezzo, sotto arriveranno i risultati")
} 

// https://developer.chrome.com/extensions/match_patterns
var ALL_SITES = { urls: ["https://localhost/*"] };

// Mozilla non usa tlsInfo in extraInfoSpec
var extraInfoSpec = ["blocking"]; 

// https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest/onHeadersReceived
browser.webRequest.onHeadersReceived.addListener(verify, ALL_SITES, extraInfoSpec);

console.log("[MAIN]: attivato listener di connessioni TLS");
