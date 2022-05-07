// LOCAL TESTING

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    development: {
      host: "localhost",
      port: 7545,
      network_id: "5777",
      gas: 4600000
    }
  },
  compilers: {
    solc: {
    }
  },
};

// ROPSTEN DEPLOYMENT

// var HDWalletProvider = require("truffle-hdwallet-provider");
// const MNEMONIC = 'impact knee hungry zone broken alley stomach stereo patrol summer unlock crowd satisfy index fluid';

// module.exports = {
//   networks: {
//     development: {
//       host: "127.0.0.1",
//       port: 7545,
//       network_id: "*"
//     },
//     ropsten: {
//       provider: new HDWalletProvider(MNEMONIC, "https://ropsten.infura.io/v3/573a0674be2642f4aec2b685bfd6eb55"),
//       network_id: 3,
//       gas: 4000000      //make sure this gas allocation isn't over 4M, which is the max
//     },
//   }
// };


// Commands to deploy on rpesten
// npm install --save truffle-hdwallet-provider
// truffle deploy --network ropsten
// truffle console --network ropsten
// HBaggaeClaim.deployed().then(function(instance){return instance });
// HBaggaeClaim.deployed().then(function(instance){return instance.getBalance() });