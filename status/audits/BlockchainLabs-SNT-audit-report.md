# Status Network Token Audit

## Preamble
This audit report was undertaken by BlockchainLabs.nz for the purpose of providing feedback to Status Research & Development Gmbh. It has subsequently been shared publicly without any express or implied warranty.

Solidity contracts were sourced from the public Github repo [status-im/status-network-token](https://github.com/status-im/status-network-token) prior to commit [79419f86c1b4bfcfcd18f08aecee168ff1f73fc4](https://github.com/status-im/status-network-token/tree/79419f86c1b4bfcfcd18f08aecee168ff1f73fc4) - we would encourage all community members and token holders to make their own assessment of the contracts.

## Scope
All Solidity code contained in [/contracts](https://github.com/status-im/status-network-token/tree/master/contracts) was considered in scope along with the tests contained in [/test](https://github.com/status-im/status-network-token/tree/master/test) as a basis for static and dynamic analysis.

## Focus Areas
The audit report is focused on the following key areas - though this is *not an exhaustive list*.

### Correctness
* No correctness defects uncovered during static analysis?
* No implemented contract violations uncovered during execution?
* No other generic incorrect behavior detected during execution?
* Adherence to adopted standards such as ERC20?

### Testability
* Test coverage across all functions and events?
* Test cases for both expected behaviour and failure modes?
* Settings for easy testing of a range of parameters?
* No reliance on nested callback functions or console logs?
* Avoidance of test scenarios calling other test scenarios?

### Security
* No presence of known security weaknesses?
* No funds at risk of malicious attempts to withdraw/transfer?
* No funds at risk of control fraud?
* Prevention of Integer Overflow or Underflow?

### Best Practice
* Explicit labeling for the visibility of functions and state variables?
* Proper management of gas limits and nested execution?
* Latest version of the Solidity compiler?

## Classification

### Defect Severity
* **Minor** - A defect that does not have a material impact on the contract execution and is likely to be subjective.
* **Moderate** - A defect that could impact the desired outcome of the contract execution in a specific scenario.
* **Major** - A defect that impacts the desired outcome of the contract execution or introduces a weakness that may be exploited.
* **Critical** - A defect that presents a significant security vulnerability or failure of the contract across a range of scenarios.

## Findings
### Minor

**SGT Exchanger** - While testing the correctness of SGTExchanger, we found that it was possible for a user with no SGT tokens to call the collect() function. It was also possible for a user with SGT tokens to call the collect() function for a second time, after having already collected their SNT.

However, this is a minor issue because in both cases no SNT was issued. Since commit `450fbc85fd7a4a0dc17d22fc7a6ab5071277fb46`, PR 106 on 16th June an exception is now thrown:
https://github.com/status-im/status-network-token/pull/106

**Test Failures** - Tests designed to check for failures were encapsulated within a `catch` and were never properly evaluated. The fix for this issue was addressed on https://github.com/status-im/status-network-token#70 and later improved on https://github.com/status-im/status-network-token#133

**SGT after Contribution** - As of 19 June, attempts to generate additional SGT tokens after the contribution period has begun do not throw an exception.

Prior to 19 June this resulted in a thrown exception, which is preferable.

~~However, no new tokens are created so this is only a minor issue.~~ _Status have advised that SGT can be issued after the contribution period._

### Moderate
_No moderate defects were found during this audit._

### Major

**Short Address** - The current implementation of MiniMeToken is vulnerable to ERC20 Short Address 'Attack'

http://vessenes.com/the-erc20-short-address-attack-explained/
https://blog.golemproject.net/how-to-find-10m-by-just-reading-blockchain-6ae9d39fcd95

While this isn't a critical issue as it only comes into play with user error, we suggest making the fix to MiniMeToken.

A simple fix would be to add a modifier to check address size, and apply this modifier to the transfer function of the MiniMeToken:
```
    modifier onlyPayloadSize(uint size) {
       assert(msg.data.length == size + 4);
       _;
    }

    function transfer(address _to, uint256 _value) onlyPayloadSize(2 * 32) {
      //function body unchanged
    }
```
**DevTokensHolder** - The function collectTokens on the DevTokensHolder contract will mistakenly floor the division of any period of time by 24 months. Making it impossible for developers to collect any token until 2 years. The fix was merged on status-im/status-network-token#105

### Critical
_No critical defects were found during this audit._

## Conclusion
Overall we have been satisfied with the quality of the code and responsiveness of the developers in fixing defects. There was good test coverage for some components such as MultiSigWallet and MiniMeToken as they've been used in other projects, meanwhile tests for the other contracts/functions were written during the audit period to improve the testability of the project as a whole.

The developers have followed common best practices and demonstrated an awareness of security weaknesses that could put funds at risk. During the audit the **Short Address** advisory was published and we recommend that this be handled upstream as a modifier in the MiniMeToken contract itself.
