//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/access/Ownable.sol";

enum TokenStatus {
    EMPTY,
    PENDING,
    ACCEPTED,
    REJECTED
}

// A simple solidity contract to request new tokens to be used by the registry!
// The deployer reviews each request and will reject it or accept it.
// Once a token is approved to be used by the registry it can't be removed.
contract RequestedTokens is Ownable {
    mapping(address => TokenStatus) public status;
    mapping(address => string) public logoURL;
    address[] public alltokens;
    address[] public acceptedtokens;

    event NewTokenRequested(address indexed token);

    event NewTokenRejected(address indexed token);

    event NewTokenAccepted(address indexed token);

    function requestNewToken(
        address _token,
        string calldata _logoURL
    ) external {
        require(status[_token] == TokenStatus.EMPTY, "Request already exists!");
        status[_token] = TokenStatus.PENDING;
        logoURL[_token] = _logoURL;
        alltokens.push(_token);
        emit NewTokenRequested(_token);
    }

    function rejectTokenRequest(address _token) external onlyOwner {
        require(status[_token] == TokenStatus.PENDING, "Only pending");
        status[_token] = TokenStatus.REJECTED;
        emit NewTokenRejected(_token);
    }

    function acceptTokenRequest(address _token) external onlyOwner {
        require(status[_token] == TokenStatus.PENDING, "Only pending");
        status[_token] = TokenStatus.ACCEPTED;
        acceptedtokens.push(_token);
        emit NewTokenAccepted(_token);
    }


   // Later the ownership could be transferred to a DAO to create a voting rpocess for accepting/rejecting tokens
    function transferOwnership(
        address newOwner
    ) public virtual override onlyOwner {
        require(
            newOwner != address(0),
            "Ownable: new owner is the zero address"
        );
        _transferOwnership(newOwner);
    }
}
