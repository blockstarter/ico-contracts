pragma solidity ^0.4.6;
import "./StandardToken.sol";

contract GUPToken is StandardToken {

	//FIELDS
	//CONSTANTS
	uint public constant LOCKOUT_PERIOD = 1 years; //time after end date that illiquid GUP can be transferred

	//ASSIGNED IN INITIALIZATION
	uint public endMintingTime; //Time in seconds no more tokens can be created
	address public minter; //address of the account which may mint new tokens

	mapping (address => uint) public illiquidBalance; //Balance of 'Frozen funds'

	//MODIFIERS
	//Can only be called by contribution contract.
	modifier only_minter {
		if (msg.sender != minter) throw;
		_;
	}

	// Can only be called if illiquid tokens may be transformed into liquid.
	// This happens when `LOCKOUT_PERIOD` of time passes after `endMintingTime`.
	modifier when_thawable {
		if (now < endMintingTime + LOCKOUT_PERIOD) throw;
		_;
	}

	// Can only be called if (liquid) tokens may be transferred. Happens
	// immediately after `endMintingTime`.
	modifier when_transferable {
		if (now < endMintingTime) throw;
		_;
	}

	// Can only be called if the `crowdfunder` is allowed to mint tokens. Any
	// time before `endMintingTime`.
	modifier when_mintable {
		if (now >= endMintingTime) throw;
		_;
	}

	// Initialization contract assigns address of crowdfund contract and end time.
	function GUPToken(address _minter, uint _endMintingTime) {
		endMintingTime = _endMintingTime;
		minter = _minter;
	}

	// Fallback function throws when called.
	function() {
		throw;
	}

	// Create new tokens when called by the crowdfund contract.
	// Only callable before the end time.
	function createToken(address _recipient, uint _value)
		when_mintable
		only_minter
		returns (bool o_success)
	{
		balances[_recipient] += _value;
		totalSupply += _value;
		return true;
	}

	// Create an illiquidBalance which cannot be traded until end of lockout period.
	// Can only be called by crowdfund contract befor the end time.
	function createIlliquidToken(address _recipient, uint _value)
		when_mintable
		only_minter
		returns (bool o_success)
	{
		illiquidBalance[_recipient] += _value;
		totalSupply += _value;
		return true;
	}

	// Make sender's illiquid balance liquid when called after lockout period.
	function makeLiquid()
		when_thawable
		returns (bool o_success)
	{
		balances[msg.sender] += illiquidBalance[msg.sender];
		illiquidBalance[msg.sender] = 0;
		return true;
	}

	// Transfer amount of tokens from sender account to recipient.
	// Only callable after the crowd fund end date.
	function transfer(address _recipient, uint _amount)
		when_transferable
		returns (bool o_success)
	{
		return super.transfer(_recipient, _amount);
	}

	// Transfer amount of tokens from a specified address to a recipient.
	// Only callable after the crowd fund end date.
	function transferFrom(address _from, address _recipient, uint _amount)
		when_transferable
		returns (bool o_success)
	{
		return super.transferFrom(_from, _recipient, _amount);
	}
}
