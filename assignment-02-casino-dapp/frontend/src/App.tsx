import { useState } from "react";
import { formatEther, parseEther, type Contract } from "ethers";
import { getCasino } from "./contract";
import { connectWallet } from "./wallet";
import "./styles.css";

type Round = { round: bigint; count: bigint; pot: bigint; open: boolean };

export default function App() {
  const [account, setAccount] = useState("");
  const [casino, setCasino] = useState<Contract>();
  const [round, setRound] = useState<Round>();
  const [number, setNumber] = useState(1);
  const [stake, setStake] = useState("0.001");
  const [message, setMessage] = useState("Connect MetaMask to begin.");
  const [pending, setPending] = useState(false);

  async function refresh(contract: Contract) {
    const [roundId, count, pot, open] = await contract.roundState();
    setRound({ round: roundId, count, pot, open });
  }

  async function connect() {
    try {
      if (!window.ethereum) throw new Error("MetaMask was not found.");
      const session = await connectWallet(window.ethereum);
      const contract = getCasino(
        import.meta.env.VITE_CASINO_ADDRESS ?? "",
        session.signer,
      );
      setAccount(session.account);
      setCasino(contract);
      await refresh(contract);
      setMessage("Wallet connected to Sepolia.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Connection failed.");
    }
  }

  async function transact(action: () => Promise<{ wait(): Promise<unknown> }>) {
    try {
      setPending(true);
      setMessage("Waiting for confirmation...");
      const transaction = await action();
      await transaction.wait();
      if (casino) await refresh(casino);
      setMessage("Transaction confirmed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Transaction failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main>
      <h1>Classroom Casino dApp</h1>
      <p className="warning">Sepolia test ETH only. This demonstration is not suitable for real-money use.</p>
      {!account ? (
        <button onClick={connect}>Connect MetaMask</button>
      ) : (
        <>
          <p><strong>Account:</strong> {account}</p>
          <section>
            <h2>Current round</h2>
            <p>Round {round?.round.toString() ?? "-"}; bets {round?.count.toString() ?? "-"}/100</p>
            <p>Pot: {round ? formatEther(round.pot) : "-"} ETH; {round?.open ? "open" : "ready to settle"}</p>
          </section>
          <section>
            <h2>Place one bet</h2>
            <label>Number 1–10 <input type="number" min="1" max="10" value={number} onChange={(event) => setNumber(Number(event.target.value))} /></label>
            <label>Test ETH <input value={stake} onChange={(event) => setStake(event.target.value)} /></label>
            <button disabled={pending || !round?.open} onClick={() => transact(() => casino!.placeBet(number, { value: parseEther(stake) }))}>Place bet</button>
          </section>
          <div className="actions">
            <button disabled={pending || round?.open} onClick={() => transact(() => casino!.settleRound())}>Settle full round</button>
            <button disabled={pending} onClick={() => transact(() => casino!.claimWinnings())}>Claim winnings</button>
          </div>
        </>
      )}
      <p role="status">{message}</p>
    </main>
  );
}
