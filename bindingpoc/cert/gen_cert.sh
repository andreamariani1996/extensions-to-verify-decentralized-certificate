#!/bin/bash

cp ./cert.txt ./cert-bad.txt

python3 add_cert.py

# generazione chiave privata della CA, con la quale firmerà certificati
openssl genrsa -out sk_root_CA.key 2048
# generazione certificato self-signed della CA (ovvero la chiave pubblica)
openssl req -new -nodes -key sk_root_CA.key -x509 -days 365 << ANSWERS  > cert_root_CA.crt
IT
Roma
Civitavecchia
Blockchain CA
Cert
Blockchain
Null
ANSWERS

# generazione chiave privata del web server
openssl genrsa -out sk_server.key 2048
# generazione CSR, richiesta di firma, facendo riferimento al file di configurazione per mettere un'estensione in più
openssl req -key sk_server.key -new -config myconfig.cnf << ANSWERS  > CSR_server.csr
IT
Roma
Civitavecchia
Andrea S.p.A.
Tech
localhost
Null
andrea123

ANSWERS

# unite req_extensions, altrimenti non si prendeva SAN, perché se ci sono nomi duplicati l'ultimo viene ignorato
openssl x509 -req -in CSR_server.csr -CA cert_root_CA.crt -CAkey sk_root_CA.key -CAcreateserial -out cert_server.crt -extfile myconfig.cnf -extensions req_ext -days 500 -sha256



# ======= web server cattivo =========

# generazione chiave privata del web server
openssl genrsa -out sk_server-bad.key 2048
# generazione CSR, richiesta di firma, facendo riferimento al file di configurazione per mettere un'estensione in più
openssl req -key sk_server-bad.key -new -config myconfig-bad.cnf << ANSWERS  > CSR_server-bad.csr
IT
Roma
Civitavecchia
Andrea S.p.A.
Tech
localhost
Null
andrea123

ANSWERS

# unite req_extensions, altrimenti non si prendeva SAN, perché se ci sono nomi duplicati l'ultimo viene ignorato
openssl x509 -req -in CSR_server-bad.csr -CA cert_root_CA.crt -CAkey sk_root_CA.key -CAcreateserial -out cert_server-bad.crt -extfile myconfig-bad.cnf -extensions req_ext -days 500 -sha256

# ======= fine =========

# nota: se dovesse essere chiesta la password per un qualche motivo, questa è: andrea123

# i comandi utilizzati per generare il file che servirà nel web server (mettere password pippo123)
openssl pkcs12 -export -in cert_server.crt -inkey sk_server.key -name springboot -out springboot.p12 -password pass:pippo123
keytool -importkeystore -deststorepass pippo123 -destkeystore springboot.jks -srckeystore springboot.p12 -srcstoretype PKCS12 -srcstorepass pippo123
keytool -importkeystore -srckeystore springboot.jks -destkeystore springboot.jks -deststoretype pkcs12 -srcstorepass pippo123

# ======= web server cattivo =========
# -name springboot-bad è ripreso poi nell'application.yml, sarebbe l'alias del keystore
openssl pkcs12 -export -in cert_server-bad.crt -inkey sk_server-bad.key -name springboot-bad -out springboot-bad.p12 -password pass:pippo123
keytool -importkeystore -deststorepass pippo123 -destkeystore springboot-bad.jks -srckeystore springboot-bad.p12 -srcstoretype PKCS12 -srcstorepass pippo123
keytool -importkeystore -srckeystore springboot-bad.jks -destkeystore springboot-bad.jks -deststoretype pkcs12 -srcstorepass pippo123