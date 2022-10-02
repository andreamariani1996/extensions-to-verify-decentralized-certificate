from web3 import Web3
from eth_keys import keys
from eth_utils import decode_hex
import json

file_environment = open("environment.json", "r")
environment = json.load(file_environment)
file_environment.close()

# viene effettuata la connessione a un nodo della rete di Ethereum
web3 = Web3(Web3.HTTPProvider(environment["UrlProviderHTTP"]))
if (web3.isConnected()):
    print("connessione HTTP blockchain riuscita")
else:
    print("connessione HTTP blockchain fallita")


default_account_address = web3.eth.accounts[0]
default_account_address_lower = default_account_address.lower()


print("l'indirizzo dell'account di default è: " + default_account_address)
print("il bilancio dell'account di default è: " + str(web3.eth.get_balance(default_account_address)))

file_contract = open("Binding.json", "r")

binding_contract_information = json.load(file_contract)

file_contract.close()

binding_interface = binding_contract_information["abi"]
  
binding_bytecode = binding_contract_information["bytecode"]

# si definisce un oggetto contratto counter a partire dall'interfaccia e dal bytecode
binding_contract = web3.eth.contract(abi=binding_interface, bytecode=binding_bytecode)

# si prepara la transazione
# notare come si chiama il costruttore del contratto e gli si passa il valore 4
construct_txn = binding_contract.constructor().buildTransaction({
    'from': default_account_address,
    'nonce': web3.eth.get_transaction_count(default_account_address),
    'gas': 1728712, # se non viene dato esplicitamente viene stimato dal metodo web3.eth.estimate_gas()
    'gasPrice': web3.toWei('21', 'gwei')})

# si firma la transazione con la chiave privata dell'account
# signed = account.signTransaction(construct_txn)

# si invia la transazione
tx_hash = web3.eth.send_transaction(construct_txn)

# si aspetta la ricevuta della transazione per prendere da questa le informazioni
txn_receipt = web3.eth.wait_for_transaction_receipt(tx_hash)

# si salva in un oggetto il contratto deployato
contract_binding = web3.eth.contract(address=txn_receipt.contractAddress, abi=binding_interface)

print("indirizzo del contratto: " + str(contract_binding.address))
print("funzioni offerte dal contratto: " + str(contract_binding.all_functions()))
# notare come get_balance è una funzione di web3
print("bilancio del contratto: " + str(web3.eth.get_balance(contract_binding.address)))

binding_contract_information["address"] = str(contract_binding.address)
file_contract = open("Binding.json", "w")
# indent=2 serve per farlo più carino
json.dump(binding_contract_information, file_contract, indent=2)
file_contract.close()

file_environment = open("environment.json", "w")
environment["User"]["address"] = default_account_address
# indent=2 serve per farlo più carino
json.dump(environment, file_environment, indent=2)
file_environment.close()