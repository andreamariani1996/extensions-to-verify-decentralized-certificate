# Estensioni di Firefox per verificare certificati X.509 creati in modo decentralizzato
Questo repository contiene il codice relativo alle estensioni di Firefox per verificare certificati X.509 creati in modo decentralizzato tramite Ethereum. Questo lavoro è stato svolto da Andrea Mariani per la tesi del "[Corso di Laurea Magistrale in Ingegneria Informatica](https://ingegneria.uniroma3.it/corsi/dipartimento-di-ingegneria/lm/2020-2021/ingegneria-informatica-0580707303300001/)", 
afferente al Dipartimento di Ingegneria dell'Università degli Studi Roma Tre. 

Il relatore della tesi è il prof. [Maurizio Pizzonia](https://compunet.ing.uniroma3.it/#!/people/pizzo) e il correlatore è il dott. [Diego Pennino](https://compunet.ing.uniroma3.it/#!/people/pennino).

## Accesso al repository 

Per effettuare il download del repository:

    git clone https://github.com/andreamariani1996/extensions-to-verify-decentralized-certificate.git

## Organizzazione repository
* [app_to_handle_trust_anchor](app_to_handle_trust_anchor/): contiene i file dell'applicazione con la quale si interfacceranno le estensioni di Firefox per gestire i certificati;
* [bindingpoc](bindingpoc/): contiene la PoC relativa al paper "[Efficient Certification of Endpoint Control on Blockchain](https://ieeexplore.ieee.org/abstract/document/9547272)". In questo lavoro non è stata modificata la logica della PoC, ma sono state fatte alcune modifiche per adattarla allo specifico caso d'uso ([PoC originale](https://gitlab.com/uniroma3/compunet/networks/bindingpoc/-/tree/master));
* [spring-boot-https](spring-boot-https/): contiene un web server implementato mediante il framework [Spring Security](https://spring.io/projects/spring-security) che restituisce un certificato che ha come estensione una prova decentralizzata valida;
* [spring-boot-https-bad](spring-boot-https-bad/): contiene un web server implementato mediante il framework [Spring Security](https://spring.io/projects/spring-security) che restituisce un certificato che ha come estensione una prova decentralizzata non valida;
* [verifier_extension](verifier_extension/): contiene un'estensione di Firefox che prende il certificato dall'handshake TLS a fronte di una richiesta a un web server e verifica se nel certificato è presente e valida una prova decentralizzata: se lo è restituisce la risposta del web server, altrimenti filtra la risposta del server restituendo una pagina bianca. Al momento dell'installazione dell'estensione in Firefox, viene mandata una richiesta all'applicazione installata sull'host ([app_to_handle_trust_anchor](app_to_handle_trust_anchor/)) che si occupa di gestire i certificati di Firefox richiedendo l'aggiunta di una trust anchor. Questo è necessario perché l'estensione non ha i permessi necessari per aggiungere autonomamente la trust anchor;
* [verifier_supporter_extension](verifier_supporter_extension/): contiene un'estensione di Firefox che supporta l'estensione descritta precedentemente. In particolare, quando l'estensione precedente viene rimossa, questa estensione riceve l'evento di disinstallazione e fa una richiesta di rimozione della trust anchor all'applicazione installata sull'host;
* [start.sh](start.sh/): script che esegue i comandi necessari per creare un certificato in modo decentralizzato e configura opportunamente i web server;
* [clean.sh](clean.sh/): script per cancellare i file generati dall'esecuzione dello script [start.sh](start.sh/);

# Prerequisiti
* [Python] 3.8.5;
* [Node.js] 14.19.2;
* [OpenSSL] 1.1.1h;
* [Certutil] ottenuto installando libnss3-tools (`apt-get install libnss3-tools`);
* [Ganache CLI] 6.12.2 (ganache-core: 2.13.2);
* [Browserify] 1.2.0;
* [Firefox] 105.0;

Sono indicate le versione utilizzate e i test sono stati fatti solo su Linux.

## Utilizzo del repository
* modificare il campo "path" del file [handle_trust_anchor.json](extensions-to-verify-decentralized-certificate/app_to_handle_trust_anchor/handle_trust_anchor.json) specificando dove si trova il file [handle_trust_anchor.py](extensions-to-verify-decentralized-certificate/app_to_handle_trust_anchor/handle_trust_anchor.py);
* modificare opportunamente nel file [handle_trust_anchor.py](extensions-to-verify-decentralized-certificate/app_to_handle_trust_anchor/handle_trust_anchor.py) tutti path che si incontrano (la cartella del profilo di default di Firefox si può trovare facilmente digitando nella barra di ricerca di Firefox `about:profiles`);
* copiare il file [handle_trust_anchor.json](extensions-to-verify-decentralized-certificate/app_to_handle_trust_anchor/handle_trust_anchor.json) nelle cartelle specificate in [Manifest Location](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Native_manifests#manifest_location);
* aprire un terminale, spostarsi nella cartella [bindingpoc](bindingpoc/) ed eseguire il comando `ganache-cli --account_keys_path keys.json`;
* aprire un terminale, spostarsi nella cartella principale ed eseguire `sh start.sh`;
* aprire un terminale, spostarsi nella cartella [spring-boot-https](spring-boot-https/), poi in build, libs ed eseguire il comando `java -jar spring-boot-https-0.0.1-SNAPSHOT.jar`;
* aprire un terminale, spostarsi nella cartella [spring-boot-https-bad](spring-boot-https-bad/), poi in build, libs ed eseguire il comando `java -jar spring-boot-https-0.0.1-SNAPSHOT.jar`;
* aprire firefox e digitare nella ricerca `https://localhost:8443`, si può vedere che il browser mostra una pagina di errore, in quanto non riconosce la CA che ha emesso il certificato;
* aprire firefox e digitare nella barra di ricerca `about:debugging#/runtime/this-firefox`;
* caricare temporaneamente l'estensione per verificare i certificati selezionando il file [manifest.json](extensions-to-verify-decentralized-certificate/verifier_extension/manifest.json) presente nella cartella [verifier_extension](verifier_extension/). Cliccando su "Ispeziona" e poi "Console" si dovrebbero vedere i log dell'estensione. Questa estensione fa una richiesta all'applicazione nell'host per installare la trust anchor;
* nello stesso modo caricare temporaneamente l'estensione per supportare l'estensione che verifica i certificati;
* fare nuovamente una richiesta `https://localhost:8443`, questa volta la pagina dovrebbe essere mostrata e controllando i log dell'estensione si dovrebbe vedere che la verifica della prova decentralizzata è stata effettuata;
* provare a fare una richiesta al web server malevolo (`https://localhost:8444`), si vede che viene mostrata una pagina bianca. In realtà la risposta del web server sarebbe un'altra, ma viene filtrata dall'estensione;
* rimuovere l'estensione che verifica i certificati. Questo avrà come effetto la rimozione della trust anchor e il riavvio di Firefox (la trust anchor viene rimossa effettivamente quando si riavvia Firefox). La richiesta di rimozione e riavvio è stata fatta dall'estensione di supporto all'applicazione nell'host. Adesso facendo le richieste ai web server si ottiene di nuovo una pagina di errore;
* una volta terminato di fare i test, interrompere tutti i processi ed eseguire `sh clean.sh` dalla cartella principale.
