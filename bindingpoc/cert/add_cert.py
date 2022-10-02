import json

print("a partire dal template si crea il file di configurazione da usare per ottenere il certificato")
config_template = open("myconfig_template.cnf", "r")
config = config_template.readlines()
config_template.close()

# print(config)

cert_file = open("cert.txt", "r")
cert = cert_file.read()
cert_file.close()

# si deve mettere [:32] altrimenti si prendono i caratteri "\n" che fanno andare a capo e non va bene
config[220] = config[220][:26] + cert

# print(config[220])

config_cert = open("myconfig.cnf", "w")
config_cert.writelines(config)
config_cert.close()


config_bad_template = open("myconfig_template.cnf", "r")
config_bad = config_bad_template.readlines()
config_bad_template.close()

cert_bad_file = open("cert-bad.txt", "r")
cert_bad = cert_bad_file.read()
cert_bad_file.close()

print(type(cert_bad))
print(cert_bad)
# appena si legge dal file si devono buttare la prima l'ultima double quote del file, altrimenti il parsing viene male
cert_bad = cert_bad[1:len(cert_bad)-1]
print(cert_bad)

# altrimenti il parsing viene male
cert_bad = cert_bad.replace("'", '"')

cert_bad_json = json.loads(cert_bad)
print(type(cert_bad_json))

tandMErkleProof = cert_bad_json["service"][0]["serviceEndpoint"]["proof"]["tAndMerkleProof"]
print(tandMErkleProof)

cert_bad_json["service"][0]["serviceEndpoint"]["proof"]["tAndMerkleProof"] = tandMErkleProof[:40] + tandMErkleProof[50:] 
cert_bad = json.dumps(cert_bad_json)
print(cert_bad)
cert_bad = cert_bad.replace('"', "'")
cert_bad = '"' + cert_bad + '"'
print(cert_bad)


config_bad[220] = config_bad[220][:26] + cert_bad
config_bad_cert = open("myconfig-bad.cnf", "w")
config_bad_cert.writelines(config_bad)
config_bad_cert.close()

print("[FINE]")