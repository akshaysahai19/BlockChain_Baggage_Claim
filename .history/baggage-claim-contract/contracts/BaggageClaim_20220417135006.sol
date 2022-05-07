pragma solidity >=0.4.24;

contract BaggageClaim{

    address airportAuthority;
    uint public myBalance;

    struct details{
        uint escrow;
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
    }

    mapping (address => details) balanceDetails;
    mapping(address => AirportBaggage) airportBaggage;
    mapping(uint => ClaimRequest) claimRequest;
    mapping(address => Memeberships) memberships;
    Airports[] airportNames;

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

    constructor () payable public{
        airportAuthority = msg.sender;
        balanceDetails[msg.sender].escrow = msg.value;
        memberships[msg.sender].memebershipStatus = 2;
        myBalance = address(this).balance;
    }

    event LogMessage(string message, uint value);

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
        balanceDetails[newAirports].escrow = 0;
        airportNames.push(Airports(newAirports, airportsName));
    }

    function unregisterAirports(address payable toAirports) public  onlyAirportAuthority{
        if(memberships[toAirports].memebershipStatus!=1){
            revert();
        }
        memberships[toAirports].memebershipStatus = 0;
        balanceDetails[toAirports].escrow = 0;

    }

    function addBaggaage(uint noOfBaggage) public onlyAirport{
        airportBaggage[msg.sender].totalBaggage+=noOfBaggage;
        airportBaggage[msg.sender].totalUnclaimedBaggage+=noOfBaggage;

    }


    function responseToClaimBaggage(uint done, uint hashOfDetails) public onlyAirport{
        if(claimRequest[hashOfDetails].requestStatus!=0){
            revert();
        }
        balanceDetails[msg.sender].status = done;
        balanceDetails[msg.sender].hashOfDetails = hashOfDetails;
        claimRequest[hashOfDetails].requestStatus = done;
    }



                                                // Customer Functions //
                                                
    function registerCustomers() public{
        if(msg.sender==airportAuthority){
            revert();
        }
        if(memberships[msg.sender].memebershipStatus==1){
            revert();
        }
        address customer =msg.sender;
        memberships[customer].memebershipStatus = 3;
        balanceDetails[customer].escrow = 0;
    }

    function unregisterCustomer(address payable customer) public  onlyAirportAuthority{
        if(memberships[customer].memebershipStatus!=3){
            revert();
        }
        memberships[customer].memebershipStatus = 0;
        customer.transfer(balanceDetails[customer].escrow);
        balanceDetails[customer].escrow = 0;

    }

    function requestToClaimBaggage(address fromAirport, uint hashOfDetails, uint noOfBaggage) public payable onlyCustomer{
        uint totalAmountNeeded = (airportBaggage[fromAirport].pricePerbag)*noOfBaggage;
        if(airportBaggage[fromAirport].totalUnclaimedBaggage<noOfBaggage){
            revert();
        }
        if(memberships[fromAirport].memebershipStatus!=1){
            revert();
        }
        if(totalAmountNeeded > msg.value){
            revert();
        }

        address newBuyer = msg.sender;
        balanceDetails[newBuyer].status = 1;
        balanceDetails[newBuyer].escrow = msg.value;
        emit LogMessage("Pmsg.value ", msg.value);
        balanceDetails[msg.sender].hashOfDetails = hashOfDetails;
        claimRequest[hashOfDetails].requestStatus = 0;
        claimRequest[hashOfDetails].requestQuantity = noOfBaggage;

    }

    function settlePayment(address payable toAirport, uint hashOfDetails) public payable onlyCustomer{
        uint quantity = claimRequest[hashOfDetails].requestQuantity;
        uint amt = quantity * airportBaggage[toAirport].pricePerbag;
        emit LogMessage("Payment of ", amt);
        emit LogMessage("Payment of airport sent ", amt);
        if(balanceDetails[msg.sender].escrow<amt){
            revert();
        }
        if(claimRequest[hashOfDetails].requestStatus!=1){
            revert();
        }

        address customer = msg.sender;
        
        balanceDetails[toAirport].escrow = balanceDetails[toAirport].escrow + amt;
        balanceDetails[customer].escrow = balanceDetails[customer].escrow-amt;
        airportBaggage[toAirport].totalBaggage = airportBaggage[toAirport].totalBaggage-quantity;
        airportBaggage[toAirport].totalUnclaimedBaggage = airportBaggage[toAirport].totalUnclaimedBaggage-quantity;
        airportBaggage[toAirport].totalBaggageClaimed+= airportBaggage[toAirport].totalBaggageClaimed+quantity;
        balanceDetails[toAirport].hashOfDetails = hashOfDetails;
        emit LogMessage("Customer Balance before ", balanceDetails[customer].escrow);
        toAirport.transfer(amt);
        emit LogMessage("Balance after ", balanceDetails[toAirport].escrow);

    }

    function getTotalUnclaimedBaggage() public view returns(uint){
        return airportBaggage[msg.sender].totalUnclaimedBaggage;
    }

    function getAirportClaimedBagagge() public view returns(uint){
        return airportBaggage[msg.sender].totalBaggageClaimed;
    }

    function getBalance() public view returns(uint){
        return balanceDetails[msg.sender].escrow;
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

    function getAirportMembershipStatus() public view returns(uint){
        return memberships[msg.sender].memebershipStatus;
    }

}