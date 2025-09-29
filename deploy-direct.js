import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

async function main() {
  console.log("🚀 Starting TodoList deployment...");

  // Read the compiled contract
  const contractPath = path.join(process.cwd(), 'artifacts/contracts/TodoList.sol/TodoList.json');
  const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("📝 Deploying with account:", wallet.address);

  // Get balance
  const balance = await provider.getBalance(wallet.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  if (balance < ethers.parseEther("0.01")) {
    console.log("❌ Insufficient balance for deployment. You need at least 0.01 ETH for gas fees.");
    return;
  }

  // Create contract factory
  const contractFactory = new ethers.ContractFactory(
    contractJson.abi,
    contractJson.bytecode,
    wallet
  );

  console.log("🚀 Deploying contract...");

  // Deploy contract
  const contract = await contractFactory.deploy();
  console.log("⏳ Waiting for deployment transaction to be mined...");

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("✅ TodoList deployed to:", contractAddress);

  // Save the contract address to .env file
  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Update or add CONTRACT_ADDRESS
  const contractAddressLine = `CONTRACT_ADDRESS="${contractAddress}"`;

  if (envContent.includes('CONTRACT_ADDRESS=')) {
    envContent = envContent.replace(/CONTRACT_ADDRESS=.*/, contractAddressLine);
  } else {
    envContent += `\n${contractAddressLine}`;
  }

  fs.writeFileSync(envPath, envContent.trim() + '\n');
  console.log("📁 Contract address saved to .env file");

  // Update the config.ts file
  const configPath = path.join(process.cwd(), 'src/contracts/config.ts');
  const configContent = `import TodoListABI from './TodoListABI.json';

export const CONTRACT_ADDRESS = "${contractAddress}";
export const CONTRACT_ABI = TodoListABI;

export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/tdOvenHYTE24wRM4UI3XY";
`;

  fs.writeFileSync(configPath, configContent);
  console.log("📁 Contract address updated in config.ts");

  // Verify deployment by calling a simple function
  console.log("🔍 Verifying deployment...");
  const todoCount = await contract.todoCount();
  console.log("✅ Initial todo count:", todoCount.toString());

  console.log("\n🎉 Deployment completed successfully!");
  console.log("📋 Summary:");
  console.log("   Contract Address:", contractAddress);
  console.log("   Network: Sepolia Testnet");
  console.log("   Deployer:", wallet.address);
  console.log("   Gas Used: Check Etherscan for details");
  console.log("   Etherscan:", `https://sepolia.etherscan.io/address/${contractAddress}`);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});