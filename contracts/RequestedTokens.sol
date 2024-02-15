//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/access/Ownable.sol";

enum TokenStatus {
    EMPTY,
    PENDING,
    ACCEPTED,
    REJECTED
}

//  _______  _______  _______           _______  _______ _________  _________ _______  _        _______  _        _______ 
// (  ____ )(  ____ \(  ___  )|\     /|(  ____ \(  ____ \\__   __/  \__   __/(  ___  )| \    /\(  ____ \( (    /|(  ____ \
// | (    )|| (    \/| (   ) || )   ( || (    \/| (    \/   ) (        ) (   | (   ) ||  \  / /| (    \/|  \  ( || (    \/
// | (____)|| (__    | |   | || |   | || (__    | (_____    | |        | |   | |   | ||  (_/ / | (__    |   \ | || (_____ 
// |     __)|  __)   | |   | || |   | ||  __)   (_____  )   | |        | |   | |   | ||   _ (  |  __)   | (\ \) |(_____  )
// | (\ (   | (      | | /\| || |   | || (            ) |   | |        | |   | |   | ||  ( \ \ | (      | | \   |      ) |
// | ) \ \__| (____/\| (_\ \ || (___) || (____/\/\____) |   | |        | |   | (___) ||  /  \ \| (____/\| )  \  |/\____) |
// |/   \__/(_______/(____\/_)(_______)(_______/\_______)   )_(        )_(   (_______)|_/    \/(_______/|/    )_)\_______)
                                                                                                                       

// A simple solidity contract to request new tokens to be used by the registry!
// The deployer reviews each request and will reject it or accept it.
// Once a token is approved to be used by the registry it can't be removed.
contract RequestedTokens is Ownable {
    mapping(address => TokenStatus) public status;
    address[] private alltokens;
    address[] private acceptedtokens;

    event NewTokenRequested(address indexed token);

    event NewTokenRejected(address indexed token);

    event NewTokenAccepted(address indexed token);

    function requestNewToken(address _token) external {
        require(status[_token] == TokenStatus.EMPTY, "Request already exists!");
        status[_token] = TokenStatus.PENDING;
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

    function getAllTokens() external view returns (address[] memory) {
        return alltokens;
    }
    function getAcceptedTokens() external view returns (address[] memory){
        return acceptedtokens;
    }
}
