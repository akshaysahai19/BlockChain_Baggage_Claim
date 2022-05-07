pragma solidity >=0.4.24;

contract AirlineLostBaggage{

    address airportAuthority;
    uint public myBalance;

    struct details{
        uint escrow;
        uint status;
        uint hashOfDetails;
    }

    struct AirlineBaggage{
        uint timestamp;
        uint memebershipStatus;
        uint pricePerbag;
        uint totalBaggage;
        uint totalUnclaimedBaggage;
        uint totalBaggageClaimed;
        string airlineName;
    }

    struct BaggageClaim{
        uint requestStatus;
        uint requestQuantity;
    }

    mapping (address => details) balanceDetails;
    mapping(address => AirlineBaggage) airlineBaggage;
    mapping(uint => BaggageClaim) baggageClaim;

    modifier onlyAirlineAuthority(){
        require(msg.sender == airportAuthority);
        _;
    }

    modifier onlyAirline(){
        require(airlineBaggage[msg.sender].memebershipStatus==1);
        _;
    }

    modifier notAnAirline(){
        require(airlineBaggage[msg.sender].memebershipStatus!=1);
        _;
    }

    constructor () payable public{
        airportAuthority = msg.sender;
        balanceDetails[msg.sender].escrow = msg.value;

        myBalance = address(this).balance;
    }

    event LogMessage(string message, uint value);

    function registerAirlines(string memory airlinesName, uint pricePerbag) public payable{
        address newAirlines =msg.sender;
        airlineBaggage[newAirlines].timestamp = block.timestamp;
        airlineBaggage[newAirlines].memebershipStatus = 1;
        airlineBaggage[newAirlines].pricePerbag = pricePerbag;
        airlineBaggage[newAirlines].totalBaggage = 0;
        airlineBaggage[newAirlines].totalBaggageClaimed = 0;
        airlineBaggage[newAirlines].totalUnclaimedBaggage = 0;
        airlineBaggage[newAirlines].airlineName = airlinesName;
    }

    function unregisterAirlines(address payable toAirlines) public  onlyAirlineAuthority{
        if(airlineBaggage[toAirlines].memebershipStatus!=1){
            revert();
        }
        airlineBaggage[toAirlines].memebershipStatus = 0;
        emit LogMessage("balanceDetails[toAirlines].escrow",balanceDetails[toAirlines].escrow);
        toAirlines.transfer(balanceDetails[toAirlines].escrow);
        balanceDetails[toAirlines].escrow = 0;
    }

    function addBaggaage(uint noOfBaggage) public onlyAirline{
        airlineBaggage[msg.sender].totalBaggage+=noOfBaggage;
        airlineBaggage[msg.sender].totalUnclaimedBaggage+=noOfBaggage;

    }

    function requestToClaimBaggage(address fromAirline, uint hashOfDetails, uint noOfBaggage) public payable notAnAirline{
        emit LogMessage("amount to escrow", msg.value);
        emit LogMessage("price", ((airlineBaggage[fromAirline].pricePerbag)*noOfBaggage));
        if(airlineBaggage[fromAirline].totalUnclaimedBaggage<noOfBaggage){
            emit LogMessage("totalUnclaimedBaggage<noOfBaggage",0);
            revert();
        }
        if(airlineBaggage[fromAirline].memebershipStatus!=1){
            emit LogMessage("memebershipStatus!=1",0);
            revert();
        }
        if(((airlineBaggage[fromAirline].pricePerbag)*noOfBaggage) > msg.value){
            emit LogMessage("pricePerbag)*noOfBaggage) > msg.value",0);
            revert();
        }

        address newBuyer = msg.sender;
        balanceDetails[newBuyer].status = 1;
        balanceDetails[newBuyer].escrow = msg.value;
        balanceDetails[msg.sender].hashOfDetails = hashOfDetails;
        baggageClaim[hashOfDetails].requestStatus = 0;
        baggageClaim[hashOfDetails].requestQuantity = noOfBaggage;

    }

    function settlePayment(address payable toAirline, uint hashOfDetails) payable public notAnAirline{
        uint quantity = baggageClaim[hashOfDetails].requestQuantity;
        uint amt = quantity * airlineBaggage[toAirline].pricePerbag;
        if(balanceDetails[msg.sender].escrow<amt){
            revert();
        }
        if(baggageClaim[hashOfDetails].requestStatus!=1){
            revert();
        }

        address customer = msg.sender;
        
        balanceDetails[toAirline].escrow = balanceDetails[toAirline].escrow + amt;
        balanceDetails[customer].escrow = balanceDetails[customer].escrow-amt;
        airlineBaggage[toAirline].totalBaggage = airlineBaggage[toAirline].totalBaggage-quantity;
        airlineBaggage[toAirline].totalUnclaimedBaggage = airlineBaggage[toAirline].totalUnclaimedBaggage-quantity;
        airlineBaggage[toAirline].totalBaggageClaimed+= airlineBaggage[toAirline].totalBaggageClaimed+quantity;
        balanceDetails[toAirline].hashOfDetails = hashOfDetails;
        toAirline.transfer(amt);

    }

    function responseToClaimBaggage(uint done, uint hashOfDetails) public onlyAirline{
        if(baggageClaim[hashOfDetails].requestStatus!=0){
            revert();
        }
        balanceDetails[msg.sender].status = done;
        balanceDetails[msg.sender].hashOfDetails = hashOfDetails;
        baggageClaim[hashOfDetails].requestStatus = done;
    }

    function getTotalUnclaimedBaggage() public view returns(uint){
        return airlineBaggage[msg.sender].totalUnclaimedBaggage;
    }

    function getTotalClaimedBagagge() public view returns(uint){
        return airlineBaggage[msg.sender].totalBaggageClaimed;
    }

    function getBalance() public view returns(uint){
        return balanceDetails[msg.sender].escrow;
    }


}
