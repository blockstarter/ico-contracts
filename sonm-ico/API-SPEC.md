


Contracts
---------
  - **`SNM`** is ERCxx token
    - ERC20 / ERC23 interface
    - `mintFor(uint value, address recipient)`
      - priveleged acess: only from `ICO`
      - check `totalSupply < 222M`
  - **`ICO`**
    - `buyEth()`
    - `buyOther(uint value, address ethAddr, string otherAddr, uint cryptoId)`
      - priveleged access: form `multi-changer`
      - 
  - Funds
    - **`TeamFundRestricted`**
      - multisig with delay
    - **`TeamFund`**
      - multisig witout dalay
    - **`EcosystemFund`**
      - multisig with delay
    - **`BountyFund`**
      - multisig

Services
--------
  - **`multi-info`**
    - stores one-time addresses
    - provides persistent mapping eth-addr <-> other-addr
    - subscribes to events from `multi-monitor`
    - provedes API for web-frontend
  - **`multi-changer`**
    - uses `multi-info` to get addresses
    - subscribes to events from `multi-monitor`
    - sends transactions to `ICO.buyOther`
    - prepares requests for cashbacks
  - **`multi-montor`**
    - monitors confirmed transations in various crypto-networks
      - cryptoid.info
      - native block explorers
      - including eth
    - accepts subscriptions for balance changes

Tools
-----
  - **`address-generator`**
    - can generate loads of addresses for various cryptos
