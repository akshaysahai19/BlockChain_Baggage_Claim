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
    $(document).on('click', '.btn-vote', App.handleRegistration);//register airlines
    $(document).on('click', '#win-count', App.handleAddBaggage);//add baggage
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

  handleRegister: function(addr){
    var voteInstance;
    web3.eth.getAccounts(function(error, accounts) {
    var account = accounts[0];
    App.contracts.vote.deployed().then(function(instance) {
      voteInstance = instance;
      return voteInstance.register(addr, {from: account});
    }).then(function(result, err){
        if(result){
            if(parseInt(result.receipt.status) == 1)
            alert(addr + " registration done successfully")
            else
            alert(addr + " registration not failed due to revert")
        } else {
            alert(addr + " registration failed")
        }   
    })
    })
},

  handleRegistration: function(event) {
    event.preventDefault();
    var airlinesName = "A";//pass these values from the UI
    var pricePerBaggage = 1;//
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
                alert(account + " Airlines unre")
            }   
        });
    });
  },


  handleAddBaggage: function(event) {
    event.preventDefault();
    var bagCount = 23;//pass these values from the UI

    web3.eth.getAccounts(function(error, accounts) {
      var account = accounts[0];

      App.contracts.claim.deployed().then(function(instance) {
        airlinesRegistryInstance = instance;

        return airlinesRegistryInstance.addBaggaage(bagCount, 0,{from: account});
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

    web3.eth.getAccounts(function(error, accounts) {
      var account = accounts[0];

      App.contracts.claim.deployed().then(function(instance) {
        airlinesRegistryInstance = instance;

        return airlinesRegistryInstance.requestToClaimBaggage(sellingAirline, hashOfDetails, buyQuantity,{from: account});
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

    web3.eth.getAccounts(function(error, accounts) {
      var account = accounts[0];

      App.contracts.claim.deployed().then(function(instance) {
        airlinesRegistryInstance = instance;

        return airlinesRegistryInstance.responseToClaimBaggage(purchaseFrom, hashOfDetails, buyQuantity,{from: account});
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

    web3.eth.getAccounts(function(error, accounts) {
      var account = accounts[0];

      App.contracts.claim.deployed().then(function(instance) {
        airlinesRegistryInstance = instance;

        return airlinesRegistryInstance.settlePayment(sellingAirline, hashOfDetails,{from: account});
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

  handleWinner : function() {
    console.log("To get winner");
    var voteInstance;
    App.contracts.vote.deployed().then(function(instance) {
      voteInstance = instance;
      return voteInstance.reqWinner();
    }).then(function(res){
    console.log(res);
      alert(App.names[res] + "  is the winner ! :)");
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
