
pragma solidity ^0.4.11;

import "./PreICO.sol";
import "./SNM.sol";
import "./installed/token/ERC20.sol";


contract ICO {

  // Constants
  // =========

  uint public constant TOKEN_PRICE = 2824; // SNM per ETH
  uint public constant TOKENS_FOR_SALE = 331360000 * 1e18;
  uint public constant SNM_PER_SPT = 4; // Migration rate


  // Events
  // ======

  event ForeignBuy(address holder, uint snmValue, string txHash);
  event Migrate(address holder, uint snmValue);
  event RunIco();
  event PauseIco();
  event FinishIco(address teamFund, address ecosystemFund, address bountyFund);


  // State variables
  // ===============

  PreICO preICO;
  SNM public snm;

  address public team;
  address public tradeRobot;
  modifier teamOnly { require(msg.sender == team); _; }
  modifier robotOnly { require(msg.sender == tradeRobot); _; }

  uint tokensSold = 0;

  enum IcoState { Created, Running, Paused, Finished }
  IcoState icoState = IcoState.Created;


  // Constructor
  // ===========

  function ICO(address _team, address _preICO, address _tradeRobot) {
    snm = new SNM(this);
    preICO = PreICO(_preICO);
    team = _team;
    tradeRobot = _tradeRobot;
  }



  // Public functions
  // ================

  // Here you can buy some tokens (just don't forget to provide enough gas).
  function() external payable {
    buyFor(msg.sender);
  }


  function buyFor(address _investor) public payable {
    require(icoState == IcoState.Running);
    require(msg.value > 0);
    buy(_investor, msg.value * TOKEN_PRICE);
  }


  function getBonus(uint _value, uint _sold)
    public constant returns (uint)
  {
    uint[8] memory _bonusPattern = [ 150, 125, 100, 75, 50, 38, 25, uint(13) ];
    uint _step = TOKENS_FOR_SALE / 10;
    uint _bonus = 0;

    for(uint8 i = 0; _value > 0 && i < _bonusPattern.length; ++i) {
      uint _min = _step * i;
      uint _max = _step * (i+1);

      if(_sold >= _min && _sold < _max) {
        uint _bonusedPart = min(_value, _max - _sold);
        _bonus += _bonusedPart * _bonusPattern[i] / 1000;
        _value -= _bonusedPart;
        _sold  += _bonusedPart;
      }
    }

    return _bonus;
  }



  // Priveleged functions
  // ====================


  // This is called by our friendly robot to allow you to buy SNM for various
  // cryptos.
  function foreignBuy(address _investor, uint _snmValue, string _txHash)
    external robotOnly
  {
    require(icoState == IcoState.Running);
    require(_snmValue > 0);
    buy(_investor, _snmValue);
    ForeignBuy(_investor, _snmValue, _txHash);
  }


  // Team can replace tradeRobot in case of malfunction.
  function setRobot(address _robot) external teamOnly {
    tradeRobot = _robot;
  }


  // We can force migration for early investors
  function migrateSome(address[] _investors) external robotOnly {
    for(uint i = 0; i < _investors.length; i++)
      doMigration(_investors[i]);
  }


  // ICO state management: start / pause / finish
  // --------------------------------------------

  function startIco() external teamOnly {
    require(icoState == IcoState.Created || icoState == IcoState.Paused);
    icoState = IcoState.Running;
    RunIco();
  }


  function pauseIco() external teamOnly {
    require(icoState == IcoState.Running);
    icoState = IcoState.Paused;
    PauseIco();
  }


  function finishIco(
    address _teamFund,
    address _ecosystemFund,
    address _bountyFund
  )
    external teamOnly
  {
    require(icoState == IcoState.Running || icoState == IcoState.Paused);

    uint alreadyMinted = snm.totalSupply();
    uint totalAmount = alreadyMinted * 1110 / 889;
    // totalAmount = alreadyMinted + ecosystem + team + bounty;

    snm.mint(_teamFund, 10 * totalAmount / 111);
    snm.mint(_ecosystemFund, totalAmount / 10);
    snm.mint(_bountyFund, totalAmount / 111);
    snm.defrost();

    icoState = IcoState.Finished;
    FinishIco(_teamFund, _ecosystemFund, _bountyFund);
  }


  // Withdraw all collected ethers to the team's multisig wallet
  function withdrawEther(uint _value) external teamOnly {
    team.transfer(_value);
  }

  function withdrawToken(address _tokenContract, uint _val) external teamOnly
  {
    ERC20 _tok = ERC20(_tokenContract);
    _tok.transfer(team, _val);
  }



  // Private functions
  // =================

  function min(uint a, uint b) internal constant returns (uint) {
    return a < b ? a : b;
  }


  function buy(address _investor, uint _snmValue) internal {
    uint _bonus = getBonus(_snmValue, tokensSold);
    uint _total = _snmValue + _bonus;

    require(tokensSold + _total <= TOKENS_FOR_SALE);

    snm.mint(_investor, _total);
    tokensSold += _total;
  }


  function doMigration(address _investor) internal {
    // Migration must be completed before ICO is finished, because
    // total amount of tokens must be known to calculate amounts minted for
    // funds (bounty, team, ecosystem).
    require(icoState != IcoState.Finished);

    uint _sptBalance = preICO.balanceOf(_investor);
    require(_sptBalance > 0);

    preICO.burnTokens(_investor);

    // Mint extra amount of tokens for our generous early investors.
    uint _snmValue = _sptBalance * SNM_PER_SPT;
    snm.mint(_investor, _snmValue);

    Migrate(_investor, _snmValue);
  }
}
