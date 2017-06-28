"""Upgradeable token."""

import pytest
from ethereum.tester import TransactionFailed
from web3.contract import Contract

from ico.state import UpgradeState


@pytest.fixture
def upgradeable_token(token):
    return token


@pytest.fixture
def upgrade_agent(chain, upgradeable_token) -> Contract:
    """The test upgrade agent/target token."""
    args = [
        upgradeable_token.address,
    ]
    contract, hash = chain.provider.deploy_contract('TestMigrationTarget', deploy_args=args)
    return contract


@pytest.fixture
def upgrade_agent_2(chain, upgradeable_token) -> Contract:
    """Another deployment of the upgrade agent."""
    args = [
        upgradeable_token.address,
    ]
    contract, hash = chain.provider.deploy_contract('TestMigrationTarget', deploy_args=args)
    return contract


@pytest.fixture
def initial_team_balance(token):
    return token.call().totalSupply()


@pytest.fixture
def initial_total_supply(token):
    return token.call().totalSupply()


def test_set_upgrade_agent(upgradeable_token: Contract, upgrade_agent: Contract, team_multisig):
    """Upgrade agent can be set on a released token."""

    # Preconditions are met
    assert upgrade_agent.call().isUpgradeAgent()
    assert upgradeable_token.call().canUpgrade()
    assert upgradeable_token.call().upgradeMaster() == team_multisig
    assert upgrade_agent.call().oldToken() == upgradeable_token.address
    assert upgrade_agent.call().originalSupply() == upgradeable_token.call().totalSupply()
    assert upgradeable_token.call().getUpgradeState() == UpgradeState.WaitingForAgent

    upgradeable_token.transact({"from": team_multisig}).setUpgradeAgent(upgrade_agent.address)
    assert upgradeable_token.call().getUpgradeState() == UpgradeState.ReadyToUpgrade


def test_malicious_set_upgrade_agent(upgradeable_token: Contract, upgrade_agent: Contract, malicious_address):
    """Only owner can set the upgrade agent can be set on a released token."""

    with pytest.raises(TransactionFailed):
        upgradeable_token.transact({"from": malicious_address}).setUpgradeAgent(upgrade_agent.address)


def test_change_upgrade_master(upgradeable_token: Contract, upgrade_agent: Contract, team_multisig, customer):
    """Owner can change the upgrade master."""

    upgradeable_token.transact({"from": team_multisig}).setUpgradeMaster(customer)
    upgradeable_token.transact({"from": customer}).setUpgradeAgent(upgrade_agent.address)


def test_upgrade_partial(upgradeable_token: Contract, upgrade_agent: Contract, team_multisig, customer):
    """We can upgrade some of tokens."""

    upgradeable_token.transact({"from": team_multisig}).setUpgradeAgent(upgrade_agent.address)

    # Fiddle numbers so that we have some balance on other users too
    upgradeable_token.transact({"from": team_multisig}).transfer(customer, 1000)

    to_upgrade = 3000000
    begin_tokens = upgradeable_token.call().balanceOf(team_multisig)
    supply_start = upgradeable_token.call().totalSupply()
    assert begin_tokens > to_upgrade

    upgradeable_token.transact({"from": team_multisig}).upgrade(to_upgrade)

    assert upgradeable_token.call().getUpgradeState() == UpgradeState.Upgrading

    assert upgradeable_token.call().totalSupply() == supply_start - to_upgrade
    assert upgrade_agent.call().totalSupply() == to_upgrade
    assert upgradeable_token.call().totalUpgraded() == to_upgrade

    assert upgradeable_token.call().balanceOf(team_multisig) == begin_tokens - to_upgrade
    assert upgrade_agent.call().balanceOf(team_multisig) == to_upgrade


def test_upgrade_all(upgradeable_token: Contract, upgrade_agent: Contract, team_multisig, customer):
    """We can upgrade all tokens of two owners."""

    # Fiddle numbers so that we have some balance on other users too
    upgradeable_token.transact({"from": team_multisig}).transfer(customer, 1000)

    to_upgrade_team = upgradeable_token.call().balanceOf(team_multisig)
    to_upgrade_customer = upgradeable_token.call().balanceOf(customer)
    supply_start = upgradeable_token.call().totalSupply()

    upgradeable_token.transact({"from": team_multisig}).setUpgradeAgent(upgrade_agent.address)

    upgradeable_token.transact({"from": team_multisig}).upgrade(to_upgrade_team)
    upgradeable_token.transact({"from": customer}).upgrade(to_upgrade_customer)

    assert upgradeable_token.call().getUpgradeState() == UpgradeState.Upgrading
    assert upgradeable_token.call().totalSupply() == 0
    assert upgrade_agent.call().totalSupply() == supply_start
    assert upgradeable_token.call().totalUpgraded() == supply_start

    assert upgrade_agent.call().balanceOf(team_multisig) == to_upgrade_team
    assert upgrade_agent.call().balanceOf(customer) == to_upgrade_customer


def test_cannot_upgrade_too_many(upgradeable_token: Contract, upgrade_agent: Contract, team_multisig, customer):
    """We cannot upgrade more tokens than we have."""

    upgradeable_token.transact({"from": team_multisig}).setUpgradeAgent(upgrade_agent.address)
    upgradeable_token.transact({"from": team_multisig}).transfer(customer, 10000)
    assert upgradeable_token.call().balanceOf(customer) == 10000

    with pytest.raises(TransactionFailed):
        upgradeable_token.transact({"from": customer}).upgrade(20000)


def test_cannot_change_agent_in_fly(upgradeable_token: Contract, upgrade_agent: Contract, team_multisig, customer, upgrade_agent_2):
    """Upgrade agent cannot be changed after the ugprade has begun."""

    upgradeable_token.transact({"from": team_multisig}).setUpgradeAgent(upgrade_agent.address)
    upgradeable_token.transact({"from": team_multisig}).transfer(customer, 10000)
    upgradeable_token.transact({"from": customer}).upgrade(10000)

    with pytest.raises(TransactionFailed):
        upgradeable_token.transact({"from": team_multisig}).setUpgradeAgent(upgrade_agent_2.address)

