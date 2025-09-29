import "@nomiclabs/hardhat-ethers";
import "dotenv/config";

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: "0.8.19",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_URL || "https://eth-sepolia.g.alchemy.com/v2/tdOvenHYTE24wRM4UI3XY",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
};