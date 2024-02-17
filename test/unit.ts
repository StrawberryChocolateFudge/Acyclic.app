import { expect } from "chai";
import {
  calculateTokenDeposit,
  convertDecimalNumberStringToRateAndDecimalShift,
  AGPH,
} from "../lib/traverseDAG";

describe("Unit tests for various function on the client side", function () {
  it("test calculating rate and decimal shift from string float", function () {
    let depositAmount = "0.124";
    let rateAndShift = convertDecimalNumberStringToRateAndDecimalShift(
      depositAmount,
    );
    expect(rateAndShift.rate).to.equal(124);
    expect(rateAndShift.decimalShift).to.equal(3);

    depositAmount = "124.34646";

    rateAndShift = convertDecimalNumberStringToRateAndDecimalShift(
      depositAmount,
    );
    expect(rateAndShift.rate).to.equal(12434646);
    expect(rateAndShift.decimalShift).to.equal(5);
  });

  it("Test calculating token deposit amount using rate and decimal shift", function () {
    let agphTokenAmount = "1";
    let rate = 124;
    let decimalShift = 3;

    expect(calculateTokenDeposit(agphTokenAmount, rate, decimalShift)).to.equal(
      "0.124",
    );

    expect(calculateTokenDeposit("0.5", rate, decimalShift)).to.equal("0.062");
  });

  it("Calculate the DAG using mock data", function () {
    
  });
});
