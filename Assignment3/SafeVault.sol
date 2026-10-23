pragma solidity 0.4.24;

// Same compiler and deposit model as Dangerous; adds CEI and a lock.
contract SafeVault {
    mapping(address => uint) public deposits;
    bool private entered;

    modifier nonReentrant() {
        require(!entered);
        entered = true;
        _;
        entered = false;
    }

    function depositMoney() public payable {
        deposits[msg.sender] += msg.value;
    }

    function withdraw(uint amount) public nonReentrant {
        require(deposits[msg.sender] >= amount);
        deposits[msg.sender] -= amount;
        require(msg.sender.call.value(amount)());
    }
}
