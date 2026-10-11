// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title A small classroom casino demonstration
/// @notice Players choose a number from 1 to 10 and may bet once per round.
contract Casino {
    error InvalidConfiguration();
    error InvalidNumber();
    error StakeTooSmall();
    error AlreadyBet();
    error RoundClosed();
    error RoundStillOpen();
    error NothingToClaim();
    error TransferFailed();

    struct Bet {
        address player;
        uint8 number;
        uint256 amount;
    }

    uint256 public immutable minimumBet;
    uint16 public immutable maxBets;
    uint256 public currentRound = 1;
    uint8 public lastWinningNumber;
    uint256 public rolloverPot;

    uint16 private betCount;
    uint256 private pot;
    bool private open = true;

    Bet[] internal bets;
    mapping(uint256 round => mapping(address player => bool)) public hasBet;
    mapping(address player => uint256 amount) public claimable;

    event BetPlaced(
        uint256 indexed round,
        address indexed player,
        uint8 number,
        uint256 amount
    );
    event RoundFilled(uint256 indexed round, uint256 pot);
    event RoundSettled(
        uint256 indexed round,
        uint8 winningNumber,
        uint256 prizePool,
        uint256 winnerCount
    );
    event WinningsClaimed(address indexed player, uint256 amount);

    constructor(uint256 minimumBet_, uint16 maxBets_) {
        if (minimumBet_ == 0 || maxBets_ < 2 || maxBets_ > 100) {
            revert InvalidConfiguration();
        }
        minimumBet = minimumBet_;
        maxBets = maxBets_;
    }

    function roundState()
        external
        view
        returns (uint256 round, uint16 count, uint256 totalPot, bool isOpen)
    {
        return (currentRound, betCount, pot, open);
    }

    function placeBet(uint8 number) external payable {
        if (!open) revert RoundClosed();
        if (number < 1 || number > 10) revert InvalidNumber();
        if (msg.value < minimumBet) revert StakeTooSmall();
        if (hasBet[currentRound][msg.sender]) revert AlreadyBet();

        hasBet[currentRound][msg.sender] = true;
        bets.push(Bet(msg.sender, number, msg.value));
        betCount += 1;
        pot += msg.value;

        emit BetPlaced(currentRound, msg.sender, number, msg.value);

        if (betCount == maxBets) {
            open = false;
            emit RoundFilled(currentRound, pot);
        }
    }

    /// @notice Completes a full round and opens the next one.
    /// @dev This block-data draw is intentionally simple for classroom use. It is
    ///      predictable/manipulable and must not be used for real-money gambling.
    function settleRound() external {
        if (open) revert RoundStillOpen();

        uint256 settledRound = currentRound;
        uint256 prizePool = pot;
        uint8 winningNumber = uint8(
            (uint256(
                keccak256(
                    abi.encodePacked(
                        block.prevrandao,
                        block.timestamp,
                        settledRound,
                        address(this)
                    )
                )
            ) % 10) + 1
        );
        lastWinningNumber = winningNumber;

        uint256 winnerCount;
        for (uint256 i = 0; i < bets.length; i += 1) {
            if (bets[i].number == winningNumber) winnerCount += 1;
        }

        if (winnerCount == 0) {
            rolloverPot = prizePool;
        } else {
            uint256 prizePerWinner = prizePool / winnerCount;
            for (uint256 i = 0; i < bets.length; i += 1) {
                if (bets[i].number == winningNumber) {
                    claimable[bets[i].player] += prizePerWinner;
                }
            }
            rolloverPot = prizePool % winnerCount;
        }

        emit RoundSettled(
            settledRound,
            winningNumber,
            prizePool,
            winnerCount
        );

        delete bets;
        currentRound += 1;
        betCount = 0;
        pot = rolloverPot;
        open = true;
    }

    function claimWinnings() external {
        uint256 amount = claimable[msg.sender];
        if (amount == 0) revert NothingToClaim();

        claimable[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert TransferFailed();

        emit WinningsClaimed(msg.sender, amount);
    }
}
