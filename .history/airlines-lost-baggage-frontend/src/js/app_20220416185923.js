App = {
  web3Provider: null,
  contracts: {},
  airports: new Array({}),
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
  }).then(function(){
    App.contracts.claim.deployed().then(function(instance) {
      airlinesInstance = instance;
      var airlinesCount ;
      airlinesInstance.getAirlinesCount({from: App.account}).then(data=>{
         console.log('data',data.c[0]);
      airlinesCount=data

       })
      alert("  airlinesCount: %o "+ airlinesCount);
      for(var i = 0; i < airlinesCount; i++){
        var name = airlinesInstance.getAirlineName(i, {from: App.account});
        var address = airlinesInstance.getAirlineAddress(i, {from: App.account});
        App.airports.push({name: name, address: address});
      }
      return App.airports;
    }).then(function(res){
    console.log(res);
      alert("  Airlines: %o "+ res);
    }).catch(function(err){
      console.log(err.message);
    })
  });
  },

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

  handleRegistration: function(airlinesName,pricePerBaggage) {

    // for (i = 0; i < App.airports.length; i ++) {
    //   if(App.airports[i] == airlinesName){
    //     alert("Airport already registered");
    //     return;
    //   }
    // }

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
                  App.airports.push([airlinesName]);
                  console.log(App.airports);
                }
                else
                  alert(account + " Airlines registration failed due to revert")
            } else {
                  alert(account + " Airlines registration failed")
            }   
        });
    });
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
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
