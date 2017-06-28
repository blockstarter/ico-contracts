
const SNM = artifacts.require("./SNM.sol");
const ICO = artifacts.require("./ICO.sol");
const MockPreICO = artifacts.require("./MockPreICO.sol");

contract("bonus pattern", () => {

  const TOKENS_FOR_SALE = new web3.BigNumber("1e18").mul(331360000);

  const [a, b, c] = web3.eth.accounts;
  let ico;

  it("should be able to create ICO", () =>
    ICO.new(a, b, c).then(res => {
      assert.isOk(res && res.address, "has invalid address");
      ico = res;
    })
  );

  const chkBonus = (sold, value, bonus) =>
    ico.getBonus.call(
      value,
      TOKENS_FOR_SALE.mul(sold).trunc().toFixed()
    ).then(res => assert.equal(bonus, res.toFixed()));

  it("should get bonus for the 1st 10% tokens", () => chkBonus(0,   1000, 150));
  it("should get bonus for the 2nd 10% tokens", () => chkBonus(0.1, 1000, 125));
  it("should get bonus for the 3rd 10% tokens", () => chkBonus(0.2, 1000, 100));
  it("should get bonus for the 4th 10% tokens", () => chkBonus(0.3, 1000,  75));
  it("should get bonus for the 5th 10% tokens", () => chkBonus(0.4, 1000,  50));
  it("should get bonus for the 6th 10% tokens", () => chkBonus(0.5, 1000,  38));
  it("should get bonus for the 7th 10% tokens", () => chkBonus(0.6, 1000,  25));
  it("should get bonus for the 8th 10% tokens", () => chkBonus(0.7, 1000,  13));
  it("should get no bonus for the 9th 10% tokens", () => chkBonus(0.8, 1000,  0));
})
