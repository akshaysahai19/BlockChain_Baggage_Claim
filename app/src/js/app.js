App = {
  web3Provider: null,
  contracts: {},
  airports: new Array(),
  names: new Array(),
  url: "http://127.0.0.1:7545",
  airportAuthority: null,
  accountType: 99, //0-customer, 1-airport
  currentAccount: null,
  init: function () {

    $.getJSON('../airports.json', function(data) {

      for (i = 0; i < data.length; i ++) {
        App.names.push(data[i]);
      }
      return App.loadAllAirports();
    });
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

    }).then(function () {
      App.accountSwitched();
      // App.checkMemeberShipStatus();
      return App.bindEvents();
    });
  },

  loadRegisteredAirports: function () {

    App.contracts.claim
        .deployed()
        .then(function (instance) {

    var airportsInstance = instance;
          var airportsCount;
          airportsInstance
            .getAirportsCount({ from: App.account })
            .then(async (data) => {
              console.log("data", data.c[0]);
              airportsCount = data.c[0];

              for (var i = 0; i < airportsCount; i++) {
                await App.fetchAirports(i, airportsCount, airportsInstance);
              }
              console.log("App.airports FinalList = ", App.airports);
            });

          console.log(
            "App.contracts.claim.currentProvider: " +
            App.contracts.claim.currentProvider
          );
        });
  },

  fetchAirports: function (index, count, airportsInstance) {
    var airportIndex;
    var address;
    var price;
    var quantity;

    console.log("index: ", index);
    App.airports = [];

    airportsInstance
      .getAirportsAddress(index, { from: App.account })
      .then((data) => {
        console.log("address ", data);
        address = data;
        console.log("i = " + index, "address = ", address);
        console.log("App.airports FinalList = ", App.airports);

        airportsInstance.getMembershipStatus({ from: address }).then((data) => {
          console.log("getMembershipStatus data ", data.c[0]);
          if (data.c[0] == 1) {
            console.log("inside getMembershipStatus data ");
            console.log(App.airports);

            airportsInstance
              .getAirportsIndex(index, { from: App.account })
              .then((data) => {
                console.log("airportIndex ", data);
                airportIndex = data.c[0];
              });

            airportsInstance
              .getAirportPricePerBag({ from: address })
              .then((data) => {
                price = data.c[0];
                console.log("price ", price);

                airportsInstance
                  .getTotalUnclaimedBaggage({ from: address })
                  .then((data) => {
                    quantity = data.c[0];
                    console.log("count ", quantity);

                    console.log(
                      "index = " + index,
                      "airportIndex = ",
                      airportIndex,
                      "address = ",
                      address,
                      "price = ",
                      price,
                      "quantity = ",
                      quantity
                    );
                    App.airports.push({
                      airportIndex: airportIndex,
                      address: address,
                      price: price,
                      quantity: quantity,
                    });
                    if (index == count - 1) {
                      console.log("App.airports FinalList = ", App.airports);
                      App.handleUpdateAirportsList();
                    }
                  });
              });
          }
        });
      });
  },

  accountSwitched: function () {

    console.log("accountSwitched Called");
    
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
      App.accountType = 99;
      App.checkMemeberShipStatus();
      
      $.getScript("UI.js", function () {
       resetUIFields();
       App.airports = [];
        }
      );
      // Do any other work!
    }
  },

  bindEvents: function () {
    $(document).on("click", "#airportRegister", function () {
      var airportIndex = $("#airport_list").val();
      var perPriceBag = $("#perPriceBag").val();
      App.handleAirportRegistration(airportIndex, perPriceBag);
    }); //register airports
    $(document).on("click", "#customerRegister", function () {
      App.handleCustomerRegistration();
    }); //register customer
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
      App.handleResponseToClaimBaggage(2, hashDetailsWhileClaim);
    }); //claim response - approve
    $(document).on("click", "#disapproveClaim", function () {
      var hashDetailsWhileClaim = $("#hashDetailsWhileResponse").val();
      App.handleResponseToClaimBaggage(3, hashDetailsWhileClaim);
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
      App.handleAirportUnregistration(unregisterAirportName);
    }); //unregister airports
    $(document).on("click", "#customerButtonUnregister", function () {
      var unregisterAirportName = $("#customerAddressUnregister").val();
      App.handleCustomerUnregistration(unregisterAirportName);
    }); //unregister customers
    $(document).on("click", "#bonusButtonAllotment", function () {
      var bonusAddress = $("#bonusAddressToken").val();
      App.handleBonusAllotment(bonusAddress);
    }); //allot bonus
    $(document).on("click", "#getBalanceButton", App.handleBalance); //add baggage
    $(document).on("click", "#airportTypeButton", function () {
      App.accountType = 1;
      App.checkMemeberShipStatus();
    });
    $(document).on("click", "#customerTypeButton", function () {
      App.accountType = 0;
      App.checkMemeberShipStatus();
    });
    $(document).on("click", "#getDetailsWhileClaim", function () {
      var index = $("#sellingAirportWhileClaim").val();
      App.showBagDetails(index);
    });
    $(document).on("click", "#getDetailsWhileSettle", function () {
      var index = $("#sellingAirportWhileSettle").val();
      App.showBagDetails(index);
    });
    

    App.loadParticleJs();

  },
  

  loadAllAirports: function () {

    var airportList = jQuery("#airport_list");
    airportList.empty();
    for (var i = 0; i < App.names.length; i++) {
      var newOption = jQuery(
        '<option value="' + i + '">' + App.names[i] + "</option>"
      );
      airportList.append(newOption);
    }
  },

  showBagDetails: function (index) {
    var claiemedInstance;

    App.contracts.claim
      .deployed()
      .then(function (instance) {
        claiemedInstance = instance;

        return claiemedInstance.getTotalUnclaimedBaggage({
          from: App.airports[index].address,
        });
      })
      .then(function (result, err) {
        alert(
          "Price Per Bag: " +
          App.airports[index].price +
          "\n" +
          "Avalaible Quantity: " +
          result.c[0]
        );
      });
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

  handleAirportRegistration: function (airportIndex, pricePerBaggage) {
    console.log("airportIndex = " + airportIndex);
    console.log("pricePerBaggage = " + pricePerBaggage);
    for (var i = 0; i < App.airports.length; i++) {
      if (App.airports[i].address == App.account) {
        alert("Airport already registered");
        return;
      }
    }
    var price = pricePerBaggage;
    var airportsRegistryInstance;

    App.contracts.claim
      .deployed()
      .then(function (instance) {
        airportsRegistryInstance = instance;

        return airportsRegistryInstance.registerAirports(airportIndex, price, {
          from: App.account,
        });
      })
      .then(function (result, err) {
        if (result) {
          console.log("result: %o", result);
          console.log(result.receipt.status);
          if (parseInt(result.receipt.status) == 1) {
            alert(App.account + " Airport registered successfully");
            App.airports.push({
              airportIndex: airportIndex,
              address: App.account,
              price: pricePerBaggage,
              quantity: 0,
            });
            console.log(App.airports);
            App.handleUpdateAirportsList();
            App.checkMemeberShipStatus();
          } else
            alert(App.account + " Airport registration failed due to revert");
        } else {
          alert(App.account + " Airports registration failed");
        }
      });
  },

  handleCustomerRegistration: function () {
    App.contracts.claim
      .deployed()
      .then(function (instance) {
        customerRegistryInstance = instance;

        return customerRegistryInstance.registerCustomer({
          from: App.account,
        });
      })
      .then(function (result, err) {
        if (result) {
          console.log("result: %o", result);
          console.log(result.receipt.status);
          if (parseInt(result.receipt.status) == 1) {
            alert(App.account + " Customer registered successfully");
            App.checkMemeberShipStatus();
          } else
            alert(App.account + " Customer registration failed due to revert");
        } else {
          alert(App.account + " Customer registration failed");
        }
      });
  },

  handleBonusAllotment: function (address) {
    App.contracts.claim
      .deployed()
      .then(function (instance) {
        customerRegistryInstance = instance;

        return customerRegistryInstance.giveJoiningBonus(address,{
          from: App.account,
        });
      })
      .then(function (result, err) {
        if (result) {
          console.log("result: %o", result);
          console.log(result.receipt.status);
          if (parseInt(result.receipt.status) == 1) {
            alert(App.account + " Bonus given successfully");
            App.checkMemeberShipStatus();
          } else
            alert(App.account + " Bonus allotment failed due to revert");
        } else {
          alert(App.account + " Bonus allotmenr failed");
        }
      });
  },

  handleUpdateAirportsList: function () {
    var sellingAirportWhileClaim = jQuery("#sellingAirportWhileClaim");
    var sellingAirportWhileSettle = jQuery("#sellingAirportWhileSettle");
    var unregisterAirportName = jQuery("#unregisterAirportName");
    sellingAirportWhileClaim.empty();
    for (var i = 0; i < App.airports.length; i++) {
      var newOption = jQuery(
        '<option value="' + i + '">' + App.names[App.airports[i].airportIndex] + "</option>"
      );
      sellingAirportWhileClaim.append(newOption);
    }
    sellingAirportWhileSettle.empty();
    for (var i = 1; i < App.airports.length; i++) {
      var newOption = jQuery(
        '<option value="' + i + '">' + App.names[App.airports[i].airportIndex] + "</option>"
      );
      sellingAirportWhileSettle.append(newOption);
    }
    unregisterAirportName.empty();
    for (var i = 1; i < App.airports.length; i++) {
      var newOption = jQuery(
        '<option value="' + i + '">' + App.names[App.airports[i].airportIndex] + "</option>"
      );
      unregisterAirportName.append(newOption);
    }
  },

  handleAddBaggage: function (bagCount) {
    var addBaggageInstance;

    App.contracts.claim
      .deployed()
      .then(function (instance) {
        addBaggageInstance = instance;

        return addBaggageInstance.addBaggaage(bagCount, { from: App.account });
      })
      .then(function (result, err) {
        if (result) {
          console.log("result: %o", result);
          console.log(result.receipt.status);
          if (parseInt(result.receipt.status) == 1)
            alert(App.account + " Baggage added successfully");
          else alert(App.account + " Baggage failed due to revert");
        } else {
          alert(App.account + " Baggage add failed");
        }
      });
  },

  handleRequestBaggage: function (index, bagCount, hashDetails) {
    var airportsRequestInstance;
    var amountToSend = bagCount * App.airports[index].price;

    App.contracts.claim
      .deployed()
      .then(function (instance) {
        airportsRequestInstance = instance;

        return airportsRequestInstance.requestToClaimBaggage(
          App.airports[index].address,
          hashDetails,
          bagCount,
          {
            from: App.account,
            value: web3.toWei(amountToSend, "ether"),
          }
        );
      })
      .then(function (result, err) {
        if (result) {
          console.log("result: %o", result);
          console.log(result.receipt.status);
          if (parseInt(result.receipt.status) == 1)
            alert(App.account + " Baggage Requested successfully");
          else alert(App.account + " Baggage Request failed due to revert");
        } else {
          alert(App.account + " Baggage Request failed");
        }
      });
  },

  handleResponseToClaimBaggage: function (done, hashOfDetails) {
    var airportsResponseInstance;

    App.contracts.claim
      .deployed()
      .then(function (instance) {
        airportsResponseInstance = instance;

        return airportsResponseInstance.responseToClaimBaggage(
          done,
          hashOfDetails,
          { from: App.account }
        );
      })
      .then(function (result, err) {
        if (result) {
          console.log("result: %o", result);
          console.log(result.receipt.status);
          if (parseInt(result.receipt.status) == 1)
            alert(App.account + " Baggage Response submitted successfully");
          else alert(App.account + " Baggage Response failed due to revert");
        } else {
          alert(App.account + " Baggage Response failed");
        }
      });
  },

  handleSettlePayment: function (index, hashOfDetails) {
    var airportsSettleInstance;

    App.contracts.claim
      .deployed()
      .then(function (instance) {
        airportsSettleInstance = instance;
        console.log(
          "App.airports[index].address ",
          App.airports[index].address
        );
        console.log("hashOfDetails ", hashOfDetails);

        return airportsSettleInstance.settlePayment(
          App.airports[index].address,
          hashOfDetails,
          { from: App.account }
        );
      })
      .then(function (result, err) {
        if (result) {
          console.log("result: %o", result);
          console.log(result.receipt.status);
          if (parseInt(result.receipt.status) == 1)
            alert(App.account + " Payment settled successfully");
          else alert(App.account + " Payment failed due to revert");
        } else {
          alert(App.account + " Payment failed");
        }
      });
  },

  handleAirportUnregistration: function (index) {
    var airportsRegistryInstance;
    var sellingAirport = App.airports[index].address;

    App.contracts.claim
      .deployed()
      .then(function (instance) {
        airportsRegistryInstance = instance;

        return airportsRegistryInstance.unregisterAirports(sellingAirport, {
          from: App.account,
        });
      })
      .then(function (result, err) {
        if (result) {
          console.log("result: %o", result);
          console.log(result.receipt.status);
          if (parseInt(result.receipt.status) == 1) {
            alert(App.account + " Airport unregistrerd successfully");
            App.updateRemoveAirport(sellingAirport);
          } else
            alert(
              App.account + " Airport unregistration failed due to revert"
            );
        } else {
          alert(App.account + " Airport unregistration failed");
        }
      });
  },

  handleCustomerUnregistration: function (address) {
    var customerRegistryInstance;

    App.contracts.claim
      .deployed()
      .then(function (instance) {
        customerRegistryInstance = instance;

        return customerRegistryInstance.unregisterCustomer(address, {
          from: App.account,
        });
      })
      .then(function (result, err) {
        if (result) {
          console.log("result: %o", result);
          console.log(result.receipt.status);
          if (parseInt(result.receipt.status) == 1) {
            alert(App.account + " Customer unregistrerd successfully");
          } else
            alert(
              App.account + " Customer unregistration failed due to revert"
            );
        } else {
          alert(App.account + " Customer unregistration failed");
        }
      });
  },

  updateRemoveAirport: function (sellingAirport) {
    var tempAirports = [];
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
        return claimInstance.balanceOf({ from: App.account });
      })
      .then(function (res) {
        console.log(res);
        alert(" Current Balance: " + res + " ETH");
        // alert("  Balance is result: " + res);
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
        return claimInstance.getMembershipStatus({ from: App.account });
      })
      .then(function (res) {
        console.log(res);
        if (res.c[0] == 0) {
          if (App.accountType != 0 && App.accountType != 1) {
            App.accountType = 99;
          }
        } else if (res.c[0] == 1) {
          App.accountType = 1;
        } else if (res.c[0] == 3) {
          App.accountType = 0;
        } else {
          App.accountType = 99;
        }
        App.screenFilter(res);
      })
      .catch(function (err) {
        console.log(err.message);
      });
  },

  screenFilter: function (memeberShip) {
    App.loadRegisteredAirports();
    console.log("To screen filter");
    var memebershipStatus = memeberShip.c[0];
    $.getScript("UI.js", function() {
      updateUIState(memebershipStatus, App.accountType);
    });
  },

  loadParticleJs: function () {
    $.getScript("UI.js", function () {
      particleInit();  // call particleInit() function
    });
  },
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});