App = {
  web3Provider: null,
  contracts: {},
  airports: new Array({}),
  names: new Array(),
  url: 'http://127.0.0.1:7545',
  airportAuthority:null,
  currentAccount:null,
  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
        // Is there is an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fallback to the TestRPC
      App.web3Provider = new Web3.providers.HttpProvider(App.url);
    }
    web3 = new Web3(App.web3Provider);

    ethereum.enable();

    App.testFunction();

    App.populateAddress();
    return App.initContract();
  },

  initContract: function() {
    $.getJSON('AirlineLostBaggage.json', function(data) {
    // Get the necessary contract artifact file and instantiate it with truffle-contract
    var airlineContractJsonData = data;
    App.contracts.claim = TruffleContract(airlineContractJsonData);

    // Set the provider for our contract
    App.contracts.claim.setProvider(App.web3Provider);
    
    App.getAirportAuthority();
    return App.bindEvents();
  }).then(function(){
    App.contracts.claim.deployed().then(function(instance) {
      airlinesInstance = instance;
      var airlinesCount ;
      airlinesInstance.getAirlinesCount({from: App.account}).then(data=>{
         console.log('data',data.c[0]);
      airlinesCount=data.c[0];
      for(var i = 0; i < airlinesCount; i++){
              var name ;
              var address;
              airlinesInstance.getAirlinesName(i, {from: App.account}).then(data=>{
                console.log('name',data);
                name=data;
              } );
              airlinesInstance.getAirlinesAddress(i, {from: App.account}).then(data=>{
                console.log('address',data);
                address=data;
                App.airports.push({name:name,address:address});
                console.log(App.airports)
                App.handleUpdateAirlinesList();
              });
            }
       })
      
      return App.airports;
    }).then(function(res){
    console.log(res);
      alert("  Airlines: %o "+ res);
    }).catch(function(err){
      console.log(err.message);
    })
  });
  },

  testFunction: function() {

    ethereum
  .request({ method: 'eth_accounts' })
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
ethereum.on('accountsChanged', App.handleAccountsChanged);

// For now, 'eth_accounts' will continue to always return an array


  },

  handleAccountsChanged: function(accounts){
    console.log(accounts);
    if (accounts.length === 0) {
      // MetaMask is locked or the user has not connected any accounts
      console.log('Please connect to MetaMask.');
    } else if (accounts[0] !== App.account) {
      App.account = accounts[0];
      console.log('Account changed to ' + App.account);
      // Do any other work!
    }
  } ,

  bindEvents: function() {
    $(document).on('click', '#airportRegister', function(){ var airportname = $('#airportName').val(); var perPriceBag = $('#perPriceBag').val();App.handleRegistration(airportname,perPriceBag); });//register airlines
    $(document).on('click', '#addBaggage', function(){ var totalAddBaggageNumber = $('#totalAddBaggageNumber').val(); App.handleAddBaggage(totalAddBaggageNumber); });//add baggage
    $(document).on('click', '#claimBaggageRequest', function(){ var sellingAirportWhileClaim = $('#sellingAirportWhileClaim').val();var totalClaimBaggageNumber = $('#totalClaimBaggageNumber').val();var hashDetailsWhileClaim = $('#hashDetailsWhileClaim').val(); App.handleRequestBaggage(sellingAirportWhileClaim, totalClaimBaggageNumber, hashDetailsWhileClaim); });//claim request
    $(document).on('click', '#claimBaggageResponse', function(){ var totalClaimBaggageNumber = $('#totalClaimBaggageNumber').val();var hashDetailsWhileClaim = $('#hashDetailsWhileClaim').val(); App.handleRequestBaggage(sellingAirportWhileClaim, totalClaimBaggageNumber, hashDetailsWhileClaim); });//claim response
    $(document).on('click', '#pay', function(){ var sellingAirportWhileSettle = $('#sellingAirportWhileSettle').val();var hashDetailsWhileSettle = $('#hashDetailsWhileSettle').val(); App.handleSettlePayment(sellingAirportWhileSettle, hashDetailsWhileSettle); });//settlePayment
    $(document).on('click', '#airportUnregister', function(){ var unregisterAirportName = $('#unregisterAirportName').val(); App.handleUnregistration(unregisterAirportName); });//unregister airlines
    $(document).on('click', '#balance', App.handleBalance);//add baggage
  },

  populateAddress : function(){
    console.log("populateAddress called");
    new Web3(new Web3.providers.HttpProvider(App.url)).eth.getAccounts((err, accounts) => {
      web3.eth.defaultAccount=web3.eth.accounts[0]
      jQuery.each(accounts,function(i){
        // if(web3.eth.coinbase != accounts[i]){
        //   var optionElement = '<option value="'+accounts[i]+'">'+accounts[i]+'</option';
        //   jQuery('#enter_address').append(optionElement);  
        // }
      });
    });
  },

  getAirportAuthority : function(){
    App.contracts.claim.deployed().then(function(instance) {
      console.log("result: ");
      return instance;
    }).then(function(result) {
      console.log("result: %o", result);
      App.airportAuthority = result.constructor.currentProvider.selectedAddress.toString();
      App.currentAccount = web3.eth.coinbase;
      if(App.airportAuthority != App.currentAccount){
        jQuery('#address_div').css('display','none');
        jQuery('#register_div').css('display','none');
      }else{
        jQuery('#address_div').css('display','block');
        jQuery('#register_div').css('display','block');
      }
    })
  },

  handleRegistration: function(airlinesName,pricePerBaggage) {

    for(var i = 0; i < App.airports.length; i++){
      if(App.airports[i].name == airlinesName){
        alert("Airport already registered");
        return;
      }
    }

    var airlinesRegistryInstance;

    web3.eth.getAccounts(function(error, accounts) {
      var account = accounts[0];

      App.contracts.claim.deployed().then(function(instance) {
        airlinesRegistryInstance = instance;

        return airlinesRegistryInstance.registerAirlines(airlinesName, pricePerBaggage, {from: account});
      }).then(function(result, err){
            if(result){
              console.log("result: %o", result);
                console.log(result.receipt.status);
                if(parseInt(result.receipt.status) == 1){
                  alert(account + " Airlines registration done successfully")
                  App.airports.push({name:airlinesName,address:account});
                  console.log(App.airports);
                  App.handleUpdateAirlinesList();
                }
                else
                  alert(account + " Airlines registration failed due to revert")
            } else {
                  alert(account + " Airlines registration failed")
            }   
        });
    });
  },

  handleUpdateAirlinesList: function(){
    var sellingAirportWhileClaim = jQuery('#sellingAirportWhileClaim');
    var sellingAirportWhileSettle = jQuery('#sellingAirportWhileSettle');
    var unregisterAirportName = jQuery('#unregisterAirportName');
    for(var i = 1; i < App.airports.length; i++){
      var newOption = jQuery('<option value="'+App.airports[i].address+'">'+App.airports[i].name+'</option>');
      sellingAirportWhileClaim.append(newOption);
    }

    for(var i = 1; i < App.airports.length; i++){
      var newOption = jQuery('<option value="'+App.airports[i].address+'">'+App.airports[i].name+'</option>');
      sellingAirportWhileSettle.append(newOption);
    }

    for(var i = 1; i < App.airports.length; i++){
      var newOption = jQuery('<option value="'+App.airports[i].address+'">'+App.airports[i].name+'</option>');
      unregisterAirportName.append(newOption);
    }

  },


  handleAddBaggage: function(bagCount) {
    var addBaggageInstance;

    web3.eth.getAccounts(function(error, accounts) {
      var account = accounts[0];

      App.contracts.claim.deployed().then(function(instance) {
        addBaggageInstance = instance;

        return addBaggageInstance.addBaggaage(bagCount,{from: account});
      }).then(function(result, err){
            if(result){
              console.log("result: %o", result);
                console.log(result.receipt.status);
                if(parseInt(result.receipt.status) == 1)
                alert(account + " Baggage added successfully")
                else
                alert(account + " Baggage failed due to revert")
            } else {
                alert(account + " Baggage add failed")
            }   
        });
    });
  },

  handleRequestBaggage: function(sellingAirline, bagCount, hashDetails) {
    var airlinesRequestInstance;

    web3.eth.getAccounts(function(error, accounts) {
      var account = accounts[0];

      App.contracts.claim.deployed().then(function(instance) {
        airlinesRequestInstance = instance;

        return airlinesRequestInstance.requestToClaimBaggage(sellingAirline, hashDetails, bagCount,{from: account, value: web3.toWei(web3.eth.getBalance(account), "wei")});
      }).then(function(result, err){
            if(result){
              console.log("result: %o", result);
                console.log(result.receipt.status);
                if(parseInt(result.receipt.status) == 1)
                alert(account + " Baggage Requested successfully")
                else
                alert(account + " Baggage Request failed due to revert")
            } else {
                alert(account + " Baggage Request failed")
            }   
        });
    });
  },

  handleResponseToClaimBaggage: function(done, hashOfDetails) {
    event.preventDefault();
    var airlinesResponseInstance;

    web3.eth.getAccounts(function(error, accounts) {
      var account = accounts[0];

      App.contracts.claim.deployed().then(function(instance) {
        airlinesResponseInstance = instance;

        return airlinesResponseInstance.responseToClaimBaggage(done, hashOfDetails,{from: account});
      }).then(function(result, err){
            if(result){
              console.log("result: %o", result);
                console.log(result.receipt.status);
                if(parseInt(result.receipt.status) == 1)
                alert(account + " Baggage Response successfully")
                else
                alert(account + " Baggage Response failed due to revert")
            } else {
                alert(account + " Baggage Response failed")
            }   
        });
    });
  },


  handleSettlePayment: function(sellingAirline, hashOfDetails) {
    var airlinesSettleInstance;

    web3.eth.getAccounts(function(error, accounts) {
      var account = accounts[0];

      App.contracts.claim.deployed().then(function(instance) {
        airlinesSettleInstance = instance;

        return airlinesSettleInstance.settlePayment(sellingAirline, hashOfDetails,{from: account});
      }).then(function(result, err){
            if(result){
              console.log("result: %o", result);
                console.log(result.receipt.status);
                if(parseInt(result.receipt.status) == 1)
                alert(account + " Payment settled successfully")
                else
                alert(account + " Payment failed due to revert")
            } else {
                alert(account + " Payment failed")
            }   
        });
    });
  },


  handleUnregistration: function(sellingAirline) {
    var airlinesRegistryInstance;

    web3.eth.getAccounts(function(error, accounts) {
      var account = accounts[0];

      App.contracts.claim.deployed().then(function(instance) {
        airlinesRegistryInstance = instance;

        return airlinesRegistryInstance.unregisterAirlines(sellingAirline, {from: account});
      }).then(function(result, err){
            if(result){
              console.log("result: %o", result);
                console.log(result.receipt.status);
                if(parseInt(result.receipt.status) == 1)
                alert(account + " Airlines unregistrerd successfully")
                else
                alert(account + " Airlines unregistration failed due to revert")
            } else {
                alert(account + " Airlines unregistration failed")
            }   
        });
    });
  },

  handleBalance : function() {
    console.log("To current escrow balance");
    var claimInstance;
    App.contracts.claim.deployed().then(function(instance) {
      claimInstance = instance;
      return claimInstance.getBalance({from: App.account});
    }).then(function(res){
    console.log(res);
      alert("  Balance is result: "+ res);
    }).catch(function(err){
      console.log(err.message);
    })
  },


  screenFilter: function(memeberShip){
    
  }





};






$(function() {
  $(window).load(function() {
    App.init();
  });
});
