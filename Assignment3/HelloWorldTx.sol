// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Bind this interface to an EXISTING HelloWorld address in Remix.
// Omitting pure makes Remix offer a transaction button. The deployed code
// remains pure, and the hello() selector stays 0x19ff1d21.
interface HelloWorldTx {
    function hello() external returns (string memory);
}
