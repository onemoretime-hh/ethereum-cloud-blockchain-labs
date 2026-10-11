import { network } from "hardhat";

const { ethers, networkName } = await network.connect();
const casino = await ethers.deployContract("Casino", [
  1_000_000_000_000_000n,
  100,
]);
await casino.waitForDeployment();

console.log(`Casino deployed on ${networkName}: ${await casino.getAddress()}`);
