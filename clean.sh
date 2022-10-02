#!/bin/bash

rm ./bindingpoc/cert/cert.txt
rm ./bindingpoc/cert/cert_root_CA.crt
rm ./bindingpoc/cert/cert_root_CA.srl
rm ./bindingpoc/cert/cert_server.crt
rm ./bindingpoc/cert/CSR_server.csr
rm ./bindingpoc/cert/myconfig.cnf
rm ./bindingpoc/cert/sk_root_CA.key
rm ./bindingpoc/cert/sk_server.key
rm ./bindingpoc/cert/springboot.jks
rm ./bindingpoc/cert/springboot.jks.old
rm ./bindingpoc/cert/springboot.p12
rm ./bindingpoc/cert/cert-bad.txt
rm ./bindingpoc/cert/cert_server-bad.crt
rm ./bindingpoc/cert/CSR_server-bad.csr
rm ./bindingpoc/cert/myconfig-bad.cnf
rm ./bindingpoc/cert/sk_server-bad.key
rm ./bindingpoc/cert/springboot-bad.jks
rm ./bindingpoc/cert/springboot-bad.jks.old
rm ./bindingpoc/cert/springboot-bad.p12
rm ./bindingpoc/verifier_bundle.js

cd spring-boot-https
gradle clean
cd ..
rm spring-boot-https/src/main/resources/springboot.p12
cd spring-boot-https-bad
gradle clean
cd ..
rm spring-boot-https-bad/src/main/resources/springboot-bad.p12
rm ./verifier_extension/verifier_bundle.js