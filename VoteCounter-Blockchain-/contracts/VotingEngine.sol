// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VotingSession {
    struct Candidate {
        string name;
        uint256 voteCount;
    }

    string public electionName;
    uint256 public maxVoters;
    uint256 public totalVotesCast;
    address public admin;
    bool public isFinalized; 
    uint256 public winnerIndex;
    
    Candidate[] public candidates;
    mapping(address => bool) public hasVoted;
    mapping(address => bool) public whitelistedVoters;

    event ElectionFinalized(string winnerName, uint256 totalVotes);

    constructor(string memory _name, uint256 _max, string[] memory _names, address _admin) {
        electionName = _name;
        maxVoters = _max;
        admin = _admin;
        for (uint i = 0; i < _names.length; i++) {
            candidates.push(Candidate(_names[i], 0));
        }
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    function authorizeVoter(address _voter) public onlyAdmin {
        whitelistedVoters[_voter] = true;
    }

    // ADDED: The logic must be here to seal the individual session
    function finalizeElection() public onlyAdmin {
        require(!isFinalized, "Already finalized");
        uint256 highestVotes = 0;
        for (uint i = 0; i < candidates.length; i++) {
            if (candidates[i].voteCount > highestVotes) {
                highestVotes = candidates[i].voteCount;
                winnerIndex = i;
            }
        }
        isFinalized = true;
        emit ElectionFinalized(candidates[winnerIndex].name, candidates[winnerIndex].voteCount);
    }

    function vote(uint256 _index) public {
        require(!isFinalized, "Election is closed!");
        require(whitelistedVoters[msg.sender], "Not whitelisted!");
        require(!hasVoted[msg.sender], "Already voted!");
        require(totalVotesCast < maxVoters, "Max capacity reached!");

        candidates[_index].voteCount++;
        hasVoted[msg.sender] = true;
        totalVotesCast++;
    }

    function getCandidates() public view returns (Candidate[] memory) {
        return candidates;
    }
}

contract VotingFactory {
    address[] public allElections;
    address public owner; 

    event NewElection(address contractAddress, string name, address creator);

    constructor() {
        owner = msg.sender; 
    }

    function createNewElection(string memory _name, uint256 _max, string[] memory _names) public {
        VotingSession newSession = new VotingSession(_name, _max, _names, msg.sender);
        allElections.push(address(newSession));
        emit NewElection(address(newSession), _name, msg.sender);
    }

    function getDeployedElections() public view returns (address[] memory) {
        return allElections;
    }
}