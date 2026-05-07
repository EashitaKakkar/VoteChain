# VoteChain

**VoteChain** is a decentralized voting application (dApp) built on **Base Sepolia**. It replaces traditional centralized voting with a transparent, immutable blockchain-based system using a Factory Pattern architecture.

---

##  Tech Stack
* **Frontend:** React.js, Vite, Bootstrap 
* **Blockchain:** Solidity, Ethers.js, Base Sepolia Testnet
* **Smart Contracts:** Factory-Session Architecture (deployed via Remix)

---

##  Final Product

<p align="center">
  <img src="src/assets/VoteChain_Logo.png" width="100" alt="Logo" />
</p>

| **Admin Dashboard** | **Voter Interface** | **Home Page** |
| :--- | :--- | :--- |
| ![Admin](src/assets/33e84a46-0215-44c0-9eb6-5ff3274f707a.jpg) | ![Voter](src/assets/7a082cbe-7af0-4807-8301-e94f659cfcd2.jpg) | ![Home](src/assets/f1cb0694-f007-4474-8e36-c3de4d6f95cb.jpg) |

---

##  Key Features
* **Factory Pattern:** Every election session is its own isolated smart contract deployed by the main Factory contract.
* **Whitelisting:** Only admin-authorized addresses can cast votes (on-chain verification).
* **Finalization Logic:** Once a session ends, the winner is permanently certified and the state is locked.

---

##  Development

1. **Install:** `npm install`
2. **Run:** `npm run dev`
3. **Network:** Connect MetaMask to **Base Sepolia**.
