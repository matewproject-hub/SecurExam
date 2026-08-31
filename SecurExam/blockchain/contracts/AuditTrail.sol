// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract AuditTrail {
    struct AuditRecord {
        string paperId;
        string actionType;
        string userRole;
        string userIdentifier;
        string sha256Hash;
        uint256 timestamp;
    }

    AuditRecord[] public records;

    event RecordAdded(
        string paperId,
        string actionType,
        string userRole,
        string userIdentifier,
        string sha256Hash,
        uint256 timestamp
    );

    function addRecord(
        string memory _paperId,
        string memory _actionType,
        string memory _userRole,
        string memory _userIdentifier,
        string memory _sha256Hash
    ) public {
        uint256 currentTimestamp = block.timestamp;
        
        records.push(AuditRecord({
            paperId: _paperId,
            actionType: _actionType,
            userRole: _userRole,
            userIdentifier: _userIdentifier,
            sha256Hash: _sha256Hash,
            timestamp: currentTimestamp
        }));

        emit RecordAdded(
            _paperId,
            _actionType,
            _userRole,
            _userIdentifier,
            _sha256Hash,
            currentTimestamp
        );
    }

    function getRecordCount() public view returns (uint256) {
        return records.length;
    }

    function getRecord(uint256 index) public view returns (
        string memory paperId,
        string memory actionType,
        string memory userRole,
        string memory userIdentifier,
        string memory sha256Hash,
        uint256 timestamp
    ) {
        require(index < records.length, "Record index out of bounds");
        AuditRecord storage record = records[index];
        return (
            record.paperId,
            record.actionType,
            record.userRole,
            record.userIdentifier,
            record.sha256Hash,
            record.timestamp
        );
    }
}
