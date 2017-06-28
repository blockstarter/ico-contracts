"""Token core functionality."""

import pytest
from ethereum.tester import TransactionFailed
from web3.contract import Contract


@pytest.fixture
def token_with_customer_balance(chain, team_multisig, token, customer) -> Contract:
    """Create a Crowdsale token where transfer restrictions have been lifted."""

    # Make sure customer 1 has some token balance
    token.transact({"from": team_multisig}).transfer(customer, 10000)

    return token


def test_token_initialized(token: Contract, team_multisig: str, token_symbol: str, token_name: str, initial_supply: int):
    """Token is initialized with the parameters we want."""
    assert token.call().symbol() == token_symbol
    assert token.call().name() == token_name
    assert token.call().totalSupply() == initial_supply


def test_transfer(token_with_customer_balance: Contract, customer: str, empty_address: str):
    """ERC-20 compatible transfer() is available."""

    token = token_with_customer_balance
    amount = 5000
    initial_balance = token.call().balanceOf(customer)

    token.transact({"from": customer}).transfer(empty_address, amount)

    assert token.call().balanceOf(customer) == initial_balance - amount
    assert token.call().balanceOf(empty_address) == amount

    events = token.pastEvents("Transfer").get()
    assert len(events) == 1 + 1  # plus initial release
    e = events[-1]
    assert e["args"]["to"] == empty_address
    assert e["args"]["from"] == customer
    assert e["args"]["value"] == amount


def test_not_enough_balance(token_with_customer_balance: Contract, customer: str, empty_address: str):
    """ERC-20 transfer fails if user exceeds his/her balance."""

    token = token_with_customer_balance
    initial_balance = token.call().balanceOf(customer)
    amount = initial_balance + 1

    with pytest.raises(TransactionFailed):
        token.transact({"from": customer}).transfer(empty_address, amount)


def test_transfer_with_allowance(token_with_customer_balance: Contract, customer: str, empty_address: str, allowed_party):
    """Tokens can be transferred with ECR-20 allowance approval."""

    token = token_with_customer_balance
    amount = 5000
    initial_balance = token.call().balanceOf(customer)
    token.transact({"from": customer}).approve(allowed_party, amount)
    assert token.call().allowance(customer, allowed_party) == amount

    events = token.pastEvents("Approval").get()
    assert len(events) > 0  # Edgeless gets 2 events, because one is needed to construct token
    e = events[-1]
    assert e["args"]["owner"] == customer
    assert e["args"]["spender"] == allowed_party
    assert e["args"]["value"] == amount

    token.transact({"from": allowed_party}).transferFrom(customer, empty_address, amount)

    events = token.pastEvents("Transfer").get()
    assert len(events) == 1 + 1  # plus initial transfer
    e = events[-1]
    assert e["args"]["to"] == empty_address
    assert e["args"]["from"] == customer
    assert e["args"]["value"] == amount

    assert token.call().balanceOf(customer) == initial_balance - amount
    assert token.call().balanceOf(empty_address) == amount
    assert token.call().allowance(customer, allowed_party) == 0


def test_transfer_with_allowance_exceeded(token_with_customer_balance: Contract, customer: str, empty_address: str, allowed_party):
    """One cannot transfers more than approved allowance."""

    token = token_with_customer_balance
    amount = 5000
    token.transact({"from": customer}).approve(allowed_party, amount)

    with pytest.raises(TransactionFailed):
        token.transact({"from": allowed_party}).transferFrom(customer, empty_address, amount+1)


