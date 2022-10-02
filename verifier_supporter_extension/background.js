console.log("[MAIN]: estensione caricata");

/*
On startup, connect to the "ping_pong" app.
*/
let port = browser.runtime.connectNative("handle_trust_anchor");

/*
Listen for messages from the app.
*/
port.onMessage.addListener((response) => {
  console.log("Received: " + response);
});

function uninstall(info) {

  console.log("[MAIN]: info: " + JSON.stringify(info, null, 2))

  console.log("[MAIN]: invio all'applicazione la richiesta di rimuovere la trust anchor");
  port.postMessage("rm");

}

browser.management.onUninstalled.addListener(uninstall)
