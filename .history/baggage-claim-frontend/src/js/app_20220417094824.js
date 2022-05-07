App = {
  web3Provider: null,
  contracts: {},
  airports: new Array({}),
  names: new Array(),
  url: "http://127.0.0.1:7545",
  airportAuthority: null,
  currentAccount: null,
  init: function () {
    return App.initWeb3();
  },

  initWeb3: function () {
    // Is there is an injected web3 instance?
    if (typeof web3 !== "undefined") {
      App.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fallback to the TestRPC
      App.web3Provider = new Web3.providers.HttpProvider(App.url);
    }
    web3 = new Web3(App.web3Provider);

    ethereum.enable();

    App.populateAddress();
    return App.initContract();
  },

  initContract: function () {
    $.getJSON("BaggageClaim.json", function (data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var airportContractJsonData = data;
      App.contracts.claim = TruffleContract(airportContractJsonData);

      // Set the provider for our contract
      App.contracts.claim.setProvider(App.web3Provider);

      App.getAirportAuthority();
      return App.bindEvents();
    }).then(function () {
      App.contracts.claim
        .deployed()
        .then(function (instance) {
          airportsInstance = instance;
          var airportsCount;
          airportsInstance
            .getAirportsCount({ from: App.account })
            .then((data) => {
              console.log("data", data.c[0]);
              airportsCount = data.c[0];
              for (var i = 0; i < airportsCount; i++) {
                var name;
                var address;
                var price;

                airportsInstance
                  .getAirportsAddress(i, { from: App.account })
                  .then((data) => {
                    console.log("address ", data);
                    address = data;
                  });
                airportsInstance
                  .getAirportMembershipStatus(address, { from: App.account })
                  .then((data) => {
                    console.log("address data ", data.s);
                    if (data.s == 1) {
                      console.log(App.airports);
                      airportsInstance
                      .getAirportsName(i, { from: App.account })
                      .then((data) => {
                        console.log("name ", data);
                        name = data;
                        airportsInstance.getAirportPricePerBag( { from: App.account })
                      .then((data) => {
                        console.log("price", data);
                        price = data;
                      App.airports.push({ name: name, address: address ,price: price});

                      });
                      });
                      

                    }
                  });
              }
              App.handleUpdateAirportsList();
            });

          App.testFunction();

          console.log(
            "App.contracts.claim.currentProvider: " +
              App.contracts.claim.currentProvider
          );
          App.checkMemeberShipStatus();

          return App.airports;
        })
        .then(function (res) {
          console.log(res);
          alert("  Airports: %o " + res);
        })
        .catch(function (err) {
          console.log(err.message);
        });
    });
  },

  testFunction: function () {
    ethereum
      .request({ method: "eth_accounts" })
      .then(App.handleAccountsChanged)
      .catch((err) => {
        // Some unexpected error.
        // For backwards compatibility reasons, if no accounts are available,
        // eth_accounts will return an empty array.
        console.error(err);
      });

    // Note that this event is emitted on page load.
    // If the array of accounts is non-empty, you're already
    // connected.
    ethereum.on("accountsChanged", App.handleAccountsChanged);

    // For now, 'eth_accounts' will continue to always return an array
  },

  handleAccountsChanged: function (accounts) {
    console.log(accounts);
    if (accounts.length === 0) {
      // MetaMask is locked or the user has not connected any accounts
      console.log("Please connect to MetaMask.");
    } else if (accounts[0] !== App.account) {
      App.account = accounts[0];
      console.log("Account changed to " + App.account);
      App.checkMemeberShipStatus();
      // Do any other work!
    }
  },

  bindEvents: function () {
    $(document).on("click", "#airportRegister", function () {
      var airportname = $("#airportName").val();
      var perPriceBag = $("#perPriceBag").val();
      App.handleRegistration(airportname, perPriceBag);
    }); //register airports
    $(document).on("click", "#addBaggage", function () {
      var totalAddBaggageNumber = $("#totalAddBaggageNumber").val();
      App.handleAddBaggage(totalAddBaggageNumber);
    }); //add baggage
    $(document).on("click", "#claimBaggageRequest", function () {
      var sellingAirportWhileClaim = $("#sellingAirportWhileClaim").val();
      var totalClaimBaggageNumber = $("#totalClaimBaggageNumber").val();
      var hashDetailsWhileClaim = $("#hashDetailsWhileClaim").val();
      App.handleRequestBaggage(
        sellingAirportWhileClaim,
        totalClaimBaggageNumber,
        hashDetailsWhileClaim
      );
    }); //claim request
    $(document).on("click", "#approveClaim", function () {
      var hashDetailsWhileClaim = $("#hashDetailsWhileResponse").val();
      App.handleResponseToClaimBaggage(
        1,
        hashDetailsWhileClaim
      );
    }); //claim response - approve
    $(document).on("click", "#disapproveClaim", function () {
      var hashDetailsWhileClaim = $("#hashDetailsWhileResponse").val();
      App.handleResponseToClaimBaggage(
        0,
        hashDetailsWhileClaim
      );
    }); //claim response - disapprove
    $(document).on("click", "#pay", function () {
      var sellingAirportWhileSettle = $("#sellingAirportWhileSettle").val();
      var hashDetailsWhileSettle = $("#hashDetailsWhileSettle").val();
      App.handleSettlePayment(
        sellingAirportWhileSettle,
        hashDetailsWhileSettle
      );
    }); //settlePayment
    $(document).on("click", "#airportUnregister", function () {
      var unregisterAirportName = $("#unregisterAirportName").val();
      App.handleUnregistration(unregisterAirportName);
    }); //unregister airports
    $(document).on("click", "#balance", App.handleBalance); //add baggage
  },

  populateAddress: function () {
    console.log("populateAddress called");
    new Web3(new Web3.providers.HttpProvider(App.url)).eth.getAccounts(
      (err, accounts) => {
        web3.eth.defaultAccount = web3.eth.accounts[0];
        jQuery.each(accounts, function (i) {
          // if(web3.eth.coinbase != accounts[i]){
          //   var optionElement = '<option value="'+accounts[i]+'">'+accounts[i]+'</option';
          //   jQuery('#enter_address').append(optionElement);
          // }
        });
      }
    );
  },

  getAirportAuthority: function () {
    App.contracts.claim
      .deployed()
      .then(function (instance) {
        console.log("result: ");
        return instance;
      })
      .then(function (result) {
        console.log("result: %o", result);
        App.airportAuthority =
          result.constructor.currentProvider.selectedAddress.toString();
        App.currentAccount = web3.eth.coinbase;
        if (App.airportAuthority != App.currentAccount) {
          jQuery("#address_div").css("display", "none");
          jQuery("#register_div").css("display", "none");
        } else {
          jQuery("#address_div").css("display", "block");
          jQuery("#register_div").css("display", "block");
        }
      });
  },

  handleRegistration: function (airportsName, pricePerBaggage) {
    console.log("airportsName = " + airportsName);
    console.log("pricePerBaggage = " + pricePerBaggage);
    for (var i = 1; i < App.airports.length; i++) {
      if (App.airports[i].name == airportsName) {
        alert("Airport already registered");
        return;
      }
    }

    var airportsRegistryInstance;

    web3.eth.getAccounts(function (error, accounts) {
      var account = accounts[0];

      App.contracts.claim
        .deployed()
        .then(function (instance) {
          airportsRegistryInstance = instance;

          return airportsRegistryInstance.registerAirports(
            airportsName,
            pricePerBaggage,
            { from: account }
          );
        })
        .then(function (result, err) {
          if (result) {
            console.log("result: %o", result);
            console.log(result.receipt.status);
            if (parseInt(result.receipt.status) == 1) {
              alert(account + " Airports registration done successfully");
              App.airports.push({ name: airportsName, address: account, price: pricePerBaggage });
              console.log(App.airports);
              App.handleUpdateAirportsList();
              App.checkMemeberShipStatus();
            } else
              alert(account + " Airports registration failed due to revert");
          } else {
            alert(account + " Airports registration failed");
          }
        });
    });
  },

  handleUpdateAirportsList: function () {
    var sellingAirportWhileClaim = jQuery("#sellingAirportWhileClaim");
    var sellingAirportWhileSettle = jQuery("#sellingAirportWhileSettle");
    var unregisterAirportName = jQuery("#unregisterAirportName");
    sellingAirportWhileClaim.empty();
    for (var i = 1; i < App.airports.length; i++) {
      var newOption = jQuery(
        '<option value="' +
          i +
          '">' +
          App.airports[i].name +
          "</option>"
      );
      sellingAirportWhileClaim.append(newOption);
    }
    sellingAirportWhileSettle.empty();
    for (var i = 1; i < App.airports.length; i++) {
      var newOption = jQuery(
        '<option value="' +
          i +
          '">' +
          App.airports[i].name +
          "</option>"
      );
      sellingAirportWhileSettle.append(newOption);
    }
    unregisterAirportName.empty();
    for (var i = 1; i < App.airports.length; i++) {
      var newOption = jQuery(
        '<option value="' +
          i +
          '">' +
          App.airports[i].name +
          "</option>"
      );
      unregisterAirportName.append(newOption);
    }
  },

  handleAddBaggage: function (bagCount) {
    var addBaggageInstance;

    web3.eth.getAccounts(function (error, accounts) {
      var account = accounts[0];

      App.contracts.claim
        .deployed()
        .then(function (instance) {
          addBaggageInstance = instance;

          return addBaggageInstance.addBaggaage(bagCount, { from: account });
        })
        .then(function (result, err) {
          if (result) {
            console.log("result: %o", result);
            console.log(result.receipt.status);
            if (parseInt(result.receipt.status) == 1)
              alert(account + " Baggage added successfully");
            else alert(account + " Baggage failed due to revert");
          } else {
            alert(account + " Baggage add failed");
          }
        });
    });
  },

  handleRequestBaggage: function (index, bagCount, hashDetails) {
    var airportsRequestInstance;
    var amountToSend = bagCount * App.airports[index].price;

    web3.eth.getAccounts(function (error, accounts) {
      var account = accounts[0];

      App.contracts.claim
        .deployed()
        .then(function (instance) {
          airportsRequestInstance = instance;

          return airportsRequestInstance.requestToClaimBaggage(
            App.airports[index].address,
            hashDetails,
            bagCount,
            {
              from: account,
              value: this.web3.utils.toWei(amountToSend, "ether"),
            }
          );
        })
        .then(function (result, err) {
          if (result) {
            console.log("result: %o", result);
            console.log(result.receipt.status);
            if (parseInt(result.receipt.status) == 1)
              alert(account + " Baggage Requested successfully");
            else alert(account + " Baggage Request failed due to revert");
          } else {
            alert(account + " Baggage Request failed");
          }
        });
    });
  },

  handleResponseToClaimBaggage: function (done, hashOfDetails) {
    var airportsResponseInstance;

    web3.eth.getAccounts(function (error, accounts) {
      var account = accounts[0];

      App.contracts.claim
        .deployed()
        .then(function (instance) {
          airportsResponseInstance = instance;

          return airportsResponseInstance.responseToClaimBaggage(
            done,
            hashOfDetails,
            { from: account }
          );
        })
        .then(function (result, err) {
          if (result) {
            console.log("result: %o", result);
            console.log(result.receipt.status);
            if (parseInt(result.receipt.status) == 1)
              alert(account + " Baggage Response successfully");
            else alert(account + " Baggage Response failed due to revert");
          } else {
            alert(account + " Baggage Response failed");
          }
        });
    });
  },

  handleSettlePayment: function (index, hashOfDetails) {
    var airportsSettleInstance;

    web3.eth.getAccounts(function (error, accounts) {
      var account = accounts[0];

      App.contracts.claim
        .deployed()
        .then(function (instance) {
          airportsSettleInstance = instance;

          return airportsSettleInstance.settlePayment(
            App.airports[index].address,
            hashOfDetails,
            { from: account }
          );
        })
        .then(function (result, err) {
          if (result) {
            console.log("result: %o", result);
            console.log(result.receipt.status);
            if (parseInt(result.receipt.status) == 1)
              alert(account + " Payment settled successfully");
            else alert(account + " Payment failed due to revert");
          } else {
            alert(account + " Payment failed");
          }
        });
    });
  },

  handleUnregistration: function (index) {
    var airportsRegistryInstance;
    var sellingAirport = App.airports[index].address;

    web3.eth.getAccounts(function (error, accounts) {
      var account = accounts[0];

      App.contracts.claim
        .deployed()
        .then(function (instance) {
          airportsRegistryInstance = instance;

          return airportsRegistryInstance.unregisterAirports(sellingAirport, {
            from: account,
          });
        })
        .then(function (result, err) {
          if (result) {
            console.log("result: %o", result);
            console.log(result.receipt.status);
            if (parseInt(result.receipt.status) == 1) {
              alert(account + " Airports unregistrerd successfully");
              App.updateRemoveAirport(sellingAirport);
            } else
              alert(account + " Airports unregistration failed due to revert");
          } else {
            alert(account + " Airports unregistration failed");
          }
        });
    });
  },

  updateRemoveAirport: function (sellingAirport) {
    var tempAirports = []
    for (var i = 0; i < App.airports.length; i++) {
      if (App.airports[i].address != sellingAirport) {
        tempAirports.push(App.airports[i]);
      }
    }
    App.airports = tempAirports;
    tempAirports = [];
    App.handleUpdateAirportsList();
  },

  handleBalance: function () {
    console.log("To current escrow balance");
    var claimInstance;
    App.contracts.claim
      .deployed()
      .then(function (instance) {
        claimInstance = instance;
        return claimInstance.getBalance({ from: App.account });
      })
      .then(function (res) {
        console.log(res);
        alert("  Balance is result: " + res);
      })
      .catch(function (err) {
        console.log(err.message);
      });
  },

  checkMemeberShipStatus: function () {
    console.log("To check membership status");
    var claimInstance;
    App.contracts.claim
      .deployed()
      .then(function (instance) {
        claimInstance = instance;
        return claimInstance.getAirportMembershipStatus({ from: App.account });
      })
      .then(function (res) {
        console.log(res);
        App.screenFilter(res);
        alert("  Membership status is result: " + res);
      })
      .catch(function (err) {
        console.log(err.message);
      });
  },

  screenFilter: function (memeberShip) {
    if (memeberShip == 0) {
      $("#registerCard").css("display", "block");
      $("#claimRequestCard").css("display", "block");
      $("#settlePaymentCard").css("display", "block");
      $("#airportTitle").css("display", "block");
      $("#buyerTitle").css("display", "block");
      $("#addbaggageCard").css("display", "none");
      $("#claimResponseCard").css("display", "none");
      $("#unregisterCard").css("display", "none");
      $("#authorityTitle").css("display", "none");
    } else if (memeberShip == 1) {
      $("#addbaggageCard").css("display", "block");
      $("#claimResponseCard").css("display", "block");
      $("#registerCard").css("display", "block");
      $("#airportTitle").css("display", "block");
      $("#unregisterCard").css("display", "none");
      $("#claimRequestCard").css("display", "none");
      $("#settlePaymentCard").css("display", "none");
      $("#buyerTitle").css("display", "none");
      $("#authorityTitle").css("display", "none");
    } else {
      $("#unregisterCard").css("display", "block");
      $("#authorityTitle").css("display", "block");
      $("#airportTitle").css("display", "none");
      $("#addbaggageCard").css("display", "none");
      $("#claimResponseCard").css("display", "none");
      $("#registerCard").css("display", "none");
      $("#claimRequestCard").css("display", "none");
      $("#settlePaymentCard").css("display", "none");
      $("#buyerTitle").css("display", "none");
    }
  },
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
