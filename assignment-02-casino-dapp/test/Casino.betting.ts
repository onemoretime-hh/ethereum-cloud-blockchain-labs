import { expect } from "chai";
import { network } from "hardhat";

describe("Casino betting rules", function () {
  const minimumBet = 1_000_000_000_000_000n;

  async function deployCasino(maxBets = 3) {
    const { ethers } = await network.connect();
    const casino = await ethers.deployContract("Casino", [minimumBet, maxBets]);
    await casino.waitForDeployment();
    return { casino, ethers };
  }

  it("initializes an open first round with the configured limits", async function () {
    const { casino } = await deployCasino();
    expect(await casino.minimumBet()).to.equal(minimumBet);
    expect(await casino.maxBets()).to.equal(3n);
    expect(await casino.currentRound()).to.equal(1n);
    expect(await casino.roundState()).to.deep.equal([1n, 0n, 0n, true]);
  });

  it("rejects a zero minimum stake and max-bet limits outside 2 through 100", async function () {
    const { ethers } = await network.connect();
    const factory = await ethers.getContractFactory("Casino");
    await expect(factory.deploy(0n, 3)).to.be.revertedWithCustomError(factory, "InvalidConfiguration");
    await expect(factory.deploy(minimumBet, 1)).to.be.revertedWithCustomError(factory, "InvalidConfiguration");
    await expect(factory.deploy(minimumBet, 101)).to.be.revertedWithCustomError(factory, "InvalidConfiguration");
  });

  it("accepts a numbered bet and updates the round count and pot", async function () {
    const { casino, ethers } = await deployCasino();
    const [owner] = await ethers.getSigners();
    await expect(casino.placeBet(7, { value: minimumBet }))
      .to.emit(casino, "BetPlaced")
      .withArgs(1n, owner.address, 7n, minimumBet);
    expect(await casino.roundState()).to.deep.equal([1n, 1n, minimumBet, true]);
  });

  it("rejects numbers outside 1 through 10", async function () {
    const { casino } = await deployCasino();
    await expect(casino.placeBet(0, { value: minimumBet })).to.be.revertedWithCustomError(casino, "InvalidNumber");
    await expect(casino.placeBet(11, { value: minimumBet })).to.be.revertedWithCustomError(casino, "InvalidNumber");
  });

  it("rejects a stake below the configured minimum", async function () {
    const { casino } = await deployCasino();
    await expect(casino.placeBet(5, { value: minimumBet - 1n })).to.be.revertedWithCustomError(casino, "StakeTooSmall");
  });

  it("allows an address to bet only once per round", async function () {
    const { casino } = await deployCasino();
    await casino.placeBet(4, { value: minimumBet });
    await expect(casino.placeBet(5, { value: minimumBet })).to.be.revertedWithCustomError(casino, "AlreadyBet");
  });

  it("closes at the configured count", async function () {
    const { casino, ethers } = await deployCasino(2);
    const [, second] = await ethers.getSigners();
    await casino.placeBet(2, { value: minimumBet });
    await casino.connect(second).placeBet(8, { value: minimumBet });
    expect(await casino.roundState()).to.deep.equal([1n, 2n, minimumBet * 2n, false]);
    await expect(casino.placeBet(3, { value: minimumBet })).to.be.revertedWithCustomError(casino, "RoundClosed");
  });
});
