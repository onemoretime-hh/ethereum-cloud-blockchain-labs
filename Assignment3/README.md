# Assignment 3 Ethereum and Solidity labs

Author: Jiahao Wan

This folder contains the source code and reproducible local experiments accompanying Assignment / Lab 3 for Introduction to Ethereum and Cloud Blockchain Solutions Engineering.

## Files

- `StorageTest.sol`: the supplied storage contract, compiled with Solidity 0.5.1 and optimization disabled.
- `put_input.json`: the exact 32-element, 1 KiB input for Remix.
- `HelloWorld.sol`: Hello World, compiled with Solidity 0.8.28, optimizer enabled for 200 runs, Cancun EVM target.
- `HelloWorldTx.sol`: transaction-only client interface; use Remix At Address with the existing HelloWorld contract.
- `Dangerous.sol`: the supplied Solidity 0.4.24 vulnerable contract.
- `ReentrancyAttack.sol`: an attacker for this isolated local lab contract.
- `SafeVault.sol`: a repair using checks-effects-interactions and a reentrancy lock, also compiled with 0.4.24.
- `run_lab.py`: compilation and executable local experiments.
- `artifacts/`: generated ABI, creation/runtime bytecode, compile settings and measured local receipts.

## Reproduce

Use Python 3.12. From this directory:

```sh
python -m pip install -r requirements.txt
python -c "import solcx; [solcx.install_solc(v) for v in ['0.4.24','0.5.1','0.8.28']]"
python run_lab.py
```

If the compiler binary endpoint is unavailable, download the specified native compiler versions from the official ethereum/solc-bin repository. The installed compiler binaries are not included here.

## Observed local results

| Experiment | Result |
|---|---:|
| First 1 KiB write, Prague EVM | 758,369 gas |
| First 1 KiB write, Istanbul EVM | 689,869 gas |
| Repeated identical write, Prague EVM | 101,669 gas |
| Optimized Hello World deployment, Prague | 97,347 gas |
| Hello World transaction call, Prague | 21,416 gas |
| Decoded Hello World return | `Hello, world!` |
| Vulnerable vault balance after attack | 0 ETH |
| Owner net gain excluding gas | 5.5 simulated ETH |
| Repaired vault attack | Reverted, 5.5 simulated ETH preserved |
| Legitimate withdrawal from repaired vault | Succeeded |

These are actual **local Py-EVM** results, not Remix screenshots or Sepolia transactions. The script uses only pre-funded local test accounts; it does not require private keys, access public funds, or send public-network transactions.

## Public testnet steps

Use Sepolia in Remix with MetaMask. Deploy `HelloWorld.sol` with the compiler settings above. Record the contract address and deployment transaction hash. To send a transaction to the pure function, compile `HelloWorldTx.sol`, choose that interface in Deploy, and bind it with **At Address** to the existing HelloWorld address. Click its transaction-style `hello` button with zero value and approve the wallet transaction. Do not deploy the interface. The selector remains `0x19ff1d21`; declaring the client interface without `pure` changes the UI behavior, not the deployed code. Some Remix versions reject the low-level interaction route when the ABI lacks a fallback, so the interface route avoids that UI check. Record the transaction hash. To obtain the returned string, use `eth_call`, the original Remix `hello` read button, or Etherscan Read Contract after verification; transaction receipts do not store ordinary return values.

For the storage exercise, choose compiler 0.5.1 and disable optimization, deploy a fresh `StorageTest`, then paste `put_input.json` into `put`. Record transaction gas and the selected Remix VM version.
