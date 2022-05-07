// SPDX-License-Identifier: MIT

// pragma solidity ^0.8.0;
pragma solidity >=0.4.24;


import "./BaggageClaim-IERC20.sol";


contract BaggageClaim  is IERC20{

// ERC20 token 
   //-----------------------------------------------------------------------------
    mapping(address => uint256) private _balances;

    mapping(address => mapping(address => uint256)) private _allowances;

    uint256 private _totalSupply;

    string private _name;
    string private _symbol;
    //-------------------------------------------------------------------------------

//


    address airportAuthority;
    uint public myBalance;


    struct details{
        uint status;
        uint hashOfDetails;
    }

    struct Memeberships{
        uint memebershipStatus;//0 new, //1-airport,//2-authority//3-customer
    }

    struct Airports{
        address airportAddress;
        string airportName;
    }

    struct AirportBaggage{
        uint timestamp;
        uint pricePerbag;
        uint totalBaggage;
        uint totalUnclaimedBaggage;
        uint totalBaggageClaimed;
    }

    struct ClaimRequest{
        uint requestStatus;
        uint requestQuantity;
        uint amount;
    }

    mapping (address => details) balanceDetails;
    mapping(address => AirportBaggage) airportBaggage;
    mapping(uint => ClaimRequest) claimRequest;
    mapping(address => Memeberships) memberships;
    Airports[] airportNames;


// Modifiers  
   //-----------------------------------------------------------------------------
   
    modifier onlyAirportAuthority(){
        require(msg.sender == airportAuthority);
        _;
    }

    modifier onlyAirport(){
        require(memberships[msg.sender].memebershipStatus==1);
        _;
    }

    modifier onlyCustomer(){
        require(memberships[msg.sender].memebershipStatus!=1);
        require(memberships[msg.sender].memebershipStatus!=2);
        _;
    }

    //-----------------------------------------------------------------------------  
  
//


//Constructor
        //-----------------------------------------------------------------------------  
    
    constructor ()  public{
           _name = 'Baggage Claim';
        _symbol = 'CUB';
        _totalSupply=10000;
        _balances[msg.sender] = _totalSupply;

        airportAuthority = msg.sender;
        // balanceDetails[msg.sender].escrow = msg.value;
        memberships[msg.sender].memebershipStatus = 2;
        myBalance = address(this).balance;
    }

    //-----------------------------------------------------------------------------  
  
//
    event LogMessage(string message, uint value);

// Airport Authority functions 
    //-----------------------------------------------------------------------------
     
    function unregisterCustomer(address  customer) public  onlyAirportAuthority{
        if(memberships[customer].memebershipStatus!=3){
            revert();
        }
        memberships[customer].memebershipStatus = 0;
        _approve(customer,airportAuthority, _balances[customer]);

        transferFrom(customer, airportAuthority, _balances[customer]);
    }
    function unregisterAirports(address  toAirports) public  onlyAirportAuthority{
        if(memberships[toAirports].memebershipStatus!=1){
            revert();
        }
        memberships[toAirports].memebershipStatus = 0;
        _approve(toAirports,airportAuthority, _balances[toAirports]);

        transferFrom(toAirports, airportAuthority, _balances[toAirports]);

    }
     function giveJoiningBonus(address  joiner) public  onlyAirportAuthority{
        if(memberships[joiner].memebershipStatus==0 ||
        memberships[joiner].memebershipStatus==2 ){
            revert();
        }

        _transfer(airportAuthority, joiner, 20);

    }
       //-----------------------------------------------------------------------------
//  

// Airport functions 
   //-----------------------------------------------------------------------------
     

    function registerAirports(string memory airportsName, uint pricePerbag) public{
        if(msg.sender==airportAuthority){
            revert();
        }
        if(memberships[msg.sender].memebershipStatus==3){
            revert();
        }
        address newAirports =msg.sender;
        airportBaggage[newAirports].timestamp = block.timestamp;
        memberships[newAirports].memebershipStatus = 1;
        airportBaggage[newAirports].pricePerbag = pricePerbag;
        airportBaggage[newAirports].totalBaggage = 0;
        airportBaggage[newAirports].totalBaggageClaimed = 0;
        airportBaggage[newAirports].totalUnclaimedBaggage = 0;
        airportNames.push(Airports(newAirports, airportsName));
    }

   

    function addBaggaage(uint noOfBaggage) public onlyAirport{
        airportBaggage[msg.sender].totalBaggage+=noOfBaggage;
        airportBaggage[msg.sender].totalUnclaimedBaggage+=noOfBaggage;

    }


    function responseToClaimBaggage(uint done, uint hashOfDetails) public onlyAirport{
        if(claimRequest[hashOfDetails].requestStatus!=1){
            revert();
        }
        balanceDetails[msg.sender].status = done;
        balanceDetails[msg.sender].hashOfDetails = hashOfDetails;
        claimRequest[hashOfDetails].requestStatus = done;
    }


   //-----------------------------------------------------------------------------
//

// Customer functions 
   //-----------------------------------------------------------------------------
     

   function registerCustomer() public{
        if(msg.sender==airportAuthority){
            revert();
        }
        if(memberships[msg.sender].memebershipStatus==1){
            revert();
        }
        address customer =msg.sender;
        memberships[customer].memebershipStatus = 3;


                _approve(airportAuthority,customer, 100);

        transferFrom(airportAuthority, customer, 100);


    }

    function requestToClaimBaggage(address fromAirport, uint hashOfDetails, uint noOfBaggage) public  onlyCustomer{
        uint totalAmountNeeded = (airportBaggage[fromAirport].pricePerbag)*noOfBaggage;
        if(airportBaggage[fromAirport].totalUnclaimedBaggage<noOfBaggage){
            revert();
        }
        if(memberships[fromAirport].memebershipStatus!=1){
            revert();
        }
        if(totalAmountNeeded > balanceOf()){
            revert();
        }

        address newBuyer = msg.sender;
        balanceDetails[newBuyer].status = 1;



  
        balanceDetails[msg.sender].hashOfDetails = hashOfDetails;
        claimRequest[hashOfDetails].requestStatus = 1;

        claimRequest[hashOfDetails].requestQuantity = noOfBaggage;

    }

    function settlePayment(address  toAirport, uint hashOfDetails) public  onlyCustomer{
        uint quantity = claimRequest[hashOfDetails].requestQuantity;
        uint amt = quantity * airportBaggage[toAirport].pricePerbag;
        emit LogMessage("Payment of ", amt);
        emit LogMessage("Payment of airport sent ", amt);
        if(balanceOf()<amt){
            revert();
        }
        if(claimRequest[hashOfDetails].requestStatus!=2){
            revert();
        }

        address customer = msg.sender;
        _transfer(customer, toAirport, amt);

        airportBaggage[toAirport].totalBaggage = airportBaggage[toAirport].totalBaggage-quantity;
        airportBaggage[toAirport].totalUnclaimedBaggage = airportBaggage[toAirport].totalUnclaimedBaggage-quantity;
        airportBaggage[toAirport].totalBaggageClaimed+= airportBaggage[toAirport].totalBaggageClaimed+quantity;
        balanceDetails[toAirport].hashOfDetails = hashOfDetails;


    }

   //-----------------------------------------------------------------------------
//

//  functions to read data  
    //-----------------------------------------------------------------------------  
  

    function getTotalUnclaimedBaggage() public view returns(uint){
        return airportBaggage[msg.sender].totalUnclaimedBaggage;
    }

    function getAirportClaimedBagagge() public view returns(uint){
        return airportBaggage[msg.sender].totalBaggageClaimed;
    }


    function getAirportsCount() public view returns(uint){
        return airportNames.length;
    }

    function getAirportsName(uint index) public view returns(string memory){
        return airportNames[index].airportName;
    }

    function getAirportsAddress(uint index) public view returns(address){
        return airportNames[index].airportAddress;
    }

    function getAirportPricePerBag() public view returns(uint){
        return airportBaggage[msg.sender].pricePerbag;
    }

    function getMembershipStatus() public view returns(uint){
        return memberships[msg.sender].memebershipStatus;
    }

    //-----------------------------------------------------------------------------  
//

// ERC20 functions 
   //-----------------------------------------------------------------------------
     

    function transfer(address sender,address recipient, uint256 amount) internal   returns (bool) {
        _transfer(sender, recipient, amount);
        return true;
    }

   
    function allowance(address owner, address spender) internal view   returns (uint256) {
        return _allowances[owner][spender];
    }

  
    function approve(address spender, uint256 amount) internal   returns (bool) {
        _approve(_msgSender(), spender, amount);
        return true;
    }

    
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) internal   returns (bool) {
        _transfer(sender, recipient, amount);

        uint256 currentAllowance = _allowances[sender][_msgSender()];
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
        
            _approve(sender, _msgSender(), currentAllowance - amount);
        

        return true;
    }

   
    function _transfer(
        address sender,
        address recipient,
        uint256 amount
    ) internal  {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");

        _beforeTokenTransfer(sender, recipient, amount);

        uint256 senderBalance = _balances[sender];
        require(senderBalance >= amount, "ERC20: transfer amount exceeds balance");
        
            _balances[sender] = senderBalance - amount;
        
        _balances[recipient] += amount;

        emit Transfer(sender, recipient, amount);

        _afterTokenTransfer(sender, recipient, amount);
    }
  
   function balanceOf() public view returns (uint256) {
        return _balances[msg.sender];
    }

    function _approve(
        address owner,
        address spender,
        uint256 amount
    ) internal  {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    function _msgSender() internal view  returns (address) {
        return msg.sender;
    }
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal  {}

   
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal  {}
    //-------------------------------------------------------------------------------

//

}