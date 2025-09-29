import hre from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Starting TodoList deployment...");

  // Get the ContractFactory and Signers here.
  const [deployer] = await hre.ethers.getSigners();

  console.log("📝 Deploying contracts with the account:", deployer.address);
  console.log("💰 Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Deploy the TodoList contract
  const TodoList = await hre.ethers.getContractFactory("TodoList");
  const todoList = await TodoList.deploy();

  await todoList.waitForDeployment();

  const contractAddress = await todoList.getAddress();

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
  const todoCount = await todoList.todoCount();
  console.log("✅ Initial todo count:", todoCount.toString());

  console.log("\n🎉 Deployment completed successfully!");
  console.log("📋 Summary:");
  console.log("   Contract Address:", contractAddress);
  console.log("   Network: Sepolia Testnet");
  console.log("   Deployer:", deployer.address);
  console.log("   Transaction Hash:", todoList.deploymentTransaction().hash);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});