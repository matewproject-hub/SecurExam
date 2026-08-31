const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Default Ganache local network
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://127.0.0.1:8545');

// We need a private key to sign transactions (e.g. Admin or system wallet)
// In a real app, this should be securely managed
const privateKey = process.env.SYSTEM_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Default Hardhat Account #0
const wallet = new ethers.Wallet(privateKey, provider);

// Load the compiled ABI
const artifactPath = path.resolve(__dirname, '../../../blockchain/artifacts/contracts/AuditTrail.sol/AuditTrail.json');
let contractAbi = [];
if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    contractAbi = artifact.abi;
}

const contractAddress = process.env.CONTRACT_ADDRESS; 

let contract;
if (contractAddress && contractAbi.length > 0) {
    contract = new ethers.Contract(contractAddress, contractAbi, wallet);
} else {
    console.warn("AuditTrail contract address or ABI not found. Blockchain logging will fail.");
}

/**
 * Log an event to the blockchain audit trail
 * @param {string} paperId 
 * @param {string} actionType (e.g., 'UPLOAD', 'ACCESS_GRANTED', 'ACCESS_DENIED')
 * @param {string} userRole 
 * @param {string} userIdentifier (e.g., username or user ID)
 * @param {string} sha256Hash 
 * @returns {string} Transaction hash
 */
async function logAuditAction(paperId, actionType, userRole, userIdentifier, sha256Hash) {
    if (!contract) throw new Error("Smart contract not initialized");

    try {
        const tx = await contract.addRecord(
            paperId,
            actionType,
            userRole,
            userIdentifier,
            sha256Hash
        );
        const receipt = await tx.wait();
        return receipt.hash;
    } catch (error) {
        console.error("Blockchain logging error:", error);
        throw error;
    }
}

/**
 * Fetch all audit records from the blockchain
 */
async function fetchAllRecords() {
    if (!contract) return [];
    
    try {
        const count = await contract.getRecordCount();
        const records = [];
        for (let i = 0; i < count; i++) {
            const record = await contract.getRecord(i);
            records.push({
                paperId: record.paperId,
                actionType: record.actionType,
                userRole: record.userRole,
                userIdentifier: record.userIdentifier,
                sha256Hash: record.sha256Hash,
                timestamp: new Date(Number(record.timestamp) * 1000).toISOString()
            });
        }
        return records;
    } catch (error) {
        console.error("Error fetching records:", error);
        throw error;
    }
}

module.exports = {
    logAuditAction,
    fetchAllRecords
};
