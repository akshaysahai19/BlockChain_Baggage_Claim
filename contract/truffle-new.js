var HDWalletProvider = require("truffle-hdwallet-provider");
const MNEMONIC = 'impact knee hungry zone broken alley stomach stereo patrol summer unlock crowd satisfy index fluid';

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*"
    },
    ropsten: {
      provider: new HDWalletProvider(MNEMONIC, "https://ropsten.infura.io/v3/573a0674be2642f4aec2b685bfd6eb55"),
      network_id: 3,
      gas: 4000000      //make sure this gas allocation isn't over 4M, which is the max
    },
  }
};
