# Assignment 02 Casino dApp Design

## Purpose

Produce a submission-ready solution for GEC Academy Assignment/Lab #2. The solution consists of a complete English written report and a modern Ethereum Casino dApp that preserves the tutorial's learning goals while replacing obsolete tooling. The report identifies the student as Wan, Jiahao (`2621751515@qq.com`) and references the course repository at `https://github.com/onemoretime-hh/ethereum-cloud-blockchain-labs`.

## Repository Structure

The repository root will contain a concise course README. All work for this assignment will live in `assignment-02-casino-dapp/`:

- `contracts/`: Solidity 0.8.x Casino contract.
- `test/`: contract behavior and failure-case tests.
- `scripts/`: local and Sepolia deployment scripts.
- `frontend/`: React, Vite, ethers.js, and the current MetaMask provider API.
- `report/`: the final Word report and the source data/script used to generate it.
- `README.md`: setup, test, deployment, frontend, and IPFS instructions.

Generated dependency directories, private keys, RPC credentials, compiler caches, and local build artifacts will not be committed.

## Smart Contract

The Casino contract will use Solidity 0.8.x and support repeated rounds. Each bet selects an integer from 1 through 10 and transfers at least the configured minimum stake. The round closes when the configured bet limit is reached; the production deployment setting will support the assignment's 100-bet target, while automated tests may use a smaller constructor value to exercise settlement efficiently.

The contract will reject invalid numbers, insufficient stakes, duplicate participation in the same round, bets after a round closes, and premature settlement. After betting closes, any user may settle the round; the winning number will be derived from current block data as a simple teaching demonstration that removes the obsolete Oraclize dependency. The documentation will state clearly that this pseudo-random method is not suitable for a real-money casino. Winners will withdraw their recorded share through a simple claim function. Events will expose bets, settlement, and withdrawals to the frontend.

## Frontend

The frontend will use React, Vite, ethers.js, and the EIP-1193 provider exposed by MetaMask. It will connect through `window.ethereum`, request account access only after a user action, verify the Sepolia chain, display the active account and round state, accept a stake and number selection, submit bets, settle an eligible round, and claim winnings. The contract address will come from an environment variable so a new deployment does not require source edits. User-facing errors will distinguish wallet rejection, wrong network, invalid input, and contract reverts.

## Deployment and Hosting

Hardhat scripts will support a local development network and Sepolia. The repository will include `.env.example` but never a real private key or RPC secret. A public Sepolia deployment requires the student to provide an RPC endpoint, hold test ETH, and sign the deployment from a dedicated test wallet. The static frontend will be built into `frontend/dist/` and will include reproducible IPFS publication instructions. Final report fields for the contract address, deployment transaction, and IPFS content identifier will be filled after those external actions succeed.

## Written Answers

Part I will answer every numbered subquestion in natural academic English. Question 1(a) will use the four lecture-confirmed categories: token systems, identity and reputation systems, decentralized autonomous organizations, and election and voting systems. Question 1(b) will add three distinct cases. Question 1(c) will give five verified Ethereum Mainnet contract addresses with category explanations and normal human-readable references. Gas-cost answers will identify the applicable EVM assumptions, and transaction terminology will use the current proof-of-stake wording while explaining the assignment's older use of "mined/staked."

Part II will describe architecture, contract behavior, testing, local operation, Sepolia deployment, frontend integration, and IPFS publication. It will report only results that were actually verified. The final paragraph of the report will stand alone and explain that the tutorial required necessary modernization because Ropsten was retired, MetaMask replaced the legacy injected Web3 interface, and the original dependency versions no longer work together unchanged.

## Word Report Formatting

The deliverable will be a `.docx` document on US Letter pages. The cover sheet will be the first page and will follow the assignment's required sequence. All text, borders, and table rules will be black. Main headings will use SimHei at Chinese size 4 (14 pt); body text will use a regular serif Chinese-compatible font at Chinese small size 4 (12 pt). The report will use restrained numbering and paragraph prose instead of excessive bullet lists. Tables will use a three-line academic style with only the top rule, header separator, and bottom rule. Hyperlinks will be black rather than Word's default blue. The independent-effort signature line will remain for the student to sign personally.

## Verification

Contract tests will cover constructor validation, valid bets, the main rejection paths, round closure, settlement, winning-number range, winner accounting, claims, and round reset. The frontend must pass its production build and targeted component or utility tests. Deployment configuration will be checked without exposing secrets. The Word report will be rendered to page images with the bundled document runtime; every page will be inspected for correct fonts, all-black styling, three-line tables, page breaks, clipping, overlap, and readable references. Placeholder scans will ensure only the user-controlled signature and genuinely external deployment fields remain before handoff.

## Boundaries

The project is an educational testnet exercise, not a production gambling system. It will not request, store, or transmit a seed phrase or private key. It will not claim a Sepolia or IPFS deployment before a real transaction or content identifier has been verified. It will not fabricate screenshots, addresses, transaction hashes, signatures, or test results.
