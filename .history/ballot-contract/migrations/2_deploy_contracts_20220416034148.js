var Ballot = artifacts.require("AirlineLostBaggage");

module.exports = function(deployer) {
  deployer.deploy(AirlineLostBaggage,4);
};
