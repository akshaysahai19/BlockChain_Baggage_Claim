var BaggageClaim = artifacts.require("AirlineLostBaggage");

module.exports = function(deployer) {
  deployer.deploy(AirlineLostBaggage);
};
