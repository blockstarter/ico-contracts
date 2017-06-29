pragma solidity ^0.4.8;

import "zeppelin/SafeMath.sol";
import "./interface/Controller.sol";
import "./ANT.sol";
import "./ANPlaceholder.sol";
import "./SaleWallet.sol";

/*
    Copyright 2017, Jorge Izquierdo (Aragon Foundation)
    Copyright 2017, Jordi Baylina (Giveth)

    Based on SampleCampaign-TokenController.sol from https://github.com/Giveth/minime
 */

contract AragonTokenSale is Controller, SafeMath {
    uint public initialBlock;             // Block number in which the sale starts. Inclusive. sale will be opened at initial block.
    uint public finalBlock;               // Block number in which the sale end. Exclusive, sale will be closed at ends block.
    uint public initialPrice;             // Number of wei-ANT tokens for 1 wei, at the start of the sale (18 decimals)
    uint public finalPrice;               // Number of wei-ANT tokens for 1 wei, at the end of the sale
    uint8 public priceStages;             // Number of different price stages for interpolating between initialPrice and finalPrice
    address public aragonDevMultisig;     // The address to hold the funds donated
    address public communityMultisig;     // Community trusted multisig to deploy network
    bytes32 public capCommitment;

    uint public totalCollected = 0;               // In wei
    bool public saleStopped = false;              // Has Aragon Dev stopped the sale?
    bool public saleFinalized = false;            // Has Aragon Dev finalized the sale?

    mapping (address => bool) public activated;   // Address confirmates that wants to activate the sale

    ANT public token;                             // The token
    ANPlaceholder public networkPlaceholder;      // The network placeholder
    SaleWallet public saleWallet;                    // Wallet that receives all sale funds

    uint constant public dust = 1 finney;         // Minimum investment
    uint public hardCap = 1000000 ether;          // Hard cap to protect the ETH network from a really high raise

    event NewPresaleAllocation(address indexed holder, uint256 antAmount);
    event NewBuyer(address indexed holder, uint256 antAmount, uint256 etherAmount);
    event CapRevealed(uint value, uint secret, address revealer);
/// @dev There are several checks to make sure the parameters are acceptable
/// @param _initialBlock The Block number in which the sale starts
/// @param _finalBlock The Block number in which the sale ends
/// @param _aragonDevMultisig The address that will store the donated funds and manager
/// for the sale
/// @param _initialPrice The price for the first stage of the sale. Price in wei-ANT per wei.
/// @param _finalPrice The price for the final stage of the sale. Price in wei-ANT per wei.
/// @param _priceStages The number of price stages. The price for every middle stage
/// will be linearly interpolated.
/*
 price
        ^
        |
Initial |       s = 0
price   |      +------+
        |      |      | s = 1
        |      |      +------+
        |      |             | s = 2
        |      |             +------+
        |      |                    | s = 3
Final   |      |                    +------+
price   |      |                           |
        |      |    for priceStages = 4    |
        +------+---------------------------+-------->
          Initial                     Final       time
          block                       block


Every stage is the same time length.
Price increases by the same delta in every stage change

*/

  function AragonTokenSale (
      uint _initialBlock,
      uint _finalBlock,
      address _aragonDevMultisig,
      address _communityMultisig,
      uint256 _initialPrice,
      uint256 _finalPrice,
      uint8 _priceStages,
      bytes32 _capCommitment
  )
      non_zero_address(_aragonDevMultisig)
      non_zero_address(_communityMultisig)
  {
      if (_initialBlock < getBlockNumber()) throw;
      if (_initialBlock >= _finalBlock) throw;
      if (_initialPrice <= _finalPrice) throw;
      if (_priceStages < 2) throw;
      if (_priceStages > _initialPrice - _finalPrice) throw;
      if (uint(_capCommitment) == 0) throw;

      // Save constructor arguments as global variables
      initialBlock = _initialBlock;
      finalBlock = _finalBlock;
      aragonDevMultisig = _aragonDevMultisig;
      communityMultisig = _communityMultisig;
      initialPrice = _initialPrice;
      finalPrice = _finalPrice;
      priceStages = _priceStages;
      capCommitment = _capCommitment;
  }

  // @notice Deploy ANT is called only once to setup all the needed contracts.
  // @param _token: Address of an instance of the ANT token
  // @param _networkPlaceholder: Address of an instance of ANPlaceholder
  // @param _saleWallet: Address of the wallet receiving the funds of the sale

  function setANT(address _token, address _networkPlaceholder, address _saleWallet)
           non_zero_address(_token)
           non_zero_address(_networkPlaceholder)
           non_zero_address(_saleWallet)
           only(aragonDevMultisig)
           public {

    // Assert that the function hasn't been called before, as activate will happen at the end
    if (activated[this]) throw;

    token = ANT(_token);
    networkPlaceholder = ANPlaceholder(_networkPlaceholder);
    saleWallet = SaleWallet(_saleWallet);

    if (token.controller() != address(this)) throw; // sale is controller
    if (networkPlaceholder.sale() != address(this)) throw; // placeholder has reference to Sale
    if (networkPlaceholder.token() != address(token)) throw; // placeholder has reference to ANT
    if (token.totalSupply() > 0) throw; // token is empty
    if (saleWallet.finalBlock() != finalBlock) throw; // final blocks must match
    if (saleWallet.multisig() != aragonDevMultisig) throw; // receiving wallet must match
    if (saleWallet.tokenSale() != address(this)) throw; // watched token sale must be self

    // Contract activates sale as all requirements are ready
    doActivateSale(this);
  }

  // @notice Certain addresses need to call the activate function prior to the sale opening block.
  // This proves that they have checked the sale contract is legit, as well as proving
  // the capability for those addresses to interact with the contract.
  function activateSale()
           public {
    doActivateSale(msg.sender);
  }

  function doActivateSale(address _entity)
    non_zero_address(token)               // cannot activate before setting token
    only_before_sale
    private {
    activated[_entity] = true;
  }

  // @notice Whether the needed accounts have activated the sale.
  // @return Is sale activated
  function isActivated() constant public returns (bool) {
    return activated[this] && activated[aragonDevMultisig] && activated[communityMultisig];
  }

  // @notice Get the price for a ANT token at any given block number
  // @param _blockNumber the block for which the price is requested
  // @return Number of wei-ANT for 1 wei
  // If sale isn't ongoing for that block, returns 0.
  function getPrice(uint _blockNumber) constant public returns (uint256) {
    if (_blockNumber < initialBlock || _blockNumber >= finalBlock) return 0;

    return priceForStage(stageForBlock(_blockNumber));
  }

  // @notice Get what the stage is for a given blockNumber
  // @param _blockNumber: Block number
  // @return The sale stage for that block. Stage is between 0 and (priceStages - 1)
  function stageForBlock(uint _blockNumber) constant internal returns (uint8) {
    uint blockN = safeSub(_blockNumber, initialBlock);
    uint totalBlocks = safeSub(finalBlock, initialBlock);

    return uint8(safeDiv(safeMul(priceStages, blockN), totalBlocks));
  }

  // @notice Get what the price is for a given stage
  // @param _stage: Stage number
  // @return Price in wei for that stage.
  // If sale stage doesn't exist, returns 0.
  function priceForStage(uint8 _stage) constant internal returns (uint256) {
    if (_stage >= priceStages) return 0;
    uint priceDifference = safeSub(initialPrice, finalPrice);
    uint stageDelta = safeDiv(priceDifference, uint(priceStages - 1));
    return safeSub(initialPrice, safeMul(uint256(_stage), stageDelta));
  }

  // @notice Aragon Dev needs to make initial token allocations for presale partners
  // This allocation has to be made before the sale is activated. Activating the sale means no more
  // arbitrary allocations are possible and expresses conformity.
  // @param _receiver: The receiver of the tokens
  // @param _amount: Amount of tokens allocated for receiver.
  function allocatePresaleTokens(address _receiver, uint _amount, uint64 cliffDate, uint64 vestingDate)
           only_before_sale_activation
           only_before_sale
           non_zero_address(_receiver)
           only(aragonDevMultisig)
           public {

    if (_amount > 10 ** 24) throw; // 1 million ANT. No presale partner will have more than this allocated. Prevent overflows.

    if (!token.generateTokens(address(this), _amount)) throw;
    token.grantVestedTokens(_receiver, _amount, uint64(now), cliffDate, vestingDate);

    NewPresaleAllocation(_receiver, _amount);
  }

/// @dev The fallback function is called when ether is sent to the contract, it
/// simply calls `doPayment()` with the address that sent the ether as the
/// `_owner`. Payable is a required solidity modifier for functions to receive
/// ether, without this modifier functions will throw if ether is sent to them

  function () public payable {
    return doPayment(msg.sender);
  }

/////////////////
// Controller interface
/////////////////

/// @notice `proxyPayment()` allows the caller to send ether to the Token directly and
/// have the tokens created in an address of their choosing
/// @param _owner The address that will hold the newly created tokens

  function proxyPayment(address _owner) payable public returns (bool) {
    doPayment(_owner);
    return true;
  }

/// @notice Notifies the controller about a transfer, for this sale all
///  transfers are allowed by default and no extra notifications are needed
/// @param _from The origin of the transfer
/// @param _to The destination of the transfer
/// @param _amount The amount of the transfer
/// @return False if the controller does not authorize the transfer
  function onTransfer(address _from, address _to, uint _amount) public returns (bool) {
    // Until the sale is finalized, only allows transfers originated by the sale contract.
    // When finalizeSale is called, this function will stop being called and will always be true.
    return _from == address(this);
  }

/// @notice Notifies the controller about an approval, for this sale all
///  approvals are allowed by default and no extra notifications are needed
/// @param _owner The address that calls `approve()`
/// @param _spender The spender in the `approve()` call
/// @param _amount The amount in the `approve()` call
/// @return False if the controller does not authorize the approval
  function onApprove(address _owner, address _spender, uint _amount) public returns (bool) {
    // No approve/transferFrom during the sale
    return false;
  }

/// @dev `doPayment()` is an internal function that sends the ether that this
///  contract receives to the aragonDevMultisig and creates tokens in the address of the
/// @param _owner The address that will hold the newly created tokens

  function doPayment(address _owner)
           only_during_sale_period
           only_sale_not_stopped
           only_sale_activated
           non_zero_address(_owner)
           minimum_value(dust)
           internal {

    if (totalCollected + msg.value > hardCap) throw; // If past hard cap, throw

    uint256 boughtTokens = safeMul(msg.value, getPrice(getBlockNumber())); // Calculate how many tokens bought

    if (!saleWallet.send(msg.value)) throw; // Send funds to multisig
    if (!token.generateTokens(_owner, boughtTokens)) throw; // Allocate tokens. This will fail after sale is finalized in case it is hidden cap finalized.

    totalCollected = safeAdd(totalCollected, msg.value); // Save total collected amount

    NewBuyer(_owner, boughtTokens, msg.value);
  }

  // @notice Function to stop sale for an emergency.
  // @dev Only Aragon Dev can do it after it has been activated.
  function emergencyStopSale()
           only_sale_activated
           only_sale_not_stopped
           only(aragonDevMultisig)
           public {

    saleStopped = true;
  }

  // @notice Function to restart stopped sale.
  // @dev Only Aragon Dev can do it after it has been disabled and sale is ongoing.
  function restartSale()
           only_during_sale_period
           only_sale_stopped
           only(aragonDevMultisig)
           public {

    saleStopped = false;
  }

  function revealCap(uint256 _cap, uint256 _cap_secure)
           only_during_sale_period
           only_sale_activated
           verify_cap(_cap, _cap_secure)
           public {

    if (_cap > hardCap) throw;

    hardCap = _cap;
    CapRevealed(_cap, _cap_secure, msg.sender);

    if (totalCollected + dust >= hardCap) {
      doFinalizeSale(_cap, _cap_secure);
    }
  }

  // @notice Finalizes sale generating the tokens for Aragon Dev.
  // @dev Transfers the token controller power to the ANPlaceholder.
  function finalizeSale(uint256 _cap, uint256 _cap_secure)
           only_after_sale
           only(aragonDevMultisig)
           public {

    doFinalizeSale(_cap, _cap_secure);
  }

  function doFinalizeSale(uint256 _cap, uint256 _cap_secure)
           verify_cap(_cap, _cap_secure)
           internal {
    // Doesn't check if saleStopped is false, because sale could end in a emergency stop.
    // This function cannot be successfully called twice, because it will top being the controller,
    // and the generateTokens call will fail if called again.

    // Aragon Dev owns 30% of the total number of emitted tokens at the end of the sale.
    uint256 aragonTokens = token.totalSupply() * 3 / 7;
    if (!token.generateTokens(aragonDevMultisig, aragonTokens)) throw;
    token.changeController(networkPlaceholder); // Sale loses token controller power in favor of network placeholder

    saleFinalized = true;  // Set stop is true which will enable network deployment
    saleStopped = true;
  }

  // @notice Deploy Aragon Network contract.
  // @param networkAddress: The address the network was deployed at.
  function deployNetwork(address networkAddress)
           only_finalized_sale
           non_zero_address(networkAddress)
           only(communityMultisig)
           public {

    networkPlaceholder.changeController(networkAddress);
  }

  function setAragonDevMultisig(address _newMultisig)
           non_zero_address(_newMultisig)
           only(aragonDevMultisig)
           public {

    aragonDevMultisig = _newMultisig;
  }

  function setCommunityMultisig(address _newMultisig)
           non_zero_address(_newMultisig)
           only(communityMultisig)
           public {

    communityMultisig = _newMultisig;
  }

  function getBlockNumber() constant internal returns (uint) {
    return block.number;
  }

  function computeCap(uint256 _cap, uint256 _cap_secure) constant public returns (bytes32) {
    return sha3(_cap, _cap_secure);
  }

  function isValidCap(uint256 _cap, uint256 _cap_secure) constant public returns (bool) {
    return computeCap(_cap, _cap_secure) == capCommitment;
  }

  modifier only(address x) {
    if (msg.sender != x) throw;
    _;
  }

  modifier verify_cap(uint256 _cap, uint256 _cap_secure) {
    if (!isValidCap(_cap, _cap_secure)) throw;
    _;
  }

  modifier only_before_sale {
    if (getBlockNumber() >= initialBlock) throw;
    _;
  }

  modifier only_during_sale_period {
    if (getBlockNumber() < initialBlock) throw;
    if (getBlockNumber() >= finalBlock) throw;
    _;
  }

  modifier only_after_sale {
    if (getBlockNumber() < finalBlock) throw;
    _;
  }

  modifier only_sale_stopped {
    if (!saleStopped) throw;
    _;
  }

  modifier only_sale_not_stopped {
    if (saleStopped) throw;
    _;
  }

  modifier only_before_sale_activation {
    if (isActivated()) throw;
    _;
  }

  modifier only_sale_activated {
    if (!isActivated()) throw;
    _;
  }

  modifier only_finalized_sale {
    if (getBlockNumber() < finalBlock) throw;
    if (!saleFinalized) throw;
    _;
  }

  modifier non_zero_address(address x) {
    if (x == 0) throw;
    _;
  }

  modifier minimum_value(uint256 x) {
    if (msg.value < x) throw;
    _;
  }
}
