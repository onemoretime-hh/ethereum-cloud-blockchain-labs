# Assignment 02 Casino dApp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a tested modern Ethereum Casino dApp and a submission-ready English Word report for GEC Academy Assignment/Lab #2.

**Architecture:** A Hardhat 3 TypeScript project owns the Solidity contract, automated tests, and Ignition deployment module. A separate React/Vite frontend consumes the generated ABI through ethers.js and the current MetaMask EIP-1193 provider. A reproducible Python document builder creates the formatted Word report from verified answer content and build/deployment evidence.

**Tech Stack:** Solidity 0.8.28, Hardhat 3, Mocha, ethers.js 6, TypeScript, React, Vite, Vitest, python-docx, LibreOffice/Poppler render verification.

**Spec:** `docs/superpowers/specs/2026-10-11-assignment-02-casino-dapp-design.md`

## Global Constraints

- Keep all assignment implementation under `assignment-02-casino-dapp/`; keep the course repository root reusable for later labs.
- Use a configurable round size capped at 100, with the Sepolia deployment default set to 100 bets.
- Never commit a private key, seed phrase, RPC credential, dependency tree, compiler cache, or local build artifact.
- Use `window.ethereum` through ethers.js `BrowserProvider`; do not use legacy global `web3`.
- Treat the Casino as a testnet educational exercise, not a production gambling system.
- The Word report uses US Letter pages, black content only, SimHei 14 pt headings, 12 pt body text, restrained numbering, and three-line tables.
- The report's final paragraph alone explains the Ropsten, MetaMask API, and dependency modernization.
- Do not fabricate a deployment address, transaction hash, IPFS CID, signature, screenshot, or test result.

## Review Focus

- A malicious winner contract must not block other winners: settlement records claimable balances and never pushes prizes.
- A round with no winning bets must preserve its pot as rollover rather than lock or destroy funds.
- Settlement after the target block expires must fail with an explicit recovery path rather than derive randomness from a zero block hash.
- A wallet on the wrong chain or with no authorized account must receive a clear frontend state and no transaction attempt.
- Long addresses, URLs, and references in the Word report must wrap without clipping and must remain black.

---

### Task 1: Repository and Contract Betting Rules

**Files:**
- Create: `README.md`, `.gitignore`
- Create: `assignment-02-casino-dapp/package.json`, `assignment-02-casino-dapp/pnpm-lock.yaml`, `assignment-02-casino-dapp/tsconfig.json`, `assignment-02-casino-dapp/hardhat.config.ts`
- Create: `assignment-02-casino-dapp/contracts/Casino.sol`
- Test: `assignment-02-casino-dapp/test/Casino.betting.ts`

**Interfaces:**
- Produces: `Casino(uint256 minimumBetWei, uint16 maxBets)`; `placeBet(uint8 number)`; getters `currentRound()`, `minimumBet()`, `maxBets()`, `roundState()`; errors for invalid configuration, number, stake, duplicate player, and closed round.

- [ ] **Step 1: Write failing constructor and betting tests** asserting valid initialization, `maxBets` range 2-100, number range 1-10, minimum stake, one bet per address per round, pot/count updates, and closure at the configured count.
- [ ] **Step 2: Run `pnpm hardhat test test/Casino.betting.ts`** and confirm failure because `Casino.sol` is absent.
- [ ] **Step 3: Implement the minimal contract state, custom errors, events, constructor, and `placeBet(uint8)`**; set `drawBlock = block.number + 2` when the final bet closes the round.
- [ ] **Step 4: Run `pnpm hardhat test test/Casino.betting.ts` and `pnpm hardhat compile`**; expect all betting tests to pass and compilation to report success.
- [ ] **Step 5: Commit** with `feat: add casino betting rules`.

### Task 2: Settlement, Rollover, and Pull Payments

