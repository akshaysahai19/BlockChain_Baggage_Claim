// module.exports = {
//   // See <http://truffleframework.com/docs/advanced/configuration>
//   // to customize your Truffle configuration!
//   networks: {
//     development: {
//       host: "localhost",
//       port: 7545,
//       network_id: "5777",
//       gas: 4600000
//     }
//   },
//   compilers: {
//     solc: {
//       // version: "0.7.6",    // Fetch exact version from solc-bin (default: truffle's version)
//       // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
//       // settings: {          // See the solidity docs for advice about optimization and evmVersion
//       //  optimizer: {
//       //    enabled: false,
//       //    runs: 200
//       //  },
//       //  evmVersion: "byzantium"
//       // }
//     }
//   },
// };

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
      provider: function() {
        return new HDWalletProvider(MNEMONIC, "https://ropsten.infura.io/v3/573a0674be2642f4aec2b685bfd6eb55")
      },
      network_id: 3,
      gas: 4000000      //make sure this gas allocation isn't over 4M, which is the max
    }
  }
};
