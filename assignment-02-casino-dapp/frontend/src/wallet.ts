import { BrowserProvider } from "ethers";

export const SEPOLIA_CHAIN_ID = 11155111n;

export async function connectWallet(ethereum: NonNullable<Window["ethereum"]>) {
  const provider = new BrowserProvider(ethereum);
  await provider.send("eth_requestAccounts", []);
  const network = await provider.getNetwork();
  if (network.chainId !== SEPOLIA_CHAIN_ID) {
    throw new Error("Please switch MetaMask to the Sepolia test network.");
  }
  const signer = await provider.getSigner();
  return { provider, signer, account: await signer.getAddress() };
}