**Files:**
- Modify: `assignment-02-casino-dapp/contracts/Casino.sol`
- Create: `assignment-02-casino-dapp/contracts/test/RejectingWinner.sol`
- Test: `assignment-02-casino-dapp/test/Casino.settlement.ts`

**Interfaces:**
- Consumes: betting state and `drawBlock` from Task 1.
- Produces: `settleRound()`; `claimWinnings()`; `recoverExpiredRound()`; getters `claimable(address)`, `lastWinningNumber()`, `rolloverPot()`; events `RoundSettled`, `WinningsClaimed`, `RoundRecovered`.

- [ ] **Step 1: Write failing settlement tests** asserting premature rejection, winning number 1-10, equal winner credits, no-winner rollover, expired-block rejection and recovery, reentrancy-safe claim clearing, rejecting-recipient isolation, and a clean next round.
- [ ] **Step 2: Run `pnpm hardhat test test/Casino.settlement.ts`** and confirm failure on missing settlement methods.
- [ ] **Step 3: Implement settlement and claims** using `blockhash(drawBlock)`, per-round player lists, checks-effects-interactions in `claimWinnings`, and ownerless public recovery after the 256-block blockhash window.
- [ ] **Step 4: Run `pnpm hardhat test`**; expect every betting and settlement test to pass.
- [ ] **Step 5: Commit** with `feat: settle casino rounds safely`.

### Task 3: MetaMask Frontend

**Files:**
- Create: `assignment-02-casino-dapp/frontend/package.json`, `frontend/pnpm-lock.yaml`, `frontend/tsconfig*.json`, `frontend/vite.config.ts`, `frontend/index.html`, `frontend/.env.example`
- Create: `frontend/src/contract.ts`, `frontend/src/wallet.ts`, `frontend/src/App.tsx`, `frontend/src/main.tsx`, `frontend/src/styles.css`
- Test: `frontend/src/wallet.test.ts`, `frontend/src/App.test.tsx`

**Interfaces:**
- Consumes: compiled Casino ABI copied to `frontend/src/abi/Casino.json`; environment key `VITE_CASINO_ADDRESS`.
- Produces: `connectWallet(ethereum): Promise<WalletSession>` and UI actions `placeBet`, `settleRound`, `claimWinnings`, plus readable loading, wrong-network, rejected-request, and revert states.

- [ ] **Step 1: Write failing wallet and UI tests** for no provider, rejected authorization, empty accounts, chain ID other than Sepolia `11155111`, invalid stake/number, contract reads, and disabled transaction buttons while pending.
- [ ] **Step 2: Run `pnpm test -- --run` in `frontend/`** and confirm failure because wallet/UI modules are absent.
- [ ] **Step 3: Implement `contract.ts` and `wallet.ts`** with ethers `BrowserProvider`, `eth_requestAccounts`, chain verification, ABI/address validation, and normalized error messages.
- [ ] **Step 4: Implement the React UI and black-only stylesheet** with account/round summary, stake input, buttons 1-10, bet/settle/claim controls, transaction feedback, and responsive layout.
- [ ] **Step 5: Run `pnpm test -- --run` and `pnpm build` in `frontend/`**; expect passing tests and a successful `dist/` build.
- [ ] **Step 6: Commit** with `feat: add modern metamask casino frontend`.

### Task 4: Deployment and Reproducible Operations

**Files:**
- Create: `assignment-02-casino-dapp/ignition/modules/Casino.ts`
- Create: `assignment-02-casino-dapp/.env.example`
- Create: `assignment-02-casino-dapp/scripts/export-abi.ts`
- Create: `assignment-02-casino-dapp/README.md`
- Modify: `assignment-02-casino-dapp/package.json`, `README.md`
- Test: `assignment-02-casino-dapp/test/deployment-config.test.ts`

**Interfaces:**
- Produces: Ignition parameters `minimumBetWei` and `maxBets`; scripts `compile`, `test`, `export:abi`, `deploy:local`, `deploy:sepolia`, `frontend:build`; documented IPFS command accepting `frontend/dist/`.

