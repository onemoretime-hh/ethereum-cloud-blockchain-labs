import { Contract } from "ethers";
import abi from "./abi/Casino.json";

export function getCasino(address: string, signer: import("ethers").Signer) {
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    throw new Error("Set VITE_CASINO_ADDRESS to the deployed contract address.");
  }
  return new Contract(address, abi, signer);
}
