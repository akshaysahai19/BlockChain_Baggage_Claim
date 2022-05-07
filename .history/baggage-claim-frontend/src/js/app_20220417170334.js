App = {
  web3Provider: null,
  contracts: {},
  airports: new Array({}),
  names: new Array(),
  url: "http://127.0.0.1:7545",
  airportAuthority: null,
  accountType: 99, //0-customer, 1-airport
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
            .then(async (data) => {
              console.log("data", data.c[0]);
              airportsCount = data.c[0];

              for (var i = 0; i < airportsCount; i++) {
                // var airport = await App.fetchAirports(i);
                await App.fetchAirports(i, airportsCount);
              }
              console.log("App.airports FinalList = ", App.airports);
            });
          console.log("testFunction Called");
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
        })
        .catch(function (err) {
          console.log(err.message);
        });
    });
  },

  fetchAirports: function (index, count) {
    var name;
    var address;
    var price;
    var quantity;

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
              .getAirportsName(index, { from: App.account })
              .then((data) => {
                console.log("name ", data);
                name = data;
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
                    "name = ",
                    name,
                    "address = ",
                    address,
                    "price = ",
                    price,
                    "quantity = ",
                    quantity
                  );
                  App.airports.push({
                    name: name,
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
      App.handleAirportRegistration(airportname, perPriceBag);
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
      App.handleResponseToClaimBaggage(1, hashDetailsWhileClaim);
    }); //claim response - approve
    $(document).on("click", "#disapproveClaim", function () {
      var hashDetailsWhileClaim = $("#hashDetailsWhileResponse").val();
      App.handleResponseToClaimBaggage(0, hashDetailsWhileClaim);
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

  showBagDetails: function (index) {
    alert("Price Per Bag: "+App.airports[index].price+"\n"+"Avalaible Quantity: "+App.airports[index].quantity);
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

  handleAirportRegistration: function (airportsName, pricePerBaggage) {
    console.log("airportsName = " + airportsName);
    console.log("pricePerBaggage = " + pricePerBaggage);
    for (var i = 1; i < App.airports.length; i++) {
      if (App.airports[i].address == App.account) {
        alert("Airport already registered");
        return;
      }
    }
    var price = web3.toWei(pricePerBaggage, "ether");
    var airportsRegistryInstance;

    App.contracts.claim
      .deployed()
      .then(function (instance) {
        airportsRegistryInstance = instance;

        return airportsRegistryInstance.registerAirports(airportsName, price, {
          from: App.account,
        });
      })
      .then(function (result, err) {
        if (result) {
          console.log("result: %o", result);
          console.log(result.receipt.status);
          if (parseInt(result.receipt.status) == 1) {
            alert(App.account + " Airports registration done successfully");
            App.airports.push({
              name: airportsName,
              address: App.account,
              price: pricePerBaggage,
              quantity: 0,
            });
            console.log(App.airports);
            App.handleUpdateAirportsList();
            App.checkMemeberShipStatus();
          } else
            alert(App.account + " Airports registration failed due to revert");
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
            alert(App.account + " Customer registration done successfully");
            App.checkMemeberShipStatus();
          } else
            alert(App.account + " Customer registration failed due to revert");
        } else {
          alert(App.account + " Customer registration failed");
        }
      });
  },

  handleUpdateAirportsList: function () {
    var sellingAirportWhileClaim = jQuery("#sellingAirportWhileClaim");
    var sellingAirportWhileSettle = jQuery("#sellingAirportWhileSettle");
    var unregisterAirportName = jQuery("#unregisterAirportName");
    sellingAirportWhileClaim.empty();
    for (var i = 1; i < App.airports.length; i++) {
      var newOption = jQuery(
        '<option value="' + i + '">' + App.airports[i].name + "</option>"
      );
      sellingAirportWhileClaim.append(newOption);
    }
    sellingAirportWhileSettle.empty();
    for (var i = 1; i < App.airports.length; i++) {
      var newOption = jQuery(
        '<option value="' + i + '">' + App.airports[i].name + "</option>"
      );
      sellingAirportWhileSettle.append(newOption);
    }
    unregisterAirportName.empty();
    for (var i = 1; i < App.airports.length; i++) {
      var newOption = jQuery(
        '<option value="' + i + '">' + App.airports[i].name + "</option>"
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
            alert(App.account + " Baggage Response successfully");
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
            alert(App.account + " Airports unregistrerd successfully");
            App.updateRemoveAirport(sellingAirport);
          } else
            alert(
              App.account + " Airports unregistration failed due to revert"
            );
        } else {
          alert(App.account + " Airports unregistration failed");
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
        return claimInstance.getBalance({ from: App.account });
      })
      .then(function (res) {
        console.log(res);
        alert(" Current Balance: " + res / 10 ** 18 + " ETH");
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
    memeberShip = memeberShip.c[0];
    if (App.accountType == 0) {
      if (memeberShip == 0) {
        $("#registerCustomerCard").css("display", "block");
        $("#registerAirportCard").css("display", "none");
        $("#claimRequestCard").css("display", "none");
        $("#settlePaymentCard").css("display", "none");
        $("#airportTitle").css("display", "none");
        $("#buyerTitle").css("display", "none");
        $("#addbaggageCard").css("display", "none");
        $("#claimResponseCard").css("display", "none");
        $("#unregisterAirportCard").css("display", "none");
        $("#unregisterCustomerCard").css("display", "none");
        $("#authorityTitle").css("display", "none");
        $("#changeAccountTypeCard").css("display", "none");
        $("#getBalanceCard").css("display", "none");
      } else if (memeberShip == 3) {
        $("#registerCustomerCard").css("display", "none");
        $("#registerAirportCard").css("display", "none");
        $("#claimRequestCard").css("display", "block");
        $("#settlePaymentCard").css("display", "block");
        $("#airportTitle").css("display", "none");
        $("#buyerTitle").css("display", "block");
        $("#addbaggageCard").css("display", "none");
        $("#claimResponseCard").css("display", "none");
        $("#unregisterAirportCard").css("display", "none");
        $("#unregisterCustomerCard").css("display", "none");
        $("#authorityTitle").css("display", "none");
        $("#changeAccountTypeCard").css("display", "none");
        $("#getBalanceCard").css("display", "block");
      }
    } else if (App.accountType == 1) {
      if (memeberShip == 0) {
        $("#registerCustomerCard").css("display", "none");
        $("#registerAirportCard").css("display", "block");
        $("#claimRequestCard").css("display", "none");
        $("#settlePaymentCard").css("display", "none");
        $("#airportTitle").css("display", "none");
        $("#buyerTitle").css("display", "none");
        $("#addbaggageCard").css("display", "none");
        $("#claimResponseCard").css("display", "none");
        $("#unregisterAirportCard").css("display", "none");
        $("#unregisterCustomerCard").css("display", "none");
        $("#authorityTitle").css("display", "none");
        $("#changeAccountTypeCard").css("display", "none");
        $("#getBalanceCard").css("display", "none");
      } else if (memeberShip == 1) {
        $("#registerCustomerCard").css("display", "none");
        $("#registerAirportCard").css("display", "none");
        $("#claimRequestCard").css("display", "none");
        $("#settlePaymentCard").css("display", "none");
        $("#airportTitle").css("display", "block");
        $("#buyerTitle").css("display", "none");
        $("#addbaggageCard").css("display", "block");
        $("#claimResponseCard").css("display", "block");
        $("#unregisterAirportCard").css("display", "none");
        $("#unregisterCustomerCard").css("display", "none");
        $("#authorityTitle").css("display", "none");
        $("#changeAccountTypeCard").css("display", "none");
        $("#getBalanceCard").css("display", "block");
      }
    } else {
      if (memeberShip == 0) {
        $("#registerCustomerCard").css("display", "none");
        $("#registerAirportCard").css("display", "none");
        $("#claimRequestCard").css("display", "none");
        $("#settlePaymentCard").css("display", "none");
        $("#airportTitle").css("display", "none");
        $("#buyerTitle").css("display", "none");
        $("#addbaggageCard").css("display", "none");
        $("#claimResponseCard").css("display", "none");
        $("#unregisterAirportCard").css("display", "none");
        $("#unregisterCustomerCard").css("display", "none");
        $("#authorityTitle").css("display", "none");
        $("#changeAccountTypeCard").css("display", "block");
        $("#getBalanceCard").css("display", "none");
      }

      if (memeberShip == 2) {
        $("#registerCustomerCard").css("display", "none");
        $("#registerAirportCard").css("display", "none");
        $("#claimRequestCard").css("display", "none");
        $("#settlePaymentCard").css("display", "none");
        $("#airportTitle").css("display", "none");
        $("#buyerTitle").css("display", "none");
        $("#addbaggageCard").css("display", "none");
        $("#claimResponseCard").css("display", "none");
        $("#unregisterAirportCard").css("display", "block");
        $("#unregisterCustomerCard").css("display", "block");
        $("#authorityTitle").css("display", "block");
        $("#changeAccountTypeCard").css("display", "none");
        $("#getBalanceCard").css("display", "none");
      }
    }
  },
};

loadParticleJs: function() {

  $(document).ready(function () {
    /* ---- particles.js config ---- */
    console.log("particles.js config loading...");
    particlesJS("particles-js", {
      particles: {
        number: {
          value: 380,
          density: {
            enable: true,
            value_area: 800,
          },
        },
        color: {
          value: "#3eb3e9",
        },
        shape: {
          type: "circle",
          stroke: {
            width: 0,
            color: "#3eb3e9",
          },
          polygon: {
            nb_sides: 5,
          },
          image: {
            src: "img/github.svg",
            width: 100,
            height: 100,
          },
        },
        opacity: {
          value: 0.2,
          random: false,
          anim: {
            enable: false,
            speed: 1,
            opacity_min: 0.1,
            sync: false,
          },
        },
        size: {
          value: 3,
          random: true,
          anim: {
            enable: false,
            speed: 40,
            size_min: 0.1,
            sync: false,
          },
        },
        line_linked: {
          enable: true,
          distance: 150,
          color: "#3eb3e9",
          opacity: 0.2,
          width: 1,
        },
        move: {
          enable: true,
          speed: 10,
          direction: "none",
          random: false,
          straight: false,
          out_mode: "out",
          bounce: false,
          attract: {
            enable: false,
            rotateX: 600,
            rotateY: 1200,
          },
        },
      },
      interactivity: {
        detect_on: "canvas",
        events: {
          onhover: {
            enable: true,
            mode: "grab",
          },
          onclick: {
            enable: true,
            mode: "push",
          },
          resize: true,
        },
        modes: {
          grab: {
            distance: 140,
            line_linked: {
              opacity: 1,
            },
          },
          bubble: {
            distance: 400,
            size: 40,
            duration: 2,
            opacity: 8,
            speed: 3,
          },
          repulse: {
            distance: 200,
            duration: 0.4,
          },
          push: {
            particles_nb: 4,
          },
          remove: {
            particles_nb: 2,
          },
        },
      },
      retina_detect: true,
    });


}



$(function () {
  $(window).load(function () {
    App.init();
  });
});
