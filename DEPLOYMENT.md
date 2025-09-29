# 🚀 Blockchain Todo App - Deployment Guide

## 📋 Project Overview

A decentralized todo application built with React and deployed on Ethereum Sepolia testnet.

**Features:**
- ✅ Blockchain-based todo storage
- 📅 Interactive calendar view
- 🔗 MetaMask integration
- ⚡ Real-time loading states
- 🎨 Responsive design

**Smart Contract:** `0x95Cba9761A3cAe8F0Ff0607CBf1cbA702e87c4f6` (Sepolia)

---

## 🌐 Deployment Options

### 1. 🎯 Vercel (Recommended)

**Steps:**
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Sign up with GitHub
4. Click "New Project" → Import your repository
5. Vercel will auto-detect React settings
6. Click "Deploy"

**URL:** Your app will be available at `https://your-project-name.vercel.app`

### 2. 🌐 Netlify

**Steps:**
1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Click "New site from Git"
4. Choose your repository
5. Build settings are auto-configured via `netlify.toml`
6. Click "Deploy site"

**URL:** Your app will be available at `https://random-name.netlify.app`

### 3. 📦 GitHub Pages

**Steps:**
1. Install gh-pages: `npm install --save-dev gh-pages`
2. Add to package.json:
   ```json
   "homepage": "https://yourusername.github.io/your-repo-name",
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d build"
   }
   ```
3. Run: `npm run deploy`

### 4. ☁️ Fleek (Web3 Native)

**Steps:**
1. Go to [fleek.co](https://fleek.co)
2. Sign up and connect GitHub
3. Select your repository
4. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `build`
5. Deploy to IPFS

---

## 🔧 Pre-Deployment Checklist

- ✅ Build completes successfully (`npm run build`)
- ✅ Smart contract deployed on Sepolia
- ✅ Contract address updated in config
- ✅ All lint warnings resolved
- ✅ Environment variables configured (if needed)

---

## 🛡️ Environment Variables

For production deployment, ensure these are set:
- `REACT_APP_CONTRACT_ADDRESS`: Your deployed contract address
- `REACT_APP_SEPOLIA_URL`: Sepolia RPC URL (optional, has fallback)

---

## 📱 Testing Deployment

After deployment:
1. ✅ Visit your deployed URL
2. ✅ Connect MetaMask to Sepolia testnet
3. ✅ Try creating a todo
4. ✅ Check calendar view
5. ✅ Test delete functionality

---

## 🔍 Troubleshooting

**Build Fails:**
- Check Node.js version (16+ recommended)
- Run `npm install` to update dependencies
- Check console for specific errors

**MetaMask Issues:**
- Ensure Sepolia testnet is selected
- Check contract address in config.ts
- Verify sufficient ETH for gas fees

**Todos Not Loading:**
- Check browser console for errors
- Verify wallet connection
- Confirm you're on Sepolia testnet

---

## 📊 Performance

**Build Size:**
- Main bundle: ~271 KB (gzipped)
- CSS: ~6.4 KB
- Total: ~278 KB

**Optimizations:**
- Code splitting enabled
- Production build optimized
- Minimal dependencies

---

## 🔗 Useful Links

- **Smart Contract Explorer:** [Sepolia Etherscan](https://sepolia.etherscan.io/address/0x95Cba9761A3cAe8F0Ff0607CBf1cbA702e87c4f6)
- **Sepolia Faucet:** [Get test ETH](https://sepoliafaucet.com/)
- **MetaMask:** [Download](https://metamask.io/)

---

*Built with ❤️ using React, Ethers.js, and Ethereum*