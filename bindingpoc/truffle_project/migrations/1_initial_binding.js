const Binding = artifacts.require("Binding");
const ECDSA = artifacts.require("ECDSA");
const EthereumDIDRegistry = artifacts.require("EthereumDIDRegistry");
const Strings = artifacts.require("Strings");

module.exports = function (deployer) {
  deployer.deploy(Binding);
  deployer.deploy(ECDSA);
  deployer.deploy(EthereumDIDRegistry);
  deployer.deploy(Strings);
};
