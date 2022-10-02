#!/bin/bash

cd bindingpoc
# ganache-cli --account_keys_path keys.json
python3 deploy_smart_contract_ganache-cli.py
node index.js &
sleep 20
# per uccidere tutti i processi che si chiamano "node index.js"
ps -ef | grep 'node index.js' | grep -v grep | awk '{print $2}' | xargs -r kill -9
cd cert
sh gen_cert.sh
cp ./springboot.p12 ../../spring-boot-https/src/main/resources
cp ./springboot-bad.p12 ../../spring-boot-https-bad/src/main/resources
cd ../../spring-boot-https
gradle build
cd ../spring-boot-https-bad
gradle build
cd ../bindingpoc
browserify verifier_to_bundle.js --standalone verifier > verifier_bundle.js
cp ./verifier_bundle.js ../verifier_extension