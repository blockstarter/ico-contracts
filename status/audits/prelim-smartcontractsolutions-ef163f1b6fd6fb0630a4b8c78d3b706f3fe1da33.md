Hi all!

Here are the severe issues we've found so far:

#### Cloning a MiniMeToken with snapshot block set to the current block is subject to a value change attack.

If a `MiniMeToken` is cloned by calling the `createCloneToken` function on [line 384 of MiniMeToken.sol](https://github.com/status-im/status-network-token/blob/2152b17aa2ef584a2aea95533c707a345c6ccf69/contracts/MiniMeToken.sol#L384) with the `_snapshotBlock` parameter set to zero or `block.number`, the clone will be creating using the current block as `parentSnapShotBlock`.

This opens a small window of time for an attacker to see this transaction in the network, and insert `transfer` transactions in the same block. Given these will be [in the context of the current block too](https://github.com/status-im/status-network-token/blob/2152b17aa2ef584a2aea95533c707a345c6ccf69/contracts/MiniMeToken.sol#L500), the values used for the clone token will contain the modifications by the attacker. This would be confusing for the user creating the clone at the very least, and potentially dangerous. 

Luckily this can be very easily fixed. Consider replacing [line 391 of MiniMeToken.sol](https://github.com/status-im/status-network-token/blob/2152b17aa2ef584a2aea95533c707a345c6ccf69/contracts/MiniMeToken.sol#L391) for a check that will throw if `_snapshotBlock` equals `block.number`. Consider adding the same check [in the MiniMeToken constructor](https://github.com/status-im/status-network-token/blob/2152b17aa2ef584a2aea95533c707a345c6ccf69/contracts/MiniMeToken.sol#L156) too, for `_parentSnapShotBlock`.

#### ContributionWallet finalBlock can be different from StatusContribution stopBlock

Withdrawal from the `ContributionWallet` contract is enabled once [the contribution is finalized](https://github.com/status-im/status-network-token/blob/2152b17aa2ef584a2aea95533c707a345c6ccf69/contracts/ContributionWallet.sol#L58) or when the current block is after `finalBlock`, a state variable. For the contract to serve its purpose, `finalBlock` should be the same as the contribution's `stopBlock` or greater. Otherwise, the funds could be withdrawn [before the contribution is finalized](https://github.com/status-im/status-network-token/blob/2152b17aa2ef584a2aea95533c707a345c6ccf69/contracts/ContributionWallet.sol#L57), which would defeat the purpose of `ContributionWallet`. 

Consider using `contribution.stopBlock()` in place of `finalBlock` or checking that `finalBlock` is greater or equal than `stopBlock`.

**Addendum**

We also have and additional comment about [a PR you merged adding gas price cap to transactions](https://github.com/status-im/status-network-token/pull/20/files) and [a pending PR adding a cap to call frequency by address](https://github.com/status-im/status-network-token/pull/67/files). Both are out of the audit's commit scope, but we want to let you guys know our thoughts anyway as a friendly help. We don't this this additions are a good idea, and recommend you revert them. 

See [Vitalik's post](http://vitalik.ca/general/2017/06/09/sales.html) about the gas price cap issue, and the frequency cap can be easily circumvented so it doesn't add security but does add complexity and attack surface.

Let me know your thoughts/questions. The final report will be delivered on Friday, as agreed.

Happy to be working on this together,

Cheers,

Manuel Araoz

[openzeppelin.com](https://openzeppelin.com/)