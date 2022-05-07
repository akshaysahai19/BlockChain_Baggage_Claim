App = {
  web3Provider: null,
  contracts: {},
  names: new Array(),
  url: 'http://127.0.0.1:7545',
  airportAuthority:null,
  currentAccount:null,
  init: function() {
    $.getJSON('../proposals.json', function(data) {
      var proposalsRow = $('#proposalsRow');
      var proposalTemplate = $('#proposalTemplate');

      for (i = 0; i < data.length; i ++) {
        proposalTemplate.find('.panel-title').text(data[i].name);
        proposalTemplate.find('img').attr('src', data[i].picture);
        proposalTemplate.find('.btn-vote').attr('data-id', data[i].id);

        proposalsRow.append(proposalTemplate.html());
        App.names.push(data[i].name);
      }
    });
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
  });
  },

  bindEvents: function() {
    $(document).on('click', '#airportRegister', function(){ var ad = $('#airportName').val(); App.handleRegistration(ad); });//register airlines
    $(document).on('click', '#win-count', App.handleAddBaggage);//add baggage
    $(document).on('click', '#balance', App.handleBalance);//add baggage
    $(document).on('click', '#register', function(){ var ad = $('#enter_address').val(); App.handleRegister(ad); });
  },

  populateAddress : function(){
    console.log("populateAddress called");
    new Web3(new Web3.providers.HttpProvider(App.url)).eth.getAccounts((err, accounts) => {
      web3.eth.defaultAccount=web3.eth.accounts[0]
      jQuery.each(accounts,function(i){
        if(web3.eth.coinbase != accounts[i]){
          var optionElement = '<option value="'+accounts[i]+'">'+accounts[i]+'</option';
          jQuery('#enter_address').append(optionElement);  
        }
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

  handleRegistration: function(airlinesName) {
    // event.preventDefault();
    // var airlinesName = "A";//pass these values from the UI
    var pricePerBaggage = 10;//
    var airlinesRegistryInstance;

    web3.eth.getAccounts(function(error, accounts) {
      var account = accounts[0];

      App.contracts.claim.deployed().then(function(instance) {
        airlinesRegistryInstance = instance;

        return airlinesRegistryInstance.registerAirlines(airlinesName, pricePerBaggage, {from: account, value: web3.toWei(1, "ether")});
      }).then(function(result, err){
            if(result){
              console.log("result: %o", result);
                console.log(result.receipt.status);
                if(parseInt(result.receipt.status) == 1)
                alert(account + " Airlines registration done successfully")
                else
                alert(account + " Airlines registration failed due to revert")
            } else {
                alert(account + " Airlines registration failed")
            }   
        });
    });
  },

  handleUnregistration: function(event) {
    event.preventDefault();
    var sellingAirline = "ID";//pass these values from the UI
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


  handleAddBaggage: function(event) {
    event.preventDefault();
    var bagCount = 23;//pass these values from the UI
    var addBaggageInstance;

    web3.eth.getAccounts(function(error, accounts) {
      var account = accounts[0];

      App.contracts.claim.deployed().then(function(instance) {
        addBaggageInstance = instance;

        return addBaggageInstance.addBaggaage(bagCount, 0,{from: account});
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

  handleRequestBaggage: function(event) {
    event.preventDefault();
    var sellingAirline = "";//pass these values from the UI
    var hashOfDetails = 23;//pass these values from the UI
    var buyQuantity = 2;//pass these values from the UI
    var airlinesRequestInstance;

    web3.eth.getAccounts(function(error, accounts) {
      var account = accounts[0];

      App.contracts.claim.deployed().then(function(instance) {
        airlinesRequestInstance = instance;

        return airlinesRequestInstance.requestToClaimBaggage(sellingAirline, hashOfDetails, buyQuantity,{from: account});
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

  handleResponseToClaimBaggage: function(event) {
    event.preventDefault();
    var done = "";//pass these values from the UI
    var hashOfDetails = 23;//pass these values from the UI
    var airlinesResponseInstance;

    web3.eth.getAccounts(function(error, accounts) {
      var account = accounts[0];

      App.contracts.claim.deployed().then(function(instance) {
        airlinesResponseInstance = instance;

        return airlinesResponseInstance.responseToClaimBaggage(purchaseFrom, hashOfDetails, buyQuantity,{from: account});
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


  handleSettlePayment: function(event) {
    event.preventDefault();
    var sellingAirline = "";//pass these values from the UI
    var hashOfDetails = 23;//pass these values from the UI
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
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
