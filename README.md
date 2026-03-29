# PayLink – Instant XLM Request & Payment

PayLink is an ultra-fast, beginner-friendly web application designed to eliminate the friction in sending and requesting Stellar (XLM) payments. By utilizing intuitive URL parameters, users can instantly generate a secure, pre-filled payment link that handles the recipient and amount automatically—no manual entry errors, no fuss.

## 🚀 Features



### 3. Shareable Payment Link Generation
*   **Flow A (Create):** Define an XLM amount and instantly get a unique copied-link (`/?to=[Address]&amount=[Amount]`).
*   Share this link anywhere to request payment securely!

### 4. Auto-Filled Payment Interface
*   **Flow B (Pay):** Opening the received link auto-populates the recipient field and the exact payment amount, locking it securely to prevent manipulation or typos.

### 5. Instant 1-Click Settlement
*   A single click safely builds a native transaction utilizing `@stellar/stellar-sdk`.
*   Directly requests the signature via Freighter wallet.
*   Once signed, it is programmatically submitted to the Horizon Testnet and generates a clickable link to view the receipt directly on **Stellar Expert**.

## 🎨 Premium Design
Enjoy an exceptionally premium interface customized meticulously without utilizing heavy UI frameworks:
*   Vibrant, glassmorphic card elements with translucent blurring.
*   Fully responsive logic mapped to dark-mode preferences.
*   Sleek micro-animations on interactive elements and status spinners powered purely by CSS.
*   Typography driven by the Google Font *Outfit*.

## 🛠️ Technology Stack
*   **Core:** Modern HTML5 & JavaScript ES6+
*   **Framework:** Built on Vite vanilla template for zero-config high performance bundling.
*   **Web3:**
    *   `@stellar/freighter-api` (Wallet standard integration)
    *   `@stellar/stellar-sdk` (Network communications & transaction building)

## 📦 Getting Started

### Prerequisites
*   Node.js (`v18+` recommended)
*   [Freighter Wallet Extension](https://www.freighter.app/) installed on your browser and configured for the **Testnet**.

### Installation
1. Clone this repository:
   ```bash
   git clone https://github.com/debojyoti10CC/stellar_level_1.git
   ```
2. Navigate into the app folder:
   ```bash
   cd stellar_level_1
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the localized Vite development server:
   ```bash
   npm run dev
   ```
5. Open up the provided local URL (usually `http://localhost:5173/`) in your browser to begin routing and processing XLM!

## 💡 Troubleshooting
*   **Freighter isn't responding / "Connection Rejected":** Ensure your Freighter plugin is unlocked beforehand. If it is disabled or rejected previously locally, check your browser extensions.
*   **"TransactionBuilder.payment is not a function":** If adapting into older codebases, remain mindful that operations have recently segmented into `Operation.payment()` over the older `TransactionBuilder.payment()` convention. This repository maintains modern specifications.

---
*Built with ❤️ for the Stellar Network.*
