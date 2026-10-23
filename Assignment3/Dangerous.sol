pragma solidity 0.4.24;

contract Dangerous {
    mapping(address => uint) deposits;

    function depositMoney() public payable {
        deposits[msg.sender] += msg.value;
    }

    function withdraw(uint amount) public {
        require(deposits[msg.sender] >= amount);
        if (!msg.sender.call.value(amount)()) {
            revert();
        }
        deposits[msg.sender] -= amount;
    }
}
