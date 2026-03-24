import './style.css';
import { 
  isConnected,
  isAllowed, 
  setAllowed, 
  requestAccess, 
  getNetwork, 
  signTransaction,
  getNetworkDetails
} from '@stellar/freighter-api';
import { Horizon, TransactionBuilder, Networks, Asset, Operation } from '@stellar/stellar-sdk';

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;
const server = new Horizon.Server(HORIZON_URL);

let currentUserKey = null;

// App State
const urlParams = new URLSearchParams(window.location.search);
const payTo = urlParams.get('to');
const payAmount = urlParams.get('amount');
const isPaymentFlow = !!(payTo && payAmount);

// Render basic skeleton
document.querySelector('#app').innerHTML = `
  <div class="glass-card">
    <div class="header">
      <h1 class="title">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        PayLink
      </h1>
      <p class="subtitle">Instant XLM Request & Payment</p>
    </div>

    <div class="wallet-section">
      <div class="wallet-info" id="wallet-info">
        <span class="wallet-text">Not connected</span>
        <button id="btn-connect" class="btn-secondary" style="width: auto; padding: 6px 14px; font-size: 12px; margin: 0;">Connect Wallet</button>
      </div>
    </div>

    <div id="view-create" class="hidden">
      <label for="input-amount">Payment Amount</label>
      <div class="input-wrapper">
        <input type="number" id="input-amount" placeholder="0.00" min="0.1" step="0.1">
        <span class="suffix">XLM</span>
      </div>
      <button id="btn-generate">Generate Link</button>
      
      <div id="link-result-container" class="link-result hidden">
        <p>🔗 Payment Link Ready!</p>
        <div class="link-url" id="generated-link"></div>
        <button id="btn-copy" class="btn-secondary">Copy Link</button>
      </div>
    </div>

    <div id="view-pay" class="hidden">
      <div class="recipient-row">
        <div class="avatar" id="pay-avatar">P</div>
        <div class="recipient-details">
          <div class="label">Pay To</div>
          <div class="address" id="pay-address">...</div>
        </div>
      </div>
      
      <div class="input-wrapper" style="margin-bottom: 32px; pointer-events: none;">
        <input type="number" id="pay-amount-display" readonly style="background: rgba(0,0,0,0.4);">
        <span class="suffix">XLM</span>
      </div>
      
      <button id="btn-pay" disabled>Pay Now</button>
      
      <div id="tx-status" class="hidden"></div>
    </div>
  </div>
`;

// DOM Elements
const btnConnect = document.getElementById('btn-connect');
const walletInfo = document.getElementById('wallet-info');
const viewCreate = document.getElementById('view-create');
const viewPay = document.getElementById('view-pay');

// Create View Elements
const inputAmount = document.getElementById('input-amount');
const btnGenerate = document.getElementById('btn-generate');
const linkResultContainer = document.getElementById('link-result-container');
const generatedLink = document.getElementById('generated-link');
const btnCopy = document.getElementById('btn-copy');

// Pay View Elements
const payAddress = document.getElementById('pay-address');
const payAmountDisplay = document.getElementById('pay-amount-display');
const payAvatar = document.getElementById('pay-avatar');
const btnPay = document.getElementById('btn-pay');
const txStatus = document.getElementById('tx-status');

function initView() {
  if (isPaymentFlow) {
    viewPay.classList.remove('hidden');
    payAddress.textContent = payTo;
    payAmountDisplay.value = payAmount;
    payAvatar.textContent = payTo.substring(0, 1).toUpperCase();
  } else {
    viewCreate.classList.remove('hidden');
  }
}

function truncate(str) {
  if (!str) return '';
  return str.substring(0, 5) + '...' + str.substring(str.length - 4);
}

function showStatus(message, isError = false) {
  txStatus.className = `status-message ${isError ? 'status-error' : 'status-success'}`;
  txStatus.innerHTML = message;
  txStatus.classList.remove('hidden');
}

