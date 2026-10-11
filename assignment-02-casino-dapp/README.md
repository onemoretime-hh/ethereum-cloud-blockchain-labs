# Assignment 02 Casino dApp

This classroom project modernizes the Casino tutorial with Solidity 0.8.28, Hardhat 3, React, ethers.js 6, and the current MetaMask provider API. Players choose a number from 1 to 10. A round closes after 100 bets, anyone may settle it, and the winning player or players may claim the pot.

The draw hashes current block data. That approach is intentionally simple for a testnet lesson and is not secure enough for real-money gambling.

## Local verification

Requirements: Node.js 22 or later and pnpm.

```powershell
pnpm install
pnpm compile
pnpm test
pnpm export:abi
pnpm --dir frontend install
pnpm frontend:build
pnpm deploy:local
```

## Sepolia deployment

Use a dedicated test-only wallet. Never commit its private key.

```powershell
$env:SEPOLIA_RPC_URL='https://sepolia.infura.io/v3/YOUR_PROJECT_ID'
$env:SEPOLIA_PRIVATE_KEY='0xYOUR_TEST_WALLET_PRIVATE_KEY'
pnpm deploy:sepolia
```

Copy the printed contract address into `frontend/.env.local`:

```text
VITE_CASINO_ADDRESS=0xDEPLOYED_CONTRACT_ADDRESS
```

Then run `pnpm --dir frontend dev` for development or `pnpm frontend:build` for a production build. MetaMask must be connected to Sepolia (chain ID 11155111).

## IPFS publication

After the production build, add the complete `frontend/dist` directory with IPFS Desktop or an IPFS node:

```powershell
ipfs add -r frontend/dist
```

Open the root CID through an IPFS gateway. A custom domain can point to the CID through a DNSLink TXT record. Record the final Sepolia address, deployment transaction hash, and root CID for the submission.

## Main files

- `contracts/Casino.sol`: betting, settlement, rollover, and prize claims
- `test/`: Hardhat contract tests
- `frontend/`: React and MetaMask interface
- `scripts/deploy.ts`: local or Sepolia deployment
- `scripts/export-abi.mjs`: copies the compiled ABI to the frontend
- `report/`: answer sheet and Word report builder
