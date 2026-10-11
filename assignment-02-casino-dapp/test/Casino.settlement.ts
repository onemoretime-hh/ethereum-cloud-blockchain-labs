import { expect } from "chai";
import { network } from "hardhat";

describe("Casino settlement", function () {
  const stake = 1_000_000_000_000_000n;

  async function deployCasino(maxBets = 10) {
    const { ethers } = await network.connect();
    const casino = await ethers.deployContract("Casino", [stake, maxBets]);
    await casino.waitForDeployment();
    return { casino, ethers };
  }

  it("does not settle an open round", async function () {
    const { casino } = await deployCasino(2);
    await expect(casino.settleRound()).to.be.revertedWithCustomError(
      casino,
      "RoundStillOpen",
    );
  });

  it("draws 1 through 10, credits the winner, and starts a clean round", async function () {
    const { casino, ethers } = await deployCasino(10);
    const signers = await ethers.getSigners();

    for (let i = 0; i < 10; i += 1) {
      await casino.connect(signers[i]).placeBet(i + 1, { value: stake });
    }

    await expect(casino.settleRound()).to.emit(casino, "RoundSettled");
    const winningNumber = await casino.lastWinningNumber();
    expect(winningNumber).to.be.within(1n, 10n);

    const winner = signers[Number(winningNumber) - 1];
    expect(await casino.claimable(winner.address)).to.equal(stake * 10n);
    expect(await casino.roundState()).to.deep.equal([2n, 0n, 0n, true]);
  });

  it("lets a credited winner claim once", async function () {
    const { casino, ethers } = await deployCasino(10);
    const signers = await ethers.getSigners();

    for (let i = 0; i < 10; i += 1) {
      await casino.connect(signers[i]).placeBet(i + 1, { value: stake });
    }
    await casino.settleRound();

    const winningNumber = await casino.lastWinningNumber();
    const winner = signers[Number(winningNumber) - 1];
    await expect(casino.connect(winner).claimWinnings())
      .to.emit(casino, "WinningsClaimed")
      .withArgs(winner.address, stake * 10n);
    expect(await casino.claimable(winner.address)).to.equal(0n);
    await expect(
      casino.connect(winner).claimWinnings(),
    ).to.be.revertedWithCustomError(casino, "NothingToClaim");
  });
});