const updateWalletUI = async (publicKey) => {
  if (!publicKey) {
    walletInfo.classList.remove('active');
    walletInfo.innerHTML = `
      <span class="wallet-text">Not connected</span>
      <button id="btn-connect" class="btn-secondary" style="width: auto; padding: 6px 14px; font-size: 12px; margin: 0;">Connect Wallet</button>
    `;
    document.getElementById('btn-connect').addEventListener('click', handleConnect);
    btnPay.disabled = true;
    return;
  }

  // Fetch balance
  let balance = '0.00';
  let isFunded = true;
  try {
    const account = await server.loadAccount(publicKey);
    const nativeBal = account.balances.find(b => b.asset_type === 'native');
    balance = nativeBal ? parseFloat(nativeBal.balance).toFixed(2) : '0.00';
  } catch (e) {
    isFunded = false;
    balance = 'Unfunded';
  }

  walletInfo.classList.add('active');
  walletInfo.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 4px;">
      <span style="font-size: 12px; color: var(--text-secondary);">Connected (${truncate(publicKey)}) <span style="color:var(--accent); font-size: 10px; margin-left:4px;">Testnet</span></span>
      <span class="balance">${balance} XLM</span>
    </div>
    <button id="btn-disconnect" class="btn-secondary" style="width: auto; padding: 4px 10px; font-size: 11px; margin: 0; background: rgba(0,0,0,0.5);">Disconnect</button>
  `;
  document.getElementById('btn-disconnect').addEventListener('click', handleDisconnect);

  if (isPaymentFlow && isFunded) {
    btnPay.disabled = false;
  } else if (isPaymentFlow && !isFunded) {
    showStatus('Account is not funded. Switch to a funded account.', true);
  }
};

const handleConnect = async () => {
  try {
    const connected = await isConnected();
    if (!connected) {
      alert("Freighter Wallet is not installed. Please install it from freighter.app to continue.");
      return;
    }
    const isConn = await isAllowed();
    if (!isConn) {
      await setAllowed();
    }
    const access = await requestAccess();
    if (access.error) {
       console.error(access.error);
       alert("Connection request rejected or failed: " + access.error);
       return;
    }
    currentUserKey = access.address || access.publicKey || access;
    if (!currentUserKey || typeof currentUserKey !== 'string') {
       alert("Failed to retrieve public key.");
       return;
    }
    await updateWalletUI(currentUserKey);
  } catch (err) {
    console.error('Wallet connection failed', err);
    alert('Wallet connection failed: ' + err.message);
  }
};

const handleDisconnect = () => {
  currentUserKey = null;
  updateWalletUI(null);
};

// Generate Link Flow
btnGenerate.addEventListener('click', () => {
  if (!currentUserKey) {
    alert("Please connect your wallet first to set the recipient address.");
    return;
  }
  const amt = inputAmount.value;
  if (!amt || isNaN(amt) || Number(amt) <= 0) {
    alert("Please enter a valid amount");
    return;
  }

  const url = new URL(window.location.href.split('?')[0]);
  url.searchParams.set('to', currentUserKey);
  url.searchParams.set('amount', amt);

  generatedLink.textContent = url.toString();
  linkResultContainer.classList.remove('hidden');
});

btnCopy.addEventListener('click', () => {
  navigator.clipboard.writeText(generatedLink.textContent);
  const oldText = btnCopy.textContent;
  btnCopy.textContent = "Copied!";
  btnCopy.style.background = "var(--accent)";
  setTimeout(() => {
    btnCopy.textContent = oldText;
    btnCopy.style.background = "transparent";
  }, 2000);
});

// Pay Flow
btnPay.addEventListener('click', async () => {
  if (!currentUserKey) return;
  
  const originalText = btnPay.innerHTML;
  btnPay.disabled = true;
  btnPay.innerHTML = '<div class="loader"></div> Processing...';
  txStatus.className = 'hidden';

  try {
    // 1. Get account from Horizon
    const account = await server.loadAccount(currentUserKey);

    // 2. Build Transaction
    const tx = new TransactionBuilder(account, {
      fee: '100', // 100 stroops base fee
      networkPassphrase: NETWORK_PASSPHRASE
    })
    .addOperation(
      Operation.payment({
        destination: payTo,
        asset: Asset.native(),
        amount: String(payAmount)
      })
    )
    .setTimeout(180)
    .build();

    // 3. Sign Transaction via Freighter
    const { signedTxXdr, error } = await signTransaction(tx.toXDR(), {
      network: 'TESTNET',
      networkPassphrase: NETWORK_PASSPHRASE
    });

    if (error) {
      throw new Error(error);
    }

    // 4. Submit Transaction to Horizon
    const signedTx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
    const result = await server.submitTransaction(signedTx);

    showStatus(`Success! <br><a href="https://stellar.expert/explorer/testnet/tx/${result.hash}" target="_blank" style="color:var(--accent); font-size: 12px; margin-top:8px; display:inline-block;">View on Stellar Expert ↗</a>`);
    
    // Refresh balance
    await updateWalletUI(currentUserKey);

  } catch (err) {
    console.error(err);
    showStatus(err.message || "Transaction failed or was rejected.", true);
  } finally {
    btnPay.disabled = false;
    btnPay.innerHTML = originalText;
  }
});

// Provide initial Wallet connection context if available
document.getElementById('btn-connect').addEventListener('click', handleConnect);

initView();
