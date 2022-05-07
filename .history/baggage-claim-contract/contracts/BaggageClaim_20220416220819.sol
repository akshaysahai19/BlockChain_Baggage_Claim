pragma solidity >=0.4.24;

contract BaggageClaim{

    address airportAuthority;
    uint public myBalance;

    struct details{
        uint escrow;
        uint status;
        uint hashOfDetails;
    }

    struct Airports{
        address airportAddress;
        string airportName;
    }

    struct AirportBaggage{
        uint timestamp;
        uint memebershipStatus;
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
    mapping(uint => ClaimRequest) ClaimRequest;
    Airports[] airportNames;

    modifier onlyAirportAuthority(){
        require(msg.sender == airportAuthority);
        _;
    }

    modifier onlyAirport(){
        require(airportBaggage[msg.sender].memebershipStatus==1);
        _;
    }

    modifier notAnAirport(){
        require(airportBaggage[msg.sender].memebershipStatus!=1);
        _;
    }

    constructor () payable public{
        airportAuthority = msg.sender;
        balanceDetails[msg.sender].escrow = msg.value;
        airportBaggage[msg.sender].memebershipStatus = 2;
        myBalance = address(this).balance;
    }

    event LogMessage(string message, uint value);

    function registerAirports(string memory airportsName, uint pricePerbag) public notAnAirport{
        address newAirports =msg.sender;
        airportBaggage[newAirports].timestamp = block.timestamp;
        airportBaggage[newAirports].memebershipStatus = 1;
        airportBaggage[newAirports].pricePerbag = pricePerbag;
        airportBaggage[newAirports].totalBaggage = 0;
        airportBaggage[newAirports].totalBaggageClaimed = 0;
        airportBaggage[newAirports].totalUnclaimedBaggage = 0;
        balanceDetails[newAirports].escrow = 0;
        airportNames.push(Airports(newAirports, airportsName));
    }

    function unregisterAirports(address payable toAirports) public  onlyAirportAuthority{
        if(airportBaggage[toAirports].memebershipStatus!=1){
            revert();
        }
        airportBaggage[toAirports].memebershipStatus = 0;
        toAirports.transfer(balanceDetails[toAirports].escrow);
        balanceDetails[toAirports].escrow = 0;

    }

    function addBaggaage(uint noOfBaggage) public onlyAirport{
        airportBaggage[msg.sender].totalBaggage+=noOfBaggage;
        airportBaggage[msg.sender].totalUnclaimedBaggage+=noOfBaggage;

    }

    function requestToClaimBaggage(address fromAirport, uint hashOfDetails, uint noOfBaggage) public payable notAnAirport{
        uint totalAmountNeeded = (airportBaggage[fromAirport].pricePerbag)*noOfBaggage;
        if(airportBaggage[fromAirport].totalUnclaimedBaggage<noOfBaggage){
            revert();
        }
        if(airportBaggage[fromAirport].memebershipStatus!=1){
            revert();
        }
        if(totalAmountNeeded > msg.value){
            revert();
        }

        address newBuyer = msg.sender;
        balanceDetails[newBuyer].status = 1;
        balanceDetails[newBuyer].escrow = msg.value;
        balanceDetails[msg.sender].hashOfDetails = hashOfDetails;
        ClaimRequest[hashOfDetails].requestStatus = 0;
        ClaimRequest[hashOfDetails].requestQuantity = noOfBaggage;

    }

    function settlePayment(address payable toAirport, uint hashOfDetails) payable public notAnAirport{
        uint quantity = baggageClaim[hashOfDetails].requestQuantity;
        uint amt = quantity * airportBaggage[toAirport].pricePerbag;
        if(balanceDetails[msg.sender].escrow<amt){
            revert();
        }
        if(baggageClaim[hashOfDetails].requestStatus!=1){
            revert();
        }

        address customer = msg.sender;
        
        balanceDetails[toAirport].escrow = balanceDetails[toAirport].escrow + amt;
        balanceDetails[customer].escrow = balanceDetails[customer].escrow-amt;
        airportBaggage[toAirport].totalBaggage = airportBaggage[toAirport].totalBaggage-quantity;
        airportBaggage[toAirport].totalUnclaimedBaggage = airportBaggage[toAirport].totalUnclaimedBaggage-quantity;
        airportBaggage[toAirport].totalBaggageClaimed+= airportBaggage[toAirport].totalBaggageClaimed+quantity;
        balanceDetails[toAirport].hashOfDetails = hashOfDetails;
        toAirport.transfer(amt);

    }

    function responseToClaimBaggage(uint done, uint hashOfDetails) public onlyAirport{
        if(baggageClaim[hashOfDetails].requestStatus!=0){
            revert();
        }
        balanceDetails[msg.sender].status = done;
        balanceDetails[msg.sender].hashOfDetails = hashOfDetails;
        baggageClaim[hashOfDetails].requestStatus = done;
    }

    function getTotalUnclaimedBaggage() public view returns(uint){
        return airportBaggage[msg.sender].totalUnclaimedBaggage;
    }

    function getTotalClaimedBagagge() public view returns(uint){
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

    function getAirportMembershipStatus() public view returns(uint){
        return airportBaggage[msg.sender].memebershipStatus;
    }

}