- [ ] **Step 1: Write a failing deployment-config test** that imports the module and asserts a 0.001 ETH minimum bet, 100-bet Sepolia default, no literal secret, and ABI export containing `placeBet`, `settleRound`, and `claimWinnings`.
- [ ] **Step 2: Run the deployment-config test** and confirm failure on missing module/export.
- [ ] **Step 3: Implement Ignition deployment, secure config variables, ABI export, package scripts, `.env.example`, and setup/deployment/IPFS instructions** without inserting real credentials or unverified public identifiers.
- [ ] **Step 4: Run `pnpm hardhat ignition deploy ignition/modules/Casino.ts --network hardhatMainnet`, `pnpm export:abi`, and the full tests/builds**; expect a local address, valid frontend ABI, passing tests, and successful frontend build.
- [ ] **Step 5: Commit** with `docs: add casino deployment workflow`.

### Task 5: Complete Written Answers and Word Report

**Files:**
- Create: `assignment-02-casino-dapp/report/answers.md`
- Create: `assignment-02-casino-dapp/report/references.md`
- Create: `assignment-02-casino-dapp/report/build_report.py`
- Create: `assignment-02-casino-dapp/report/Assignment_02_Wan_Jiahao.docx`
- Test: `assignment-02-casino-dapp/report/test_report.py`

**Interfaces:**
- Consumes: verified lecture use cases, current primary references, actual test/build output, repository URL, and any later verified Sepolia/IPFS identifiers.
- Produces: a complete English answer sheet and formatted Word report with cover, Parts I-II, references, independent-effort signature line, three-line tables, and the required standalone final modernization paragraph.

- [ ] **Step 1: Write failing structural tests** asserting every question label `1(a)` through `5(c)`, five valid Mainnet addresses, cover identity, repository URL, final modernization paragraph, black text, heading/body sizes, black hyperlinks, three-line table borders, and intact long address/URL text for render QA.
- [ ] **Step 2: Run `python report/test_report.py`** and confirm failure because report sources/output are absent.
- [ ] **Step 3: Write `answers.md` and `references.md`** in natural academic English with limited lists, current terminology, verified claims, and no fabricated deployment evidence.
- [ ] **Step 4: Implement `build_report.py`** with US Letter sections, SimHei 14 pt headings, 12 pt body, all-black runs/links, controlled page breaks, footer page numbers, and OOXML three-line tables.
- [ ] **Step 5: Build and structurally test the DOCX**; expect all report tests to pass.
- [ ] **Step 6: Render the DOCX to PNG/PDF QA output with the bundled document runtime and inspect every page**; fix any clipping, orphaned headings, bad wrapping, non-black content, incorrect fonts, or table-rule defects, then rerun structural tests.
- [ ] **Step 7: Commit** with `docs: add assignment 02 report`.

### Task 6: Final Verification and Repository Handoff

**Files:**
- Modify only files implicated by verification failures.

**Interfaces:**
- Consumes: all outputs from Tasks 1-5.
- Produces: clean Git history, verified local deliverables, and a precise list of remaining user-signed Sepolia/IPFS steps.

- [ ] **Step 1: Run contract tests, frontend tests/build, local Ignition deployment, ABI export, report structural tests, document render, `git diff --check`, and a secret-pattern scan**; save only human-readable verified summaries in the report.
- [ ] **Step 2: Review the complete diff against the design spec** and correct only demonstrated gaps or regressions.
- [ ] **Step 3: Run the entire verification suite again from a clean working tree state** and record exact pass counts and artifact paths.
- [ ] **Step 4: Commit any verification fixes** with `chore: finalize assignment 02 deliverables`.
- [ ] **Step 5: Push the commits to `origin/main` if authenticated access is available**; otherwise provide the exact non-destructive push command for the student.
