pragma solidity ^0.4.6;

import "./GUPToken.sol";
import "./SafeMath.sol";

contract Contribution is SafeMath {

	//FIELDS

	//CONSTANTS
	//Time limits
	uint public constant STAGE_ONE_TIME_END = 1 hours;
	uint public constant STAGE_TWO_TIME_END = 72 hours;
	uint public constant STAGE_THREE_TIME_END = 2 weeks;
	uint public constant STAGE_FOUR_TIME_END = 4 weeks;
	//Prices of GUP
	uint public constant PRICE_STAGE_ONE = 120000;
	uint public constant PRICE_STAGE_TWO = 110000;
	uint public constant PRICE_STAGE_THREE = 100000;
	uint public constant PRICE_STAGE_FOUR = 90000;
	uint public constant PRICE_BTCS = 120000;
	//GUP Token Limits
	uint public constant MAX_SUPPLY =        100000000000;
	uint public constant ALLOC_ILLIQUID_TEAM = 8000000000;
	uint public constant ALLOC_LIQUID_TEAM =  13000000000;
	uint public constant ALLOC_BOUNTIES =      2000000000;
	uint public constant ALLOC_NEW_USERS =    17000000000;
	uint public constant ALLOC_CROWDSALE =    60000000000;
	uint public constant BTCS_PORTION_MAX = 125000 * PRICE_BTCS;
	//ASSIGNED IN INITIALIZATION
	//Start and end times
	uint public publicStartTime; //Time in seconds public crowd fund starts.
	uint public privateStartTime; //Time in seconds when BTCSuisse can purchase up to 125000 ETH worth of GUP;
	uint public publicEndTime; //Time in seconds crowdsale ends
	//Special Addresses
	address public btcsAddress; //Address used by BTCSuisse
	address public multisigAddress; //Address to which all ether flows.
	address public matchpoolAddress; //Address to which ALLOC_BOUNTIES, ALLOC_LIQUID_TEAM, ALLOC_NEW_USERS, ALLOC_ILLIQUID_TEAM is sent to.
	address public ownerAddress; //Address of the contract owner. Can halt the crowdsale.
	//Contracts
	GUPToken public gupToken; //External token contract hollding the GUP
	//Running totals
	uint public etherRaised; //Total Ether raised.
	uint public gupSold; //Total GUP created
	uint public btcsPortionTotal; //Total of Tokens purchased by BTC Suisse. Not to exceed BTCS_PORTION_MAX.
	//booleans
	bool public halted; //halts the crowd sale if true.

	//FUNCTION MODIFIERS

	//Is currently in the period after the private start time and before the public start time.
	modifier is_pre_crowdfund_period() {
		if (now >= publicStartTime || now < privateStartTime) throw;
		_;
	}

	//Is currently the crowdfund period
	modifier is_crowdfund_period() {
		if (now < publicStartTime || now >= publicEndTime) throw;
		_;
	}

	//May only be called by BTC Suisse
	modifier only_btcs() {
		if (msg.sender != btcsAddress) throw;
		_;
	}

	//May only be called by the owner address
	modifier only_owner() {
		if (msg.sender != ownerAddress) throw;
		_;
	}

	//May only be called if the crowdfund has not been halted
	modifier is_not_halted() {
		if (halted) throw;
		_;
	}

	// EVENTS

	event PreBuy(uint _amount);
	event Buy(address indexed _recipient, uint _amount);


	// FUNCTIONS

	//Initialization function. Deploys GUPToken contract assigns values, to all remaining fields, creates first entitlements in the GUP Token contract.
	function Contribution(
		address _btcs,
		address _multisig,
		address _matchpool,
		uint _publicStartTime,
		uint _privateStartTime
	) {
		ownerAddress = msg.sender;
		publicStartTime = _publicStartTime;
		privateStartTime = _privateStartTime;
		publicEndTime = _publicStartTime + 4 weeks;
		btcsAddress = _btcs;
		multisigAddress = _multisig;
		matchpoolAddress = _matchpool;
		gupToken = new GUPToken(this, publicEndTime);
		gupToken.createIlliquidToken(matchpoolAddress, ALLOC_ILLIQUID_TEAM);
		gupToken.createToken(matchpoolAddress, ALLOC_BOUNTIES);
		gupToken.createToken(matchpoolAddress, ALLOC_LIQUID_TEAM);
		gupToken.createToken(matchpoolAddress, ALLOC_NEW_USERS);
	}

	//May be used by owner of contract to halt crowdsale and no longer except ether.
	function toggleHalt(bool _halted)
		only_owner
	{
		halted = _halted;
	}

	//constant function returns the current GUP price.
	function getPriceRate()
		constant
		returns (uint o_rate)
	{
		if (now <= publicStartTime + STAGE_ONE_TIME_END) return PRICE_STAGE_ONE;
		if (now <= publicStartTime + STAGE_TWO_TIME_END) return PRICE_STAGE_TWO;
		if (now <= publicStartTime + STAGE_THREE_TIME_END) return PRICE_STAGE_THREE;
		if (now <= publicStartTime + STAGE_FOUR_TIME_END) return PRICE_STAGE_FOUR;
		else return 0;
	}

	// Given the rate of a purchase and the remaining tokens in this tranche, it
	// will throw if the sale would take it past the limit of the tranche.
	// It executes the purchase for the appropriate amount of tokens, which
	// involves adding it to the total, minting GUP tokens and stashing the
	// ether.
	// Returns `amount` in scope as the number of GUP tokens that it will
	// purchase.
	function processPurchase(uint _rate, uint _remaining)
		internal
		returns (uint o_amount)
	{
		o_amount = safeDiv(safeMul(msg.value, _rate), 1 ether);
		if (o_amount > _remaining) throw;
		if (!multisigAddress.send(msg.value)) throw;
		if (!gupToken.createToken(msg.sender, o_amount)) throw; //change to match create token
		gupSold += o_amount;
	}

	//Special Function can only be called by BTC Suisse and only during the pre-crowdsale period.
	//Allows the purchase of up to 125000 Ether worth of GUP Tokens.
	function preBuy()
		payable
		is_pre_crowdfund_period
		only_btcs
		is_not_halted
	{
		uint amount = processPurchase(PRICE_BTCS, BTCS_PORTION_MAX - btcsPortionTotal);
		btcsPortionTotal += amount;
		PreBuy(amount);
	}

	//Default function called by sending Ether to this address with no arguments.
	//Results in creation of new GUP Tokens if transaction would not exceed hard limit of GUP Token.
	function()
		payable
		is_crowdfund_period
		is_not_halted
	{
		uint amount = processPurchase(getPriceRate(), ALLOC_CROWDSALE - gupSold);
		Buy(msg.sender, amount);
	}

	//failsafe drain
	function drain()
		only_owner
	{
		if (!ownerAddress.send(this.balance)) throw;
	}
}
